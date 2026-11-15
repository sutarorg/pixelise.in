import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getUserDetail } from "@/services/admin/admin-service";

export const GET = apiRoute<{ id: string }>("admin-user", async ({ requestId, params }) => {
  await requireAdmin("audit:read");
  return ok(await getUserDetail(params.id), requestId);
});
