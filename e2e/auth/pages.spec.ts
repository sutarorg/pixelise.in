import { expect, test } from "../fixtures/test";
import { readSeo } from "../helpers/seo";

/**
 * The three account-entry pages.
 *
 * These render without any backend: they are static shells that only talk to the
 * API when a form is submitted. That means they can be verified in CI before
 * Supabase or Razorpay exist — which is exactly when a 404 here would hurt most.
 */

test.describe("account entry pages", () => {
  for (const { path, heading } of [
    { path: "/login", heading: /sign in/i },
    { path: "/signup", heading: /create your account/i },
    { path: "/forgot-password", heading: /reset your password/i },
  ] as const) {
    test(`${path} renders, is noindex and has one H1 @smoke @mobile`, async ({ page, recorder }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);

      const seo = await readSeo(page);

      expect(seo.h1s, `H1 count on ${path}`).toHaveLength(1);
      expect(seo.h1s[0]).toMatch(heading);
      expect(seo.title).toContain("Pixelise");
      expect(seo.robots ?? "", `robots meta on ${path}`).toContain("noindex");

      // A visible form with real labels, not placeholder-only inputs.
      await expect(page.locator("main#main")).toBeVisible();
      await expect(page.locator("form")).toHaveCount(1);
      const labelledControls = await page.locator("form label").count();
      expect(labelledControls, `labels on ${path}`).toBeGreaterThanOrEqual(1);

      recorder.expectNone();
    });
  }

  test("sign-in form validates locally before it calls the API @smoke", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /^sign in$/i }).click();

    // Both fields are reported at once and nothing was submitted.
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
  });

  test("a recovery link opens the new-password form, not the sign-in form @smoke", async ({
    page,
  }) => {
    await page.goto("/login?mode=recovery");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/set a new password/i);
    await expect(page.locator("#recovery-password")).toBeVisible();
    await expect(page.locator("#login-email")).toHaveCount(0);
  });

  test("a failed link exchange explains itself on the sign-in page @smoke", async ({ page }) => {
    await page.goto("/login?error=link_expired");

    await expect(page.getByText(/expired or was already used/i)).toBeVisible();
  });

  test("the two account pages link to each other @smoke", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /create an account/i })).toHaveAttribute(
      "href",
      "/signup",
    );

    await page.goto("/signup");
    await expect(page.getByRole("link", { name: /^sign in$/i })).toHaveAttribute("href", "/login");
  });

  test("signup asks for confirmation instead of claiming the account is open", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page.locator("#signup-email").fill("someone@example.com");
    await page.locator("#signup-password").fill("correct-horse");
    await page.locator("#signup-confirm").fill("correct-horsE");

    await page.getByRole("button", { name: /create account/i }).click();

    // Mismatched confirmation is caught in the browser; no request is made.
    await expect(page.getByText(/do not match/i)).toBeVisible();
  });
});
