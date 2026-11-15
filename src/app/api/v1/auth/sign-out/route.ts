import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** POST /api/v1/auth/sign-out — clears the Supabase session cookies. */

export const POST = apiRoute("sign-out", async ({ requestId }) => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return ok({ status: "signed_out" as const }, requestId);
});
