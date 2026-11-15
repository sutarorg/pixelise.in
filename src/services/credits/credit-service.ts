import "server-only";

import type {
  CreditTransaction,
  CreditTransactionType,
  CreditWallet,
  Paginated,
} from "@/lib/api/types";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import {
  getServiceClient,
  isInsufficientCredits,
} from "@/lib/supabase/service";

/**
 * Credits service.
 *
 * This module is a thin, typed boundary over the SQL functions in
 * `supabase/migrations/0002_functions.sql`. It never computes a balance: the
 * database owns the invariant, this layer owns the translation into API shapes
 * and the mapping of `insufficient_credits` into something a customer can act on.
 */

const log = createLogger("credits");

export interface WalletRow {
  available_credits: number;
  reserved_credits: number;
  updated_at: string;
}

function toWallet(row: WalletRow): CreditWallet {
  return {
    available: row.available_credits,
    reserved: row.reserved_credits,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export async function getWallet(userId: string): Promise<CreditWallet> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("available_credits, reserved_credits, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw failures.unavailable("We couldn't read your credit balance.");

  if (!data) {
    // Every profile gets a wallet from the auth trigger; a missing row means the
    // account predates the schema. Create it rather than showing a fake zero.
    const { data: created, error: createError } = await supabase
      .from("credit_wallets")
      .insert({ user_id: userId })
      .select("available_credits, reserved_credits, updated_at")
      .single();
    if (createError || !created) throw failures.unavailable("We couldn't read your credit balance.");
    return toWallet(created as WalletRow);
  }

  return toWallet(data as WalletRow);
}

/* -------------------------------- Ledger ---------------------------------- */

interface TransactionRow {
  id: string;
  transaction_type: "purchase" | "reservation" | "consumption" | "refund" | "admin_adjustment";
  credit_delta: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const typeByDbType: Record<TransactionRow["transaction_type"], CreditTransactionType> = {
  purchase: "purchase",
  reservation: "generation",
  consumption: "generation",
  refund: "refund",
  admin_adjustment: "adjustment",
};

export function mapTransaction(row: TransactionRow): CreditTransaction {
  const amountPaise = row.metadata && typeof row.metadata.amountPaise === "number"
    ? row.metadata.amountPaise
    : null;

  const creditsFromMetadata =
    row.metadata && typeof row.metadata.credits === "number" ? row.metadata.credits : null;

  return {
    id: row.id,
    type: typeByDbType[row.transaction_type],
    status: "completed",
    description: row.description,
    /* A consumption row records the settlement of a hold that already left
       `available`, so its delta is 0; the held amount is the meaningful figure. */
    credits: row.credit_delta === 0 && creditsFromMetadata !== null ? -creditsFromMetadata : row.credit_delta,
    amountPaise,
    currency: amountPaise !== null ? "INR" : null,
    createdAt: row.created_at,
    generationId: row.reference_type === "generation" ? row.reference_id : null,
  };
}

const dbTypesForFilter: Record<CreditTransactionType, TransactionRow["transaction_type"][]> = {
  purchase: ["purchase"],
  generation: ["reservation", "consumption", "refund"],
  refund: ["refund"],
  adjustment: ["admin_adjustment"],
};

export async function listTransactions(input: {
  userId: string;
  type?: CreditTransactionType | null;
  cursor?: string | null;
  limit?: number;
}): Promise<Paginated<CreditTransaction>> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const supabase = getServiceClient();

  let query = supabase
    .from("credit_transactions")
    .select("id, transaction_type, credit_delta, reference_type, reference_id, description, metadata, created_at")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (input.type) query = query.in("transaction_type", dbTypesForFilter[input.type]);
  if (input.cursor) query = query.lt("created_at", input.cursor);

  const { data, error } = await query;
  if (error) throw failures.unavailable("We couldn't load your credit history.");

  const rows = (data ?? []) as TransactionRow[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map(mapTransaction),
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    total: null,
  };
}

/* ------------------------------ Transactions ------------------------------ */

export interface HoldResult {
  wallet: CreditWallet;
  applied: boolean;
}

/** Places the hold for one generation. Throws `insufficient_credits`. */
export async function reserveCredits(input: {
  userId: string;
  generationId: string;
  credits: number;
}): Promise<HoldResult> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("credit_reserve", {
    p_user_id: input.userId,
    p_generation_id: input.generationId,
    p_credits: input.credits,
  });

  if (error) {
    if (isInsufficientCredits(error)) throw failures.insufficientCredits();
    log.error("reserve failed", { userId: input.userId, generationId: input.generationId, code: error.code });
    throw failures.unavailable("We couldn't hold credits for this generation.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    wallet: {
      available: Number(row?.available_credits ?? 0),
      reserved: Number(row?.reserved_credits ?? 0),
      updatedAt: new Date().toISOString(),
    },
    applied: Boolean(row?.applied),
  };
}

/** Converts the hold into a charge. Idempotent per generation. */
export async function settleCredits(generationId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("credit_close_hold", {
    p_generation_id: generationId,
    p_outcome: "consumed",
  });

  if (error) {
    log.error("settle failed", { generationId, code: error.code });
    throw failures.unavailable("We couldn't settle credits for this generation.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Number(row?.credits ?? 0);
}

/** Returns held credits to the customer. Idempotent per generation. */
export async function releaseCredits(generationId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("credit_close_hold", {
    p_generation_id: generationId,
    p_outcome: "released",
  });

  if (error) {
    log.error("release failed", { generationId, code: error.code });
    throw failures.unavailable("We couldn't return the reserved credits.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Number(row?.credits ?? 0);
}

/* -------------------------------- Pricing --------------------------------- */

export interface GenerationPrice {
  credits: number;
  resolution: string | null;
  approved: boolean;
}

/**
 * The one place a generation price is decided. The browser sends ids; this reads
 * the rate the owner approved. No row, or an unapproved row, means the studio
 * cannot charge — and therefore cannot generate.
 */
export async function resolveGenerationPrice(input: {
  styleId: string;
  qualityId: string;
}): Promise<GenerationPrice | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("generation_pricing")
    .select("credits, resolution, approved")
    .eq("style_id", input.styleId)
    .eq("quality_id", input.qualityId)
    .maybeSingle();

  if (error) throw failures.unavailable("We couldn't read generation pricing.");
  if (!data) return null;

  return {
    credits: Number(data.credits),
    resolution: (data.resolution as string | null) ?? null,
    approved: Boolean(data.approved),
  };
}

/** True when at least one approved rate exists, i.e. the studio can charge. */
export async function isGenerationPriced(): Promise<boolean> {
  const supabase = getServiceClient();
  const { count, error } = await supabase
    .from("generation_pricing")
    .select("id", { count: "exact", head: true })
    .eq("approved", true);

  if (error) return false;
  return (count ?? 0) > 0;
}
