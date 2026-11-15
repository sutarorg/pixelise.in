import Link from "next/link";

import { cn } from "@/lib/utils";
import { formatCreditDelta, formatDateTime, formatPaise } from "@/lib/format";
import type { CreditTransaction, CreditTransactionStatus } from "@/lib/api/types";

const typeLabel: Record<CreditTransaction["type"], string> = {
  purchase: "Purchase",
  generation: "Generation",
  refund: "Refund",
  adjustment: "Adjustment",
};

const statusStyle: Record<CreditTransactionStatus, string> = {
  completed: "bg-[#eefaf3] text-[#0d6b46]",
  pending: "bg-[#fdf6e7] text-[#8a6516]",
  failed: "bg-[#fdf1f0] text-[#7d2a22]",
  reversed: "bg-surface text-muted-strong",
};

function statusLabel(status: CreditTransactionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function CreditsCell({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        value > 0 ? "text-success" : value < 0 ? "text-ink" : "text-muted",
      )}
    >
      {formatCreditDelta(value)}
    </span>
  );
}

/**
 * Credit movements and payments in one table.
 *
 * Desktop gets a real table with column headers; narrow screens get a stacked
 * list of the same records, never a horizontally scrolled table. Rows link to
 * the originating creation when the service provides one.
 */
export function TransactionTable({ rows }: { rows: CreditTransaction[] }) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Credit transactions, newest first, with type, credits, amount and status
          </caption>
          <thead>
            <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
              <th scope="col" className="px-4 py-2.5 font-bold sm:px-5">Date</th>
              <th scope="col" className="px-4 py-2.5 font-bold">Description</th>
              <th scope="col" className="px-4 py-2.5 font-bold">Type</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Credits</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Amount</th>
              <th scope="col" className="px-4 py-2.5 font-bold sm:pr-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-surface/60">
                <td className="whitespace-nowrap px-4 py-3 text-[0.75rem] text-muted sm:px-5">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-4 py-3 text-[0.8125rem] font-semibold text-ink">
                  {row.generationId ? (
                    <Link
                      href={`/creations/${row.generationId}`}
                      className="rounded hover:text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                    >
                      {row.description}
                    </Link>
                  ) : (
                    row.description
                  )}
                </td>
                <td className="px-4 py-3 text-[0.75rem] text-muted-strong">{typeLabel[row.type]}</td>
                <td className="px-4 py-3 text-right text-[0.8125rem]">
                  <CreditsCell value={row.credits} />
                </td>
                <td className="px-4 py-3 text-right text-[0.8125rem] tabular-nums text-ink-soft">
                  {row.amountPaise !== null ? formatPaise(row.amountPaise) : "—"}
                </td>
                <td className="px-4 py-3 sm:pr-5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.06em]",
                      statusStyle[row.status],
                    )}
                  >
                    {statusLabel(row.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold text-ink">{row.description}</p>
                <p className="mt-0.5 text-[0.6875rem] text-muted">
                  {formatDateTime(row.createdAt)} · {typeLabel[row.type]}
                </p>
              </div>
              <CreditsCell value={row.credits} />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.06em]",
                  statusStyle[row.status],
                )}
              >
                {statusLabel(row.status)}
              </span>
              <span className="text-[0.75rem] tabular-nums text-muted-strong">
                {row.amountPaise !== null ? formatPaise(row.amountPaise) : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
