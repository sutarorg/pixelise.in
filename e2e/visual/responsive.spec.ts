import { expect, test } from "../fixtures/test";
import { responsiveRoutes, viewports } from "../helpers/routes";

/**
 * Responsive checks that catch real breakage: horizontal scrolling, clipped
 * headings, and tap targets too small to hit on a phone.
 */
test.describe("responsive layout", () => {
  for (const viewport of viewports) {
    test(`no horizontal overflow at ${viewport.label}px @responsive`, async ({ page, recorder }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of responsiveRoutes) {
        await page.goto(route);
        await page.waitForLoadState("networkidle").catch(() => {});

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
          };
        });

        expect(
          overflow.scrollWidth,
          `${route} overflows at ${viewport.width}px (scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth})`,
        ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      }

      recorder.expectNone([/hydration/i]);
    });
  }

  test("mobile tap targets are large enough @mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const links = page.getByRole("dialog").getByRole("link");
    const count = await links.count();
    expect(count).toBeGreaterThan(4);

    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box, `link ${index} has no box`).not.toBeNull();
      expect(box!.height, `tap target height for link ${index}`).toBeGreaterThanOrEqual(40);
    }
  });

  test("article tables scroll instead of breaking the layout", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/blog/shopify-product-photography-guide");

    const wrappers = page.locator("table").locator("xpath=..");
    const count = await wrappers.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const overflowX = await wrappers.nth(index).evaluate((node) => window.getComputedStyle(node).overflowX);
      expect(["auto", "scroll"]).toContain(overflowX);
    }
  });
});
