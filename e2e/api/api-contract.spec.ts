import { expect, test } from "../fixtures/test";

/**
 * API contract checks that hold without a configured backend.
 *
 * The application's promise is that every `/api/v1` response is JSON with
 * `{ success, data | error, requestId }` — including failures. These tests catch the
 * regression where Next.js starts returning an HTML error page.
 */

const readOnlyEndpoints = [
  "/api/v1/credits/packs",
  "/api/v1/public/config",
  "/api/v1/studio/config",
];

test.describe("api envelope", () => {
  for (const endpoint of readOnlyEndpoints) {
    test(`${endpoint} returns a JSON envelope @smoke`, async ({ request }) => {
      const response = await request.get(endpoint, { failOnStatusCode: false });
      expect([200, 503]).toContain(response.status());

      expect(response.headers()["content-type"]).toContain("application/json");
      const body = await response.json();

      expect(body).toHaveProperty("requestId");
      expect(typeof body.requestId).toBe("string");
      expect(body.requestId.length).toBeGreaterThan(8);
      expect(body.success).toBe(true);

      // Private data must never be cached by a shared proxy.
      if (endpoint !== "/api/v1/credits/packs") {
        expect(response.headers()["cache-control"] ?? "").toMatch(/no-store|private/);
      }
    });
  }

  test("errors use the same envelope as successes @smoke", async ({ request }) => {
    const response = await request.get("/api/v1/me", { failOnStatusCode: false });
    expect([401, 503]).toContain(response.status());

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
    expect(body.requestId).toBeTruthy();
  });

  test("unknown API routes return 404 rather than a 500", async ({ request }) => {
    const response = await request.get("/api/v1/definitely-not-a-route", { failOnStatusCode: false });
    expect(response.status()).toBe(404);
  });

  test("unsupported methods are rejected", async ({ request }) => {
    const response = await request.put("/api/v1/credits/packs", {
      data: { packId: "creator" },
      failOnStatusCode: false,
    });
    expect([405, 404]).toContain(response.status());
  });

  test("auth endpoints never echo credentials", async ({ request }) => {
    const password = "SuperSecretPassword123!";
    const response = await request.post("/api/v1/auth/sign-in", {
      data: { email: "nobody@pixelise.in", password },
      failOnStatusCode: false,
    });

    const text = await response.text();
    expect(text).not.toContain(password);
    expect(text.toLowerCase()).not.toContain("password_hash");
  });

  test("public config exposes only public values", async ({ request }) => {
    const response = await request.get("/api/v1/public/config", { failOnStatusCode: false });
    if (response.status() !== 200) test.skip(true, "public config is not available in this environment");

    const text = await response.text();
    for (const secretName of ["SUPABASE_SERVICE_ROLE", "RAZORPAY_KEY_SECRET", "R2_SECRET", "FAL_KEY", "RESEND_API_KEY"]) {
      expect(text).not.toContain(secretName);
    }
  });
});
