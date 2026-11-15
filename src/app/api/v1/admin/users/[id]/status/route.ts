import { requireAdmin } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { adminUserStatusSchema } from "@/lib/validations";
import { updateUserStatus } from "@/services/admin/admin-service";
import { sendAccountStatusEmail } from "@/services/email/email-service";

/** PATCH /api/v1/admin/users/{id}/status — suspend or reactivate, with an audit row. */

export const PATCH = apiRoute<{ id: string }>("admin-user-status", async ({ request, requestId, params }) => {
  const admin = await requireAdmin("users:write");
  const body = await parseBody(request, adminUserStatusSchema);

  const user = await updateUserStatus({
    adminId: admin.id,
    userId: params.id,
    status: body.status,
    reason: body.reason,
  });

  void sendAccountStatusEmail({ userId: params.id, status: body.status, reason: body.reason }).catch(
    () => undefined,
  );

  return ok(user, requestId);
});
