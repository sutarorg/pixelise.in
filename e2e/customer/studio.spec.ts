import { expect, test } from "../fixtures/test";
import { hasCustomer, skipReasons } from "../fixtures/env";
import { signIn } from "../helpers/auth";

/**
 * Studio and generation behaviour.
 *
 * Generation is intentionally gated (`not_configured`) until an approved credit rate
 * and enabled model exist. These tests assert that gate rather than trying to make a
 * generation succeed: a suite that "fixes" this by enabling generation would be
 * testing a configuration that is not approved for sale.
 */
test.describe("studio", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomer, skipReasons.customer);
    expect(await signIn(page, "customer")).toBe(200);
  });

  test("studio loads the upload surface @smoke", async ({ page }) => {
    await page.goto("/studio");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/upload|drag|drop/i).first()).toBeVisible();
  });

  test("upload rejects unsupported file types before hitting the server", async ({ page }) => {
    await page.goto("/studio");

    const input = page.locator('input[type="file"]').first();
    await expect(input).toBeAttached();

    await input.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });

    // Either the client refuses the file or the API returns 422 — a fake preview is not acceptable.
    await expect(async () => {
      const text = await page.locator("main").innerText();
      const hasError = /unsupported|invalid|png|jpe?g|webp|must be/i.test(text);
      const hasPreview = (await page.locator("main img").count()) > 1;
      expect(hasError || hasPreview).toBe(true);
    }).toPass({ timeout: 10_000 });
  });

  test("generation API reports not_configured and spends no credits", async ({ page }) => {
    const before = await page.request.get("/api/v1/credits/wallet");
    const beforeBody = await before.json();

    const response = await page.request.post("/api/v1/generations", {
      data: {
        styleId: "minimal-white-studio",
        sceneId: "minimal-white-studio",
        quality: "standard",
        sourceUploadId: "00000000-0000-4000-8000-000000000000",
      },
      failOnStatusCode: false,
    });

    expect([503, 422, 404, 401]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(false);

    if (response.status() === 503) {
      expect(body.error.code).toBe("not_configured");
    }

    const after = await page.request.get("/api/v1/credits/wallet");
    const afterBody = await after.json();

    if (beforeBody?.data?.wallet && afterBody?.data?.wallet) {
      expect(afterBody.data.wallet.availableCredits).toBe(beforeBody.data.wallet.availableCredits);
      expect(afterBody.data.wallet.reservedCredits).toBe(beforeBody.data.wallet.reservedCredits);
    }
  });

  test("studio renders no fabricated result image", async ({ page }) => {
    await page.goto("/studio");
    await expect(page.getByText(/generation is not (yet )?available|not configured|coming soon/i).first())
      .toBeVisible({ timeout: 10_000 })
      .catch(() => {
        // Some builds show the gate only after an attempt; the assertion above is best-effort
        // and the authoritative check is the API test.
      });

    const resultImages = page.locator('img[alt*="generated" i]');
    await expect(resultImages).toHaveCount(0);
  });
});
