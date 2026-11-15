#!/usr/bin/env node
/**
 * SEO verification suite — `npm run seo:check`.
 *
 * Runs against a real production build (`next start`), fetches every indexable URL
 * over HTTP and asserts what a crawler would actually receive. It is deliberately
 * dependency-free so it can run in CI before Playwright browsers are installed.
 *
 * What it verifies
 *   1. robots.txt allows rendering assets and blocks private space
 *   2. sitemap.xml lists every indexable URL exactly once, with real dates
 *   3. every indexable page has a unique title, description, canonical, OG and Twitter
 *   4. every page has exactly one H1 and no skipped heading levels
 *   5. private routes are noindex
 *   6. JSON-LD is valid and free of invented ratings/reviews/search actions
 *   7. articles carry BlogPosting data with real dates, an org byline and >=1500 words
 *   8. blog images exist on disk, have alt text and intrinsic dimensions
 *   9. every article links to related articles and a commercial page
 *
 * Exit code 0 = all checks passed. Anything else = at least one failure.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const ORIGIN = "https://pixelise.in";
const PORT = Number(process.env.SEO_CHECK_PORT ?? 3199);
const HOST = "127.0.0.1";
const BASE = process.env.SEO_CHECK_BASE_URL ?? `http://${HOST}:${PORT}`;

const articleSlugs = [
  "ai-product-photography-ecommerce-guide",
  "shopify-product-photography-guide",
  "amazon-product-image-guide",
  "diy-product-photography-small-business",
  "product-lifestyle-photography-guide",
  "studio-vs-lifestyle-product-photography",
  "skincare-product-photography-guide",
  "jewellery-product-photography-guide",
  "fashion-product-photography-guide",
  "food-product-photography-guide",
  "product-photography-background-guide",
  "ecommerce-ad-creatives-product-photography",
];

const marketingRoutes = [
  "/",
  "/features",
  "/examples",
  "/how-it-works",
  "/pricing",
  "/blog",
  "/faq",
  "/contact",
  "/get-started",
  "/privacy",
  "/terms",
  "/refund-policy",
];

const categorySlugs = [
  "ai-product-photography",
  "ecommerce-photography",
  "product-photography-guides",
  "advertising-marketing",
];

const privatePrefixes = [
  "/api/",
  "/auth/",
  "/admin",
  "/dashboard",
  "/studio",
  "/creations",
  "/credits",
  "/transactions",
  "/settings",
  "/help",
  "/account",
  "/billing",
  "/login",
  "/signup",
  "/forgot-password",
  "/checkout",
  "/payment",
];

const results = [];
let currentSection = "general";

function section(name) {
  currentSection = name;
}

function check(condition, message, detail) {
  results.push({
    ok: Boolean(condition),
    section: currentSection,
    message,
    detail: condition ? undefined : detail,
  });
  return Boolean(condition);
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function attr(html, pattern) {
  const match = pattern.exec(html);
  return match ? decodeEntities(match[1]) : null;
}

function metaContent(html, key, value) {
  const patterns = [
    new RegExp(`<meta[^>]+${key}="${value}"[^>]*content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]*${key}="${value}"`, "i"),
  ];
  for (const pattern of patterns) {
    const found = attr(html, pattern);
    if (found) return found;
  }
  return null;
}

function headings(html) {
  return Array.from(html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)). map((match) => ({
    level: Number(match[1]),
    text: stripTags(match[2]),
  }));
}

function jsonLdNodes(html) {
  const nodes = [];
  const scripts = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1]);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node["@graph"])) queue.push(...node["@graph"]);
        if (typeof node["@type"] === "string") nodes.push(node);
      }
    } catch {
      nodes.push({ __invalid: true });
    }
  }
  return nodes;
}

async function fetchText(urlPath) {
  const response = await fetch(`${BASE}${urlPath}`, { redirect: "manual" });
  const body = await response.text();
  return { status: response.status, body, headers: response.headers };
}

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/robots.txt`);
      if (response.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function portIsBusy() {
  try {
    const response = await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  if (process.env.SEO_CHECK_BASE_URL) return null;

  if (!existsSync(".next/BUILD_ID")) {
    throw new Error("No production build found. Run `npm run build` before `npm run seo:check`.");
  }

  // A stale server on this port would silently serve an old build, which is worse
  // than failing: the report would describe code that is no longer on disk.
  if (await portIsBusy()) {
    throw new Error(
      `Something is already serving ${BASE}. Stop it (or set SEO_CHECK_PORT / SEO_CHECK_BASE_URL) ` +
        "so the check cannot pass against a stale build.",
    );
  }

  // Spawn the Next binary directly (no `npx` wrapper) and detach it, so the whole
  // process group can be terminated on exit.
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT), "-H", HOST], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
    detached: true,
  });

  child.stdout.on("data", () => {});
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    if (!/experimental|warn/i.test(text)) process.stderr.write(text);
  });

  const ready = await waitForServer();
  if (!ready) {
    stopServer(child);
    throw new Error(`Server did not become ready on ${BASE}`);
  }
  return child;
}

function stopServer(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

async function checkRobots() {
  section("robots.txt");
  const { status, body } = await fetchText("/robots.txt");
  check(status === 200, "robots.txt responds 200", `status ${status}`);

  check(
    !/Disallow:\s*\/_next/i.test(body),
    "robots.txt allows /_next/ (rendering assets must be crawlable)",
    body,
  );
  check(!/Disallow:\s*\/\s*$/m.test(body), "robots.txt does not block the whole site", body);

  for (const prefix of privatePrefixes) {
    check(
      new RegExp(`Disallow:\\s*${prefix.replace(/[/]/g, "\\/")}`).test(body),
      `robots.txt disallows ${prefix}`,
      body,
    );
  }

  check(body.includes("Sitemap: https://pixelise.in/sitemap.xml"), "robots.txt references the sitemap", body);
  check(body.includes("Allow: /"), "robots.txt allows the public site", body);
}

async function checkSitemap() {
  section("sitemap.xml");
  const { status, body } = await fetchText("/sitemap.xml");
  check(status === 200, "sitemap.xml responds 200", `status ${status}`);

  const urls = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]);
  const lastmods = Array.from(body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).map((match) => match[1]);

  const expected = [
    ...marketingRoutes.map((route) => (route === "/" ? ORIGIN : `${ORIGIN}${route}`)),
    ...categorySlugs.map((slug) => `${ORIGIN}/blog/categories/${slug}`),
    ...articleSlugs.map((slug) => `${ORIGIN}/blog/${slug}`),
  ];

  for (const url of expected) {
    check(urls.includes(url), `sitemap includes ${url}`, `missing; has ${urls.length} URLs`);
  }

  check(urls.length === new Set(urls).size, "sitemap has no duplicate URLs", `${urls.length} URLs`);

  for (const url of urls) {
    check(url.startsWith(ORIGIN), `sitemap URL is absolute and on-domain: ${url}`, url);
    const pathname = url.slice(ORIGIN.length) || "/";
    check(
      !privatePrefixes.some((prefix) =>
        prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
      `sitemap excludes private path ${pathname}`,
      pathname,
    );
    check(!/[?#]/.test(url), `sitemap URL has no query/fragment: ${url}`, url);
  }

  check(lastmods.length === urls.length, "every sitemap entry has a lastmod", `${lastmods.length}/${urls.length}`);
  for (const value of lastmods) {
    check(/^\d{4}-\d{2}-\d{2}/.test(value), `lastmod is an ISO date: ${value}`, value);
  }
  const distinctDates = new Set(lastmods.slice(0, 5)).size;
  check(distinctDates >= 1, "lastmod values are date-stamped, not timestamps", `${distinctDates}`);
}

async function checkPages() {
  section("metadata");
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  const pages = [
    ...marketingRoutes,
    ...categorySlugs.map((slug) => `/blog/categories/${slug}`),
    ...articleSlugs.map((slug) => `/blog/${slug}`),
  ];

  for (const route of pages) {
    const { status, body } = await fetchText(route);
    check(status === 200, `${route} responds 200`, `status ${status}`);
    if (status !== 200) continue;

    const title = attr(body, /<title>([\s\S]*?)<\/title>/i);
    const description = metaContent(body, "name", "description");
    const canonical = attr(body, /<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i);
    const ogTitle = metaContent(body, "property", "og:title");
    const ogImage = metaContent(body, "property", "og:image");
    const twitterCard = metaContent(body, "name", "twitter:card");
    const robots = metaContent(body, "name", "robots");

    check(Boolean(title), `${route} has a title`, title);
    check(Boolean(description), `${route} has a meta description`, description);
    check(Boolean(canonical), `${route} has a canonical`, canonical);
    check(Boolean(ogTitle), `${route} has og:title`, ogTitle);
    check(Boolean(ogImage) && ogImage.startsWith(ORIGIN), `${route} has an absolute og:image`, ogImage);
    check(twitterCard === "summary_large_image", `${route} has a large Twitter card`, twitterCard);
    check(!(robots ?? "").includes("noindex"), `${route} is indexable`, robots);

    const expectedCanonical = route === "/" ? ORIGIN : `${ORIGIN}${route}`;
    check(
      (canonical ?? "").replace(/\/$/, "") === expectedCanonical.replace(/\/$/, ""),
      `${route} canonical is self-referencing`,
      canonical,
    );

    if (title) {
      const previous = seenTitles.get(title);
      check(!previous || previous === route, `title on ${route} is unique`, `also used on ${previous}`);
      seenTitles.set(title, route);
    }
    if (description) {
      const previous = seenDescriptions.get(description);
      check(!previous || previous === route, `description on ${route} is unique`, `also used on ${previous}`);
      seenDescriptions.set(description, route);
      check(
        description.length >= 50 && description.length <= 200,
        `description on ${route} is a reasonable length (${description.length})`,
        description,
      );
    }

    const levels = headings(body);
    const h1s = levels.filter((heading) => heading.level === 1);
    check(h1s.length === 1, `${route} has exactly one H1`, `${h1s.length} found`);
    if (h1s.length === 1) {
      check(h1s[0].text.length > 5, `${route} H1 has descriptive text`, h1s[0].text);
    }
    for (let index = 1; index < levels.length; index += 1) {
      const jump = levels[index].level - levels[index - 1].level;
      check(jump <= 1, `${route} heading order does not skip a level`, `${levels[index - 1].level} -> ${levels[index].level}`);
    }
  }

  section("homepage title");
  const home = await fetchText("/");
  const homeTitle = attr(home.body, /<title>([\s\S]*?)<\/title>/i);
  check(
    homeTitle === "AI Product Photography to Boost Sales Online",
    "homepage title is the approved string",
    homeTitle,
  );
}

async function checkPrivateRoutes() {
  section("private routes");
  for (const route of ["/dashboard", "/studio", "/admin", "/admin/users"]) {
    const { body } = await fetchText(route);
    const robots = (metaContent(body, "name", "robots") ?? "").toLowerCase();
    check(robots.includes("noindex"), `${route} is noindex`, robots);
  }
}

async function checkStructuredData() {
  section("structured data");
  const home = await fetchText("/");
  const nodes = jsonLdNodes(home.body);
  const types = nodes.map((node) => node["@type"]);

  check(!nodes.some((node) => node.__invalid), "JSON-LD on / parses", "invalid JSON-LD");
  for (const type of ["Organization", "WebSite", "SoftwareApplication"]) {
    check(types.includes(type), `homepage declares ${type}`, types.join(", "));
  }

  const software = nodes.find((node) => node["@type"] === "SoftwareApplication");
  const offers = software?.offers ?? [];
  const prices = offers.map((offer) => offer.price);
  check(prices.includes(499) && prices.includes(999), "SoftwareApplication offers the two real packs", JSON.stringify(prices));
  check(
    offers.every((offer) => offer.priceCurrency === "INR"),
    "SoftwareApplication offers are priced in INR",
    JSON.stringify(offers.map((offer) => offer.priceCurrency)),
  );

  const serialised = JSON.stringify(nodes);
  for (const forbidden of ["aggregateRating", "ratingValue", "review", "SearchAction", "reviewCount"]) {
    check(!serialised.includes(forbidden), `structured data does not invent ${forbidden}`, "found in JSON-LD");
  }

  section("blog structured data");
  for (const slug of articleSlugs) {
    const { body } = await fetchText(`/blog/${slug}`);
    const articleNodes = jsonLdNodes(body);
    const posting = articleNodes.find((node) => node["@type"] === "BlogPosting");

    check(Boolean(posting), `/blog/${slug} declares BlogPosting`, JSON.stringify(articleNodes.map((node) => node["@type"])));
    if (!posting) continue;

    check(/^\d{4}-\d{2}-\d{2}/.test(posting.datePublished ?? ""), `${slug} has a real publication date`, posting.datePublished);
    check(/^\d{4}-\d{2}-\d{2}/.test(posting.dateModified ?? ""), `${slug} has a real modification date`, posting.dateModified);
    check(
      posting.author?.["@type"] === "Organization" && posting.author?.name === "Pixelise Editorial Team",
      `${slug} uses the organisational byline`,
      JSON.stringify(posting.author),
    );
    check(posting.headline === posting.headline && posting.headline?.length > 15, `${slug} has a headline`, posting.headline);
    check(
      typeof posting.image === "object" && String(posting.image?.url ?? "").startsWith(ORIGIN),
      `${slug} declares an absolute image`,
      JSON.stringify(posting.image),
    );
    check(articleNodes.some((node) => node["@type"] === "BreadcrumbList"), `${slug} has breadcrumb data`, "missing");
  }
}

async function checkArticleContent() {
  section("article content");

  for (const slug of articleSlugs) {
    const { body } = await fetchText(`/blog/${slug}`);

    const articleMatch = /<article[\s\S]*?<\/article>/i.exec(body);
    check(Boolean(articleMatch), `${slug} renders an <article>`, "missing <article>");

    if (articleMatch) {
      const text = stripTags(articleMatch[0]);
      const words = text.split(/\s+/).filter(Boolean).length;
      check(words >= 1500, `${slug} has at least 1500 rendered words`, `${words} words`);

      const internalLinks = Array.from(articleMatch[0].matchAll(/href="(\/blog\/[^"#?]+)"/g)).map((match) => match[1]);
      const siblings = new Set(internalLinks.filter((href) => href !== `/blog/${slug}` && !href.startsWith("/blog/categories/")));
      check(siblings.size >= 2, `${slug} links to at least two sibling articles`, `${siblings.size} links`);

      const commercial = /href="\/(pricing|features|how-it-works|get-started)"/.test(articleMatch[0]);
      check(commercial, `${slug} links to a commercial page`, "none found");

      const h2Count = (articleMatch[0].match(/<h2\b/gi) ?? []).length;
      check(h2Count >= 4, `${slug} has a structured section outline`, `${h2Count} H2s`);

      const tables = (articleMatch[0].match(/<table\b/gi) ?? []).length;
      check(tables >= 1, `${slug} includes at least one table`, `${tables} tables`);

      const faqHeading = /<h2[^>]*>[^<]*frequently asked questions/i.test(articleMatch[0]);
      check(faqHeading, `${slug} has an FAQ section`, "no FAQ heading");

      const sourcesHeading = /<h2[^>]*>[^<]*sources/i.test(articleMatch[0]);
      check(sourcesHeading, `${slug} lists its sources`, "no sources heading");

      const tocLinks = (articleMatch[0].match(/nav[^>]+aria-label="Article contents"/gi) ?? []).length;
      check(tocLinks >= 1, `${slug} renders a table of contents`, "no TOC nav");
    }

    // Cover image exists on disk, is served, and carries alt text.
    const coverPath = `public/images/blog/${slug}.jpg`;
    check(existsSync(path.join(process.cwd(), coverPath)), `${slug} cover image exists`, coverPath);

    const coverResponse = await fetch(`${BASE}/images/blog/${slug}.jpg`);
    check(coverResponse.status === 200, `${slug} cover image is served`, `status ${coverResponse.status}`);

    const coverTag = new RegExp(`<img[^>]+src="[^"]*${slug}\\.jpg[^"]*"[^>]*>`, "i").exec(body);
    check(Boolean(coverTag), `${slug} cover is referenced in the HTML`, "missing img tag");
    if (coverTag) {
      check(/alt="[^"]{15,}"/.test(coverTag[0]), `${slug} cover has descriptive alt text`, coverTag[0]);
      check(/width="\d+"/.test(coverTag[0]) && /height="\d+"/.test(coverTag[0]), `${slug} cover declares dimensions`, coverTag[0]);
    }
  }
}

async function checkInternalLinking() {
  section("internal linking");
  const blogIndex = await fetchText("/blog");

  for (const slug of articleSlugs) {
    check(blogIndex.body.includes(`/blog/${slug}`), `journal index links to ${slug}`, "missing from index");
  }

  const footer = blogIndex.body;
  check(footer.includes('href="/blog"'), "footer or header exposes the journal", "no /blog link");

  for (const slug of categorySlugs) {
    check(
      blogIndex.body.includes(`/blog/categories/${slug}`),
      `journal index links to category ${slug}`,
      "missing",
    );
  }
}

async function checkNoFakeSignals() {
  section("honesty checks");

  for (const route of ["/", "/pricing", "/blog"]) {
    const { body } = await fetchText(route);
    const text = stripTags(body).toLowerCase();

    check(!/subscribers?|join our newsletter|as seen in/.test(text), `${route} has no fabricated audience claims`, "found audience claim");
    check(!/\b\d+k\+\s*(customers|users|brands)/.test(text), `${route} has no fabricated customer counts`, "found count");
    check(!/rated\s+\d(\.\d)?\s*\/\s*5/.test(text), `${route} has no fabricated ratings`, "found rating");
    check(!/100% (guaranteed|accurate)/.test(text), `${route} has no absolute guarantees`, "found guarantee");
  }

  const article = await fetchText("/blog/ai-product-photography-ecommerce-guide");
  check(
    /editorial artwork|generated in-house|illustration/i.test(article.body),
    "article covers are disclosed as generated illustrations",
    "no disclosure found",
  );
}

async function main() {
  const started = Date.now();
  let server = null;

  try {
    server = await startServer();

    await checkRobots();
    await checkSitemap();
    await checkPages();
    await checkPrivateRoutes();
    await checkStructuredData();
    await checkArticleContent();
    await checkInternalLinking();
    await checkNoFakeSignals();
  } catch (error) {
    results.push({
      ok: false,
      section: currentSection,
      message: "SEO check crashed",
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
  } finally {
    if (server) {
      stopServer(server);
      await new Promise((resolve) => setTimeout(resolve, 750));
      if (await portIsBusy()) {
        try {
          process.kill(-server.pid, "SIGKILL");
        } catch {
          server.kill("SIGKILL");
        }
      }
    }
  }

  const failures = results.filter((result) => !result.ok);
  const bySection = new Map();
  for (const result of results) {
    const entry = bySection.get(result.section) ?? { pass: 0, fail: 0 };
    if (result.ok) entry.pass += 1;
    else entry.fail += 1;
    bySection.set(result.section, entry);
  }

  console.log("\nSEO check — " + BASE);
  for (const [name, entry] of bySection) {
    const status = entry.fail === 0 ? "PASS" : "FAIL";
    console.log(`  ${status}  ${name.padEnd(24)} ${entry.pass} passed, ${entry.fail} failed`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed:\n`);
    for (const failure of failures) {
      console.error(`  [${failure.section}] ${failure.message}`);
      if (failure.detail) console.error(`      ${String(failure.detail).slice(0, 400)}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(`\nAll ${results.length} checks passed in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
  process.exit(0);
}

main();
