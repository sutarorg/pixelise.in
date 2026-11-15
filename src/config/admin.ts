/**
 * Admin console structure and vocabulary.
 *
 * Navigation, page metadata and the label/tone maps for every status the console
 * renders. Tones are presentational only — a status is always also written out in
 * words, so nothing depends on colour.
 */

import type {
  AdminAuditAction,
  AdminGenerationStatus,
  AdminLedgerType,
  AdminModelAvailability,
  AdminPaymentStatus,
  AdminUserStatus,
} from "@/lib/api/admin-types";

export type AdminNavIcon =
  | "overview"
  | "users"
  | "generations"
  | "payments"
  | "credits"
  | "models"
  | "config"
  | "audit";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminNavIcon;
  description: string;
};

export const adminNavGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Administration",
    items: [
      {
        label: "Overview",
        href: "/admin",
        icon: "overview",
        description: "Operational metrics for the selected period.",
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: "users",
        description: "Customer accounts, balances and status.",
      },
      {
        label: "Generations",
        href: "/admin/generations",
        icon: "generations",
        description: "Every render job and its outcome.",
      },
      {
        label: "Payments",
        href: "/admin/payments",
        icon: "payments",
        description: "Razorpay orders, verification and refunds.",
      },
      {
        label: "Credit Ledger",
        href: "/admin/credits",
        icon: "credits",
        description: "Every credit movement, with adjustments.",
      },
      {
        label: "AI Models",
        href: "/admin/models",
        icon: "models",
        description: "Providers, endpoints and routing.",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Configuration",
        href: "/admin/settings",
        icon: "config",
        description: "Site, generation, payments and email settings.",
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: "audit",
        description: "Who changed what, when and why.",
      },
    ],
  },
];

export const adminNav = adminNavGroups.flatMap((group) => group.items);

export const adminMeta = {
  title: "Pixelise Console",
  wordmarkSuffix: "Admin",
  /** Read-only notice shown on every write surface. */
  authorizationNote: "Authorized and recorded by the server on every request.",
} as const;

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info" | "violet";

export const userStatusMeta: Record<AdminUserStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "danger" },
  pending_verification: { label: "Pending verification", tone: "warning" },
  deleted: { label: "Deleted", tone: "neutral" },
};

export const generationStatusMeta: Record<
  AdminGenerationStatus,
  { label: string; tone: StatusTone }
> = {
  queued: { label: "Queued", tone: "neutral" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const paymentStatusMeta: Record<AdminPaymentStatus, { label: string; tone: StatusTone }> = {
  created: { label: "Created", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  refunded: { label: "Refunded", tone: "violet" },
  partially_refunded: { label: "Partially refunded", tone: "violet" },
};

export const ledgerTypeMeta: Record<AdminLedgerType, { label: string; tone: StatusTone }> = {
  purchase: { label: "Purchase", tone: "success" },
  reservation: { label: "Reservation", tone: "info" },
  consumption: { label: "Consumption", tone: "neutral" },
  refund: { label: "Refund", tone: "violet" },
  adjustment: { label: "Admin adjustment", tone: "warning" },
};

export const modelAvailabilityMeta: Record<
  AdminModelAvailability,
  { label: string; tone: StatusTone }
> = {
  available: { label: "Available", tone: "success" },
  degraded: { label: "Degraded", tone: "warning" },
  unavailable: { label: "Unavailable", tone: "danger" },
};

export const auditActionMeta: Record<AdminAuditAction, { label: string; tone: StatusTone }> = {
  credit_adjustment: { label: "Credit adjustment", tone: "warning" },
  user_suspension: { label: "User suspension", tone: "danger" },
  user_reactivation: { label: "User reactivation", tone: "success" },
  model_setting: { label: "Model setting", tone: "info" },
  config_change: { label: "Configuration change", tone: "info" },
  refund: { label: "Refund", tone: "violet" },
  role_change: { label: "Role change", tone: "violet" },
};

export const systemStatusMeta: Record<
  "operational" | "degraded" | "maintenance" | "unknown",
  { label: string; tone: StatusTone }
> = {
  operational: { label: "Operational", tone: "success" },
  degraded: { label: "Degraded", tone: "warning" },
  maintenance: { label: "Maintenance", tone: "info" },
  unknown: { label: "Unknown", tone: "neutral" },
};
