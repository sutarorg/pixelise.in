import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/payments/razorpay";

/**
 * Signature verification is the one place a forged payment could enter the
 * system, so it gets explicit tests with hand-computed HMACs.
 *
 * The secrets come from `vitest.config.ts` (test env), never from a real account.
 */
const keySecret = "test_key_secret";
const webhookSecret = "test_webhook_secret";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

describe("checkout signature", () => {
  it("accepts the documented order_id|payment_id HMAC", () => {
    const signature = sign("order_ABC123|pay_XYZ789", keySecret);
    expect(verifyCheckoutSignature({ orderId: "order_ABC123", paymentId: "pay_XYZ789", signature })).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    const signature = sign("order_ABC123|pay_XYZ789", "attacker_secret");
    expect(verifyCheckoutSignature({ orderId: "order_ABC123", paymentId: "pay_XYZ789", signature })).toBe(false);
  });

  it("rejects a signature for a different payment", () => {
    const signature = sign("order_ABC123|pay_OTHER", keySecret);
    expect(verifyCheckoutSignature({ orderId: "order_ABC123", paymentId: "pay_XYZ789", signature })).toBe(false);
  });

  it("rejects empty or truncated signatures without throwing", () => {
    expect(verifyCheckoutSignature({ orderId: "o", paymentId: "p", signature: "" })).toBe(false);
    expect(verifyCheckoutSignature({ orderId: "o", paymentId: "p", signature: "abc" })).toBe(false);
  });
});

describe("webhook signature", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  it("accepts a body signed with the webhook secret", () => {
    expect(verifyWebhookSignature({ rawBody, signature: sign(rawBody, webhookSecret) })).toBe(true);
  });

  it("rejects a body that was modified after signing", () => {
    const signature = sign(rawBody, webhookSecret);
    const tampered = rawBody.replace("pay_1", "pay_2");
    expect(verifyWebhookSignature({ rawBody: tampered, signature })).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature({ rawBody, signature: null })).toBe(false);
  });

  it("rejects a signature produced with the key secret instead of the webhook secret", () => {
    expect(verifyWebhookSignature({ rawBody, signature: sign(rawBody, keySecret) })).toBe(false);
  });
});
