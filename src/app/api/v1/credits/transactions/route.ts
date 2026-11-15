import type { CreditTransactionType } from "@/lib/api/types";
import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { listTransactions } from "@/services/credits/credit-service";

const types = new Set(["purchase", "generation", "refund", "adjustment"]);

/** GET /api/v1/credits/transactions?type=&cursor=&limit= */
export const GET = apiRoute("transactions", async ({ request, requestId }) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");

  const type = typeParam && types.has(typeParam) ? (typeParam as CreditTransactionType) : null;
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");

  return ok(
    await listTransactions({
      userId: user.id,
      type,
      cursor,
      limit: Number.isFinite(limit) ? limit : 20,
    }),
    requestId,
  );
});
