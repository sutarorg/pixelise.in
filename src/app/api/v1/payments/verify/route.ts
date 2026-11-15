import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { verifyPaymentSchema } from "@/lib/validations";
import { verifyCheckout } from "@/services/payments/payment-service";

/**
 * POST /api/v1/payments/verify — the checkout callback.
 *
 * A valid signature is necessary but not sufficient: credits are granted only
 * after the server has re-read the payment from Razorpay and seen `captured`.
 * Until then the answer is `verifying`, which the UI already renders.
 */

export const POST = apiRoute("payments-verify", async ({ request, requestId }) => {
  const user = await requireUser();
  const body = await parseBody(request, verifyPaymentSchema);

  return ok(
    await verifyCheckout({
      userId: user.id,
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
    }),
    requestId,
  );
});
