import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getGenerationDetail } from "@/services/admin/admin-service";

export const GET = apiRoute<{ id: string }>("admin-generation", async ({ requestId, params }) => {
  await requireAdmin("audit:read");
  return ok(await getGenerationDetail(params.id), requestId);
});
