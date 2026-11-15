import { requireAdmin } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { ok } from "@/lib/http/response";
import { listCreditTransactions } from "@/services/admin/admin-service";

export const GET = apiRoute("admin-credits", async ({ request, requestId }) => {
  const admin = await requireAdmin("audit:read");
  await enforceRateLimit("admin", admin.id);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");

  return ok(
    await listCreditTransactions({
      q: url.searchParams.get("q"),
      user: url.searchParams.get("user"),
      type: url.searchParams.get("type"),
      range: url.searchParams.get("range"),
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      cursor: url.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : 20,
    }),
    requestId,
  );
});
