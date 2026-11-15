import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getWallet } from "@/services/credits/credit-service";

/** GET /api/v1/credits/wallet — server-authored balance. Never cached. */

export const GET = apiRoute("wallet", async ({ requestId }) => {
  const user = await requireUser();
  return ok(await getWallet(user.id), requestId);
});
