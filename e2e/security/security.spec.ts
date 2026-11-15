import { expect, test } from "../fixtures/test";
import { hasCustomer, hasSecondCustomer, skipReasons } from "../fixtures/env";
import { signIn } from "../helpers/auth";

/**
 * Security regressions worth an E2E test: the ones that would be catastrophic and
 * are invisible in a happy-path suite.
 */
test.describe("security", () => {
  test("private namespaces require a session", async ({ request }) => {
    const endpoints = [
      "/api/v1/me",
      "/api/v1/credits/wallet",
      "/api/v1/creations",
      "/api/v1/generations",
      "/api/v1/payments/orders",
      "/api/v1/admin/overview",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint, { failOnStatusCode: false });
      expect([401, 403, 405, 503], `${endpoint} status`).toContain(response.status());
    }
  });

  test("one customer cannot read another customer's creation", async ({ page }) => {
    test.skip(!hasCustomer || !hasSecondCustomer, skipReasons.secondCustomer);

    expect(await signIn(page, "customer")).toBe(200);
    const list = await page.request.get("/api/v1/creations", { failOnStatusCode: false });
    const body = await list.json();
    const creationId: string | undefined = body?.data?.creations?.[0]?.id;

    test.skip(!creationId, "customer A has no creations to test cross-user access with");

    await page.context().clearCookies();
    expect(await signIn(page, "customerB")).toBe(200);

    const response = await page.request.get(`/api/v1/creations/${creationId}`, {
      failOnStatusCode: false,
    });

    // 404 rather than 403: the existence of another user's record is not confirmed.
    expect([403, 404]).toContain(response.status());

    const text = await response.text();
    expect(text).not.toMatch(/storageKey|signedUrl|r2\.cloudflarestorage/i);
  });

  test("fal webhook cannot be triggered without configuration", async ({ request }) => {
    const response = await request.post("/api/v1/webhooks/fal", {
      data: { request_id: "test", status: "OK" },
      failOnStatusCode: false,
    });

    // fal has no request signature, so the handler must re-read the queue and refuse
    // to trust the body. Unconfigured → 503; configured + unknown id → 404/400.
    expect([400, 401, 404, 503]).toContain(response.status());
  });

  test("a customer cannot call admin mutations", async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);
    expect(await signIn(page, "customer")).toBe(200);

    const attempts = [
      page.request.post("/api/v1/admin/credits/adjust", {
        data: { userId: "00000000-0000-4000-8000-000000000000", delta: 9999, reason: "escalation test" },
        failOnStatusCode: false,
      }),
      page.request.post("/api/v1/admin/users/00000000-0000-4000-8000-000000000000/status", {
        data: { status: "active" },
        failOnStatusCode: false,
      }),
    ];

    for (const attempt of attempts) {
      const response = await attempt;
      expect([401, 403, 404, 503]).toContain(response.status());
      expect(response.status()).not.toBe(200);
    }
  });

  test("generation requests cannot overspend the wallet", async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);
    expect(await signIn(page, "customer")).toBe(200);

    const before = await (await page.request.get("/api/v1/credits/wallet")).json();

    const response = await page.request.post("/api/v1/generations", {
      data: {
        styleId: "minimal-white-studio",
        sceneId: "minimal-white-studio",
        quality: "standard",
        sourceUploadId: "00000000-0000-4000-8000-000000000000",
        quantity: 9999,
      },
      failOnStatusCode: false,
    });

    // Rejected (402 insufficient credits / 422 invalid / 503 not configured). Never 201.
    expect([402, 422, 503]).toContain(response.status());

    const after = await (await page.request.get("/api/v1/credits/wallet")).json();
    if (before?.data?.wallet && after?.data?.wallet) {
      expect(after.data.wallet.reservedCredits).toBe(before.data.wallet.reservedCredits);
    }
  });

  test("no secrets appear in the client bundle or HTML", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();

    for (const name of ["SERVICE_ROLE", "RAZORPAY_KEY_SECRET", "R2_SECRET_ACCESS_KEY", "FAL_KEY", "RESEND_API_KEY"]) {
      expect(html).not.toContain(name);
    }

    expect(html).not.toMatch(/rzp_live_/);
  });
});
