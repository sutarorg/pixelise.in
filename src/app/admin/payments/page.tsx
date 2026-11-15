import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState, AdminRegionError } from "@/components/admin/error-state";
import { ConsoleToolbar } from "@/components/admin/toolbar";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { FilterSelect, ClearFilters } from "@/components/admin/filter-select";
import { Pagination } from "@/components/admin/pagination";
import { SearchInput } from "@/components/admin/search-input";
import { StatusBadge } from "@/components/admin/status-badge";
import { DetailDrawer } from "@/components/admin/detail-drawer";
import { DetailSkeleton, TableSkeleton } from "@/components/admin/loading-skeleton";
import { PaymentDetailBody } from "@/components/admin/payment-detail";
import { paymentStatusMeta } from "@/config/admin";
import { getPaymentDetail, listPayments } from "@/lib/api/admin-server";
import type { AdminPaymentRow, AdminPaymentStatus } from "@/lib/api/admin-types";
import { formatDateTime, formatPaise } from "@/lib/format";
import {
  buildHref,
  readParam,
  readPeriod,
  type QueryRecord,
  type RawSearchParams,
} from "@/lib/admin-filters";

export const metadata: Metadata = {
  title: "Payments",
  description: "Razorpay orders, verification and refunds.",
};

const statuses: AdminPaymentStatus[] = [
  "created",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
];

export default function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <>
      <AdminPageHeader
        title="Payments"
        description="Every credit purchase, from order creation to signature verification. Amounts are shown in Indian rupees exactly as the billing service stored them (in paise)."
      />
      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PaymentsContent({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const statusParam = readParam(params, "status");
  const status = statusParam && statuses.includes(statusParam as AdminPaymentStatus)
    ? (statusParam as AdminPaymentStatus)
    : undefined;
  const record = readParam(params, "record");
  const period = readPeriod(params);
  const cursor = readParam(params, "cursor");

  const query: QueryRecord = { q, status, ...period, cursor, record };

  const result = await listPayments({
    q,
    status,
    ...(period.from && period.to ? { from: period.from, to: period.to } : { range: period.range }),
    cursor,
  });

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const { items, nextCursor, prevCursor, total } = result.data;
  const filtered = Boolean(q || status || period.from);
  const closeHref = buildHref("/admin/payments", { ...query, record: undefined });
  const detailResult = record ? await getPaymentDetail(record) : null;

  const columns: DataTableColumn<AdminPaymentRow>[] = [
    {
      id: "id",
      header: "Payment",
      cardTitle: true,
      cell: (row) => (
        <Link
          href={buildHref("/admin/payments", { ...query, record: row.id })}
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
      id: "customer",
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
      id: "pack",
      header: "Pack",
      cardLabel: "Pack",
      cell: (row) => <span className="whitespace-nowrap">{row.packName}</span>,
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      cardLabel: "Amount",
      cell: (row) => (
        <span className="whitespace-nowrap font-semibold tabular-nums text-ink">
          {formatPaise(row.amountPaise)}
        </span>
      ),
    },
    {
      id: "razorpayOrderId",
      header: "Razorpay order",
      cardLabel: "Razorpay order",
      cell: (row) => (
        <span className="whitespace-nowrap font-mono text-[0.6875rem] text-muted">
          {row.razorpayOrderId}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cardLabel: "Created",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-muted-strong">
          {formatDateTime(row.createdAt)}
        </time>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "right",
      cardLabel: "Status",
      cell: (row) => (
        <StatusBadge tone={paymentStatusMeta[row.status].tone}>
          {paymentStatusMeta[row.status].label}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <ConsoleToolbar
        actions={
          <ClearFilters basePath="/admin/payments" href={buildHref("/admin/payments", { ...period })} />
        }
      >
        <SearchInput
          basePath="/admin/payments"
          label="Search payments by customer, order id or payment id"
          placeholder="Email, order or payment ID"
          defaultValue={q}
          preserve={{ status, ...period }}
        />
        <FilterSelect
          basePath="/admin/payments"
          name="status"
          label="Status"
          value={status}
          preserve={{ q, ...period }}
          options={statuses.map((value) => ({ value, label: paymentStatusMeta[value].label }))}
          allLabel="Any status"
        />
        <DateRangeFilter
          basePath="/admin/payments"
          preserve={{ q, status }}
          activeRange={period.from && period.to ? "custom" : (period.range ?? "30d")}
          from={period.from}
          to={period.to}
        />
      </ConsoleToolbar>

      <div className="overflow-hidden rounded-[10px] border border-line bg-white">
        {items.length === 0 ? (
          <AdminEmptyState
            icon={ReceiptText}
            title={filtered ? "No payments match these filters" : "No payments recorded yet"}
            description={
              filtered
                ? "No order in this window matched the search, status or date range. Clear the filters to see every payment."
                : "The API returned zero orders. Once Razorpay creates one it appears here with its verification state — nothing is seeded."
            }
          />
        ) : (
          <>
            <DataTable
              caption="Payments, newest first"
              cardNoun="payments"
              columns={columns}
              rows={items}
              rowKey={(row) => row.id}
              basePath="/admin/payments"
              query={query}
            />
            <Pagination
              basePath="/admin/payments"
              query={query}
              nextCursor={nextCursor}
              prevCursor={prevCursor}
              total={total}
              noun="payments"
              shown={items.length}
            />
          </>
        )}
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        A payment is “paid” only because the billing service verified the gateway signature or
        received the webhook. This page cannot change that state, and refunds are server-authorized
        and audited.
      </p>

      {record ? (
        <DetailDrawer
          open
          closeHref={closeHref}
          title="Payment detail"
          description="Order identifiers, verification state and history."
        >
          <Suspense fallback={<DetailSkeleton />}>
            {detailResult && detailResult.ok ? (
              <PaymentDetailBody payment={detailResult.data} />
            ) : (
              <AdminRegionError
                error={
                  detailResult && !detailResult.ok
                    ? detailResult.error
                    : {
                        code: "not_found",
                        message: "That payment could not be loaded.",
                        status: 404,
                        retryable: false,
                        requestId: null,
                      }
                }
                title="That payment couldn't be loaded"
              />
            )}
          </Suspense>
        </DetailDrawer>
      ) : null}
    </>
  );
}

function PaymentsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={10} />
    </div>
  );
}
