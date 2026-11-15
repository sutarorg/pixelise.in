import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { auditActionMeta } from "@/config/admin";
import { formatDateTime } from "@/lib/format";
import type { AdminAuditRow } from "@/lib/api/admin-types";
import type { QueryRecord } from "@/lib/admin-filters";

/**
 * The audit trail is append-only server data. Every column comes straight from
 * the entry — the admin label, the target, the reason and the result are never
 * reconstructed from anything else, and no entry exists that the service did not
 * write.
 */
export function AuditLogTable({
  rows,
  basePath,
  query,
  sort,
  dir,
}: {
  rows: AdminAuditRow[];
  basePath: string;
  query: QueryRecord;
  sort?: string;
  dir?: "asc" | "desc";
}) {
  const columns: DataTableColumn<AdminAuditRow>[] = [
    {
      id: "createdAt",
      header: "When",
      sortable: true,
      cardLabel: "When",
      cell: (row) => (
        <time dateTime={row.createdAt} className="whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </time>
      ),
      cardTitle: true,
    },
    {
      id: "admin",
      header: "Administrator",
      cardLabel: "Administrator",
      cell: (row) => (
        <span className="font-medium text-ink">{row.adminLabel}</span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cardLabel: "Action",
      cell: (row) => {
        const meta = auditActionMeta[row.action];
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
    },
    {
      id: "target",
      header: "Affected record",
      cardLabel: "Record",
      cell: (row) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-ink-soft">
            {row.targetLabel ?? row.targetType}
          </span>
          <span className="truncate font-mono text-[0.6875rem] text-muted">
            {row.targetType} · {row.targetId}
          </span>
        </span>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      cardLabel: "Reason",
      cell: (row) =>
        row.reason ? (
          <span className="line-clamp-2 max-w-[26ch] text-muted-strong">{row.reason}</span>
        ) : (
          <span className="text-muted">No reason recorded</span>
        ),
    },
    {
      id: "result",
      header: "Result",
      align: "right",
      cardLabel: "Result",
      cell: (row) =>
        row.result === "success" ? (
          <StatusBadge tone="success">Success</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Failed</StatusBadge>
        ),
    },
  ];

  return (
    <DataTable
      caption="Administrator audit log, most recent first"
      cardNoun="audit entries"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      basePath={basePath}
      query={query}
      sort={sort}
      dir={dir}
    />
  );
}

/** Deep link from an audit entry to the record it affected, when there is one. */
export function AuditTargetLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded font-medium text-violet-ink underline decoration-violet/25 underline-offset-2 hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
    >
      {children}
    </Link>
  );
}
