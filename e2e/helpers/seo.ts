import type { Page } from "@playwright/test";

export type SeoSnapshot = {
  title: string;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  robots: string | null;
  h1s: string[];
  jsonLd: unknown[];
};

/**
 * Reads what a crawler would see in the rendered document.
 *
 * All values come from `page.content()`/DOM queries after navigation, so this is the
 * post-hydration truth rather than the intended metadata object.
 */
export async function readSeo(page: Page): Promise<SeoSnapshot> {
  // Playwright transpiles this file before serialising the callback, so type
  // annotations below are stripped before the function reaches the browser.
  const snapshot = await page.evaluate(() => {
    const attr = (selector: string, name?: string) => {
      const element = document.querySelector(selector);
      return element ? element.getAttribute(name || "content") : null;
    };

    const jsonLd: unknown[] = [];
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      const raw = script.textContent || "";
      try {
        jsonLd.push(JSON.parse(raw));
      } catch {
        jsonLd.push({ __invalid: raw.slice(0, 120) });
      }
    }

    return {
      title: document.title,
      description: attr('meta[name="description"]'),
      canonical: attr('link[rel="canonical"]', "href"),
      ogTitle: attr('meta[property="og:title"]'),
      ogDescription: attr('meta[property="og:description"]'),
      ogImage: attr('meta[property="og:image"]'),
      ogType: attr('meta[property="og:type"]'),
      twitterCard: attr('meta[name="twitter:card"]'),
      robots: attr('meta[name="robots"]'),
      h1s: Array.from(document.querySelectorAll("h1")).map((node) => (node.textContent || "").trim()),
      jsonLd,
    };
  });

  return snapshot as SeoSnapshot;
}

/** Flattens nested JSON-LD graphs (`@graph`, arrays) into a single list of nodes. */
export function flattenJsonLd(nodes: unknown[]): Array<Record<string, unknown>> {
  const output: Array<Record<string, unknown>> = [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    if (Array.isArray(record["@graph"])) {
      record["@graph"].forEach(visit);
    }
    if (typeof record["@type"] === "string") output.push(record);
  };

  nodes.forEach(visit);
  return output;
}

export function nodesOfType(nodes: Array<Record<string, unknown>>, type: string) {
  return nodes.filter((node) => node["@type"] === type);
}

/**
 * HTML-only variant of {@link readSeo}, for tests that can run without a browser
 * (`request` fixture). Everything asserted here is server-rendered, so the parsed
 * values match what a crawler receives.
 */
export function parseHtmlSeo(html: string): SeoSnapshot {
  const meta = (key: string, value: string): string | null => {
    const pattern = new RegExp(`<meta[^>]+${key}="${value}"[^>]*content="([^"]*)"`, "i");
    const reversed = new RegExp(`<meta[^>]+content="([^"]*)"[^>]*${key}="${value}"`, "i");
    const match = pattern.exec(html) ?? reversed.exec(html);
    return match ? decodeHtml(match[1]) : null;
  };

  const jsonLd: unknown[] = [];
  for (const script of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(script[1]));
    } catch {
      jsonLd.push({ __invalid: true });
    }
  }

  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
  const canonicalMatch = /<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i.exec(html);

  return {
    title: titleMatch ? decodeHtml(titleMatch[1]) : "",
    description: meta("name", "description"),
    canonical: canonicalMatch ? decodeHtml(canonicalMatch[1]) : null,
    ogTitle: meta("property", "og:title"),
    ogDescription: meta("property", "og:description"),
    ogImage: meta("property", "og:image"),
    ogType: meta("property", "og:type"),
    twitterCard: meta("name", "twitter:card"),
    robots: meta("name", "robots"),
    h1s: Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map((match) =>
      decodeHtml(match[1].replace(/<[^>]+>/g, "")).trim(),
    ),
    jsonLd,
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
