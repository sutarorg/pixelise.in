import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getConfig } from "@/services/admin/admin-service";

/** GET /api/v1/admin/config — packs, models, rates and integration status. */
export const GET = apiRoute("admin-config", async ({ requestId }) => {
  const admin = await requireAdmin("audit:read");
  return ok(await getConfig(admin), requestId);
});
