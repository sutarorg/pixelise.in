import { apiRoute, parseBody } from "@/lib/http/route";
import { failures } from "@/lib/http/errors";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { getClientIp } from "@/lib/http/request";
import { ok } from "@/lib/http/response";
import { serverEnv } from "@/config/env";
import { signUpSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/services/email/email-service";

/**
 * POST /api/v1/auth/sign-up
 *
 * Creates the Auth user; the database trigger creates their profile, wallet and
 * preferences in the same transaction. A welcome email is sent only when a
 * session was actually established, so unconfirmed addresses are not mailed a
 * "your account is ready" message that isn't true yet.
 */

export const POST = apiRoute("sign-up", async ({ request, requestId }) => {
  await enforceRateLimit("auth.otp", `signup:${getClientIp(request)}`);

  const body = await parseBody(request, signUpSchema);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: body.displayName ? { display_name: body.displayName } : undefined,
      emailRedirectTo: `${serverEnv.appUrl}/api/v1/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    throw failures.validation(
      undefined,
      error.message.includes("already registered")
        ? "An account already exists for that email. Sign in instead."
        : "We couldn't create that account. Check the details and try again.",
    );
  }

  const signedIn = Boolean(data.session);

  if (signedIn && data.user) {
    void sendWelcomeEmail(data.user.id).catch(() => undefined);
  }

  return ok(
    {
      status: signedIn ? ("signed_in" as const) : ("pending_verification" as const),
      user: data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
    },
    requestId,
    { status: 201 },
  );
});
