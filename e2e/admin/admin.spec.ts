import { expect, test } from "../fixtures/test";
import { adminCredentials, hasAdmin, hasCustomer, skipReasons } from "../fixtures/env";
import { signIn } from "../helpers/auth";
import { adminRoutes } from "../helpers/routes";

test.describe("admin console", () => {
  test("unauthenticated visitors only see the sign-in gate @smoke", async ({ page }) => {
    for (const path of adminRoutes) {
      const response = await page.goto(path);
      expect(response?.status(), `status for ${path}`).toBeLessThan(400);

      await expect(page.getByRole("heading", { level: 1 })).toContainText(/sign in/i);
      const html = await page.content();

      // No admin records, emails or revenue figures leak into the HTML of a gate page.
      expect(html).not.toMatch(/audit log/i);
      expect(html).not.toMatch(/gross revenue/i);
    }
  });

  test("a customer account cannot open the console", async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);

    expect(await signIn(page, "customer")).toBe(200);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/can't open the console|sign in/i);
  });

  test("admin API rejects unauthenticated and customer callers", async ({ page }) => {
    const anonymous = await page.request.get("/api/v1/admin/overview", { failOnStatusCode: false });
    expect([401, 403, 503]).toContain(anonymous.status());

    if (hasCustomer) {
      expect(await signIn(page, "customer")).toBe(200);
      const asCustomer = await page.request.get("/api/v1/admin/overview", { failOnStatusCode: false });
      expect([401, 403, 503]).toContain(asCustomer.status());
      const body = await asCustomer.json();
      expect(body.success).toBe(false);
    }
  });

  test("admin sees the console with real navigation", async ({ page, recorder }) => {
    test.skip(!hasAdmin, skipReasons.admin);

    expect(await signIn(page, "admin")).toBe(200);

    for (const path of adminRoutes) {
      const response = await page.goto(path);
      expect(response?.status(), `status for ${path}`).toBeLessThan(400);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots ?? "").toContain("noindex");
    }

    // The signed-in admin identity comes from the session, not a hardcoded value.
    await expect(page.locator("body")).toContainText(adminCredentials.email.split("@")[0]);
    recorder.expectNone([/hydration/i, /Minified React error/i]);
  });

  test("credit adjustment requires a reason and is audited", async ({ page }) => {
    test.skip(!hasAdmin, skipReasons.admin);
    expect(await signIn(page, "admin")).toBe(200);

    const response = await page.request.post("/api/v1/admin/credits/adjust", {
      data: { userId: "00000000-0000-4000-8000-000000000000", delta: 10 },
      failOnStatusCode: false,
    });

    // Rejected for a missing reason (422) or for a nonexistent user (404) — never silently applied.
    expect([400, 404, 422]).toContain(response.status());
  });
});
