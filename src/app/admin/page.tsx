import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { MetricCard } from "@/components/admin/metric-card";
import { OverviewSkeleton } from "@/components/admin/loading-skeleton";
import { VolumeChart } from "@/components/admin/volume-chart";
import { ConsoleToolbar } from "@/components/admin/toolbar";
import { SectionCard } from "@/components/app/section-card";
import { getOverview } from "@/lib/api/admin-server";
import { formatCreditDelta, formatCredits, formatDateTime, formatPaise } from "@/lib/format";
import { readPeriod, type RawSearchParams } from "@/lib/admin-filters";

export const metadata: Metadata = {
  /* The console layout's template applies to nested routes; this page is the
     segment root, so its title is written in full. */
  title: { absolute: "Overview · Pixelise Console" },
  description: "Operational metrics for the selected period.",
};

export default function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Every figure below is aggregated by the API for the selected period. Nothing is estimated, cached from an earlier period, or filled in while a request is in flight."
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OverviewContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const period = readPeriod(params);
  const query =
    period.from && period.to ? { from: period.from, to: period.to } : { range: period.range };

  const result = await getOverview(query);

  if (!result.ok) {
    return <AdminErrorState error={result.error} />;
  }

  const data = result.data;
  const activeRange =
    data.period.preset === "custom" ? "custom" : (data.period.preset as "7d" | "30d" | "90d");

  const hasActivity =
    data.generations.total > 0 ||
    data.revenue.successfulPayments > 0 ||
    data.users.newInPeriod > 0 ||
    data.credits.purchased > 0;

  return (
    <>
      <ConsoleToolbar>
        <DateRangeFilter
          basePath="/admin"
          preserve={{}}
          activeRange={activeRange}
          from={data.period.from}
          to={data.period.to}
        />
      </ConsoleToolbar>

      <p className="text-[0.75rem] text-muted">
        Reporting period <span className="font-semibold text-ink-soft">{data.period.label}</span>{" "}
        ({data.period.days} {data.period.days === 1 ? "day" : "days"}), as defined by the API.
        Aggregated {formatDateTime(data.updatedAt)}.
      </p>

      {!hasActivity ? (
        <div className="rounded-[10px] border border-line bg-white">
          <AdminEmptyState
            icon={Sparkles}
            title="No activity in this period"
            description="The API returned real zeros for this window: no new customers, no successful payments and no generation jobs. Everything below stays at zero until the first record exists — nothing is simulated."
          />
        </div>
      ) : null}

      <section aria-labelledby="overview-customers" className="space-y-2.5">
        <h2 id="overview-customers" className="text-[0.8125rem] font-bold text-ink">
          Customers
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total customers"
            value={formatCredits(data.users.total)}
            hint={`${formatCredits(data.users.newInPeriod)} signed up in this period`}
          />
          <MetricCard
            label="Active customers"
            value={
              data.users.activeCustomers === null ? "Not available" : formatCredits(data.users.activeCustomers)
            }
            unavailable={data.users.activeCustomers === null}
            hint={
              data.users.activeDefinition ??
              "The API has no documented definition of an active customer, so none is invented here."
            }
            footnote={data.users.activeDefinition ? `Definition: ${data.users.activeDefinition}` : undefined}
          />
          <MetricCard
            label="Gross revenue"
            value={formatPaise(data.revenue.grossPaise)}
            hint={`${formatCredits(data.revenue.successfulPayments)} successful ${
              data.revenue.successfulPayments === 1 ? "payment" : "payments"
            }`}
            footnote={
              data.revenue.refundedPaise > 0
                ? `${formatPaise(data.revenue.refundedPaise)} refunded in this period`
                : "No refunds recorded in this period"
            }
          />
          <MetricCard
            label="Generation success rate"
            value={
              data.generations.successRate === null
                ? "Not available"
                : `${(data.generations.successRate * 100).toFixed(1)}%`
            }
            unavailable={data.generations.successRate === null}
            hint={
              data.generations.successRate === null
                ? "No job finished in this period, so there is no rate to report."
                : `${formatCredits(data.generations.completed)} completed · ${formatCredits(
                    data.generations.failed,
                  )} failed`
            }
          />
        </div>
      </section>

      <section aria-labelledby="overview-volume" className="space-y-2.5">
        <SectionCard
          headingId="overview-volume"
          title="Generation volume"
          description="Jobs per day in the selected period, split by outcome."
        >
          <VolumeChart points={data.volume} />
        </SectionCard>
      </section>

      <section aria-labelledby="overview-ledger" className="space-y-2.5">
        <h2 id="overview-ledger" className="text-[0.8125rem] font-bold text-ink">
          Credits and jobs
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Credits purchased"
            value={formatCredits(data.credits.purchased)}
            hint="Sum of credits granted by paid orders in this period."
          />
          <MetricCard
            label="Credits consumed"
            value={formatCredits(data.credits.consumed)}
            hint="Charged to customers for generation jobs."
          />
          <MetricCard
            label="Credits reserved"
            value={formatCredits(data.credits.reserved)}
            hint="Held for jobs still queued or processing."
          />
          <MetricCard
            label="Admin adjustments"
            value={formatCreditDelta(data.credits.adjusted)}
            hint="Net manual movement, signed. Each entry carries a reason."
          />
        </div>

        <div className="rounded-[10px] border border-line bg-white">
          <dl className="divide-y divide-line text-[0.8125rem]">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
              <dt className="text-muted-strong">Generation jobs started</dt>
              <dd className="tabular-nums font-semibold text-ink">
                {formatCredits(data.generations.total)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
              <dt className="text-muted-strong">Completed · failed · cancelled</dt>
              <dd className="tabular-nums font-semibold text-ink">
                {formatCredits(data.generations.completed)} · {formatCredits(data.generations.failed)} ·{" "}
                {formatCredits(data.generations.cancelled)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
              <dt className="text-muted-strong">Average processing time</dt>
              <dd className="tabular-nums font-semibold text-ink">
                {data.generations.averageDurationMs === null
                  ? "Not available"
                  : formatDuration(data.generations.averageDurationMs)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
              <dt className="text-muted-strong">Payments pending · failed</dt>
              <dd className="tabular-nums font-semibold text-ink">
                {formatCredits(data.revenue.pendingPayments)} · {formatCredits(data.revenue.failedPayments)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-4 border-t border-line px-4 py-2.5">
            <Link
              href="/admin/generations"
              className="inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              Open generations <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              Open payments <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
            <span className="ml-auto text-[0.6875rem] text-muted">
              Counts and amounts come from the overview endpoint; the console performs no arithmetic
              of its own beyond formatting.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
