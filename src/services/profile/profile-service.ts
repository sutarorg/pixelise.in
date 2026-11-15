import "server-only";

import type { NotificationPreferences } from "@/lib/api/types";
import type { CustomerProfile } from "@/lib/api/types";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import { getAuthUser } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * The customer's own profile and notification preferences.
 *
 * Display name is the only customer-writable field. Role, account status and the
 * email address live behind the Auth server; a PATCH here cannot touch them.
 */

const log = createLogger("profile");

export async function getProfile(user: AuthenticatedUser): Promise<CustomerProfile> {
  const authUser = await getAuthUser();
  const supabase = getServiceClient();

  const { data } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    displayName: (data?.display_name as string | null) ?? null,
    email: user.email,
    avatarUrl: null,
    emailVerified: Boolean(authUser?.email_confirmed_at),
    createdAt: (data?.created_at as string) ?? new Date().toISOString(),
    lastSignInAt: authUser?.last_sign_in_at ?? null,
  };
}

export async function updateProfile(input: {
  userId: string;
  displayName?: string;
}): Promise<CustomerProfile> {
  const supabase = getServiceClient();

  if (input.displayName !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: input.displayName })
      .eq("id", input.userId);
    if (error) {
      log.error("display name update failed", { userId: input.userId, code: error.code });
      throw failures.unavailable("We couldn't save your name.");
    }
  }

  const authUser = await getAuthUser();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", input.userId)
    .maybeSingle();

  return {
    id: input.userId,
    displayName: (data?.display_name as string | null) ?? null,
    email: authUser?.email ?? "",
    avatarUrl: null,
    emailVerified: Boolean(authUser?.email_confirmed_at),
    createdAt: (data?.created_at as string) ?? new Date().toISOString(),
    lastSignInAt: authUser?.last_sign_in_at ?? null,
  };
}

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("generation_complete, credit_receipts, product_updates")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw failures.unavailable("We couldn't load your notification settings.");

  if (!data) {
    const { data: created } = await supabase
      .from("notification_preferences")
      .insert({ user_id: userId })
      .select("generation_complete, credit_receipts, product_updates")
      .single();
    return {
      generationComplete: Boolean(created?.generation_complete ?? true),
      creditReceipts: Boolean(created?.credit_receipts ?? true),
      productUpdates: Boolean(created?.product_updates ?? false),
    };
  }

  return {
    generationComplete: Boolean(data.generation_complete),
    creditReceipts: Boolean(data.credit_receipts),
    productUpdates: Boolean(data.product_updates),
  };
}

export async function updatePreferences(input: {
  userId: string;
  preferences: Partial<NotificationPreferences>;
}): Promise<NotificationPreferences> {
  const supabase = getServiceClient();

  const patch: Record<string, boolean> = {};
  if (input.preferences.generationComplete !== undefined) patch.generation_complete = input.preferences.generationComplete;
  if (input.preferences.creditReceipts !== undefined) patch.credit_receipts = input.preferences.creditReceipts;
  if (input.preferences.productUpdates !== undefined) patch.product_updates = input.preferences.productUpdates;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: input.userId, ...patch }, { onConflict: "user_id" });
    if (error) throw failures.unavailable("We couldn't save your notification settings.");
  }

  return getPreferences(input.userId);
}

/**
 * Account deletion, step one: mark the account so it stops working immediately.
 *
 * We do not hard-delete inside a request. The assets and rows are removed by a
 * documented retention workflow because payments and the credit ledger must
 * survive for accounting, and because a bucket delete is not transactional with
 * Postgres. The customer is told exactly that.
 */
export async function requestAccountDeletion(input: {
  userId: string;
  confirmation: string;
}): Promise<{ status: "deleted" }> {
  if (input.confirmation.trim().toUpperCase() !== "DELETE") {
    throw failures.validation({ confirmation: 'Type DELETE to confirm.' });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      account_status: "deleted",
      suspension_reason: "Customer requested account deletion",
      suspended_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) throw failures.unavailable("We couldn't close your account. Nothing was changed.");

  /* End the session so the browser cannot keep browsing with a live cookie. */
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const sessionClient = await createSupabaseServerClient();
  await sessionClient.auth.signOut().catch(() => undefined);

  return { status: "deleted" };
}
