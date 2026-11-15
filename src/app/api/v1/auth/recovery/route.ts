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
  await supabase.auth.resetPasswordForEmail(body.email, {
    redirectTo: `${serverEnv.appUrl}/login?mode=recovery`,
  });

  return ok({ status: "sent" as const }, requestId);
});
