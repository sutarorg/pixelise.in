import { createHmac } from "node:crypto";

import { expect, test } from "../fixtures/test";
import { hasCustomer, razorpay, skipReasons } from "../fixtures/env";
import { apiSignIn } from "../helpers/auth";

/**
 * Payment tests.
 *
 * Hard rules encoded here:
 * - Razorpay **test mode only** (`rzp_test_…`). `fixtures/env.ts` aborts the run otherwise.
 * - No card details are ever entered. The suite exercises order creation, signature
 *   verification and webhook idempotency through the API.
 * - Credits are never granted from a frontend success event: a forged verify payload
 *   must leave the wallet untouched.
 */
test.describe("payments", () => {
  test("checkout requires an authenticated session @smoke", async ({ request }) => {
    const response = await request.post("/api/v1/payments/orders", {
      data: { packId: "creator" },
      failOnStatusCode: false,
    });

    expect([401, 403, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("pack prices come from the server, not the browser", async ({ request }) => {
    const response = await request.get("/api/v1/credits/packs");
    expect(response.status()).toBe(200);
    const body = await response.json();

    const packs = Array.isArray(body.data) ? body.data : body.data.packs;
    const creator = packs.find((pack: { id: string }) => pack.id === "creator");
    const studio = packs.find((pack: { id: string }) => pack.id === "studio");

    // The API exposes paise; rupees are a display concern.
    expect(creator.pricePaise ?? creator.price * 100).toBe(49900);
    expect(studio.pricePaise ?? studio.price * 100).toBe(99900);
    expect(creator.credits).toBe(150);
    expect(studio.credits).toBe(350);
    expect(creator.currency).toBe("INR");
    expect(creator.purchaseType).toBe("one-time");
  });

  test("forged checkout callback cannot grant credits", async ({ request }) => {
    test.skip(!hasCustomer, skipReasons.customer);

    expect(await apiSignIn(request, "customer")).toBe(200);

    const walletBefore = await (await request.get("/api/v1/credits/wallet")).json();

    const response = await request.post("/api/v1/payments/verify", {
      data: {
        orderId: "order_TEST000000000000",
        paymentId: "pay_TEST000000000000",
        signature: "0".repeat(64),
      },
      failOnStatusCode: false,
    });

    expect([400, 401, 409, 422, 503]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);

    const walletAfter = await (await request.get("/api/v1/credits/wallet")).json();
    if (walletBefore?.data?.wallet && walletAfter?.data?.wallet) {
      expect(walletAfter.data.wallet.availableCredits).toBe(walletBefore.data.wallet.availableCredits);
    }
  });

  test("webhook rejects an invalid signature", async ({ request }) => {
    const response = await request.post("/api/v1/webhooks/razorpay", {
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": "not-a-valid-signature",
      },
      data: JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_TEST", order_id: "order_TEST", amount: 49900 } } },
      }),
      failOnStatusCode: false,
    });

    expect([400, 401, 503]).toContain(response.status());
  });

  test("duplicate webhook delivery grants credits at most once", async ({ request }) => {
    test.skip(!razorpay.webhookSecret, skipReasons.razorpay);
    test.skip(!hasCustomer, skipReasons.customer);

    expect(await apiSignIn(request, "customer")).toBe(200);

    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: process.env.E2E_IDEMPOTENCY_PAYMENT_ID ?? "pay_TESTIDEMPOTENCY0001",
            order_id: process.env.E2E_IDEMPOTENCY_ORDER_ID ?? "order_TESTIDEMPOTENCY0001",
            amount: 49900,
            currency: "INR",
            status: "captured",
            captured: true,
          },
        },
      },
    });

    const signature = createHmac("sha256", razorpay.webhookSecret).update(rawBody).digest("hex");

    const walletBefore = await (await request.get("/api/v1/credits/wallet")).json();

    const deliver = () =>
      request.post("/api/v1/webhooks/razorpay", {
        headers: { "content-type": "application/json", "x-razorpay-signature": signature },
        data: rawBody,
        failOnStatusCode: false,
      });

    const first = await deliver();
    const second = await deliver();

    // Both deliveries are accepted (webhooks are retried by the provider)…
    expect([200, 202]).toContain(first.status());
    expect([200, 202]).toContain(second.status());

    // …but the ledger moves only once. A real payment is verified against the
    // provider, so the exact delta depends on the seeded order; the invariant is
    // that the second delivery does not add credits again.
    const walletAfter = await (await request.get("/api/v1/credits/wallet")).json();
    if (walletBefore?.data?.wallet && walletAfter?.data?.wallet) {
      const delta = walletAfter.data.wallet.availableCredits - walletBefore.data.wallet.availableCredits;
      const packCredits = 150;
      expect([0, packCredits]).toContain(delta);
    }
  });
});
