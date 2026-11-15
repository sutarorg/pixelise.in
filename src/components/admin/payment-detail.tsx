import { Info } from "lucide-react";

import { DetailItem, DetailSection, Identifier, Unknown } from "@/components/admin/detail-list";
import { StatusBadge } from "@/components/admin/status-badge";
import { paymentStatusMeta, type StatusTone } from "@/config/admin";
import type { AdminPaymentDetail } from "@/lib/api/admin-types";
import { formatCredits, formatDateTime, formatPaise } from "@/lib/format";

const webhookMeta: Record<AdminPaymentDetail["webhookStatus"], { label: string; tone: StatusTone }> = {
  received: { label: "Webhook received", tone: "success" },
  pending: { label: "Webhook pending", tone: "warning" },
  failed: { label: "Webhook failed", tone: "danger" },
  not_applicable: { label: "Not applicable", tone: "neutral" },
};

const verificationMeta: Record<AdminPaymentDetail["verificationStatus"], { label: string; tone: StatusTone }> = {
  verified: { label: "Signature verified", tone: "success" },
  unverified: { label: "Not verified", tone: "warning" },
  failed: { label: "Verification failed", tone: "danger" },
};

/**
 * A payment record is evidence, not a switch.
 *
 * Status, webhook receipt and signature verification all come from the billing
 * service. There is no control here that sets a payment to paid: that decision
 * belongs to the server, which checks the Razorpay signature and treats the
 * webhook as the source of truth.
 */
export function PaymentDetailBody({ payment }: { payment: AdminPaymentDetail }) {
  const meta = paymentStatusMeta[payment.status];

  return (
    <div>
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          <span className="font-mono text-[0.71875rem] text-muted">{payment.id}</span>
        </div>
        <p className="mt-1.5 text-[0.8125rem] text-ink-soft">
          {payment.packName} · {formatPaise(payment.amountPaise)} · {payment.userLabel}
        </p>
      </div>

      <DetailSection title="Amount and credits">
        <DetailItem label="Amount charged">{formatPaise(payment.amountPaise)}</DetailItem>
        <DetailItem label="Currency">{payment.currency}</DetailItem>
        <DetailItem label="Credits granted">
          {payment.creditsGranted === null ? <Unknown /> : formatCredits(payment.creditsGranted)}
        </DetailItem>
        <DetailItem label="Pack">
          {payment.packName} <span className="font-mono text-[0.6875rem] text-muted">{payment.packId}</span>
        </DetailItem>
      </DetailSection>

      <DetailSection
        title="Identifiers"
        description="Order identifiers link this record to the payment provider. Keys and secrets are never returned by the API."
      >
        <DetailItem label="Internal order ID" wide mono>
          <Identifier value={payment.internalOrderId} />
        </DetailItem>
        <DetailItem label="Razorpay order ID" wide mono>
          <Identifier value={payment.razorpayOrderId} />
        </DetailItem>
        <DetailItem label="Razorpay payment ID" wide mono>
          <Identifier value={payment.razorpayPaymentId} />
        </DetailItem>
      </DetailSection>

      <DetailSection title="Verification">
        <DetailItem label="Webhook">
          <StatusBadge tone={webhookMeta[payment.webhookStatus].tone}>
            {webhookMeta[payment.webhookStatus].label}
          </StatusBadge>
        </DetailItem>
        <DetailItem label="Signature check">
          <StatusBadge tone={verificationMeta[payment.verificationStatus].tone}>
            {verificationMeta[payment.verificationStatus].label}
          </StatusBadge>
        </DetailItem>
        <DetailItem label="Customer" wide>
          {payment.userLabel}{" "}
          <span className="font-mono text-[0.6875rem] text-muted">{payment.userId}</span>
        </DetailItem>
        <DetailItem label="Created">{formatDateTime(payment.createdAt)}</DetailItem>
      </DetailSection>

      <DetailSection title="History" description="Every status the service recorded for this order.">
        <div className="sm:col-span-2">
          {payment.history.length === 0 ? (
            <p className="text-[0.75rem] text-muted">
              No transitions recorded. The API returned an empty history for this order.
            </p>
          ) : (
            <ol className="space-y-2">
              {payment.history.map((entry, index) => {
                const entryMeta = paymentStatusMeta[entry.status];
                return (
                  <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong"
                    />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={entryMeta.tone}>{entryMeta.label}</StatusBadge>
                        <time dateTime={entry.at} className="text-[0.71875rem] text-muted">
                          {formatDateTime(entry.at)}
                        </time>
                      </p>
                      {entry.note ? (
                        <p className="mt-0.5 text-[0.75rem] text-muted-strong">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DetailSection>

      <div className="px-4 py-3 sm:px-5">
        <div className="flex gap-2.5 rounded-[8px] border border-line bg-surface px-3 py-2.5">
          <Info className="mt-px size-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />
          <p className="text-[0.71875rem] leading-[1.55] text-muted-strong">
            Refunds are executed by the billing service against the Razorpay payment, then recorded
            here and in the audit log. This console has no control that marks a payment paid,
            refunded or verified — it only reports what the service already decided.
          </p>
        </div>
      </div>
    </div>
  );
}
