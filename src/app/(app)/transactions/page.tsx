import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { ErrorState, TransactionsEmpty } from "@/components/app/state-views";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { getTransactions } from "@/lib/api/server";
import type { CreditTransactionType } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Every credit purchase, generation, refund and adjustment on your account.",
};

const filters: { id: CreditTransactionType | "all"; label: string }[] = [
  { id: "all", label: "All activity" },
  { id: "purchase", label: "Purchases" },
  { id: "generation", label: "Generations" },
  { id: "refund", label: "Refunds" },
  { id: "adjustment", label: "Adjustments" },
];

function filterHref(type: string) {
  return type === "all" ? "/transactions" : `/transactions?type=${type}`;
}

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; cursor?: string }>;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Transactions"
        description="Credit movements and payments, straight from your account. Nothing is summarised or estimated here."
      />
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TransactionsContent({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const type = filters.some((filter) => filter.id === params.type)
    ? (params.type as CreditTransactionType)
    : "all";

  const result = await getTransactions({ type, cursor: params.cursor });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter transactions">
        {filters.map((filter) => {
          const active = type === filter.id;
          return (
            <Link
              key={filter.id}
              href={filterHref(filter.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-[0.75rem] font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                active
                  ? "border-violet/25 bg-violet/10 text-violet-ink"
                  : "border-line bg-white text-muted-strong hover:border-line-strong hover:text-ink",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {!result.ok ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-white shadow-card">
          <ErrorState
            error={result.error}
            title="Credit activity is unavailable"
            description={
              result.error.code === "not_configured"
                ? "Purchases, generations and refunds appear here once this workspace is connected to the Pixelise service."
                : undefined
            }
          />
        </div>
      ) : result.data.items.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-white shadow-card">
          {type === "all" ? (
            <TransactionsEmpty />
          ) : (
            <div className="px-5 py-12 text-center">
              <h3 className="text-[1rem] font-bold text-ink">No {type} activity</h3>
              <p className="mx-auto mt-1.5 max-w-[38ch] text-[0.8125rem] leading-[1.6] text-muted-strong">
                Nothing of this type has happened on your account yet.
              </p>
              <Link
                href="/transactions"
                className="mt-4 inline-flex items-center gap-1.5 rounded text-[0.75rem] font-bold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Show all activity
              </Link>
            </div>
          )}
        </div>
      ) : (
        <SectionCard
          title="Credit activity"
          description={
            result.data.total !== null
              ? `${result.data.total} entries`
              : "Newest first"
          }
          bodyClassName="p-0"
        >
          <TransactionTable rows={result.data.items} />

          {result.data.nextCursor || params.cursor ? (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
              {params.cursor ? (
                <Link
                  href={filterHref(type)}
                  className="inline-flex items-center gap-1.5 rounded text-[0.75rem] font-bold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Back to newest
                </Link>
              ) : (
                <span />
              )}
              {result.data.nextCursor ? (
                <Link
                  href={`${filterHref(type)}${type === "all" ? "?" : "&"}cursor=${encodeURIComponent(result.data.nextCursor)}`}
                  className="inline-flex items-center gap-1.5 rounded text-[0.75rem] font-bold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  Older activity
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
      )}
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-card">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-line/70 py-3 last:border-0">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
