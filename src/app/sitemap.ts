import type { MetadataRoute } from "next";

import { blogCategories } from "@/config/blog";
import { absoluteUrl, isoDate, pageUpdates } from "@/config/seo";
import { getAllPosts, getCategoryHref, getPostHref } from "@/lib/blog";

/**
 * Only public, canonical, indexable URLs belong in the sitemap.
 *
 * Customer, admin, auth, checkout and API routes are excluded here and are also
 * `noindex` in metadata (see the `(app)` and admin layouts) and disallowed in robots.ts.
 *
 * `lastModified` values are real: they come from `pageUpdates` (bumped by hand when a
 * page's content changes) and from each article's own publication/modification dates.
 * Nothing is generated from `new Date()`, so the field never lies.
 */
const marketingRoutes: {
  path: keyof typeof pageUpdates;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" },
  { path: "/examples", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.95, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/get-started", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = marketingRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: isoDate(pageUpdates[route.path]),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categories: MetadataRoute.Sitemap = blogCategories.map((category) => ({
    url: absoluteUrl(getCategoryHref(category.slug)),
    lastModified: isoDate(pageUpdates["/blog"]),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const articles: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(getPostHref(post.slug)),
    lastModified: isoDate(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...categories, ...articles];
}
