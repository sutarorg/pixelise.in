import { expect, test } from "../fixtures/test";
import { hasCustomer, skipReasons } from "../fixtures/env";
import { signOut, signIn } from "../helpers/auth";

test.describe("authentication", () => {
  test("protected app routes render a sign-in gate instead of data @smoke", async ({ page }) => {
    for (const path of ["/dashboard", "/studio", "/credits"]) {
      const response = await page.goto(path);
      // The gate renders with 200; it must not leak studio content.
      expect(response?.status(), `status for ${path}`).toBeLessThan(400);

      await expect(page.getByRole("heading", { level: 1 })).toContainText(/sign in/i);
      await expect(page.locator("main")).not.toContainText(/available credits/i);
    }
  });

  test("app and console segments are noindex", async ({ page }) => {
    for (const path of ["/dashboard", "/admin"]) {
      await page.goto(path);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots, `robots meta on ${path}`).toContain("noindex");
    }
  });

  test("invalid sign-in returns a typed error, never a session", async ({ request }) => {
    const response = await request.post("/api/v1/auth/sign-in", {
      data: { email: "not-a-user@pixelise.in", password: "definitely-wrong" },
      failOnStatusCode: false,
    });

    expect([401, 429, 503]).toContain(response.status());
    const body = await response.json();

    expect(body).toHaveProperty("requestId");
    expect(body.success).toBe(false);
    expect(body.error.code).toMatch(/unauthenticated|not_configured|rate_limited/);

    // No auth cookies were written.
    expect(response.headers()["set-cookie"]).toBeUndefined();
  });

  test("malformed sign-in payload is rejected with field details", async ({ request }) => {
    const response = await request.post("/api/v1/auth/sign-in", {
      data: { email: "not-an-email" },
      failOnStatusCode: false,
    });

    expect([422, 503]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 422) {
      expect(body.error.code).toBe("validation_failed");
      expect(body.error.details).toBeTruthy();
    }
  });

  test("sign-in then sign-out clears the session", async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);

    expect(await signIn(page, "customer")).toBe(200);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText(/sign in/i);

    await signOut(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/sign in/i);
  });

  test("customer session cannot reach the admin console", async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);

    expect(await signIn(page, "customer")).toBe(200);
    await page.goto("/admin");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(/can't open the console|cannot open|sign in/i);
  });
});
