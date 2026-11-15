import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MailCheck, MailX } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { DetailSection, DetailItem, Identifier, Unknown } from "@/components/admin/detail-list";
import { CreditAdjustmentDialog } from "@/components/admin/credit-adjustment-dialog";
import { UserStatusControl } from "@/components/admin/user-status-control";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { DetailSkeleton } from "@/components/admin/loading-skeleton";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { SectionCard } from "@/components/app/section-card";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { can, getAdminSession } from "@/lib/admin-session";
import { getUserDetail } from "@/lib/api/admin-server";
import type {
  AdminGenerationRow,
  AdminLedgerRow,
  AdminPaymentRow,
} from "@/lib/api/admin-types";
import { generationStatusMeta, ledgerTypeMeta, paymentStatusMeta, userStatusMeta } from "@/config/admin";
import { formatCreditDelta, formatCredits, formatDate, formatDateTime, formatPaise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Customer record",
  description: "Account, balance, activity and status for one customer.",
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <UserDetail params={params} />
    </Suspense>
  );
}

async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, session] = await Promise.all([getUserDetail(id), getAdminSession()]);

  if (!result.ok) {
    return (
      <>
        <AdminPageHeader
          title="Customer record"
          back={{ href: "/admin/users", label: "All customers" }}
          description="Account, balance, activity and status for one customer."
        />
        <AdminErrorState
          error={result.error}
          title={
            result.error.code === "not_found"
              ? "That customer doesn't exist"
              : result.error.code === "forbidden"
                ? "This record isn't available to your account"
                : undefined
          }
        />
      </>
    );
  }

  const user = result.data;
  const status = userStatusMeta[user.status];
  /* `can()` only decides whether a control is offered — the service re-checks it.
     In a build with no API endpoint, controls stay visible and the request reports
     the service's refusal instead of the console pretending it lacks a permission. */
  const canWriteUsers = can(session, "users:write");
  const canWriteCredits = can(session, "credits:write");
  const configured = session.state !== "unconfigured";

  const generationsHref = `/admin/generations?user=${encodeURIComponent(user.id)}`;
  const paymentsHref = `/admin/payments?q=${encodeURIComponent(user.email)}`;
  const ledgerHref = `/admin/credits?user=${encodeURIComponent(user.id)}`;

  return (
    <>
      <AdminPageHeader
        title={user.displayName?.trim() || user.email}
        back={{ href: "/admin/users", label: "All customers" }}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{user.email}</span>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              {user.emailVerified ? (
                <MailCheck className="size-3.5 text-success" aria-hidden="true" />
              ) : (
                <MailX className="size-3.5 text-muted" aria-hidden="true" />
              )}
              {user.emailVerified ? "Email verified" : "Email not verified"}
            </span>
          </span>
        }
        meta={
          <>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <span className="text-[0.71875rem] text-muted">
              Customer since {formatDate(user.createdAt)}
            </span>
            <span className="text-[0.71875rem] text-muted">
              Last sign-in{" "}
              {user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "not recorded"}
            </span>
          </>
        }
        actions={
          <>
            <CreditAdjustmentDialog
              initialUser={{ id: user.id, label: user.displayName?.trim() || user.email }}
              disabled={!canWriteCredits}
              disabledReason="This admin account doesn't have the credits:write permission."
            />
            <UserStatusControl
              user={{ id: user.id, displayName: user.displayName, email: user.email, status: user.status }}
              canWrite={canWriteUsers}
              canWriteReason="This admin account doesn't have the users:write permission."
            />
          </>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Credits available"
          value={formatCredits(user.creditsAvailable)}
          hint="Balance the customer can spend right now."
        />
        <MetricCard
          label="Credits reserved"
          value={formatCredits(user.creditsReserved)}
          hint="Held for jobs that are still queued or processing."
        />
        <MetricCard
          label="Lifetime purchased"
          value={formatCredits(user.creditsLifetimePurchased)}
          hint="Credits granted by paid orders."
        />
        <MetricCard
          label="Lifetime consumed"
          value={formatCredits(user.creditsLifetimeConsumed)}
          hint="Credits charged for generation jobs."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <SectionCard title="Account" description="Identity, status and suspension detail.">
          <DetailSection title="Identity">
            <DetailItem label="Customer ID" mono>
              <Identifier value={user.id} />
            </DetailItem>
            <DetailItem label="Display name">
              {user.displayName?.trim() || <Unknown />}
            </DetailItem>
            <DetailItem label="Email">{user.email}</DetailItem>
            <DetailItem label="Email verified">{user.emailVerified ? "Yes" : "No"}</DetailItem>
            <DetailItem label="Signed up">{formatDateTime(user.createdAt)}</DetailItem>
            <DetailItem label="Last sign-in">
              {user.lastSignInAt ? formatDateTime(user.lastSignInAt) : <Unknown />}
            </DetailItem>
          </DetailSection>

          <DetailSection
            title="Status"
            description="Changed only through the service, with a recorded reason."
          >
            <DetailItem label="Account status">
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </DetailItem>
            <DetailItem label="Suspended at">
              {user.suspendedAt ? formatDateTime(user.suspendedAt) : "Not suspended"}
            </DetailItem>
            <DetailItem label="Suspension reason" wide>
              {user.suspensionReason ?? "No suspension recorded"}
            </DetailItem>
          </DetailSection>

          <DetailSection title="Commercial summary">
            <DetailItem label="Generations (all time)">
              {formatCredits(user.generationsTotal)}
            </DetailItem>
            <DetailItem label="Purchases (all time)">
              {formatCredits(user.purchasesTotal)}
            </DetailItem>
            <DetailItem label="Lifetime paid">
              {user.lifetimePaidPaise === null ? <Unknown /> : formatPaise(user.lifetimePaidPaise)}
            </DetailItem>
            <DetailItem label="Console note">
              {configured
                ? "Figures are read from the customer endpoint on each request."
                : "Not connected to the API in this build."}
            </DetailItem>
          </DetailSection>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Recent generations" bodyClassName="p-0">
            <RecentGenerations rows={user.recentGenerations} />
            <div className="border-t border-line px-4 py-2">
              <Link
                href={generationsHref}
                className="inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                All generations for this customer <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Recent payments" bodyClassName="p-0">
            <RecentPayments rows={user.recentPayments} />
            <div className="border-t border-line px-4 py-2">
              <Link
                href={paymentsHref}
                className="inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                Search payments <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Credit ledger"
        description="Recent movements. Adjustments carry the reason and the admin who made them."
        bodyClassName="p-0"
      >
        <RecentLedger rows={user.recentTransactions} />
        <div className="border-t border-line px-4 py-2">
          <Link
            href={ledgerHref}
            className="inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            Open the credit ledger for this customer <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </SectionCard>
    </>
  );
}

const summaryQuery = {};

function RecentGenerations({ rows }: { rows: AdminGenerationRow[] }) {
  if (rows.length === 0) {
    return (
      <AdminEmptyState
        compact
        title="No generations yet"
        description="This customer has not run a job. Nothing is listed until the API returns one."
      />
    );
  }
  const columns: DataTableColumn<AdminGenerationRow>[] = [
    {
      id: "id",
      header: "Job",
      cardTitle: true,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-[0.71875rem] text-ink">{row.id}</span>
          <span className="truncate text-[0.6875rem] text-muted">
            {row.styleName} · {row.modelName}
          </span>
        </span>
      ),
      cardLabel: "Style / model",
      cardCell: (row) => `${row.styleName} · ${row.modelName}`,
    },
    {
      id: "createdAt",
      header: "Time",
      cardLabel: "Time",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-[0.75rem] text-muted-strong">
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
        <StatusBadge tone={generationStatusMeta[row.status].tone}>
          {generationStatusMeta[row.status].label}
        </StatusBadge>
      ),
    },
  ];
  return (
    <DataTable
      caption="Recent generation jobs for this customer"
      cardNoun="jobs"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      basePath="/admin/users"
      query={summaryQuery}
    />
  );
}

function RecentPayments({ rows }: { rows: AdminPaymentRow[] }) {
  if (rows.length === 0) {
    return (
      <AdminEmptyState
        compact
        title="No payments yet"
        description="No Razorpay order exists for this account. Purchases appear here once the billing service records one."
      />
    );
  }
  const columns: DataTableColumn<AdminPaymentRow>[] = [
    {
      id: "pack",
      header: "Pack",
      cardTitle: true,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-ink">{row.packName}</span>
          <span className="truncate font-mono text-[0.6875rem] text-muted">{row.id}</span>
        </span>
      ),
      cardLabel: "Amount",
      cardCell: (row) => formatPaise(row.amountPaise),
    },
    {
      id: "createdAt",
      header: "Date",
      cardLabel: "Date",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-[0.75rem] text-muted-strong">
          {formatDate(row.createdAt)}
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
    <DataTable
      caption="Recent payments from this customer"
      cardNoun="payments"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      basePath="/admin/users"
      query={summaryQuery}
    />
  );
}

function RecentLedger({ rows }: { rows: AdminLedgerRow[] }) {
  if (rows.length === 0) {
    return (
      <AdminEmptyState
        compact
        title="No credit movements"
        description="Purchases, reservations, charges, refunds and adjustments all appear here. An empty ledger means none happened."
      />
    );
  }
  const columns: DataTableColumn<AdminLedgerRow>[] = [
    {
      id: "createdAt",
      header: "When",
      cardTitle: true,
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap text-[0.75rem] text-ink-soft">
          {formatDateTime(row.createdAt)}
        </time>
      ),
      cardLabel: "Type",
      cardCell: (row) => ledgerTypeMeta[row.type].label,
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
        <span className={row.credits >= 0 ? "font-semibold text-ink" : "font-semibold text-ink"}>
          {formatCreditDelta(row.credits)}
        </span>
      ),
    },
    {
      id: "balanceAfter",
      header: "Balance after",
      align: "right",
      cardLabel: "Balance after",
      cell: (row) => (row.balanceAfter === null ? <Unknown /> : formatCredits(row.balanceAfter)),
    },
    {
      id: "related",
      header: "Related record",
      cardLabel: "Related",
      cell: (row) =>
        row.relatedType && row.relatedId ? (
          <span className="font-mono text-[0.6875rem] text-muted">
            {row.relatedType} · {row.relatedId}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "reason",
      header: "Reason / admin",
      cardLabel: "Reason",
      cell: (row) =>
        row.reason ? (
          <span className="line-clamp-2 max-w-[28ch] text-[0.75rem] text-muted-strong">
            {row.reason}
            {row.adminLabel ? <span className="block text-muted">by {row.adminLabel}</span> : null}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];
  return (
    <DataTable
      caption="Recent credit ledger entries for this customer"
      cardNoun="ledger entries"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      basePath="/admin/users"
      query={summaryQuery}
    />
  );
}
