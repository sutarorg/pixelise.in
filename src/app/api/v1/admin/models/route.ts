import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { listModels } from "@/services/admin/admin-service";

export const GET = apiRoute("admin-models", async ({ requestId }) => {
  await requireAdmin("audit:read");
  return ok(await listModels(), requestId);
});
