import "server-only";

import { randomUUID } from "node:crypto";

import { ORDER_TTL_MINUTES, getPack } from "@/config/packs";
import type {
  BillingOrder,
  CreditWallet,
  Paginated,
  PaymentRecord,
  PaymentVerificationResult,
} from "@/lib/api/types";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import {
  createRazorpayOrder,
  publicKeyId,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "@/lib/payments/razorpay";
import { getServiceClient } from "@/lib/supabase/service";
import { getWallet } from "@/services/credits/credit-service";
import { grantPurchaseCreditsForPayment } from "./grant-service";

/**
 * Payments service.
 *
 * The money path in one sentence: an order snapshots the pack, the browser never
 * sees an amount it can change, credits are granted only after the server has
 * seen a *captured* payment from Razorpay, and every grant is idempotent per
 * payment row.
 */

const log = createLogger("payments");

export async function createOrder(input: { userId: string; packId: string }): Promise<BillingOrder> {
  const pack = getPack(input.packId);
  if (!pack) throw failures.validation({ packId: "Choose one of the available packs." });

  const supabase = getServiceClient();
  const paymentId = randomUUID();

  // The provider order is created first so a failure there leaves no half-order
  // in our database. If the insert then fails, an orphan order exists with no
  // payment row — harmless, because grants are always keyed by a payment row.
  const order = await createRazorpayOrder({
    amountPaise: pack.pricePaise,
    receipt: `pixelise_${paymentId.slice(0, 24)}`,
    notes: { packId: pack.id, userId: input.userId },
  });

  const { error } = await supabase.from("payments").insert({
    id: paymentId,
    user_id: input.userId,
    pack_id: pack.id,
    pack_name: pack.name,
    amount_paise: pack.pricePaise,
    currency: pack.currency,
    credits_to_grant: pack.credits,
    payment_status: "created",
    razorpay_order_id: order.id,
  });

  if (error) {
    log.error("payment insert failed", { userId: input.userId, code: error.code });
    throw failures.unavailable("We couldn't start that purchase.");
  }

  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60_000).toISOString();

  return {
    orderId: order.id,
    keyId: publicKeyId(),
    amountPaise: pack.pricePaise,
    currency: "INR",
    packId: pack.id,
    credits: pack.credits,
    expiresAt,
  };
}

/* ------------------------------ Verification ------------------------------ */

interface PaymentRow {
  id: string;
  user_id: string;
  pack_name: string;
  amount_paise: number;
  credits_to_grant: number;
  payment_status: "created" | "attempted" | "paid" | "failed" | "refunded";
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  credits_granted_at: string | null;
  created_at: string;
}

async function walletOrEmpty(userId: string): Promise<CreditWallet> {
  try {
    return await getWallet(userId);
  } catch {
    return { available: 0, reserved: 0, updatedAt: new Date().toISOString() };
  }
}

/**
 * Grants credits for a payment row once the provider has confirmed the capture.
 * The work itself lives in `grant-service` so checkout, webhook and
 * reconciliation share one implementation.
 */
async function grantIfCaptured(payment: PaymentRow): Promise<PaymentVerificationResult> {
  const result = await grantPurchaseCreditsForPayment({
    paymentId: payment.id,
    razorpayPaymentId: payment.razorpay_payment_id,
  });

  if (result.credits > 0 && result.granted) {
    return {
      status: "paid",
      creditsAdded: result.credits,
      wallet: {
        available: result.available,
        reserved: result.reserved,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // Nothing was granted: either the provider has not captured yet, or the
  // payment failed. The row tells us which.
  const { data: current } = await getServiceClient()
    .from("payments")
    .select("payment_status")
    .eq("id", payment.id)
    .maybeSingle();

  if (current?.payment_status === "paid") {
    return { status: "paid", creditsAdded: payment.credits_to_grant, wallet: await walletOrEmpty(payment.user_id) };
  }
  if (current?.payment_status === "failed") {
    return { status: "failed", creditsAdded: null, wallet: await walletOrEmpty(payment.user_id) };
  }

  return { status: "verifying", creditsAdded: null, wallet: await walletOrEmpty(payment.user_id) };
}

/**
 * The browser's checkout callback. A valid signature proves the (order, payment)
 * pair came from Razorpay; it does not prove the money was captured, so the
 * capture is always re-read from the API before any credit is granted.
 */
export async function verifyCheckout(input: {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<PaymentVerificationResult> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", input.orderId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!data) throw failures.notFound("We couldn't find that order on your account.");

  const payment = data as PaymentRow;

  if (!verifyCheckoutSignature({ orderId: input.orderId, paymentId: input.paymentId, signature: input.signature })) {
    log.warn("checkout signature invalid", { userId: input.userId, orderId: input.orderId });
    await supabase
      .from("payments")
      .update({
        payment_status: "failed",
        failure_code: "signature_invalid",
        failure_message_safe: "We couldn't verify that payment. No credits were added.",
      })
      .eq("id", payment.id)
      .neq("payment_status", "paid");
    return { status: "failed", creditsAdded: null, wallet: await walletOrEmpty(input.userId) };
  }

  await supabase
    .from("payments")
    .update({ razorpay_payment_id: input.paymentId, razorpay_signature_verified: true })
    .eq("id", payment.id);

  return grantIfCaptured({ ...payment, razorpay_payment_id: input.paymentId });
}

/* -------------------------------- Webhook --------------------------------- */

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
    order?: { entity?: { id?: string; amount?: number; status?: string } };
  };
}

export async function handleWebhook(input: {
  rawBody: string;
  signature: string | null;
  eventId: string | null;
}): Promise<{ handled: boolean; reason?: string }> {
  /*
   * Signature first: a forged delivery must be rejected before anything else
   * happens, including a database connection attempt.
   */
  if (!verifyWebhookSignature({ rawBody: input.rawBody, signature: input.signature })) {
    log.warn("webhook signature rejected");
    throw failures.unauthenticated("Webhook signature is not valid.");
  }

  const supabase = getServiceClient();

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(input.rawBody) as RazorpayWebhookBody;
  } catch {
    throw failures.validation(undefined, "Webhook body is not JSON.");
  }

  const eventType = body.event ?? "unknown";
  const eventId = input.eventId ?? `${eventType}:${body.payload?.payment?.entity?.id ?? randomUUID()}`;

  /* Dedupe at the provider-event level. A conflict means we have already seen it. */
  const { error: dedupeError } = await supabase
    .from("webhook_events")
    .insert({ provider: "razorpay", event_id: eventId, event_type: eventType, payload: body as never });

  if (dedupeError?.code === "23505") {
    return { handled: true, reason: "duplicate" };
  }

  try {
    let result: { handled: boolean; reason?: string } = { handled: true };

    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const entity = body.payload?.payment?.entity;
        if (!entity?.order_id) {
          result = { handled: false, reason: "missing_order" };
          break;
        }

        const { data } = await supabase
          .from("payments")
          .select("*")
          .eq("razorpay_order_id", entity.order_id)
          .maybeSingle();

        if (!data) {
          log.warn("webhook for unknown order", { orderId: entity.order_id });
          result = { handled: false, reason: "unknown_order" };
          break;
        }

        const payment = data as PaymentRow;
        await supabase
          .from("payments")
          .update({ webhook_verified: true })
          .eq("id", payment.id);

        // The webhook's own fields are a hint; the grant path re-reads the capture.
        await grantIfCaptured(payment).catch((error) => {
          log.error("webhook grant failed", { paymentId: payment.id, error: String(error) });
        });
        break;
      }

      case "payment.failed": {
        const entity = body.payload?.payment?.entity;
        if (!entity?.order_id) {
          result = { handled: false, reason: "missing_order" };
          break;
        }

        await supabase
          .from("payments")
          .update({
            payment_status: "failed",
            webhook_verified: true,
            failure_code: "provider_failed",
            failure_message_safe: "The payment did not go through. No credits were added.",
          })
          .eq("razorpay_order_id", entity.order_id)
          .neq("payment_status", "paid");
        break;
      }

      default:
        result = { handled: true, reason: "ignored_event" };
    }

    await supabase
      .from("webhook_events")
      .update({
        processing_status: result.handled ? "processed" : "ignored",
        processed_at: new Date().toISOString(),
        safe_error: result.reason ?? null,
      })
      .eq("provider", "razorpay")
      .eq("event_id", eventId);

    return result;
  } catch (error) {
    await supabase
      .from("webhook_events")
      .update({
        processing_status: "failed",
        processed_at: new Date().toISOString(),
        safe_error: error instanceof Error ? error.message.slice(0, 200) : "unknown",
      })
      .eq("provider", "razorpay")
      .eq("event_id", eventId);
    throw error;
  }
}

/* --------------------------------- Queries -------------------------------- */

export async function listPayments(input: {
  userId: string;
  cursor?: string | null;
  limit?: number;
}): Promise<Paginated<PaymentRecord>> {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const supabase = getServiceClient();

  let query = supabase
    .from("payments")
    .select("id, razorpay_order_id, pack_name, amount_paise, currency, payment_status, credits_to_grant, created_at")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (input.cursor) query = query.lt("created_at", input.cursor);

  const { data, error } = await query;
  if (error) throw failures.unavailable("We couldn't load your payments.");

  const rows = (data ?? []) as Array<{
    id: string;
    razorpay_order_id: string;
    pack_name: string;
    amount_paise: number;
    currency: string;
    payment_status: PaymentRecord["status"];
    credits_to_grant: number;
    created_at: string;
  }>;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      orderId: row.razorpay_order_id,
      packName: row.pack_name,
      amountPaise: Number(row.amount_paise),
      currency: "INR",
      status: row.payment_status,
      credits: Number(row.credits_to_grant),
      createdAt: row.created_at,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    total: null,
  };
}
