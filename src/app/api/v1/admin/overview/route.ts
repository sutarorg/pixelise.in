import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { ok } from "@/lib/http/response";
import { getOverview } from "@/services/admin/admin-service";

/** GET /api/v1/admin/overview?range=30d|7d|90d or ?from=&to= */
export const GET = apiRoute("admin-overview", async ({ request, requestId }) => {
  const admin = await requireAdmin("audit:read");
  await enforceRateLimit("admin", admin.id);

  const url = new URL(request.url);
  return ok(
    await getOverview({
      range: url.searchParams.get("range"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    }),
    requestId,
  );
});
