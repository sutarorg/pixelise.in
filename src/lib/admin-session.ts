import "server-only";

import { cache } from "react";

import { serverApiBase } from "@/lib/api/core";
import { getAdminIdentity } from "@/lib/api/admin-server";
import type { AdminIdentity } from "@/lib/api/admin-types";
import type { ApiError } from "@/lib/api/types";

/**
 * The single source of "is this caller an administrator?".
 *
 * It asks the service, every request. There is no client-side role, no decoded
 * JWT in the browser and no `localStorage` flag: hiding the navigation is not
 * authorization, and a client guard is not security. When the answer is
 * `forbidden` the console renders a bare 403 surface with no counts, names or
 * record ids — nothing that could confirm what exists.
 *
 * Stage 4 replaces only this function's body with a Supabase `getUser()` +
 * `app_metadata.app_role` check and a second `user_roles` lookup; no page or
 * component changes.
 */
export type AdminSession =
  | { state: "authorized"; admin: AdminIdentity }
  | { state: "unauthenticated" }
  | { state: "forbidden"; reason: string | null }
  | { state: "unconfigured" }
  | { state: "unavailable"; error: ApiError };

export const getAdminSession = cache(async (): Promise<AdminSession> => {
  if (!serverApiBase) return { state: "unconfigured" };

  const result = await getAdminIdentity();

  if (result.ok) {
    if (!result.data.permissions.includes("audit:read")) {
      /* An authenticated user without admin capability must not see the console
         at all, even if the identity call succeeded. */
      return { state: "forbidden", reason: "This account does not have console access." };
    }
    return { state: "authorized", admin: result.data };
  }

  if (result.error.code === "unauthenticated") return { state: "unauthenticated" };
  if (result.error.code === "forbidden") {
    return { state: "forbidden", reason: null };
  }
  return { state: "unavailable", error: result.error };
});

/**
 * Capability check used by the UI to decide whether to *show* a control.
 * The server still authorizes the action itself; this only avoids offering
 * something the admin cannot do.
 */
export function can(
  session: AdminSession,
  permission: AdminIdentity["permissions"][number],
): boolean {
  if (session.state === "authorized") return session.admin.permissions.includes(permission);
  /* No session in this environment (stage 3 frontend): controls stay visible and
     every action reports the service's refusal honestly instead of pretending. */
  return session.state === "unconfigured";
}
