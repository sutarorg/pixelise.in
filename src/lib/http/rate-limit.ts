import { createHash } from "node:crypto";

import { failures } from "./errors";
import { createLogger } from "@/lib/logging";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Rate limiting backed by Postgres (`consume_rate_limit` in 0002).
 *
 * A fixed window, one row per (bucket, key, window). This is deliberately simple:
 * Pixelise does not need a distributed token bucket at this scale, and adding
 * Redis would mean another service to secure and pay for.
 *
 * If the limiter itself fails we fail open with a warning — an outage of a
 * protective measure must not take down the product — except for the buckets
 * marked `critical` (payment order creation), where we fail closed.
 */

const log = createLogger("rate-limit");

export type RateLimitBucket =
  | "auth.otp"
  | "contact"
  | "uploads"
  | "generations"
  | "orders"
  | "admin"
  | "webhook";

export interface RateLimitRule {
  windowSeconds: number;
  limit: number;
  critical?: boolean;
}

export const rateLimitRules: Record<RateLimitBucket, RateLimitRule> = {
  "auth.otp": { windowSeconds: 3600, limit: 10 },
  contact: { windowSeconds: 3600, limit: 5 },
  uploads: { windowSeconds: 3600, limit: 60 },
  generations: { windowSeconds: 3600, limit: 30 },
  orders: { windowSeconds: 3600, limit: 10, critical: true },
  admin: { windowSeconds: 60, limit: 120 },
  webhook: { windowSeconds: 60, limit: 300 },
};

/** Hashes a key that may be personally identifying (email, IP) before storage. */
export function rateLimitKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
}

export async function consumeRateLimit(
  bucket: RateLimitBucket,
  key: string,
): Promise<RateLimitResult> {
  const rule = rateLimitRules[bucket];

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_bucket: bucket,
      p_key: rateLimitKey(key),
      p_window_seconds: rule.windowSeconds,
      p_limit: rule.limit,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const allowed = Boolean(row?.allowed);
    return {
      allowed,
      remaining: Number(row?.remaining ?? 0),
      resetAt: row?.reset_at ? String(row.reset_at) : null,
    };
  } catch (error) {
    log.error("rate limiter unavailable", {
      bucket,
      error: error instanceof Error ? error.message : String(error),
    });
    if (rule.critical) {
      throw failures.unavailable("We can't take new requests right now. Please try again in a minute.");
    }
    return { allowed: true, remaining: rule.limit, resetAt: null };
  }
}

/** Throws `rate_limited` when the caller has used up its window. */
export async function enforceRateLimit(bucket: RateLimitBucket, key: string): Promise<void> {
  const result = await consumeRateLimit(bucket, key);
  if (!result.allowed) {
    throw failures.rateLimited(
      bucket === "generations"
        ? "That's a lot of generations in an hour. Try again shortly."
        : "That was a lot of requests in a short time. Try again in a moment.",
    );
  }
}
