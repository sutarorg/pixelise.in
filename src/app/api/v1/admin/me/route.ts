import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getAdminIdentity } from "@/services/admin/admin-service";

/** GET /api/v1/admin/me — identity plus the capabilities the server will honour. */
export const GET = apiRoute("admin-me", async ({ requestId }) => {
  const admin = await requireAdmin("audit:read");
  return ok(await getAdminIdentity(admin), requestId);
});
