import "server-only";

import { serverEnv } from "@/config/env";
import { sendEmail } from "@/lib/email/resend";
import {
  accountStatusEmail,
  generationCompleteEmail,
  generationFailedEmail,
  purchaseEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import { createLogger } from "@/lib/logging";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Email orchestration.
 *
 * Looks up the recipient from Supabase Auth (our own copy never stores an email
 * address), checks the customer's notification preference, and sends. Every
 * function resolves to `void` and swallows failures — the caller has already
 * committed the financial or generation outcome.
 */

const log = createLogger("email-service");

interface Recipient {
  email: string;
  name: string | null;
}

async function recipient(userId: string): Promise<Recipient | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    log.warn("recipient lookup failed", { userId });
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return { email: data.user.email, name: (profile?.display_name as string | null) ?? null };
}

async function wants(userId: string, key: "generation_complete" | "credit_receipts"): Promise<boolean> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("generation_complete, credit_receipts")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return true; // default on; the profile trigger normally guarantees a row
  return Boolean(data[key]);
}

export async function sendWelcomeEmail(userId: string): Promise<void> {
  const to = await recipient(userId);
  if (!to) return;

  await sendEmail({
    to: to.email,
    content: welcomeEmail({ name: to.name, appUrl: serverEnv.appUrl }),
    idempotencyKey: `welcome:${userId}`,
  });
}

/** Called only after `grant_purchase_credits` has committed. */
export async function sendPurchaseReceipt(paymentId: string): Promise<void> {
  const supabase = getServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, pack_name, amount_paise, credits_to_grant, razorpay_order_id, razorpay_payment_id, paid_at, payment_status")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.payment_status !== "paid" || !payment.paid_at) return;

  const to = await recipient(payment.user_id as string);
  if (!to) return;
  if (!(await wants(payment.user_id as string, "credit_receipts"))) return;

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("available_credits")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  await sendEmail({
    to: to.email,
    content: purchaseEmail({
      name: to.name,
      packName: payment.pack_name as string,
      amountPaise: Number(payment.amount_paise),
      credits: Number(payment.credits_to_grant),
      orderId: payment.razorpay_order_id as string,
      paymentId: (payment.razorpay_payment_id as string) ?? "",
      paidAt: payment.paid_at as string,
      balanceAfter: wallet ? Number(wallet.available_credits) : null,
      appUrl: serverEnv.appUrl,
    }),
    idempotencyKey: `purchase:${paymentId}`,
  });
}

export async function sendGenerationEmail(input: {
  userId: string;
  generationId: string;
  styleName: string;
  credits: number;
  outcome: "completed" | "failed";
}): Promise<void> {
  const to = await recipient(input.userId);
  if (!to) return;
  if (!(await wants(input.userId, "generation_complete"))) return;

  const content =
    input.outcome === "completed"
      ? generationCompleteEmail({
          generationId: input.generationId,
          styleName: input.styleName,
          credits: input.credits,
          appUrl: serverEnv.appUrl,
        })
      : generationFailedEmail({
          styleName: input.styleName,
          creditsReturned: input.credits,
          appUrl: serverEnv.appUrl,
        });

  await sendEmail({
    to: to.email,
    content,
    idempotencyKey: `${input.outcome}:${input.generationId}`,
  });
}

export async function sendAccountStatusEmail(input: {
  userId: string;
  status: "suspended" | "active";
  reason: string | null;
}): Promise<void> {
  const to = await recipient(input.userId);
  if (!to) return;

  await sendEmail({
    to: to.email,
    content: accountStatusEmail({ status: input.status, reason: input.reason, appUrl: serverEnv.appUrl }),
  });
}
