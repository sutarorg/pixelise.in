import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState, AdminRegionError } from "@/components/admin/error-state";
import { ConsoleToolbar } from "@/components/admin/toolbar";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { FilterSelect, ClearFilters } from "@/components/admin/filter-select";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { DetailDrawer } from "@/components/admin/detail-drawer";
import { DetailSkeleton, TableSkeleton } from "@/components/admin/loading-skeleton";
import { GenerationDetailBody } from "@/components/admin/generation-detail";
import { generationStatusMeta } from "@/config/admin";
import { getAdminSession } from "@/lib/admin-session";
import { getConfig, getGenerationDetail, listGenerations } from "@/lib/api/admin-server";
import type { AdminGenerationRow, AdminGenerationStatus } from "@/lib/api/admin-types";
import { formatCredits, formatDateTime } from "@/lib/format";
import {
  buildHref,
  readParam,
  readPeriod,
  type QueryRecord,
  type RawSearchParams,
} from "@/lib/admin-filters";

export const metadata: Metadata = {
  title: "Generations",
  description: "Every render job and its outcome.",
};

const statuses: AdminGenerationStatus[] = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
];

export default function AdminGenerationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Generations"
        description="Every job the studio submitted, with model, timing, credit cost and outcome. Open a row for the source photo, result and provider identifiers."
      />
      <Suspense fallback={<GenerationsSkeleton />}>
        <GenerationsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function GenerationsContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const statusParam = readParam(params, "status");
  const status = statusParam && statuses.includes(statusParam as AdminGenerationStatus)
    ? (statusParam as AdminGenerationStatus)
    : undefined;
  const model = readParam(params, "model");
  const style = readParam(params, "style");
  const user = readParam(params, "user");
  const record = readParam(params, "record");
  const period = readPeriod(params);
  const cursor = readParam(params, "cursor");

  const query: QueryRecord = {
    status,
    model,
    style,
    user,
    ...period,
    cursor,
    record,
  };

  const [result, configResult, session] = await Promise.all([
    listGenerations({
      status,
      model,
      style,
      user,
      ...(period.from && period.to ? { from: period.from, to: period.to } : { range: period.range }),
      cursor,
    }),
    getConfig(),
    getAdminSession(),
  ]);

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const { items, nextCursor, prevCursor, total } = result.data;
  const filtered = Boolean(status || model || style || user || period.from);
  const closeHref = buildHref("/admin/generations", {
    ...query,
    record: undefined,
  });

  const detailResult = record ? await getGenerationDetail(record) : null;

  const modelOptions =
    configResult.ok
      ? configResult.data.generation.models.map((entry) => ({
          value: entry.id,
          label: entry.name,
        }))
      : [];
  const styleOptions =
    configResult.ok
      ? configResult.data.generation.styles.map((entry) => ({
          value: entry.id,
          label: entry.name,
        }))
      : [];

  const columns: DataTableColumn<AdminGenerationRow>[] = [
    {
      id: "id",
      header: "Job",
      cardTitle: true,
      cell: (row) => (
        <Link
          href={buildHref("/admin/generations", { ...query, record: row.id })}
          scroll={false}
          className="rounded font-mono text-[0.71875rem] font-semibold text-ink underline decoration-transparent underline-offset-2 hover:text-violet-ink hover:decoration-violet/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          {row.id}
        </Link>
      ),
      cardLabel: "Customer",
      cardCell: (row) => row.userLabel,
    },
    {
      id: "user",
      header: "Customer",
      cardLabel: "Customer",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-ink-soft">{row.userLabel}</span>
          <span className="truncate font-mono text-[0.65625rem] text-muted">{row.userId}</span>
        </span>
      ),
    },
    {
      id: "style",
      header: "Style",
      cardLabel: "Style",
      cell: (row) => <span className="whitespace-nowrap">{row.styleName}</span>,
    },
    {
      id: "model",
      header: "Model",
      cardLabel: "Model",
      cell: (row) => <span className="whitespace-nowrap text-muted-strong">{row.modelName}</span>,
    },
    {
      id: "createdAt",
      header: "Time",
      cardLabel: "Time",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-muted-strong">
          {formatDateTime(row.createdAt)}
        </time>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      align: "right",
      cardLabel: "Duration",
      cell: (row) =>
        row.durationMs === null ? (
          <span className="text-muted">Not available</span>
        ) : (
          <span className="tabular-nums">{formatMs(row.durationMs)}</span>
        ),
    },
    {
      id: "credits",
      header: "Credits",
      align: "right",
      cardLabel: "Credits",
      cell: (row) =>
        row.creditsCharged === null ? (
          <span className="text-muted">Not available</span>
        ) : (
          <span className="tabular-nums">{formatCredits(row.creditsCharged)}</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      align: "right",
      cardLabel: "Status",
      cell: (row) => (
        <StatusBadge tone={generationStatusMeta[row.status].tone}>
          {generationStatusMeta[row.status].label}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <ConsoleToolbar
        actions={
          <ClearFilters
            basePath="/admin/generations"
            href={buildHref("/admin/generations", { ...period })}
          />
        }
      >
        <FilterSelect
          basePath="/admin/generations"
          name="status"
          label="Status"
          value={status}
          preserve={{ model, style, user, ...period }}
          options={statuses.map((value) => ({ value, label: generationStatusMeta[value].label }))}
          allLabel="Any status"
        />
        <FilterSelect
          basePath="/admin/generations"
          name="model"
          label="Model"
          value={model}
          preserve={{ status, style, user, ...period }}
          options={modelOptions}
          allLabel="Any model"
        />
        <FilterSelect
          basePath="/admin/generations"
          name="style"
          label="Style"
          value={style}
          preserve={{ status, model, user, ...period }}
          options={styleOptions}
          allLabel="Any style"
        />
        <form action="/admin/generations" method="get" className="flex items-end gap-1.5">
          {[
            ["status", status],
            ["model", model],
            ["style", style],
          ].map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <div>
            <label
              htmlFor="generation-user"
              className="block text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted"
            >
              Customer
            </label>
            <input
              id="generation-user"
              name="user"
              defaultValue={user}
              placeholder="Customer ID"
              className="mt-1 h-8 w-full min-w-[11rem] rounded-[8px] border border-line-strong bg-white px-2.5 font-mono text-[0.75rem] text-ink placeholder:font-sans placeholder:text-muted/80 hover:border-ink/25 focus:border-violet focus-visible:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-[8px] border border-line-strong bg-white px-2.5 text-[0.71875rem] font-bold text-ink-soft hover:border-ink/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            Apply
          </button>
        </form>
        <DateRangeFilter
          basePath="/admin/generations"
          preserve={{ status, model, style, user }}
          activeRange={period.from && period.to ? "custom" : (period.range ?? "30d")}
          from={period.from}
          to={period.to}
        />
      </ConsoleToolbar>

      <div className="overflow-hidden rounded-[10px] border border-line bg-white">
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Sparkles}
            title={filtered ? "No jobs match these filters" : "No generation jobs yet"}
            description={
              filtered
                ? "No job in this window matched the status, model, style, customer or date range. Clear the filters to widen the search."
                : "The API returned zero jobs for this period. The first render will appear here with its model, timing and credit cost."
            }
          />
        ) : (
          <>
            <DataTable
              caption="Generation jobs"
              cardNoun="generation jobs"
              columns={columns}
              rows={items}
              rowKey={(row) => row.id}
              basePath="/admin/generations"
              query={query}
            />
            <Pagination
              basePath="/admin/generations"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              total={total}
              noun="generation jobs"
              shown={items.length}
            />
          </>
        )}
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        The customer filter takes the internal customer ID. Previews in the detail panel are signed
        URLs issued per request — the console never stores, guesses or proxies image URLs, and the
        service decides whether an image may be viewed.
      </p>

      {record ? (
        <DetailDrawer
          open
          closeHref={closeHref}
          title="Generation detail"
          description="Job, assets, provider identifiers and status history."
        >
          <Suspense fallback={<DetailSkeleton />}>
            {detailResult && detailResult.ok ? (
              <GenerationDetailBody
                generation={detailResult.data}
                viewer={session.state === "authorized" ? session.admin : null}
              />
            ) : (
              <AdminRegionError
                error={
                  detailResult && !detailResult.ok
                    ? detailResult.error
                    : {
                        code: "not_found",
                        message: "That job could not be loaded.",
                        status: 404,
                        retryable: false,
                        requestId: null,
                      }
                }
                title="That job couldn't be loaded"
              />
            )}
          </Suspense>
        </DetailDrawer>
      ) : null}
    </>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function GenerationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={10} />
    </div>
  );
}
