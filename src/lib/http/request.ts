import { createHash, randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { serverEnv } from "@/config/env";
import { failures } from "./errors";

/** Request ids appear in every response, every log line and every support reply. */
export function getRequestId(request: NextRequest): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  if (incoming && /^[A-Za-z0-9._-]{8,64}$/.test(incoming)) return incoming;
  return randomUUID();
}

/**
 * Client address, as reported by the platform proxy. Used only for rate limiting
 * and abuse signals — never stored with a message or shown to a customer.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

/**
 * Stable, non-reversible key for an address. We keep the hash so limits survive
 * restarts and look like `ip_9f2c…` in the database, not a raw IP.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT?.trim() || serverEnv.appUrl;
  return `ip_${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)}`;
}

export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent")?.slice(0, 300) ?? null;
}

const MAX_BODY_BYTES = 64 * 1024;

/**
 * Reads a JSON body with a hard size cap, then hands it to a Zod schema.
 * Field errors become `validation_failed` details the frontend can attach to
 * inputs; the raw parse error never reaches the customer.
 */
export async function readJson(request: NextRequest): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    throw failures.validation(undefined, "That request is too large.");
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw failures.validation(undefined, "That request is too large.");
  }
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw failures.validation(undefined, "The request body must be valid JSON.");
  }
}

/** Origin check for state-changing browser calls. Webhooks are exempt. */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // same-origin fetches from some clients omit it

  const allowed = new Set(
    [serverEnv.appUrl, process.env.NEXT_PUBLIC_APP_URL?.trim(), "http://127.0.0.1:3000", "http://localhost:3000"]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\/+$/, "")),
  );

  if (!allowed.has(origin.replace(/\/+$/, ""))) {
    throw failures.forbidden("This request came from an unexpected origin.");
  }
}
