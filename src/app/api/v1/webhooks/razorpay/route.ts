import { NextResponse, type NextRequest } from "next/server";

import { ApiFailure } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import { handleWebhook } from "@/services/payments/payment-service";
import { getRequestId } from "@/lib/http/request";

/**
 * POST /api/v1/webhooks/razorpay
 *
 * Three things matter here, in this order:
 *  1. the signature is verified against the **raw** body — parsing first would
 *     change the bytes and make every legitimate webhook look forged;
 *  2. the provider event id is recorded so a redelivery is a no-op;
 *  3. credits are granted only through the shared grant path, which re-reads the
 *     capture from the API.
 *
 * A failure is reported with the provider's expected shape and a 5xx, so Razorpay
 * retries; a duplicate is a 200, so it stops.
 */

const log = createLogger("razorpay-webhook");

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ status: "error", requestId }, { status: 400 });
  }

  try {
    const result = await handleWebhook({ rawBody, signature, eventId });
    return NextResponse.json({ status: "ok", ...result, requestId }, { status: 200 });
  } catch (error) {
    const failure = error instanceof ApiFailure ? error : null;
    log.error("webhook failed", {
      requestId,
      eventId,
      code: failure?.code ?? "internal_error",
      error: error instanceof Error ? error.message : String(error),
    });

    /*
     * 401 for a bad signature (never retry a forgery), 503 while the backend is
     * not configured, 500 for our own failure so Razorpay retries the delivery.
     */
    const status = failure ? failure.status : 500;
    return NextResponse.json({ status: "error", requestId }, { status });
  }
}
