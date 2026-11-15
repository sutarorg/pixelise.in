import { siteConfig } from "@/config/site";

/**
 * Content dates for marketing pages.
 *
 * These are hand-maintained on purpose. A sitemap `lastModified` must describe the
 * last *substantive* change to the page; generating it from `new Date()` makes every
 * request claim the page changed, which trains crawlers to ignore the field.
 *
 * Rule: bump the date in the same commit that changes the page's visible content.
 * Metadata-only edits (title rewrites) do not count.
 */
export const pageUpdates = {
  "/": "2026-11-15",
  "/features": "2026-11-15",
  "/examples": "2026-11-15",
  "/how-it-works": "2026-11-15",
  "/pricing": "2026-11-15",
  "/faq": "2026-11-15",
  "/contact": "2026-11-15",
  "/get-started": "2026-11-15",
  "/privacy": "2026-11-15",
  "/terms": "2026-11-15",
  "/refund-policy": "2026-11-15",
  "/blog": "2026-11-15",
} as const;

export type MarketingPath = keyof typeof pageUpdates;

/** Parses a `YYYY-MM-DD` date as UTC midnight so builds are timezone-independent. */
export function isoDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Absolute URL for a route path. `/` must not produce a double slash. */
export function absoluteUrl(path: string): string {
  if (path === "/") return siteConfig.url;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Prefixes that must never appear in search results. Kept in one place so robots.txt,
 * the sitemap guard and the SEO verification script cannot drift apart.
 */
export const privatePathPrefixes = [
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
  "/checkout",
  "/payment",
] as const;

export function isPrivatePath(path: string): boolean {
  return privatePathPrefixes.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`),
  );
}
