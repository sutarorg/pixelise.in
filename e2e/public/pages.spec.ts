import { expect, test } from "../fixtures/test";
import { readSeo } from "../helpers/seo";
import { publicRoutes } from "../helpers/routes";

test.describe("public pages", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders with complete metadata @smoke @mobile`, async ({ page, recorder }) => {
      const response = await page.goto(route.path);
      expect(response?.status(), `status for ${route.path}`).toBeLessThan(400);

      const seo = await readSeo(page);

      // Exactly one H1 per page — the marketing layout renders it via Hero/PageHero.
      expect(seo.h1s, `H1 count on ${route.path}`).toHaveLength(1);
      expect(seo.h1s[0].length).toBeGreaterThan(10);

      // Unique, descriptive title and description.
      expect(seo.title).toBeTruthy();
      expect(seo.title).not.toContain("Create Next App");
      expect(seo.description, `meta description on ${route.path}`).toBeTruthy();
      expect(seo.description!.length).toBeGreaterThanOrEqual(50);

      // Canonical, OG and Twitter are all present and absolute.
      expect(seo.canonical, `canonical on ${route.path}`).toMatch(/^https:\/\/pixelise\.in/);
      expect(seo.ogTitle).toBeTruthy();
      expect(seo.ogImage).toMatch(/^https:\/\/pixelise\.in/);
      expect(seo.twitterCard).toBe("summary_large_image");

      // Landmarks.
      await expect(page.locator("main#main")).toBeVisible();
      await expect(page.locator("header")).toHaveCount(1);
      await expect(page.locator("footer")).toHaveCount(1);

      // Marketing pages are indexable.
      expect(seo.robots ?? "").not.toContain("noindex");

      recorder.expectNone([/Failed to load resource/i, /503/]);
    });
  }

  test("marketing titles and descriptions are unique @smoke", async ({ page }) => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const route of publicRoutes) {
      await page.goto(route.path);
      const seo = await readSeo(page);

      const previousTitle = titles.get(seo.title);
      expect(previousTitle, `duplicate title "${seo.title}" on ${route.path} and ${previousTitle}`).toBeUndefined();
      titles.set(seo.title, route.path);

      const description = seo.description ?? "";
      const previousDescription = descriptions.get(description);
      expect(
        previousDescription,
        `duplicate description on ${route.path} and ${previousDescription}`,
      ).toBeUndefined();
      descriptions.set(description, route.path);
    }
  });

  test("homepage uses the approved meta title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("AI Product Photography to Boost Sales Online");
  });

  test("unknown routes return a styled 404 @smoke", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
