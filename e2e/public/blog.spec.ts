import { expect, test } from "../fixtures/test";
import { articleSlugs, categorySlugs } from "../helpers/routes";
import { flattenJsonLd, nodesOfType, readSeo } from "../helpers/seo";

test.describe("journal", () => {
  test("index lists every article with working category filters @smoke", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Better product photography starts with better ideas.",
    );
    await expect(page.getByText("THE PIXELISE JOURNAL", { exact: false })).toBeVisible();

    // Every article is reachable from the index.
    for (const slug of articleSlugs) {
      await expect(page.locator(`a[href="/blog/${slug}"]`).first()).toBeAttached();
    }

    // Category filters are real links, not inert chips.
    for (const category of categorySlugs) {
      await expect(page.locator(`a[href="/blog/categories/${category}"]`).first()).toBeVisible();
    }

    // No fake newsletter and no fabricated social proof.
    await expect(page.locator('form input[type="email"]')).toHaveCount(0);
    await expect(page.getByText(/subscribers|newsletter/i)).toHaveCount(0);
  });

  test("each article has complete article metadata and structured data", async ({ page }) => {
    test.slow();

    for (const slug of articleSlugs) {
      const response = await page.goto(`/blog/${slug}`);
      expect(response?.status(), `status for ${slug}`).toBe(200);

      const seo = await readSeo(page);

      expect(seo.h1s, `H1 count on ${slug}`).toHaveLength(1);
      expect(seo.canonical).toBe(`https://pixelise.in/blog/${slug}`);
      expect(seo.ogType).toBe("article");
      expect(seo.robots ?? "").not.toContain("noindex");

      const nodes = flattenJsonLd(seo.jsonLd);
      expect(nodes.some((node) => "__invalid" in node), `invalid JSON-LD on ${slug}`).toBe(false);

      const postings = nodesOfType(nodes, "BlogPosting");
      expect(postings, `BlogPosting schema on ${slug}`).toHaveLength(1);

      const posting = postings[0];
      expect(posting.datePublished).toBe("2026-11-15");
      expect(posting.dateModified).toBeTruthy();
      expect((posting.author as { name: string }).name).toBe("Pixelise Editorial Team");
      expect(typeof posting.wordCount).toBe("number");
      expect(posting.wordCount as number).toBeGreaterThanOrEqual(1500);

      // Breadcrumbs are present and ordered.
      expect(nodesOfType(nodes, "BreadcrumbList").length).toBeGreaterThanOrEqual(1);
    }
  });

  test("table of contents anchors resolve to rendered headings", async ({ page }) => {
    await page.goto("/blog/ai-product-photography-ecommerce-guide");

    const toc = page.getByRole("navigation", { name: "Article contents" }).first();
    await expect(toc).toBeVisible();

    const hrefs = await toc.locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
    expect(hrefs.length).toBeGreaterThan(4);

    for (const href of hrefs) {
      expect(href.startsWith("#"), `bad TOC href ${href}`).toBe(true);
      const id = href.slice(1);
      await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    }
  });

  test("article tables are labelled with header cells", async ({ page }) => {
    await page.goto("/blog/shopify-product-photography-guide");

    const tables = page.locator("table");
    expect(await tables.count()).toBeGreaterThan(0);

    for (const table of await tables.all()) {
      expect(await table.locator("th").count()).toBeGreaterThan(0);
    }
  });

  test("articles link to related reading and a commercial page @smoke", async ({ page }) => {
    await page.goto("/blog/food-product-photography-guide");

    const related = page.getByRole("heading", { name: /related reading/i });
    await expect(related).toBeVisible();

    const articleLinks = page.locator('main a[href^="/blog/"]');
    expect(await articleLinks.count()).toBeGreaterThanOrEqual(3);

    const commercial = page.locator('main a[href="/pricing"]');
    expect(await commercial.count()).toBeGreaterThanOrEqual(1);
  });

  test("category pages are indexable and list their articles", async ({ page }) => {
    for (const category of categorySlugs) {
      const response = await page.goto(`/blog/categories/${category}`);
      expect(response?.status(), `status for ${category}`).toBe(200);

      const seo = await readSeo(page);
      expect(seo.canonical).toBe(`https://pixelise.in/blog/categories/${category}`);
      expect(seo.h1s).toHaveLength(1);
      expect(seo.robots ?? "").not.toContain("noindex");

      await expect(page.locator("main article").first()).toBeVisible();
    }
  });

  test("unknown article slug returns 404", async ({ page }) => {
    const response = await page.goto("/blog/not-a-real-article");
    expect(response?.status()).toBe(404);
  });
});
