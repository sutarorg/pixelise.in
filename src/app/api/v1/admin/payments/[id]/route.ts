import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getPaymentDetail } from "@/services/admin/admin-service";

export const GET = apiRoute<{ id: string }>("admin-payment", async ({ requestId, params }) => {
  await requireAdmin("audit:read");
  return ok(await getPaymentDetail(params.id), requestId);
});
