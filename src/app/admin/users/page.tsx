import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { ConsoleToolbar } from "@/components/admin/toolbar";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { FilterSelect, ClearFilters } from "@/components/admin/filter-select";
import { Pagination } from "@/components/admin/pagination";
import { SearchInput } from "@/components/admin/search-input";
import { StatusBadge } from "@/components/admin/status-badge";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { userStatusMeta } from "@/config/admin";
import { listUsers } from "@/lib/api/admin-server";
import type { AdminUserRow, AdminUserStatus } from "@/lib/api/admin-types";
import { formatCredits, formatDate, formatPaise } from "@/lib/format";
import {
  buildHref,
  readEnum,
  readParam,
  readPeriod,
  type QueryRecord,
  type RawSearchParams,
} from "@/lib/admin-filters";

export const metadata: Metadata = {
  title: "Users",
  description: "Customer accounts, balances and status.",
};

const statuses: AdminUserStatus[] = ["active", "suspended", "pending_verification", "deleted"];
const sortable = ["createdAt", "creditsAvailable", "generationsTotal", "purchasesTotal"] as const;

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Every customer account with its balance, activity and status. Search and filters run on the API — the console never filters a downloaded list."
      />
      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const rawStatus = readParam(params, "status");
  const status = rawStatus && statuses.includes(rawStatus as AdminUserStatus)
    ? (rawStatus as AdminUserStatus)
    : undefined;
  const period = readPeriod(params);
  const sortParam = readParam(params, "sort");
  const sort = sortable.find((field) => field === sortParam) ?? "createdAt";
  const dir = readEnum(params, "dir", ["asc", "desc"] as const, "desc");
  const cursor = readParam(params, "cursor");

  const query: QueryRecord = {
    q,
    status,
    ...period,
    sort,
    dir,
    cursor,
  };

  const result = await listUsers({
    q,
    status,
    ...(period.from && period.to ? { from: period.from, to: period.to } : { range: period.range }),
    sort,
    dir,
    cursor,
  });

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const { items, nextCursor, prevCursor, total } = result.data;
  const filtered = Boolean(q || status || period.from);

  const columns: DataTableColumn<AdminUserRow>[] = [
    {
      id: "customer",
      header: "Customer",
      cardTitle: true,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <Link
            href={`/admin/users/${row.id}`}
            className="truncate rounded font-semibold text-ink hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {row.displayName?.trim() || row.email}
          </Link>
          <span className="truncate text-[0.71875rem] text-muted">{row.email}</span>
        </span>
      ),
      cardLabel: "Email",
      cardCell: (row) => row.email,
    },
    {
      id: "createdAt",
      header: "Signed up",
      sortable: true,
      cardLabel: "Signed up",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-muted-strong">
          {formatDate(row.createdAt)}
        </time>
      ),
    },
    {
      id: "creditsAvailable",
      header: "Credits",
      sortable: true,
      align: "right",
      cardLabel: "Credits available",
      cell: (row) => (
        <span className="flex flex-col items-end leading-tight">
          <span className="font-semibold text-ink">{formatCredits(row.creditsAvailable)}</span>
          {row.creditsReserved > 0 ? (
            <span className="text-[0.6875rem] text-muted">
              {formatCredits(row.creditsReserved)} reserved
            </span>
          ) : null}
        </span>
      ),
      cardCell: (row) => formatCredits(row.creditsAvailable),
    },
    {
      id: "generationsTotal",
      header: "Generations",
      sortable: true,
      align: "right",
      cardLabel: "Generations",
      cell: (row) => formatCredits(row.generationsTotal),
    },
    {
      id: "purchasesTotal",
      header: "Purchases",
      sortable: true,
      align: "right",
      cardLabel: "Purchases",
      cell: (row) => (
        <span className="flex flex-col items-end leading-tight">
          <span>{formatCredits(row.purchasesTotal)}</span>
          <span className="text-[0.6875rem] text-muted">
            {row.lifetimePaidPaise === null ? "Lifetime value unavailable" : formatPaise(row.lifetimePaidPaise)}
          </span>
        </span>
      ),
      cardCell: (row) => formatCredits(row.purchasesTotal),
    },
    {
      id: "status",
      header: "Status",
      align: "right",
      cardLabel: "Status",
      cell: (row) => (
        <StatusBadge tone={userStatusMeta[row.status].tone}>{userStatusMeta[row.status].label}</StatusBadge>
      ),
    },
  ];

  return (
    <>
      <ConsoleToolbar actions={<ClearFilters basePath="/admin/users" href={buildHref("/admin/users", { ...period })} />}>
        <SearchInput
          basePath="/admin/users"
          label="Search customers by email or name"
          placeholder="Search email or name"
          defaultValue={q}
          preserve={{ status, ...period, sort, dir: sort ? dir : undefined }}
        />
        <FilterSelect
          basePath="/admin/users"
          name="status"
          label="Status"
          value={status}
          preserve={{ q, ...period, sort, dir: sort ? dir : undefined }}
          allLabel="Any status"
          options={statuses.map((value) => ({ value, label: userStatusMeta[value].label }))}
        />
        <DateRangeFilter
          basePath="/admin/users"
          preserve={{ q, status }}
          activeRange={period.from && period.to ? "custom" : (period.range ?? "30d")}
          from={period.from}
          to={period.to}
          label="Signed up"
        />
      </ConsoleToolbar>

      <div className="overflow-hidden rounded-[10px] border border-line bg-white">
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title={filtered ? "No customers match these filters" : "No customer accounts yet"}
            description={
              filtered
                ? "Nothing in this window matched the search, status or date range. Clear the filters to see every account."
                : "The API returned zero accounts. The first sign-up will appear here with its balance and activity."
            }
            action={
              filtered ? (
                <Link
                  href={buildHref("/admin/users", { ...period })}
                  className="rounded text-[0.75rem] font-semibold text-violet-ink underline decoration-violet/30 underline-offset-4 hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <DataTable
              caption="Customer accounts"
              cardNoun="customer accounts"
              columns={columns}
              rows={items}
              rowKey={(row) => row.id}
              basePath="/admin/users"
              query={query}
              sort={sort}
              dir={dir}
            />
            <Pagination
              basePath="/admin/users"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              total={total}
              noun="customers"
              shown={items.length}
            />
          </>
        )}
        {items.length === 0 ? (
          <div className="border-t border-line px-4 py-2 text-[0.6875rem] text-muted">
            Sign-up window:{" "}
            {period.from && period.to
              ? `${period.from} → ${period.to}`
              : `last ${period.range ?? "30d"}`}
          </div>
        ) : null}
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        Sorting and paging are applied by the API. The cursor is dropped whenever a filter changes, so
        a page from one query can never be shown under another. Lifetime value is “not available” when
        the service cannot compute it.
      </p>
    </>
  );
}

function UsersSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={10} />
    </div>
  );
}
