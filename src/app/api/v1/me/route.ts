import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { deleteAccountSchema, updateProfileSchema } from "@/lib/validations";
import {
  getProfile,
  requestAccountDeletion,
  updateProfile,
} from "@/services/profile/profile-service";

/** GET /api/v1/me — the signed-in customer. */

export const GET = apiRoute("me", async ({ requestId }) => {
  const user = await requireUser();
  return ok(await getProfile(user), requestId);
});

/** PATCH /api/v1/me — display name only; role and status are server-owned. */
export const PATCH = apiRoute("me-update", async ({ request, requestId }) => {
  const user = await requireUser();
  const body = await parseBody(request, updateProfileSchema);
  return ok(await updateProfile({ userId: user.id, displayName: body.displayName }), requestId);
});

/** DELETE /api/v1/me — closes the account and ends the session. */
export const DELETE = apiRoute("me-delete", async ({ request, requestId }) => {
  const user = await requireUser();
  const body = await parseBody(request, deleteAccountSchema);
  return ok(await requestAccountDeletion({ userId: user.id, confirmation: body.confirmation }), requestId);
});
