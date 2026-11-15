import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { serverEnv } from "@/config/env";
import { failures } from "@/lib/http/errors";

/**
 * Request-scoped Supabase client that carries the customer's session.
 *
 * Follows the current Supabase SSR guidance: `getAll`/`setAll` are the cookie
 * interface, `getUser()` is the only trusted identity read (it validates the JWT
 * with the Auth server; `getSession()` does not), and cookie writes from a Server
 * Component are swallowed — the middleware layer (`src/proxy.ts`) is what
 * actually refreshes them.
 */

function assertConfigured(): { url: string; key: string } {
  const url = serverEnv.supabase.url;
  const key = serverEnv.supabase.publishableKey;
  if (!url || !key) {
    throw failures.notConfigured(
      "Sign-in isn't connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, key };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, key } = assertConfigured();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render: the proxy refreshes instead.
        }
      },
    },
  });
}

/** The authenticated Auth user, or null. Never throws for "no session". */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

/**
 * The role claim lives in `app_metadata`, which only the server can write.
 * `user_metadata` is user-editable and is never used for authorization.
 */
export function roleFromUser(user: User | null): "user" | "admin" {
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.app_role;
  return role === "admin" ? "admin" : "user";
}

export function adminRoleFromUser(user: User | null): string | null {
  const value = (user?.app_metadata as Record<string, unknown> | undefined)?.admin_role;
  return typeof value === "string" ? value : null;
}
