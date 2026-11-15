import { requireAdmin } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { adminCreditAdjustSchema } from "@/lib/validations";
import { adjustCredits } from "@/services/admin/admin-service";

/**
 * POST /api/v1/admin/credits/adjust
 *
 * The only way credits move without a purchase or a generation. The SQL function
 * enforces a reason, refuses to overdraw, and writes the ledger row and audit row
 * in the same transaction.
 */

export const POST = apiRoute("admin-credit-adjust", async ({ request, requestId }) => {
  const admin = await requireAdmin("credits:write");
  const body = await parseBody(request, adminCreditAdjustSchema);

  return ok(
    await adjustCredits({
      adminId: admin.id,
      userId: body.userId,
      direction: body.direction,
      credits: body.credits,
      reason: body.reason,
    }),
    requestId,
  );
});
