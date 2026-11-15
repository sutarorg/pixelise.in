# SEO research

Sources are official documentation only. Marketing blogs were used to locate the official
pages, never as the basis for a claim.

## Primary sources

| Topic | Source | What it means for Pixelise |
| --- | --- | --- |
| Crawling/rendering | <https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics> | Googlebot must be able to fetch CSS/JS; `robots.txt` must not block render-critical assets such as `/_next/` |
| robots.txt rules | <https://developers.google.com/search/docs/crawling-indexing/robots/intro> | `Disallow` prevents crawling, not indexing; use `noindex` for pages that should stay out of results |
| Helpful content | <https://developers.google.com/search/docs/fundamentals/creating-helpful-content> | Content must be original, substantial and people-first; self-assess who/how/why |
| Article structured data | <https://developers.google.com/search/docs/appearance/structured-data/article> | `BlogPosting` with `headline`, `image`, `datePublished`, `dateModified`, `author`, `publisher` |
| Breadcrumb structured data | <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb> | `BreadcrumbList` with `itemListElement` positions starting at 1 |
| Organization structured data | <https://developers.google.com/search/docs/appearance/structured-data/organization> | Use only properties that are genuinely known; omit address/logo if absent |
| General structured data policies | <https://developers.google.com/search/docs/appearance/structured-data/sd-policies> | Markup must describe visible content; no fake reviews/ratings |
| Sitemaps | <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap> | Only canonical, indexable URLs; accurate `lastmod`; omit `priority`/`changefreq` guesses |
| Titles and snippets | <https://developers.google.com/search/docs/appearance/title-link> | Unique, descriptive titles; Google may rewrite them |
| Meta descriptions | <https://developers.google.com/search/docs/appearance/snippet> | Descriptions are hints, not ranking inputs; unique per page |
| Canonicalization | <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls> | Self-referencing canonical on every indexable page |
| Image SEO | <https://developers.google.com/search/docs/appearance/google-images> | Descriptive filenames, alt text, stable dimensions, modern formats |
| Core Web Vitals | <https://web.dev/articles/vitals> | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at p75 |
| Next.js metadata | <https://nextjs.org/docs/app/api-reference/functions/generate-metadata> | `metadataBase`, `alternates.canonical`, `openGraph`, `twitter`, `robots` |
| Next.js sitemap | <https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap> | `MetadataRoute.Sitemap` supports `lastModified`, `changeFrequency`, `priority` |
| Next.js robots | <https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots> | `MetadataRoute.Robots` with `rules` and `sitemap` |
| schema.org | <https://schema.org/BlogPosting>, <https://schema.org/SoftwareApplication> | Property names used by the JSON-LD builders |

## Decisions

1. **One helper, one canonical.** `pageMetadata()` remains the only way pages declare
   metadata. It sets a self-referencing canonical from a path, plus OG and Twitter cards
   from `siteConfig`. Stage 5 adds optional `type`, `image`, `publishedTime` and
   `modifiedTime` for articles. Nothing else hand-writes `<head>` tags.
2. **Homepage title is fixed brand copy.** `AI Product Photography to Boost Sales Online`
   is used with `absoluteTitle: true` so the root template does not append `| Pixelise`.
   Sub-pages still get the template.
3. **`/_next/` must be crawlable.** Removing it is the highest-value change in the audit.
   `Disallow` now covers only `/api/`, `/dashboard`, `/studio`, `/admin`, `/account`,
   `/billing`, `/checkout`, `/auth/*` and `/payment/*`.
4. **Noindex beats Disallow for private pages.** The `(app)` layout sets
   `robots: { index: false, follow: false }`, so if a URL is ever linked it cannot be
   indexed even when crawled.
5. **Sitemap dates are real.** Marketing pages take dates from a single `PAGE_UPDATES`
   map in `src/config/seo.ts`, which is edited when the page changes. Articles use their
   own `publishedAt`/`updatedAt`. No `new Date()` — that would lie on every request and
   train crawlers to ignore `lastmod`.
6. **JSON-LD only claims what is true.** `Organization` has name, URL, description; the
   optional `logo`/`sameAs` appear only when configured. `SoftwareApplication` carries
   the real ₹499/₹999 one-time offers from `pricingPacks`. **No** `aggregateRating`, no
   `review`, no `SearchAction` (there is no site search).
7. **`FAQPage` markup is retained but not sold as a rich result.** Google restricted FAQ
   rich results to authoritative government/health sites in 2023. Keeping valid markup is
   harmless; promising stars or FAQ accordions in search would be false.
8. **Blog URLs are flat.** `/blog/<slug>`, lowercase, hyphenated, no dates or IDs, no
   trailing slash, canonical self-referencing. Slugs are stable; changing one requires a
   redirect and is treated as a breaking change.
9. **Internal links are planned, not accidental.** The map lives in
   `docs/seo/internal-linking-map.md`; every article links to at least two sibling
   articles and one commercial page (pricing, how-it-works or features).
10. **Image SEO.** Article covers are 1600×900 AVIF/WebP-friendly JPEGs in
    `public/images/blog/`, named for the slug, with descriptive alt text and width/height
    set to avoid CLS. Covers are labelled as editorial illustrations in the article
    footnote so they are not mistaken for customer work.
11. **Core Web Vitals.** All new pages are statically generated; no client-side data
    fetching on the blog; `next/image` with explicit dimensions; the article body is
    server-rendered text (no hydration cost beyond the TOC scroll spy, which is a
    `IntersectionObserver` in a small client component).

## Honest limitations

- **No keyword volume, difficulty or CPC data.** No paid SEO tool is available in this
  environment. `docs/blog-keyword-map.md` therefore records *intent, topic clusters and
  target phrasing*, not numeric volumes. Numbers were not invented.
- **No Search Console access.** Verification is limited to what the site can control:
  titles, descriptions, canonicals, sitemap, robots, structured data, headings, internal
  links, rendering. Rankings, impressions and click-through are unknown.
- **Rich results cannot be guaranteed.** Structured data makes a page eligible; Google
  decides. No page promises stars, FAQ dropdowns or knowledge panels.
- **Field Core Web Vitals require traffic.** Only build-level and synthetic checks are
  possible here.
- **`robots.txt` cannot enforce anything against bad actors.** It is a crawling
  convention; API protection is auth + RLS + rate limits.
