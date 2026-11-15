import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildHref, type QueryRecord } from "@/lib/admin-filters";

/**
 * Cursor pagination with explicit names ("Next page of users"). The record count
 * is not decoration: it confirms that a filter changed the result set even when
 * focus has not moved.
 */
export function Pagination({
  basePath,
  query,
  nextCursor,
  prevCursor,
  total,
  noun,
  shown,
}: {
  basePath: string;
  query: QueryRecord;
  nextCursor: string | null;
  prevCursor: string | null;
  total: number | null;
  noun: string;
  shown: number;
}) {
  const nextHref = buildHref(basePath, { ...query, cursor: nextCursor ?? undefined });
  const prevHref = buildHref(basePath, { ...query, cursor: prevCursor ?? undefined });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
      <p className="text-[0.75rem] text-muted" role="status" aria-live="polite">
        {total !== null
          ? `${shown.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} ${noun}`
          : `${shown.toLocaleString("en-IN")} ${noun} on this page`}
      </p>
      <div className="flex items-center gap-2">
        {prevCursor ? (
          <Link
            href={prevHref}
            rel="prev"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong bg-white px-2.5 text-[0.75rem] font-semibold text-ink-soft hover:border-ink/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            Previous page of {noun}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2.5 text-[0.75rem] font-semibold text-muted">
            <ChevronLeft className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            Previous page
          </span>
        )}
        {nextCursor ? (
          <Link
            href={nextHref}
            rel="next"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong bg-white px-2.5 text-[0.75rem] font-semibold text-ink-soft hover:border-ink/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            Next page of {noun}
            <ChevronRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2.5 text-[0.75rem] font-semibold text-muted">
            Next page
            <ChevronRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
