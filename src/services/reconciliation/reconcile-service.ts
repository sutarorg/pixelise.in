import "server-only";

import { createLogger } from "@/lib/logging";
import { fetchOrderPayments } from "@/lib/payments/razorpay";
import { getServiceClient } from "@/lib/supabase/service";
import { grantPurchaseCreditsForPayment } from "@/services/payments/grant-service";
import { failGeneration, refreshGeneration } from "@/services/generations/generation-service";

/**
 * Reconciliation.
 *
 * Three classes of drift are possible in an asynchronous, third-party pipeline:
 * webhooks that never arrive, jobs that stop moving, and uploads that were
 * abandoned between the signed URL and the confirmation. This module is the only
 * place that looks for them, and it is safe to run repeatedly.
 *
 * It is invoked by `GET /api/v1/admin/reconcile` (owner-only) and by the
 * documented Vercel cron entry (see `docs/deployment/vercel-setup.md`). No state
 * lives in memory, so a cold start cannot lose work.
 */

const log = createLogger("reconcile");

/** A job that has not moved in this long is considered stuck. */
const STUCK_AFTER_MS = 20 * 60 * 1000;
/** A pending order older than this is checked against the provider. */
const PENDING_PAYMENT_AFTER_MS = 15 * 60 * 1000;

export interface ReconcileReport {
  generationsChecked: number;
  generationsFailed: number;
  paymentsChecked: number;
  paymentsGranted: number;
  uploadsExpired: number;
}

export async function reconcile(options: { dryRun?: boolean } = {}): Promise<ReconcileReport> {
  const supabase = getServiceClient();
  const report: ReconcileReport = {
    generationsChecked: 0,
    generationsFailed: 0,
    paymentsChecked: 0,
    paymentsGranted: 0,
    uploadsExpired: 0,
  };

  /* 1. Running generations: ask the provider, and fail the ones that stalled. */
  const staleGenerationsBefore = new Date(Date.now() - 60_000).toISOString();
  const { data: running } = await supabase
    .from("generations")
    .select("id, created_at, generation_status")
    .in("generation_status", ["queued", "processing"])
    .lt("updated_at", staleGenerationsBefore)
    .order("created_at", { ascending: true })
    .limit(50);

  for (const row of running ?? []) {
    report.generationsChecked += 1;
    if (options.dryRun) continue;

    try {
      const age = Date.now() - new Date(row.created_at as string).getTime();
      if (age > STUCK_AFTER_MS) {
        await failGeneration(row.id as string, "timeout");
        report.generationsFailed += 1;
      } else {
        await refreshGeneration(row.id as string);
      }
    } catch (error) {
      log.warn("generation reconcile failed", {
        generationId: row.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /* 2. Payments without a grant: ask the provider whether money was captured. */
  const pendingBefore = new Date(Date.now() - PENDING_PAYMENT_AFTER_MS).toISOString();
  const { data: pending } = await supabase
    .from("payments")
    .select("id, razorpay_order_id, credits_granted_at, payment_status")
    .in("payment_status", ["created", "attempted"])
    .lt("created_at", pendingBefore)
    .order("created_at", { ascending: true })
    .limit(25);

  for (const payment of pending ?? []) {
    report.paymentsChecked += 1;
    if (options.dryRun) continue;

    try {
      const { items } = await fetchOrderPayments(payment.razorpay_order_id as string);
      const captured = items.find((item) => item.status === "captured");
      if (captured) {
        const granted = await grantPurchaseCreditsForPayment({
          paymentId: payment.id as string,
          razorpayPaymentId: captured.id,
        });
        if (granted) report.paymentsGranted += 1;
      }
    } catch (error) {
      log.warn("payment reconcile failed", {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /* 3. Abandoned uploads: expire the ticket and stop accepting a late complete. */
  const { data: expired } = await supabase
    .from("pending_uploads")
    .select("id")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .limit(100);

  if (!options.dryRun && expired && expired.length > 0) {
    await supabase
      .from("pending_uploads")
      .update({ status: "expired" })
      .in("id", expired.map((row) => row.id as string));
    report.uploadsExpired = expired.length;
  }

  log.info("reconcile finished", { ...report });
  return report;
}
