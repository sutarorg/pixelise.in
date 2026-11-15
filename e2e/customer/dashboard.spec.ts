import { expect, test } from "../fixtures/test";
import { customerCredentials, hasCustomer, skipReasons } from "../fixtures/env";
import { signIn } from "../helpers/auth";

test.describe("customer dashboard", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);
    const status = await signIn(page, "customer");
    expect(status, "sign-in should succeed for the seeded staging customer").toBe(200);
  });

  test("dashboard shows the account and wallet without inventing data @smoke", async ({ page, recorder }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The signed-in email is rendered from the session, not hardcoded.
    await expect(page.locator("body")).toContainText(customerCredentials.email.split("@")[0]);

    // Wallet figures come from the API; if the backend is unavailable the shell says so
    // instead of rendering a fake balance.
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/₹\s?0\s?credits/i);

    recorder.expectNone([/hydration/i, /Minified React error/i]);
  });

  test("credits page reports the ledger honestly", async ({ page }) => {
    await page.goto("/credits");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/credits/i);

    // Pack prices are frozen: Creator ₹499 / Studio ₹999.
    const main = await page.locator("main").innerText();
    if (/creator/i.test(main)) {
      expect(main).toContain("499");
      expect(main).toContain("999");
    }
  });

  test("creations list and empty state", async ({ page }) => {
    await page.goto("/creations");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/creation|empty|no .* yet/i);
  });

  test("settings and help are reachable", async ({ page }) => {
    for (const path of ["/settings", "/help", "/transactions"]) {
      const response = await page.goto(path);
      expect(response?.status(), `status for ${path}`).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});
