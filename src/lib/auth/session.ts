import "server-only";

import { cache } from "react";

import type { AdminPermission, AdminRole } from "@/lib/api/admin-types";
import { failures } from "@/lib/http/errors";
import { adminRoleFromUser, getAuthUser, roleFromUser } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Authorization for API routes.
 *
 * Three independent checks, in this order:
 *  1. a real session (`getUser()` validates the JWT with Supabase Auth);
 *  2. an active account (suspension is enforced server-side, not by hiding UI);
 *  3. for admins, a privileged role read from `app_metadata.app_role`, which only
 *     the service role can write.
 *
 * Nothing here trusts a header, a query parameter or the browser.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
  adminRole: AdminRole | null;
  permissions: AdminPermission[];
  accountStatus: "active" | "suspended" | "pending_verification" | "deleted";
}

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["users:write", "credits:write", "payments:refund", "models:write", "config:write", "audit:read"],
  admin: ["users:write", "credits:write", "models:write", "config:write", "audit:read"],
  support: ["users:write", "audit:read"],
  analyst: ["audit:read"],
};

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return rolePermissions[role] ?? [];
}

function isAdminRole(value: string | null): value is AdminRole {
  return value === "owner" || value === "admin" || value === "support" || value === "analyst";
}

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const role = roleFromUser(user);
  const claimedAdminRole = adminRoleFromUser(user);

  // The profile row carries account status (suspension) and the display name.
  const supabase = getServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_status, role")
    .eq("id", user.id)
    .maybeSingle();

  const accountStatus = (profile?.account_status ?? "active") as AuthenticatedUser["accountStatus"];

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: (profile?.display_name as string | null) ?? null,
    role,
    adminRole: role === "admin" ? (isAdminRole(claimedAdminRole) ? claimedAdminRole : "admin") : null,
    permissions: role === "admin" ? permissionsForRole(isAdminRole(claimedAdminRole) ? claimedAdminRole : "admin") : [],
    accountStatus,
  };
});

/** A signed-in customer with an active account. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw failures.unauthenticated("Sign in to continue.");

  if (user.accountStatus === "suspended") {
    throw failures.forbidden("This account is suspended. Contact support to resolve it.");
  }
  if (user.accountStatus === "deleted") {
    throw failures.forbidden("This account has been deleted.");
  }

  return user;
}

/** An admin, optionally with a specific capability. */
export async function requireAdmin(permission?: AdminPermission): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    // Same message for "not signed in as admin" and "missing capability" on
    // purpose: the console surfaces must not confirm what exists.
    throw failures.forbidden("This account does not have console access.");
  }

  if (permission && !user.permissions.includes(permission)) {
    throw failures.forbidden("Your console role can't perform this action.");
  }

  return user;
}
