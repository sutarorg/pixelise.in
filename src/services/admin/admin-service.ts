import "server-only";

import { PACKS } from "@/config/packs";
import { defaultQualities, defaultStyles } from "@/config/generation";
import type {
  AdminConfig,
  AdminGenerationDetail,
  AdminGenerationRow,
  AdminIdentity,
  AdminLedgerRow,
  AdminModel,
  AdminOverview,
  AdminPaginated,
  AdminPaymentDetail,
  AdminPaymentRow,
  AdminPeriod,
  AdminUserDetail,
  AdminUserRow,
} from "@/lib/api/admin-types";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import { signedAssetUrl } from "@/services/uploads/upload-service";
import { getServiceClient } from "@/lib/supabase/service";
import type { AuthenticatedUser } from "@/lib/auth/session";

/**
 * Admin console service.
 *
 * Everything here runs after `requireAdmin(...)`; there is no second check for
 * "is this an admin" inside, and no query returns another tenant's data by
 * accident because every list is an explicit projection.
 *
 * Metrics come from SQL aggregations (`admin_overview`, `admin_user_stats`), not
 * from summing pages in TypeScript.
 */

const log = createLogger("admin");

function sb() {
  return getServiceClient();
}

interface AuthUserInfo {
  email: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

/** Emails live in the auth schema; profiles never duplicate them. */
async function authUserMap(ids: string[]): Promise<Map<string, AuthUserInfo>> {
  const map = new Map<string, AuthUserInfo>();
  if (ids.length === 0) return map;

  try {
    const { data } = await sb()
      .schema("auth")
      .from("users")
      .select("id, email, last_sign_in_at, email_confirmed_at")
      .in("id", ids);

    for (const row of (data ?? []) as Array<{
      id: string;
      email: string | null;
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
    }>) {
      map.set(row.id, {
        email: row.email ?? "",
        lastSignInAt: row.last_sign_in_at,
        emailConfirmed: Boolean(row.email_confirmed_at),
      });
    }
  } catch (error) {
    log.warn("auth user lookup failed", { error: error instanceof Error ? error.message : String(error) });
  }

  return map;
}

function labelFor(displayName: string | null, email: string | undefined): string {
  if (displayName) return displayName;
  if (email) {
    const [local] = email.split("@");
    return local || email;
  }
  return "Customer";
}

/** Strips characters that would break a PostgREST filter expression. */
function sanitiseSearch(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
  return cleaned.length > 0 ? cleaned : null;
}

/* -------------------------------- Identity -------------------------------- */

export async function getAdminIdentity(admin: AuthenticatedUser): Promise<AdminIdentity> {
  const { data } = await sb()
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", admin.id)
    .maybeSingle();

  return {
    id: admin.id,
    displayName: (data?.display_name as string | null) ?? null,
    email: admin.email,
    role: admin.adminRole ?? "admin",
    permissions: admin.permissions,
    createdAt: (data?.created_at as string) ?? new Date().toISOString(),
  };
}

/* --------------------------------- Period --------------------------------- */

export function resolvePeriod(query: { range?: string | null; from?: string | null; to?: string | null }): {
  from: Date;
  to: Date;
  preset: AdminPeriod["preset"];
  label: string;
  days: number;
} {
  const now = new Date();

  const parse = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const explicitFrom = parse(query.from);
  const explicitTo = parse(query.to);

  if (explicitFrom && explicitTo && explicitFrom <= explicitTo) {
    const days = Math.max(1, Math.round((explicitTo.getTime() - explicitFrom.getTime()) / 86_400_000) + 1);
    return { from: explicitFrom, to: explicitTo, preset: "custom", label: rangeLabel(explicitFrom, explicitTo), days };
  }

  const days = query.range === "7d" ? 7 : query.range === "90d" ? 90 : 30;
  const from = new Date(now.getTime() - (days - 1) * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(now.getTime());

  return { from, to, preset: days === 7 ? "7d" : days === 90 ? "90d" : "30d", label: rangeLabel(from, to), days };
}

function rangeLabel(from: Date, to: Date): string {
  const day = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const year = to.toLocaleDateString("en-IN", { year: "numeric", timeZone: "UTC" });
  return `${day(from)} – ${day(to)} ${year}`;
}

/* -------------------------------- Overview -------------------------------- */

export async function getOverview(
  query: { range?: string | null; from?: string | null; to?: string | null },
): Promise<AdminOverview> {
  const period = resolvePeriod(query);

  const { data, error } = await sb().rpc("admin_overview", {
    p_from: period.from.toISOString(),
    p_to: period.to.toISOString(),
  });

  if (error) {
    log.error("overview aggregation failed", { code: error.code });
    throw failures.unavailable("We couldn't compute the dashboard figures.");
  }

  const { data: activeCount } = await sb().rpc("admin_active_customers", {
    p_from: period.from.toISOString(),
    p_to: period.to.toISOString(),
  });

  const raw = (data ?? {}) as {
    users?: { total?: number; newInPeriod?: number };
    revenue?: { grossPaise?: number; refundedPaise?: number; successfulPayments?: number; pendingPayments?: number; failedPayments?: number };
    credits?: { purchased?: number; consumed?: number; reserved?: number; adjusted?: number };
    generations?: { total?: number; completed?: number; failed?: number; cancelled?: number; successRate?: number | null; averageDurationMs?: number | null };
    volume?: Array<{ date: string; total: number; failed: number }>;
  };

  return {
    period: {
      preset: period.preset,
      from: period.from.toISOString().slice(0, 10),
      to: period.to.toISOString().slice(0, 10),
      days: period.days,
      label: period.label,
    },
    users: {
      total: Number(raw.users?.total ?? 0),
      newInPeriod: Number(raw.users?.newInPeriod ?? 0),
      activeCustomers: activeCount === null || activeCount === undefined ? null : Number(activeCount),
      activeDefinition: "Customers with at least one generation in the selected period.",
    },
    revenue: {
      grossPaise: Number(raw.revenue?.grossPaise ?? 0),
      refundedPaise: Number(raw.revenue?.refundedPaise ?? 0),
      successfulPayments: Number(raw.revenue?.successfulPayments ?? 0),
      pendingPayments: Number(raw.revenue?.pendingPayments ?? 0),
      failedPayments: Number(raw.revenue?.failedPayments ?? 0),
    },
    credits: {
      purchased: Number(raw.credits?.purchased ?? 0),
      consumed: Number(raw.credits?.consumed ?? 0),
      reserved: Number(raw.credits?.reserved ?? 0),
      adjusted: Number(raw.credits?.adjusted ?? 0),
    },
    generations: {
      total: Number(raw.generations?.total ?? 0),
      completed: Number(raw.generations?.completed ?? 0),
      failed: Number(raw.generations?.failed ?? 0),
      cancelled: Number(raw.generations?.cancelled ?? 0),
      successRate: raw.generations?.successRate === null || raw.generations?.successRate === undefined
        ? null
        : Number(raw.generations.successRate),
      averageDurationMs: raw.generations?.averageDurationMs === null || raw.generations?.averageDurationMs === undefined
        ? null
        : Number(raw.generations.averageDurationMs),
    },
    volume: Array.isArray(raw.volume)
      ? raw.volume.map((point) => ({ date: point.date, total: Number(point.total), failed: Number(point.failed) }))
      : [],
    updatedAt: new Date().toISOString(),
  };
}

/* ---------------------------------- Users --------------------------------- */

interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  account_status: AdminUserRow["status"];
  suspended_at?: string | null;
  suspension_reason?: string | null;
}

interface StatsRow {
  user_id: string;
  generations_total: number;
  purchases_total: number;
  lifetime_paid_paise: number;
  credits_lifetime_purchased: number;
  credits_lifetime_consumed: number;
}

async function statsFor(ids: string[]): Promise<Map<string, StatsRow>> {
  const map = new Map<string, StatsRow>();
  if (ids.length === 0) return map;
  const { data } = await sb().rpc("admin_user_stats", { p_user_ids: ids });
  for (const row of (data ?? []) as StatsRow[]) map.set(row.user_id, row);
  return map;
}

async function walletsFor(ids: string[]): Promise<Map<string, { available: number; reserved: number }>> {
  const map = new Map<string, { available: number; reserved: number }>();
  if (ids.length === 0) return map;
  const { data } = await sb()
    .from("credit_wallets")
    .select("user_id, available_credits, reserved_credits")
    .in("user_id", ids);
  for (const row of (data ?? []) as Array<{ user_id: string; available_credits: number; reserved_credits: number }>) {
    map.set(row.user_id, { available: Number(row.available_credits), reserved: Number(row.reserved_credits) });
  }
  return map;
}

export async function listUsers(query: {
  q?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminPaginated<AdminUserRow>> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const search = sanitiseSearch(query.q ?? null);

  let request = sb()
    .from("profiles")
    .select("id, display_name, created_at, account_status")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.status && ["active", "suspended", "pending_verification", "deleted"].includes(query.status)) {
    request = request.eq("account_status", query.status);
  }
  if (query.cursor) request = request.lt("created_at", query.cursor);

  if (search) {
    const { data: authMatches } = await sb()
      .schema("auth")
      .from("users")
      .select("id")
      .ilike("email", `%${search}%`)
      .limit(50);

    const ids = ((authMatches ?? []) as Array<{ id: string }>).map((row) => row.id);
    request = ids.length > 0
      ? request.or(`display_name.ilike.%${search}%,id.in.(${ids.join(",")})`)
      : request.ilike("display_name", `%${search}%`);
  }

  const { data, error } = await request;
  if (error) throw failures.unavailable("We couldn't load the customer list.");

  const rows = (data ?? []) as ProfileRow[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const ids = page.map((row) => row.id);

  const [stats, wallets, auth] = await Promise.all([statsFor(ids), walletsFor(ids), authUserMap(ids)]);

  return {
    items: page.map((row) => {
      const stat = stats.get(row.id);
      const wallet = wallets.get(row.id);
      return {
        id: row.id,
        displayName: row.display_name,
        email: auth.get(row.id)?.email ?? "",
        createdAt: row.created_at,
        status: row.account_status,
        creditsAvailable: wallet?.available ?? 0,
        creditsReserved: wallet?.reserved ?? 0,
        generationsTotal: Number(stat?.generations_total ?? 0),
        purchasesTotal: Number(stat?.purchases_total ?? 0),
        lifetimePaidPaise: Number(stat?.lifetime_paid_paise ?? 0),
      };
    }),
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    prevCursor: null,
    total: null,
  };
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data: profile } = await sb()
    .from("profiles")
    .select("id, display_name, created_at, account_status, suspended_at, suspension_reason")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) throw failures.notFound("That customer doesn't exist.");

  const row = profile as ProfileRow;
  const [stats, wallets, auth] = await Promise.all([
    statsFor([userId]),
    walletsFor([userId]),
    authUserMap([userId]),
  ]);

  const { data: recentGenerations } = await sb()
    .from("generations")
    .select("id, user_id, photography_style, model_id, generation_status, created_at, started_at, completed_at, credit_cost, profiles(display_name), model_configs(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentPayments } = await sb()
    .from("payments")
    .select("id, user_id, pack_id, pack_name, amount_paise, currency, razorpay_order_id, payment_status, created_at, profiles(display_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentTransactions } = await sb()
    .from("credit_transactions")
    .select("id, user_id, transaction_type, credit_delta, balance_after, reference_type, reference_id, description, metadata, created_at, profiles(display_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const info = auth.get(userId);
  const wallet = wallets.get(userId);
  const stat = stats.get(userId);
  const email = info?.email ?? "";

  return {
    id: row.id,
    displayName: row.display_name,
    email,
    createdAt: row.created_at,
    status: row.account_status,
    creditsAvailable: wallet?.available ?? 0,
    creditsReserved: wallet?.reserved ?? 0,
    generationsTotal: Number(stat?.generations_total ?? 0),
    purchasesTotal: Number(stat?.purchases_total ?? 0),
    lifetimePaidPaise: Number(stat?.lifetime_paid_paise ?? 0),
    emailVerified: info?.emailConfirmed ?? false,
    lastSignInAt: info?.lastSignInAt ?? null,
    suspendedAt: row.suspended_at ?? null,
    suspensionReason: row.suspension_reason ?? null,
    creditsLifetimePurchased: Number(stat?.credits_lifetime_purchased ?? 0),
    creditsLifetimeConsumed: Number(stat?.credits_lifetime_consumed ?? 0),
    recentGenerations: ((recentGenerations ?? []) as never[]).map((item) =>
      mapGenerationRow(item as Record<string, unknown>, email),
    ),
    recentPayments: ((recentPayments ?? []) as never[]).map((item) =>
      mapPaymentRow(item as Record<string, unknown>, email),
    ),
    recentTransactions: ((recentTransactions ?? []) as never[]).map((item) =>
      mapLedgerRow(item as Record<string, unknown>, email),
    ),
  };
}

/* ------------------------------- Generations ------------------------------ */

const generationStatus = (value: string): AdminGenerationRow["status"] =>
  value === "queued" || value === "processing" || value === "completed" || value === "failed" || value === "cancelled"
    ? value
    : "failed";

function mapGenerationRow(row: Record<string, unknown>, fallbackEmail = ""): AdminGenerationRow {
  const profile = row.profiles as { display_name: string | null } | null;
  const model = row.model_configs as { name: string } | null;
  const started = row.started_at ? new Date(row.started_at as string).getTime() : null;
  const completed = row.completed_at ? new Date(row.completed_at as string).getTime() : null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    userLabel: labelFor(profile?.display_name ?? null, fallbackEmail),
    styleName: defaultStyles.find((style) => style.id === row.photography_style)?.name ?? (row.photography_style as string),
    modelId: (row.model_id as string | null) ?? "unassigned",
    modelName: model?.name ?? (row.model_endpoint as string) ?? "Unknown model",
    createdAt: row.created_at as string,
    durationMs: started !== null && completed !== null ? Math.max(completed - started, 0) : null,
    status: generationStatus(row.generation_status as string),
    creditsCharged: row.generation_status === "completed" ? Number(row.credit_cost) : row.generation_status === "failed" || row.generation_status === "cancelled" ? 0 : null,
  };
}

export async function listGenerations(query: {
  q?: string | null;
  status?: string | null;
  range?: string | null;
  from?: string | null;
  to?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminPaginated<AdminGenerationRow>> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const period = resolvePeriod(query);

  let request = sb()
    .from("generations")
    .select("id, user_id, photography_style, model_id, model_endpoint, generation_status, created_at, started_at, completed_at, credit_cost, profiles(display_name), model_configs(name)")
    .gte("created_at", period.from.toISOString())
    .lte("created_at", period.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.status && ["queued", "processing", "completed", "failed", "cancelled"].includes(query.status)) {
    request = request.eq("generation_status", query.status);
  }
  if (query.cursor) request = request.lt("created_at", query.cursor);
  const search = sanitiseSearch(query.q ?? null);
  if (search) request = request.ilike("photography_style", `%${search}%`);

  const { data, error } = await request;
  if (error) throw failures.unavailable("We couldn't load the generation list.");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => mapGenerationRow(row)),
    nextCursor: hasMore ? (page[page.length - 1]?.created_at as string) ?? null : null,
    prevCursor: null,
    total: null,
  };
}

export async function getGenerationDetail(id: string): Promise<AdminGenerationDetail> {
  const { data } = await sb()
    .from("generations")
    .select("*, profiles(display_name), model_configs(name, endpoint)")
    .eq("id", id)
    .maybeSingle();

  if (!data) throw failures.notFound("That generation doesn't exist.");

  const row = data as Record<string, unknown>;
  const base = mapGenerationRow(row);

  const { data: assets } = await sb()
    .from("assets")
    .select("id, object_key, width, height, generation_id")
    .or(`id.eq.${row.source_asset_id as string},generation_id.eq.${id}`);

  const assetRows = (assets ?? []) as Array<{ object_key: string; generation_id: string | null }>;
  const sourceKey = assetRows.find((asset) => asset.generation_id === null)?.object_key ?? null;
  const resultKey = assetRows.find((asset) => asset.generation_id === id)?.object_key ?? null;

  const history: AdminGenerationDetail["statusHistory"] = [
    { status: "queued", at: row.created_at as string, note: "Queued and credits reserved." },
  ];
  if (row.started_at) history.push({ status: "processing", at: row.started_at as string, note: "Submitted to the provider." });
  if (row.completed_at) {
    history.push({
      status: generationStatus(row.generation_status as string),
      at: row.completed_at as string,
      note: row.failure_message_safe ? String(row.failure_message_safe) : "Finished.",
    });
  }

  return {
    ...base,
    sceneName: row.scene_id ? String(row.scene_id) : null,
    qualityLabel: defaultQualities.find((quality) => quality.id === row.quality_id)?.label ?? String(row.quality_id),
    sourcePreviewUrl: await signedAssetUrl(sourceKey),
    resultPreviewUrl: await signedAssetUrl(resultKey),
    providerRequestId: (row.provider_request_id as string | null) ?? null,
    modelEndpoint: (row.model_endpoint as string | null) ?? null,
    creditsReserved: row.credits_reserved === null || row.credits_reserved === undefined ? null : Number(row.credits_reserved),
    failureCode: (row.failure_code as string | null) ?? null,
    failureMessage: (row.failure_message_safe as string | null) ?? null,
    statusHistory: history,
  };
}

/* -------------------------------- Payments -------------------------------- */

function mapPaymentRow(row: Record<string, unknown>, fallbackEmail = ""): AdminPaymentRow {
  const profile = row.profiles as { display_name: string | null } | null;
  const status = row.payment_status as string;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userLabel: labelFor(profile?.display_name ?? null, fallbackEmail),
    packId: row.pack_id as string,
    packName: row.pack_name as string,
    amountPaise: Number(row.amount_paise),
    currency: "INR",
    razorpayOrderId: row.razorpay_order_id as string,
    status: status === "created" || status === "attempted" ? "pending" : (status as AdminPaymentRow["status"]),
    createdAt: row.created_at as string,
  };
}

export async function listPayments(query: {
  q?: string | null;
  status?: string | null;
  range?: string | null;
  from?: string | null;
  to?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminPaginated<AdminPaymentRow>> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const period = resolvePeriod(query);

  let request = sb()
    .from("payments")
    .select("id, user_id, pack_id, pack_name, amount_paise, currency, razorpay_order_id, payment_status, created_at, profiles(display_name)")
    .gte("created_at", period.from.toISOString())
    .lte("created_at", period.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.status) {
    if (query.status === "pending") request = request.in("payment_status", ["created", "attempted"]);
    else if (["paid", "failed", "refunded"].includes(query.status)) request = request.eq("payment_status", query.status);
  }
  if (query.cursor) request = request.lt("created_at", query.cursor);
  const search = sanitiseSearch(query.q ?? null);
  if (search) request = request.ilike("razorpay_order_id", `%${search}%`);

  const { data, error } = await request;
  if (error) throw failures.unavailable("We couldn't load the payment list.");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => mapPaymentRow(row)),
    nextCursor: hasMore ? (page[page.length - 1]?.created_at as string) ?? null : null,
    prevCursor: null,
    total: null,
  };
}

export async function getPaymentDetail(id: string): Promise<AdminPaymentDetail> {
  const { data } = await sb()
    .from("payments")
    .select("*, profiles(display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!data) throw failures.notFound("That payment doesn't exist.");

  const row = data as Record<string, unknown>;
  const base = mapPaymentRow(row);
  const paidAt = row.paid_at as string | null;
  const verified = Boolean(row.razorpay_signature_verified);

  return {
    ...base,
    internalOrderId: row.id as string,
    razorpayPaymentId: (row.razorpay_payment_id as string | null) ?? null,
    creditsGranted: row.credits_granted_at ? Number(row.credits_to_grant) : null,
    webhookStatus: row.webhook_verified ? "received" : paidAt ? "pending" : "not_applicable",
    verificationStatus: verified ? "verified" : row.failure_code === "signature_invalid" ? "failed" : "unverified",
    history: [
      { status: "pending", at: row.created_at as string, note: "Order created." },
      ...(paidAt ? [{ status: "paid" as const, at: paidAt, note: "Payment captured and credits granted." }] : []),
      ...(row.failure_code ? [{ status: "failed" as const, at: (row.updated_at as string) ?? (row.created_at as string), note: (row.failure_message_safe as string) ?? null }] : []),
    ],
  };
}

/* --------------------------------- Ledger --------------------------------- */

function mapLedgerRow(row: Record<string, unknown>, fallbackEmail = ""): AdminLedgerRow {
  const profile = row.profiles as { display_name: string | null } | null;
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const type = row.transaction_type as string;
  const credits = row.credit_delta === 0 && typeof metadata.credits === "number"
    ? -Number(metadata.credits)
    : Number(row.credit_delta);

  return {
    id: row.id as string,
    userId: row.user_id as string,
    userLabel: labelFor(profile?.display_name ?? null, fallbackEmail),
    type: type === "admin_adjustment" ? "adjustment" : (type as AdminLedgerRow["type"]),
    credits,
    balanceAfter: row.balance_after === null || row.balance_after === undefined ? null : Number(row.balance_after),
    relatedType: row.reference_type === "payment" ? "payment" : row.reference_type === "generation" ? "generation" : null,
    relatedId: (row.reference_id as string | null) ?? null,
    adminLabel: typeof metadata.adminId === "string" ? metadata.adminId : null,
    reason: typeof metadata.reason === "string" ? metadata.reason : null,
    createdAt: row.created_at as string,
  };
}

export async function listCreditTransactions(query: {
  q?: string | null;
  user?: string | null;
  type?: string | null;
  range?: string | null;
  from?: string | null;
  to?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminPaginated<AdminLedgerRow>> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const period = resolvePeriod(query);

  let request = sb()
    .from("credit_transactions")
    .select("id, user_id, transaction_type, credit_delta, balance_after, reference_type, reference_id, metadata, created_at, profiles(display_name)")
    .gte("created_at", period.from.toISOString())
    .lte("created_at", period.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.type) {
    const map: Record<string, string[]> = {
      purchase: ["purchase"],
      reservation: ["reservation"],
      consumption: ["consumption"],
      refund: ["refund"],
      adjustment: ["admin_adjustment"],
    };
    const dbTypes = map[query.type];
    if (dbTypes) request = request.in("transaction_type", dbTypes);
  }
  if (query.user) request = request.eq("user_id", query.user);
  if (query.cursor) request = request.lt("created_at", query.cursor);

  const { data, error } = await request;
  if (error) throw failures.unavailable("We couldn't load the credit ledger.");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => mapLedgerRow(row)),
    nextCursor: hasMore ? (page[page.length - 1]?.created_at as string) ?? null : null,
    prevCursor: null,
    total: null,
  };
}

export async function adjustCredits(input: {
  adminId: string;
  userId: string;
  direction: "credit" | "debit";
  credits: number;
  reason: string;
}): Promise<{ transactionId: string; userId: string; credits: number; balanceAvailable: number; balanceReserved: number }> {
  const { data, error } = await sb().rpc("admin_adjust_credits", {
    p_admin_id: input.adminId,
    p_user_id: input.userId,
    p_direction: input.direction,
    p_credits: input.credits,
    p_reason: input.reason,
  });

  if (error) {
    if (String(error.message).includes("insufficient_credits")) {
      throw failures.conflict("That customer doesn't have enough credits for this debit.");
    }
    log.error("adjustment failed", { adminId: input.adminId, code: error.code });
    throw failures.unavailable("We couldn't apply that adjustment.");
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    transactionId: String(row?.transaction_id ?? ""),
    userId: input.userId,
    credits: input.direction === "credit" ? input.credits : -input.credits,
    balanceAvailable: Number(row?.available_credits ?? 0),
    balanceReserved: Number(row?.reserved_credits ?? 0),
  };
}

/* --------------------------------- Models --------------------------------- */

export async function listModels(): Promise<AdminModel[]> {
  const { data, error } = await sb()
    .from("model_configs")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw failures.unavailable("We couldn't load the model list.");

  const { data: pricing } = await sb()
    .from("generation_pricing")
    .select("style_id, quality_id, credits, approved");

  const pricingRows = (pricing ?? []) as Array<{ quality_id: string; credits: number; approved: boolean }>;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const creditRules = defaultQualities
      .map((quality) => {
        const rates = pricingRows.filter((item) => item.quality_id === quality.id && item.approved);
        const unique = new Set(rates.map((item) => Number(item.credits)));
        return unique.size === 1 ? { qualityId: quality.id, label: quality.label, credits: [...unique][0] } : null;
      })
      .filter((item): item is { qualityId: string; label: string; credits: number } => item !== null);

    return {
      id: row.id as string,
      provider: row.provider as string,
      name: row.name as string,
      endpoint: row.endpoint as string,
      category: row.category as string,
      availability: row.availability as AdminModel["availability"],
      imageModes: (row.image_modes as string[]) ?? [],
      outputResolutions: (row.output_resolutions as string[]) ?? [],
      creditRules,
      providerPricing: row.provider_cost_usd === null || row.provider_cost_usd === undefined
        ? null
        : `$${Number(row.provider_cost_usd).toFixed(3)} per image (provider list price)`,
      routingEnabled: Boolean(row.routing_enabled),
      updatedAt: row.updated_at as string,
      updatedBy: (row.updated_by as string | null) ?? null,
    };
  });
}

export async function updateModel(input: {
  adminId: string;
  modelId: string;
  patch: { routingEnabled?: boolean; availability?: AdminModel["availability"]; providerCostUsd?: number | null };
  reason: string;
}): Promise<void> {
  const { data: existing } = await sb().from("model_configs").select("id, routing_enabled").eq("id", input.modelId).maybeSingle();
  if (!existing) throw failures.notFound("That model doesn't exist.");

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: input.adminId,
  };
  if (input.patch.routingEnabled !== undefined) update.routing_enabled = input.patch.routingEnabled;
  if (input.patch.availability !== undefined) update.availability = input.patch.availability;
  if (input.patch.providerCostUsd !== undefined) update.provider_cost_usd = input.patch.providerCostUsd;

  const { error } = await sb().from("model_configs").update(update).eq("id", input.modelId);
  if (error) throw failures.unavailable("We couldn't update that model.");

  await sb().from("admin_audit_logs").insert({
    admin_user_id: input.adminId,
    action: "model_setting",
    target_type: "model",
    target_id: input.modelId,
    reason: input.reason,
    metadata: update,
  });
}

/* ------------------------------- Configuration ---------------------------- */

export async function getConfig(admin: AuthenticatedUser): Promise<AdminConfig> {
  const { data: models } = await sb().from("model_configs").select("id, name, availability");
  const { data: pricing } = await sb().from("generation_pricing").select("quality_id, credits, approved").eq("approved", true);
  const { data: settings } = await sb().from("system_settings").select("key, value");

  const settingsMap = new Map((settings ?? []).map((row) => [row.key as string, row.value as unknown]));
  const supportRecipient = settingsMap.get("support.recipient");
  const pricingRows = (pricing ?? []) as Array<{ quality_id: string; credits: number }>;

  const creditRates = defaultQualities
    .map((quality) => {
      const values = new Set(pricingRows.filter((row) => row.quality_id === quality.id).map((row) => Number(row.credits)));
      return values.size === 1 ? { qualityId: quality.id, label: quality.label, credits: [...values][0] } : null;
    })
    .filter((item): item is { qualityId: string; label: string; credits: number } => item !== null);

  void admin;

  return {
    general: {
      siteName: "Pixelise",
      supportEmail: typeof supportRecipient === "string" ? supportRecipient : null,
      supportInboxStatus: typeof supportRecipient === "string" ? "configured" : "not_configured",
      systemStatus: models && models.some((model) => Boolean(model.availability)) ? "operational" : "unknown",
      systemStatusNote: null,
    },
    generation: {
      styles: defaultStyles.map((style) => ({ id: style.id, name: style.name, enabled: true })),
      models: ((models ?? []) as Array<{ id: string; name: string; availability: AdminConfig["generation"]["models"][number]["availability"] }>).map(
        (model) => ({ id: model.id, name: model.name, availability: model.availability }),
      ),
      creditRates,
      notes: creditRates.length === 0 ? "No generation rate has been approved yet, so paid generation is disabled." : null,
    },
    payments: {
      packs: PACKS.map((pack) => ({ id: pack.id, name: pack.name, pricePaise: pack.pricePaise, credits: pack.credits, active: true })),
      provider: { name: "Razorpay", status: Boolean(process.env.RAZORPAY_KEY_ID) ? "configured" : "not_configured" },
      webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    email: {
      provider: "Resend",
      status: Boolean(process.env.RESEND_API_KEY) ? "configured" : "not_configured",
      notifications: [
        { id: "welcome", label: "Welcome", enabled: true },
        { id: "purchase_receipt", label: "Purchase receipt", enabled: true },
        { id: "generation_complete", label: "Generation ready", enabled: true },
        { id: "generation_failed", label: "Generation failed", enabled: true },
        { id: "account_notice", label: "Account notices", enabled: true },
      ],
    },
    updatedAt: new Date().toISOString(),
  };
}

/* -------------------------------- Audit log -------------------------------- */

export async function listAuditLogs(query: {
  q?: string | null;
  action?: string | null;
  admin?: string | null;
  range?: string | null;
  from?: string | null;
  to?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminPaginated<import("@/lib/api/admin-types").AdminAuditRow>> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const period = resolvePeriod(query);

  let request = sb()
    .from("admin_audit_logs")
    .select("id, admin_user_id, action, target_type, target_id, reason, result, metadata, created_at, profiles(display_name)")
    .gte("created_at", period.from.toISOString())
    .lte("created_at", period.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.action) request = request.eq("action", query.action);
  if (query.admin) request = request.eq("admin_user_id", query.admin);
  if (query.cursor) request = request.lt("created_at", query.cursor);

  const { data, error } = await request;
  if (error) throw failures.unavailable("We couldn't load the audit log.");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => {
      const profile = row.profiles as { display_name: string | null } | null;
      return {
        id: row.id as string,
        adminId: (row.admin_user_id as string | null) ?? "",
        adminLabel: profile?.display_name ?? "Console",
        action: row.action as import("@/lib/api/admin-types").AdminAuditAction,
        targetType: row.target_type as string,
        targetId: row.target_id as string,
        targetLabel: null,
        reason: (row.reason as string | null) ?? null,
        result: (row.result as "success" | "failure") ?? "success",
        createdAt: row.created_at as string,
      };
    }),
    nextCursor: hasMore ? (page[page.length - 1]?.created_at as string) ?? null : null,
    prevCursor: null,
    total: null,
  };
}

/* ------------------------------ User status ------------------------------- */

export async function updateUserStatus(input: {
  adminId: string;
  userId: string;
  status: "active" | "suspended";
  reason: string;
}): Promise<AdminUserRow> {
  const { data: existing } = await sb()
    .from("profiles")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();

  if (!existing) throw failures.notFound("That customer doesn't exist.");

  const { error } = await sb()
    .from("profiles")
    .update({
      account_status: input.status,
      suspended_at: input.status === "suspended" ? new Date().toISOString() : null,
      suspension_reason: input.status === "suspended" ? input.reason : null,
    })
    .eq("id", input.userId);

  if (error) throw failures.unavailable("We couldn't change that account's status.");

  await sb().from("admin_audit_logs").insert({
    admin_user_id: input.adminId,
    action: input.status === "suspended" ? "user_suspension" : "user_reactivation",
    target_type: "user",
    target_id: input.userId,
    reason: input.reason,
    result: "success",
  });

  const detail = await getUserDetail(input.userId);
  return detail;
}

/* ---------------------------- Settings + pricing -------------------------- */

export async function updateSystemSetting(input: {
  adminId: string;
  key: string;
  value: unknown;
}): Promise<void> {
  const { error } = await sb()
    .from("system_settings")
    .upsert({ key: input.key, value: input.value as never, updated_by: input.adminId, updated_at: new Date().toISOString() });

  if (error) throw failures.unavailable("We couldn't save that setting.");

  await sb().from("admin_audit_logs").insert({
    admin_user_id: input.adminId,
    action: "config_change",
    target_type: "setting",
    target_id: input.key,
    reason: "Setting updated from the console",
    metadata: { value: input.value as never },
  });
}

export async function upsertPricing(input: {
  adminId: string;
  styleId: string;
  qualityId: string;
  resolution: string | null;
  credits: number;
  approved: boolean;
  notes: string | null;
}): Promise<void> {
  const { error } = await sb().from("generation_pricing").upsert(
    {
      style_id: input.styleId,
      quality_id: input.qualityId,
      resolution: input.resolution,
      credits: input.credits,
      approved: input.approved,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "style_id,quality_id" },
  );

  if (error) throw failures.unavailable("We couldn't save that rate.");

  await sb().from("admin_audit_logs").insert({
    admin_user_id: input.adminId,
    action: "config_change",
    target_type: "generation_pricing",
    target_id: `${input.styleId}:${input.qualityId}`,
    reason: input.notes ?? "Generation rate updated",
    metadata: { credits: input.credits, approved: input.approved },
  });
}

export async function listPricing() {
  const { data } = await sb()
    .from("generation_pricing")
    .select("style_id, quality_id, resolution, credits, approved, notes, updated_at")
    .order("style_id", { ascending: true });

  return (data ?? []).map((row) => ({
    styleId: row.style_id as string,
    qualityId: row.quality_id as string,
    resolution: (row.resolution as string | null) ?? null,
    credits: Number(row.credits),
    approved: Boolean(row.approved),
    notes: (row.notes as string | null) ?? null,
    updatedAt: row.updated_at as string,
  }));
}
