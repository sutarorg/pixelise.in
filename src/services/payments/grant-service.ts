import "server-only";

import { createLogger } from "@/lib/logging";
import { fetchRazorpayPayment } from "@/lib/payments/razorpay";
import { getServiceClient } from "@/lib/supabase/service";
import { sendPurchaseReceipt } from "@/services/email/email-service";

/**
 * The single function that turns a captured payment into credits.
 *
 * Called from checkout verification, the Razorpay webhook and reconciliation.
 * Each caller may already believe the payment was captured; this function still
 * re-reads the capture from the API, checks the amount against the stored pack
 * snapshot, and lets the SQL guard decide whether credits are actually applied.
 */

const log = createLogger("payment-grant");

export interface GrantResult {
  granted: boolean;
  credits: number;
  available: number;
  reserved: number;
}

/**
 * @param input.paymentId           our `payments.id`
 * @param input.razorpayPaymentId   provider payment id, when already known
 * @param input.trustedCapture      set only by a caller that has *itself* read a
 *                                  captured status from the provider in this
 *                                  request. It skips the second read.
 */
export async function grantPurchaseCreditsForPayment(input: {
  paymentId: string;
  razorpayPaymentId?: string | null;
  trustedCapture?: { amountPaise: number; currency: string };
}): Promise<GrantResult> {
  const supabase = getServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (!payment) {
    log.warn("grant for unknown payment", { paymentId: input.paymentId });
    return { granted: false, credits: 0, available: 0, reserved: 0 };
  }

  if (payment.credits_granted_at || payment.payment_status === "paid") {
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("available_credits, reserved_credits")
      .eq("user_id", payment.user_id)
      .maybeSingle();
    return {
      granted: false,
      credits: Number(payment.credits_to_grant),
      available: Number(wallet?.available_credits ?? 0),
      reserved: Number(wallet?.reserved_credits ?? 0),
    };
  }

  const providerPaymentId = input.razorpayPaymentId ?? payment.razorpay_payment_id;
  if (!providerPaymentId) {
    return { granted: false, credits: 0, available: 0, reserved: 0 };
  }

  let capture = input.trustedCapture ?? null;
  if (!capture) {
    try {
      const provider = await fetchRazorpayPayment(providerPaymentId);
      if (provider.status === "failed") {
        await supabase
          .from("payments")
          .update({
            payment_status: "failed",
            razorpay_payment_id: provider.id,
            failure_code: "provider_failed",
            failure_message_safe: "The payment did not go through. No credits were added.",
          })
          .eq("id", input.paymentId)
          .neq("payment_status", "paid");
        return { granted: false, credits: 0, available: 0, reserved: 0 };
      }
      if (provider.status !== "captured") {
        return { granted: false, credits: 0, available: 0, reserved: 0 };
      }
      capture = { amountPaise: provider.amount, currency: provider.currency };
    } catch (error) {
      log.warn("capture read failed", { paymentId: input.paymentId, error: String(error) });
      return { granted: false, credits: 0, available: 0, reserved: 0 };
    }
  }

  if (capture.amountPaise !== Number(payment.amount_paise) || capture.currency !== "INR") {
    log.error("amount mismatch on grant", {
      paymentId: input.paymentId,
      expected: payment.amount_paise,
      received: capture.amountPaise,
    });
    await supabase
      .from("payments")
      .update({
        payment_status: "failed",
        razorpay_payment_id: providerPaymentId,
        failure_code: "amount_mismatch",
        failure_message_safe: "We couldn't verify that amount. Support has been notified.",
      })
      .eq("id", input.paymentId)
      .neq("payment_status", "paid");
    return { granted: false, credits: 0, available: 0, reserved: 0 };
  }

  await supabase
    .from("payments")
    .update({ razorpay_payment_id: providerPaymentId, razorpay_signature_verified: true })
    .eq("id", input.paymentId);

  const { data, error } = await supabase.rpc("grant_purchase_credits", { p_payment_id: input.paymentId });

  if (error) {
    log.error("grant rpc failed", { paymentId: input.paymentId, code: error.code });
    return { granted: false, credits: 0, available: 0, reserved: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const applied = Boolean(row?.applied);

  if (applied) {
    // Best-effort, after commit. A mail failure cannot reverse a paid order.
    void sendPurchaseReceipt(input.paymentId).catch(() => undefined);
  }

  return {
    granted: applied,
    credits: Number(row?.credits_granted ?? 0),
    available: Number(row?.available_credits ?? 0),
    reserved: Number(row?.reserved_credits ?? 0),
  };
}
