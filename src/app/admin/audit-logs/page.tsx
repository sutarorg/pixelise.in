import { Suspense } from "react";
import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { ConsoleToolbar } from "@/components/admin/toolbar";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { FilterSelect, ClearFilters } from "@/components/admin/filter-select";
import { Pagination } from "@/components/admin/pagination";
import { SearchInput } from "@/components/admin/search-input";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { auditActionMeta } from "@/config/admin";
import { listAuditLogs } from "@/lib/api/admin-server";
import type { AdminAuditAction } from "@/lib/api/admin-types";
import {
  buildHref,
  readEnum,
  readParam,
  readPeriod,
  type QueryRecord,
  type RawSearchParams,
} from "@/lib/admin-filters";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "Who changed what, when and why.",
};

const actions: AdminAuditAction[] = [
  "credit_adjustment",
  "user_suspension",
  "user_reactivation",
  "model_setting",
  "config_change",
  "refund",
  "role_change",
];

export default function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Audit Logs"
        description="Every privileged action the service recorded, with the administrator, the affected record, the reason and the outcome. Entries are written server-side and cannot be created or edited here."
      />
      <Suspense fallback={<AuditSkeleton />}>
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AuditContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawAction = readParam(params, "action");
  const action = rawAction && actions.includes(rawAction as AdminAuditAction)
    ? (rawAction as AdminAuditAction)
    : undefined;
  const admin = readParam(params, "admin");
  const period = readPeriod(params);
  const sort = readEnum(params, "sort", ["createdAt"] as const, "createdAt");
  const dir = readEnum(params, "dir", ["asc", "desc"] as const, "desc");
  const cursor = readParam(params, "cursor");

  const query: QueryRecord = { q, action, admin, ...period, sort, dir, cursor };

  const result = await listAuditLogs({
    q,
    action,
    admin,
    ...(period.from && period.to ? { from: period.from, to: period.to } : { range: period.range }),
    sort,
    dir,
    cursor,
  });

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const { items, nextCursor, prevCursor, total } = result.data;
  const filtered = Boolean(q || action || admin || period.from);

  return (
    <>
      <ConsoleToolbar
        actions={<ClearFilters basePath="/admin/audit-logs" href={buildHref("/admin/audit-logs", { ...period })} />}
      >
        <SearchInput
          basePath="/admin/audit-logs"
          label="Search audit entries by administrator, target or reason"
          placeholder="Administrator, target or reason"
          defaultValue={q}
          preserve={{ action, admin, ...period, sort, dir }}
        />
        <FilterSelect
          basePath="/admin/audit-logs"
          name="action"
          label="Action"
          value={action}
          preserve={{ q, admin, ...period, sort, dir }}
          options={actions.map((value) => ({ value, label: auditActionMeta[value].label }))}
          allLabel="Any action"
        />
        <form action="/admin/audit-logs" method="get" className="flex items-end gap-1.5">
          {[
            ["q", q],
            ["action", action],
            ["sort", sort],
            ["dir", dir],
          ].map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <div>
            <label
              htmlFor="audit-admin"
              className="block text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted"
            >
              Administrator
            </label>
            <input
              id="audit-admin"
              name="admin"
              defaultValue={admin}
              placeholder="Admin ID"
              className="mt-1 h-8 w-full min-w-[10rem] rounded-[8px] border border-line-strong bg-white px-2.5 font-mono text-[0.75rem] text-ink placeholder:font-sans placeholder:text-muted/80 hover:border-ink/25 focus:border-violet focus-visible:outline-none"
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
          basePath="/admin/audit-logs"
          preserve={{ q, action, admin, sort, dir }}
          activeRange={period.from && period.to ? "custom" : (period.range ?? "30d")}
          from={period.from}
          to={period.to}
        />
      </ConsoleToolbar>

      <div className="overflow-hidden rounded-[10px] border border-line bg-white">
        {items.length === 0 ? (
          <AdminEmptyState
            icon={ScrollText}
            title={filtered ? "No audit entries match these filters" : "No privileged actions recorded yet"}
            description={
              filtered
                ? "Nothing in this window matched the search, action, administrator or date range. Clear the filters to see the full trail."
                : "The service has recorded no privileged action. That is a real empty log — entries are only ever written by the server when an admin acts."
            }
          />
        ) : (
          <>
            <AuditLogTable
              rows={items}
              basePath="/admin/audit-logs"
              query={query}
              sort={sort}
              dir={dir}
            />
            <Pagination
              basePath="/admin/audit-logs"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              total={total}
              noun="entries"
              shown={items.length}
            />
          </>
        )}
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        The log is append-only. A failed action is recorded as a failure, and an entry is never
        amended or removed to tidy up a mistake — corrections are new entries.
      </p>
    </>
  );
}

function AuditSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={10} />
    </div>
  );
}
