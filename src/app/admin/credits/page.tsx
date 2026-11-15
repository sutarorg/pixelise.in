import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Wallet } from "lucide-react";

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
import { CreditAdjustmentDialog } from "@/components/admin/credit-adjustment-dialog";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { can, getAdminSession } from "@/lib/admin-session";
import { listCreditTransactions } from "@/lib/api/admin-server";
import type { AdminLedgerRow, AdminLedgerType } from "@/lib/api/admin-types";
import { ledgerTypeMeta } from "@/config/admin";
import { formatCreditDelta, formatCredits, formatDateTime } from "@/lib/format";
import {
  buildHref,
  readParam,
  readPeriod,
  type QueryRecord,
  type RawSearchParams,
} from "@/lib/admin-filters";

export const metadata: Metadata = {
  title: "Credit Ledger",
  description: "Every credit movement, with adjustments.",
};

const types: AdminLedgerType[] = ["purchase", "reservation", "consumption", "refund", "adjustment"];

export default function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Credit Ledger"
        description="The append-only record of every credit movement. Purchases, reservations, charges and refunds are written by the billing and generation services; adjustments are written by admins with a reason."
      />
      <Suspense fallback={<LedgerSkeleton />}>
        <LedgerContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LedgerContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const user = readParam(params, "user");
  const typeParam = readParam(params, "type");
  const type = typeParam && types.includes(typeParam as AdminLedgerType)
    ? (typeParam as AdminLedgerType)
    : undefined;
  const period = readPeriod(params);
  const cursor = readParam(params, "cursor");

  const query: QueryRecord = { q, user, type, ...period, cursor };

  const [result, session] = await Promise.all([
    listCreditTransactions({
      q,
      user,
      type,
      ...(period.from && period.to ? { from: period.from, to: period.to } : { range: period.range }),
      cursor,
    }),
    getAdminSession(),
  ]);

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const { items, nextCursor, prevCursor, total } = result.data;
  const filtered = Boolean(q || user || type || period.from);
  const canWriteCredits = can(session, "credits:write");

  const columns: DataTableColumn<AdminLedgerRow>[] = [
    {
      id: "createdAt",
      header: "When",
      cardTitle: true,
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-ink-soft">
          {formatDateTime(row.createdAt)}
        </time>
      ),
      cardLabel: "Type",
      cardCell: (row) => ledgerTypeMeta[row.type].label,
    },
    {
      id: "customer",
      header: "Customer",
      cardLabel: "Customer",
      cell: (row) => (
        <Link
          href={`/admin/users/${row.userId}`}
          className="flex min-w-0 flex-col rounded hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <span className="truncate text-ink-soft">{row.userLabel}</span>
          <span className="truncate font-mono text-[0.65625rem] text-muted">{row.userId}</span>
        </Link>
      ),
    },
    {
      id: "id",
      header: "Transaction",
      cardLabel: "Transaction",
      cell: (row) => (
        <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted">{row.id}</span>
      ),
    },
    {
      id: "type",
      header: "Type",
      cardLabel: "Type",
      cell: (row) => (
        <StatusBadge tone={ledgerTypeMeta[row.type].tone}>{ledgerTypeMeta[row.type].label}</StatusBadge>
      ),
    },
    {
      id: "credits",
      header: "Change",
      align: "right",
      cardLabel: "Change",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-ink">
          {formatCreditDelta(row.credits)}
        </span>
      ),
    },
    {
      id: "balanceAfter",
      header: "Balance after",
      align: "right",
      cardLabel: "Balance after",
      cell: (row) =>
        row.balanceAfter === null ? (
          <span className="text-muted">Not available</span>
        ) : (
          <span className="tabular-nums text-muted-strong">{formatCredits(row.balanceAfter)}</span>
        ),
    },
    {
      id: "related",
      header: "Related record",
      cardLabel: "Related",
      cell: (row) =>
        row.relatedType && row.relatedId ? (
          <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted">
            {row.relatedType} · {row.relatedId}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "reason",
      header: "Admin / reason",
      cardLabel: "Admin / reason",
      cell: (row) =>
        row.adminLabel ? (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[0.75rem] font-semibold text-ink-soft">{row.adminLabel}</span>
            <span className="line-clamp-2 max-w-[32ch] text-[0.71875rem] text-muted">
              {row.reason ?? "No reason recorded"}
            </span>
          </span>
        ) : row.reason ? (
          <span className="line-clamp-2 max-w-[32ch] text-[0.71875rem] text-muted">{row.reason}</span>
        ) : (
          <span className="text-muted">System entry</span>
        ),
    },
  ];

  return (
    <>
      <ConsoleToolbar
        actions={
          <>
            <CreditAdjustmentDialog
              disabled={!canWriteCredits}
              disabledReason="This admin account doesn't have the credits:write permission."
            />
            <ClearFilters basePath="/admin/credits" href={buildHref("/admin/credits", { ...period })} />
          </>
        }
      >
        <SearchInput
          basePath="/admin/credits"
          label="Search the ledger by customer, transaction or related record"
          placeholder="Email, name or transaction ID"
          defaultValue={q}
          preserve={{ user, type, ...period }}
        />
        <FilterSelect
          basePath="/admin/credits"
          name="type"
          label="Type"
          value={type}
          preserve={{ q, user, ...period }}
          options={types.map((value) => ({ value, label: ledgerTypeMeta[value].label }))}
          allLabel="Any type"
        />
        <form action="/admin/credits" method="get" className="flex items-end gap-1.5">
          {[
            ["q", q],
            ["type", type],
          ].map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <div>
            <label
              htmlFor="ledger-user"
              className="block text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted"
            >
              Customer ID
            </label>
            <input
              id="ledger-user"
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
          basePath="/admin/credits"
          preserve={{ q, user, type }}
          activeRange={period.from && period.to ? "custom" : (period.range ?? "30d")}
          from={period.from}
          to={period.to}
        />
      </ConsoleToolbar>

      <div className="overflow-hidden rounded-[10px] border border-line bg-white">
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Wallet}
            title={filtered ? "No ledger entries match these filters" : "No credit movements yet"}
            description={
              filtered
                ? "No movement in this window matched the search, type or date range. Clear the filters to see the whole ledger."
                : "The API returned no movements. Purchases, charges, refunds and adjustments appear here as they are written — nothing is pre-seeded."
            }
          />
        ) : (
          <>
            <DataTable
              caption="Credit ledger, newest first"
              cardNoun="ledger entries"
              columns={columns}
              rows={items}
              rowKey={(row) => row.id}
              basePath="/admin/credits"
              query={query}
            />
            <Pagination
              basePath="/admin/credits"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              total={total}
              noun="ledger entries"
              shown={items.length}
            />
          </>
        )}
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        Adjustments are sent to the service, which validates the amount, keeps the balance from
        going negative, writes this ledger entry and answers with the resulting balance. The console
        never writes a wallet directly, and every adjustment is attributed and reasoned.
      </p>
    </>
  );
}

function LedgerSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={10} />
    </div>
  );
}
