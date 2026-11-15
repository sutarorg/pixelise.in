import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { listPayments } from "@/services/payments/payment-service";

/** GET /api/v1/payments — the customer's purchase history. */
export const GET = apiRoute("payments-list", async ({ request, requestId }) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "10");

  return ok(
    await listPayments({
      userId: user.id,
      cursor: url.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : 10,
    }),
    requestId,
  );
});
