import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { privatePathPrefixes } from "@/config/seo";

/**
 * `robots.txt` controls crawling, not indexing.
 *
 * Never disallow build assets: since 2019 Googlebot renders pages with a browser and
 * needs the CSS/JS chunks under `/_next/` to see the design at all. Blocking them
 * downgrades rendering quality. Pages that must stay out of results are handled with
 * `robots: noindex` in metadata (see the `(app)` and admin layouts), while private URL
 * space is kept out of crawling as defence in depth.
 *
 * Reference: https://developers.google.com/search/docs/crawling-indexing/robots/intro
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privatePathPrefixes],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
