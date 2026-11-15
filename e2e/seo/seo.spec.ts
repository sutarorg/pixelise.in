import { expect, test } from "../fixtures/test";
import { articleSlugs, categorySlugs, publicRoutes } from "../helpers/routes";
import { flattenJsonLd, nodesOfType } from "../helpers/seo";

/**
 * Technical SEO checks.
 *
 * These run through the `request` fixture and parse server-rendered HTML, so they
 * execute without a browser binary — which also makes them the fastest signal in CI.
 * Everything asserted here is what a crawler receives over plain HTTP.
 */
const htmlSeo = async (request: import("@playwright/test").APIRequestContext, path: string) => {
  const response = await request.get(path, { failOnStatusCode: false });
  const html = await response.text();
  const { parseHtmlSeo } = await import("../helpers/seo");
  return { status: response.status(), html, seo: parseHtmlSeo(html) };
};

test.describe("technical SEO", () => {
  test("robots.txt allows rendering assets and blocks private space @smoke", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();

    // The regression this suite exists to prevent.
    expect(body).not.toMatch(/Disallow:\s*\/_next/);
    expect(body).not.toMatch(/Disallow:\s*\/\*\.(?:js|css)/);

    for (const path of ["/api/", "/admin", "/studio", "/dashboard", "/checkout"]) {
      expect(body, `robots should disallow ${path}`).toContain(`Disallow: ${path}`);
    }

    expect(body).toContain("Sitemap: https://pixelise.in/sitemap.xml");
    expect(body).toContain("Allow: /");
  });

  test("sitemap contains every indexable URL with real dates @smoke", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
    const lastmods = Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).map((match) => match[1]);

    expect(urls.length).toBeGreaterThanOrEqual(11 + 4 + articleSlugs.length);
    expect(new Set(urls).size, "duplicate URLs in sitemap").toBe(urls.length);

    for (const route of ["/", "/features", "/pricing", "/faq", "/contact", "/blog"]) {
      const expected = route === "/" ? "https://pixelise.in" : `https://pixelise.in${route}`;
      expect(urls, `sitemap should include ${route}`).toContain(expected);
    }

    for (const slug of articleSlugs) {
      expect(urls).toContain(`https://pixelise.in/blog/${slug}`);
    }
    for (const category of categorySlugs) {
      expect(urls).toContain(`https://pixelise.in/blog/categories/${category}`);
    }

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/pixelise\.in/);
      expect(url).not.toMatch(
        /\/(api|admin|dashboard|studio|creations|credits|transactions|settings|account|billing|checkout|auth|login|signup)(\/|$)/,
      );
      expect(url).not.toMatch(/[?#]/);
      expect(url).not.toMatch(/\/$/);
    }

    expect(lastmods.length).toBe(urls.length);
    for (const value of lastmods) {
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(new Date(value).getTime()).toBeGreaterThanOrEqual(new Date("2026-01-01").getTime());
      expect(new Date(value).getTime()).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
    }
  });

  test("marketing pages carry Organization, WebSite and SoftwareApplication schema @smoke", async ({ request }) => {
    const { seo } = await htmlSeo(request, "/");
    const nodes = flattenJsonLd(seo.jsonLd);

    expect(nodesOfType(nodes, "Organization")).toHaveLength(1);
    expect(nodesOfType(nodes, "WebSite")).toHaveLength(1);

    const apps = nodesOfType(nodes, "SoftwareApplication");
    expect(apps).toHaveLength(1);

    const offers = apps[0].offers as Array<Record<string, unknown>>;
    const prices = offers.map((offer) => offer.price);
    expect(prices).toContain(499);
    expect(prices).toContain(999);
    for (const offer of offers) {
      expect(offer.priceCurrency).toBe("INR");
    }
  });

  test("structured data contains no invented ratings, reviews or search action", async ({ request }) => {
    for (const path of ["/", "/pricing", "/faq", "/blog"]) {
      const { seo } = await htmlSeo(request, path);
      const serialised = JSON.stringify(seo.jsonLd);

      expect(serialised, `aggregateRating on ${path}`).not.toContain("aggregateRating");
      expect(serialised, `review on ${path}`).not.toContain('"review"');
      expect(serialised, `ratingValue on ${path}`).not.toContain("ratingValue");
      expect(serialised, `SearchAction on ${path}`).not.toContain("SearchAction");
    }
  });

  test("every public page has a self-referencing canonical and one H1", async ({ request }) => {
    for (const route of publicRoutes) {
      const { status, seo } = await htmlSeo(request, route.path);
      expect(status, `status for ${route.path}`).toBe(200);

      const expected = route.path === "/" ? "https://pixelise.in/" : `https://pixelise.in${route.path}`;
      expect((seo.canonical ?? "").replace(/\/$/, ""), `canonical on ${route.path}`).toBe(
        expected.replace(/\/$/, ""),
      );
      expect(seo.h1s, `H1 count on ${route.path}`).toHaveLength(1);
      expect(seo.ogImage).toMatch(/^https:\/\/pixelise\.in/);
      expect(seo.twitterCard).toBe("summary_large_image");
    }
  });

  test("headings are ordered without skipped levels", async ({ request }) => {
    for (const path of ["/", "/pricing", "/blog", "/blog/shopify-product-photography-guide"]) {
      const { html } = await htmlSeo(request, path);
      const levels = Array.from(html.matchAll(/<h([1-6])[\s>]/g)).map((match) => Number(match[1]));

      expect(levels[0], `first heading on ${path}`).toBe(1);
      expect(levels.filter((level) => level === 1).length, `H1 count on ${path}`).toBe(1);

      for (let index = 1; index < levels.length; index += 1) {
        const jump = levels[index] - levels[index - 1];
        expect(jump, `heading jump ${levels[index - 1]} → ${levels[index]} on ${path}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("blog images declare dimensions and descriptive alt text", async ({ request }) => {
    const { html } = await htmlSeo(request, "/blog");
    const tags = Array.from(html.matchAll(/<img\b[^>]*>/g)).map((match) => match[0]);
    // next/image rewrites src to /_next/image?url=%2Fimages%2Fblog%2F… — match the
    // encoded path so the assertion is about the actual optimised markup.
    const covers = tags.filter((tag) => tag.includes("%2Fimages%2Fblog%2F") || tag.includes("/images/blog/"));

    expect(covers.length).toBeGreaterThanOrEqual(12);
    for (const tag of covers) {
      const alt = /alt="([^"]*)"/.exec(tag)?.[1] ?? "";
      expect(alt.length, `alt text too short: ${tag.slice(0, 80)}`).toBeGreaterThan(15);
      expect(/width="\d+"/.test(tag)).toBe(true);
      expect(/height="\d+"/.test(tag)).toBe(true);
    }
  });

  test("articles declare BlogPosting with real dates and an organisation byline", async ({ request }) => {
    for (const slug of articleSlugs.slice(0, 4)) {
      const { seo } = await htmlSeo(request, `/blog/${slug}`);
      const nodes = flattenJsonLd(seo.jsonLd);
      const postings = nodesOfType(nodes, "BlogPosting");

      expect(postings, `BlogPosting on ${slug}`).toHaveLength(1);
      expect(postings[0].datePublished).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect((postings[0].author as { name: string }).name).toBe("Pixelise Editorial Team");
      expect(seo.ogType).toBe("article");
    }
  });
});
