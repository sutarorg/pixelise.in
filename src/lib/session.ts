import "server-only";

import { cache } from "react";

import { serverApiBase } from "@/lib/api/core";
import { getProfile } from "@/lib/api/server";
import type { ApiError, CustomerProfile } from "@/lib/api/types";

/**
 * The single place the application asks "who is signed in?".
 *
 * Stage 2 has no auth provider. When `PIXELISE_API_BASE_URL` is absent the
 * answer is `unconfigured` and the app renders its honest "not connected"
 * surfaces. When the service exists and rejects the session the answer is
 * `unauthenticated`, and the application frame renders the sign-in gate instead
 * of the page. Stage 3 replaces the body of this function with the Supabase
 * `getUser()` call (see docs/research/customer-dashboard-research.md §3) — no
 * page or component changes.
 */
export type Session =
  | { state: "authenticated"; user: CustomerProfile }
  | { state: "unauthenticated" }
  | { state: "unconfigured" }
  | { state: "unavailable"; error: ApiError };

export const getSession = cache(async (): Promise<Session> => {
  if (!serverApiBase) return { state: "unconfigured" };

  const result = await getProfile();
  if (result.ok) return { state: "authenticated", user: result.data };

  if (result.error.code === "unauthenticated" || result.error.code === "forbidden") {
    return { state: "unauthenticated" };
  }

  return { state: "unavailable", error: result.error };
});

/** First name only when the account actually has one. Never invented. */
export function greetingName(user: CustomerProfile | null): string | null {
  const name = user?.displayName?.trim();
  if (!name) return null;
  return name.split(/\s+/)[0] ?? null;
}

/** "" → "P" for the avatar; null when there is nothing to show. */
export function initialsFor(user: CustomerProfile | null): string | null {
  const name = user?.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  }
  const email = user?.email?.trim();
  return email ? email[0]!.toUpperCase() : null;
}
