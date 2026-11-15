import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { updatePreferencesSchema } from "@/lib/validations";
import { getPreferences, updatePreferences } from "@/services/profile/profile-service";

export const GET = apiRoute("preferences", async ({ requestId }) => {
  const user = await requireUser();
  return ok(await getPreferences(user.id), requestId);
});

export const PATCH = apiRoute("preferences-update", async ({ request, requestId }) => {
  const user = await requireUser();
  const body = await parseBody(request, updatePreferencesSchema);
  return ok(await updatePreferences({ userId: user.id, preferences: body }), requestId);
});
