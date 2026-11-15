import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/config/env";
import { failures } from "@/lib/http/errors";

/**
 * Service-role client — the only principal that can write wallets, payments and
 * assets. Imported exclusively by server modules; the `server-only` guard turns
 * an accidental client import into a build error.
 *
 * The client is untyped on purpose: table types should come from
 * `supabase gen types typescript` once the schema is live, and until then the
 * services narrow rows at their own boundary (see `src/services/**`).
 */

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(serverEnv.supabase.url && serverEnv.supabase.serviceRoleKey);
}

export function getServiceClient(): SupabaseClient {
  if (!serverEnv.supabase.url || !serverEnv.supabase.serviceRoleKey) {
    throw failures.notConfigured(
      "The backend isn't connected to a database yet. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!cached) {
    cached = createClient(serverEnv.supabase.url, serverEnv.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-application-name": "pixelise-api" } },
    });
  }

  return cached;
}

/**
 * Postgres error codes we map to product behaviour. RLS violations and unique
 * conflicts both become 409s; anything else is an internal error.
 */
export function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "23505");
}

export function isInsufficientCredits(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { message?: string; details?: string };
  return `${candidate.message ?? ""} ${candidate.details ?? ""}`.includes("insufficient_credits");
}
