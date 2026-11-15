/**
 * Domain types for the Pixelise admin console.
 *
 * These mirror `docs/API-CONTRACT.md` Part III. Every value is server-authored;
 * the console never derives a metric, a balance or a status on the client.
 * `null` always means "the backend could not provide this", which the UI renders
 * as "Not available" rather than as a zero.
 */

/* -------------------------------- Identity --------------------------------- */

export type AdminRole = "owner" | "admin" | "analyst" | "support";

export type AdminPermission =
  | "users:write"
  | "credits:write"
  | "payments:refund"
  | "models:write"
  | "config:write"
  | "audit:read";

export interface AdminIdentity {
  id: string;
  displayName: string | null;
  email: string;
  role: AdminRole;
  /** What the server says this admin may do. The UI mirrors it; it never grants it. */
  permissions: AdminPermission[];
  createdAt: string;
}

/* --------------------------------- Period ---------------------------------- */

export type AdminRangePreset = "7d" | "30d" | "90d" | "custom";

export interface AdminPeriod {
  preset: AdminRangePreset;
  /** ISO date (YYYY-MM-DD), inclusive. */
  from: string;
  to: string;
  days: number;
  /** Server-written label such as "1–30 Sep 2026". */
  label: string;
}

/* -------------------------------- Overview --------------------------------- */

export interface AdminVolumePoint {
  /** ISO date. */
  date: string;
  total: number;
  failed: number;
}

export interface AdminOverview {
  period: AdminPeriod;
  users: {
    total: number;
    newInPeriod: number;
    /** Null when the backend has no documented definition of "active". */
    activeCustomers: number | null;
    activeDefinition: string | null;
  };
  revenue: {
    grossPaise: number;
    refundedPaise: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
  };
  credits: {
    purchased: number;
    consumed: number;
    reserved: number;
    adjusted: number;
  };
  generations: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    /** completed / (completed + failed); null when no job finished. */
    successRate: number | null;
    averageDurationMs: number | null;
  };
  volume: AdminVolumePoint[];
  updatedAt: string;
}

/* ---------------------------------- Users ---------------------------------- */

export type AdminUserStatus = "active" | "suspended" | "pending_verification" | "deleted";

export interface AdminUserRow {
  id: string;
  displayName: string | null;
  email: string;
  createdAt: string;
  status: AdminUserStatus;
  creditsAvailable: number;
  creditsReserved: number;
  generationsTotal: number;
  purchasesTotal: number;
  lifetimePaidPaise: number | null;
}

export interface AdminUserDetail extends AdminUserRow {
  emailVerified: boolean;
  lastSignInAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  creditsLifetimePurchased: number;
  creditsLifetimeConsumed: number;
  recentGenerations: AdminGenerationRow[];
  recentPayments: AdminPaymentRow[];
  recentTransactions: AdminLedgerRow[];
}

export interface AdminUserStatusInput {
  status: "active" | "suspended";
  reason: string;
}

/* ------------------------------- Generations ------------------------------- */

export type AdminGenerationStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface AdminGenerationRow {
  id: string;
  userId: string;
  userLabel: string;
  styleName: string;
  modelId: string;
  modelName: string;
  createdAt: string;
  durationMs: number | null;
  status: AdminGenerationStatus;
  creditsCharged: number | null;
}

export interface AdminGenerationDetail extends AdminGenerationRow {
  sceneName: string | null;
  qualityLabel: string;
  /** Short-lived signed URL issued per request; never a raw storage key. */
  sourcePreviewUrl: string | null;
  resultPreviewUrl: string | null;
  providerRequestId: string | null;
  modelEndpoint: string | null;
  creditsReserved: number | null;
  failureCode: string | null;
  failureMessage: string | null;
  statusHistory: { status: AdminGenerationStatus; at: string; note: string | null }[];
}

/* --------------------------------- Payments -------------------------------- */

export type AdminPaymentStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface AdminPaymentRow {
  id: string;
  userId: string;
  userLabel: string;
  packId: string;
  packName: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  status: AdminPaymentStatus;
  createdAt: string;
}

export interface AdminPaymentDetail extends AdminPaymentRow {
  internalOrderId: string;
  razorpayPaymentId: string | null;
  creditsGranted: number | null;
  webhookStatus: "received" | "pending" | "failed" | "not_applicable";
  verificationStatus: "verified" | "unverified" | "failed";
  history: { status: AdminPaymentStatus; at: string; note: string | null }[];
}

/* ------------------------------- Credit ledger ----------------------------- */

export type AdminLedgerType =
  | "purchase"
  | "reservation"
  | "consumption"
  | "refund"
  | "adjustment";

export interface AdminLedgerRow {
  id: string;
  userId: string;
  userLabel: string;
  type: AdminLedgerType;
  /** Signed: +150 added, −12 consumed. */
  credits: number;
  balanceAfter: number | null;
  relatedType: "payment" | "generation" | null;
  relatedId: string | null;
  adminLabel: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminCreditAdjustmentInput {
  userId: string;
  direction: "credit" | "debit";
  credits: number;
  reason: string;
}

export interface AdminCreditAdjustmentResult {
  transactionId: string;
  userId: string;
  credits: number;
  balanceAvailable: number;
  balanceReserved: number;
}

/* ---------------------------------- Models --------------------------------- */

export type AdminModelAvailability = "available" | "degraded" | "unavailable";

export interface AdminModel {
  id: string;
  provider: string;
  name: string;
  endpoint: string;
  category: string;
  availability: AdminModelAvailability;
  imageModes: string[];
  outputResolutions: string[];
  creditRules: { qualityId: string; label: string; credits: number }[];
  /** Human-readable provider price, when the backend exposes it. */
  providerPricing: string | null;
  routingEnabled: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export interface AdminModelSettingInput {
  routingEnabled: boolean;
  reason: string;
}

/* ------------------------------- Configuration ----------------------------- */

export interface AdminConfig {
  general: {
    siteName: string;
    supportEmail: string | null;
    supportInboxStatus: "configured" | "not_configured";
    systemStatus: "operational" | "degraded" | "maintenance" | "unknown";
    systemStatusNote: string | null;
  };
  generation: {
    styles: { id: string; name: string; enabled: boolean }[];
    models: { id: string; name: string; availability: AdminModelAvailability }[];
    creditRates: { qualityId: string; label: string; credits: number }[];
    notes: string | null;
  };
  payments: {
    packs: { id: string; name: string; pricePaise: number; credits: number; active: boolean }[];
    provider: {
      name: string;
      status: "configured" | "not_configured" | "test_mode";
    };
    webhookConfigured: boolean;
  };
  email: {
    provider: string | null;
    status: "configured" | "not_configured";
    notifications: { id: string; label: string; enabled: boolean }[];
  };
  updatedAt: string;
}

/* -------------------------------- Audit log -------------------------------- */

export type AdminAuditAction =
  | "credit_adjustment"
  | "user_suspension"
  | "user_reactivation"
  | "model_setting"
  | "config_change"
  | "refund"
  | "role_change";

export interface AdminAuditRow {
  id: string;
  adminId: string;
  adminLabel: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  result: "success" | "failure";
  createdAt: string;
}

/* -------------------------------- Transport -------------------------------- */

export interface AdminPaginated<T> {
  items: T[];
  nextCursor: string | null;
  /** Present when the backend supports reverse paging; null otherwise. */
  prevCursor: string | null;
  total: number | null;
}
