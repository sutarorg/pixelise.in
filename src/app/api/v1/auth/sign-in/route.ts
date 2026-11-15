import { apiRoute, parseBody } from "@/lib/http/route";
import { failures } from "@/lib/http/errors";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { getClientIp } from "@/lib/http/request";
import { ok } from "@/lib/http/response";
import { signInSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/v1/auth/sign-in
 *
 * The Supabase SSR client writes the session cookies through `setAll`, so the
 * response carries a real session rather than a token the browser has to store.
 * Failures are deliberately vague: "email or password is incorrect" tells an
 * attacker nothing about which accounts exist.
 */

export const POST = apiRoute("sign-in", async ({ request, requestId }) => {
  const ip = getClientIp(request);
  await enforceRateLimit("auth.otp", `signin:${ip}`);

  const body = await parseBody(request, signInSchema);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data.user) {
    const unconfirmed = error?.code === "email_not_confirmed";
    throw failures.unauthenticated(
      unconfirmed
        ? "Confirm your email address first — check your inbox for the link."
        : "Email or password is incorrect.",
    );
  }

  return ok(
    {
      status: "signed_in" as const,
      user: { id: data.user.id, email: data.user.email ?? "" },
    },
    requestId,
  );
});
