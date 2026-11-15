import { expect, test } from "../fixtures/test";

/**
 * Visual regression snapshots.
 *
 * Opt-in: set `E2E_VISUAL=1` and generate baselines on the same OS/font stack that
 * CI uses (`npx playwright test --update-snapshots`). Baselines generated on a
 * developer machine are not comparable — macOS and Linux rasterise Manrope
 * differently — so the default suite skips these instead of failing on noise.
 */
const visualPages = [
  { path: "/", name: "home" },
  { path: "/pricing", name: "pricing" },
  { path: "/blog", name: "journal" },
  { path: "/blog/shopify-product-photography-guide", name: "article" },
  { path: "/no-such-page", name: "not-found" },
];

const enabled = process.env.E2E_VISUAL === "1";

test.describe("visual snapshots", () => {
  // Describe-level skip: it prevents the browser fixture from being created at all,
  // so an environment without browser binaries reports SKIPPED instead of an error.
  test.skip(!enabled, "Set E2E_VISUAL=1 to run visual regression snapshots");

  for (const pageDef of visualPages) {
    test(`${pageDef.name} matches its baseline @visual`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(pageDef.path);
      await page.waitForLoadState("networkidle").catch(() => {});

      // Freeze anything that could animate into the baseline.
      await page.addStyleTag({
        content: "*, *::before, *::after { animation: none !important; transition: none !important; }",
      });

      await expect(page).toHaveScreenshot(`${pageDef.name}-1280.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  test("journal article is readable at 390px @visual", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/blog");
    await expect(page).toHaveScreenshot("journal-390.png", { fullPage: true, animations: "disabled" });
  });
});
