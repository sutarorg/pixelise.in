import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logging";

const log = createLogger("auth-callback");

/**
 * GET /api/v1/auth/callback — the email link exchange (Supabase PKCE flow).
 *
 * Only relative `next` paths are honoured, so a crafted link cannot bounce a
 * freshly authenticated session to another origin.
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      log.warn("code exchange failed", { code: error.code });
      return NextResponse.redirect(new URL("/login?error=link_expired", url.origin));
    }
    return NextResponse.redirect(new URL(next, url.origin));
  } catch (error) {
    log.error("callback failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.redirect(new URL("/login?error=unavailable", url.origin));
  }
}
