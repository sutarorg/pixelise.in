import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { ok } from "@/lib/http/response";
import { createOrderSchema } from "@/lib/validations";
import { createOrder } from "@/services/payments/payment-service";

/**
 * POST /api/v1/payments/orders — one Razorpay order for one pack.
 *
 * The request names a pack id and nothing else. The amount is read from the pack
 * table, snapshotted onto the payment row, and never taken from the browser.
 */

export const POST = apiRoute("orders-create", async ({ request, requestId }) => {
  const user = await requireUser();
  await enforceRateLimit("orders", user.id);

  const body = await parseBody(request, createOrderSchema);
  return ok(await createOrder({ userId: user.id, packId: body.packId }), requestId, { status: 201 });
});
