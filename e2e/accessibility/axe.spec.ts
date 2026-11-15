import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "../fixtures/test";

/**
 * WCAG 2.2 AA coverage with axe-core.
 *
 * Serious and critical violations fail the suite. Moderate and minor findings are
 * attached to the report so they can be triaged without blocking a release — this is
 * a deliberate threshold, documented in docs/audit/codebase-audit.md.
 */
const pages = [
  { path: "/", name: "homepage" },
  { path: "/pricing", name: "pricing" },
  { path: "/faq", name: "faq" },
  { path: "/contact", name: "contact" },
  { path: "/blog", name: "journal index" },
  { path: "/blog/ai-product-photography-ecommerce-guide", name: "article" },
  { path: "/blog/categories/ecommerce-photography", name: "category" },
  { path: "/login", name: "sign in" },
  { path: "/signup", name: "sign up" },
  { path: "/forgot-password", name: "password reset" },
  { path: "/dashboard", name: "app gate" },
  { path: "/admin", name: "console gate" },
];

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("accessibility", () => {
  for (const { path, name } of pages) {
    test(`${name} has no serious axe violations @smoke`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => {});

      const results = await new AxeBuilder({ page }).withTags(tags).analyze();

      const blocking = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      const nonBlocking = results.violations.filter(
        (violation) => !["serious", "critical"].includes(violation.impact ?? ""),
      );

      if (nonBlocking.length > 0) {
        await testInfo.attach(`axe-moderate-${path.replace(/\W+/g, "-")}.json`, {
          body: JSON.stringify(nonBlocking, null, 2),
          contentType: "application/json",
        });
      }

      expect(
        blocking.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }

  test("keyboard focus is visible and reachable on the journal @smoke", async ({ page }) => {
    await page.goto("/blog");

    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element) return null;
        const style = window.getComputedStyle(element);
        return {
          tag: element.tagName,
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      });

      expect(focused).not.toBeNull();
      const hasVisibleFocus =
        (focused!.outlineStyle !== "none" && focused!.outlineWidth !== "0px") ||
        focused!.boxShadow !== "none";
      expect(hasVisibleFocus, `element ${focused!.tag} has no visible focus indicator`).toBe(true);
    }
  });
});
