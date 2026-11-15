import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { failures } from "@/lib/http/errors";
import { ok } from "@/lib/http/response";
import { updatePasswordSchema } from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** POST /api/v1/auth/update-password — for the recovery link and the settings page. */

export const POST = apiRoute("auth-update-password", async ({ request, requestId }) => {
  await requireUser();
  const body = await parseBody(request, updatePasswordSchema);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: body.password });

  if (error) {
    throw failures.validation(undefined, "We couldn't update that password. Ask for a new reset link.");
  }

  return ok({ status: "updated" as const }, requestId);
});
