import { apiRoute, parseBody } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { getClientIp } from "@/lib/http/request";
import { ok } from "@/lib/http/response";
import { serverEnv } from "@/config/env";
import { recoverySchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/v1/auth/recovery — sends a password-reset link.
 *
 * Always answers the same way, whether or not the address exists, so the endpoint
 * cannot be used to enumerate accounts.
 */

export const POST = apiRoute("auth-recovery", async ({ request, requestId }) => {
  const body = await parseBody(request, recoverySchema);
  await enforceRateLimit("auth.otp", `recovery:${getClientIp(request)}`);

  const supabase = await createSupabaseServerClient();

  /* The emailed link must land on the callback first: Supabase redirects with a
     one-time `code`, and only `/api/v1/auth/callback` can exchange it for a
     session. Sending the customer straight to `/login?mode=recovery` would leave
     them holding a code nobody swaps, so the new-password form could never save. */
  const afterExchange = "/login?mode=recovery";
  await supabase.auth.resetPasswordForEmail(body.email, {
    redirectTo: `${serverEnv.appUrl}/api/v1/auth/callback?next=${encodeURIComponent(afterExchange)}`,
  });

  return ok({ status: "sent" as const }, requestId);
});
