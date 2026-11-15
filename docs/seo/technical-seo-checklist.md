# Technical SEO checklist

The state of `https://pixelise.in` after Stage 5, and the rule that keeps it there.
Every item marked ✅ is asserted by `npm run seo:check` (1,343 HTTP-level checks) and/or
the Playwright SEO spec, so it cannot regress silently.

## Crawling and indexing

| Item | Status | Verified by |
| --- | --- | --- |
| `robots.txt` does **not** disallow `/_next/` | ✅ | `seo:check` → robots.txt |
| `robots.txt` disallows `/api/`, auth, app and console routes | ✅ | `seo:check`, `e2e/seo` |
| `robots.txt` references the sitemap and sets `host` | ✅ | `seo:check` |
| Private segments ship `noindex, nofollow` | ✅ | `seo:check` → private routes |
| No `X-Robots-Tag` or meta `noindex` on public pages | ✅ | `seo:check` → metadata |
| Canonical is self-referencing on every indexable page | ✅ | `seo:check`, `e2e/seo` |
| Trailing-slash policy: no trailing slashes in canonicals or sitemap | ✅ | `seo:check` → sitemap |
| Production host is singular (`https://pixelise.in`, no `www` redirect chain) | ⚠️ owner | Hosting/DNS configuration — see `docs/deployment/` |

## Sitemap

| Item | Status | Notes |
| --- | --- | --- |
| 12 marketing routes + `/blog` + 4 category pages + 12 articles | ✅ | 28 URLs |
| No private, API or auth URLs | ✅ | asserted per URL |
| `lastModified` from real content dates (`src/config/seo.ts`, article front-matter) | ✅ | never `new Date()` |
| Stable, deterministic ordering | ✅ | static array order |
| Valid XML, absolute URLs, no query strings | ✅ | `seo:check` |
| Submitted to Search Console | ⚠️ owner | Requires domain verification |

## Metadata

| Item | Status | Notes |
| --- | --- | --- |
| One `pageMetadata()` helper for title/description/canonical/OG/Twitter | ✅ | nothing hand-writes `<head>` |
| Homepage title exactly `AI Product Photography to Boost Sales Online` | ✅ | `absoluteTitle: true` |
| Unique title per indexable page | ✅ | `seo:check` compares every page |
| Unique meta description per page, 50–200 characters | ✅ | `seo:check` length + uniqueness |
| OG `type: article` on articles, `website` elsewhere | ✅ | `pageMetadata({ type })` |
| OG image absolute, 1200×630 site card or 1600×900 article cover | ✅ | per-page assertion |
| Twitter card `summary_large_image` | ✅ | per-page assertion |
| `metadataBase` set once at the root layout | ✅ | canonical resolution |

## Structured data

| Type | Where | Constraints |
| --- | --- | --- |
| `Organization` | marketing layout | name, URL, description, logo, areaServed only |
| `WebSite` | marketing layout | no `SearchAction` (no site search exists) |
| `SoftwareApplication` | homepage | real ₹499 / ₹999 one-time offers from `pricingPacks` |
| `BreadcrumbList` | inner pages, articles, categories | positions start at 1 |
| `Blog` | `/blog` | lists current articles |
| `BlogPosting` | articles | `datePublished`, `dateModified`, organisational `author`, `wordCount`, image |
| `FAQPage` | `/`, `/faq` | retained, **not** promised as a rich result (see below) |

Forbidden and asserted absent: `aggregateRating`, `review`, `ratingValue`, `reviewCount`,
`SearchAction`, invented `award`, invented `sameAs` profiles.

## Content structure

| Item | Status |
| --- | --- |
| Exactly one `<h1>` per page, matching the page's purpose | ✅ |
| No skipped heading levels anywhere in `<main>` | ✅ |
| Every article: ≥1,500 rendered words, ≥4 `H2` sections, a table, an FAQ, a sources section | ✅ |
| Every article: ≥2 sibling article links + ≥1 commercial link | ✅ |
| Table of contents anchors resolve to rendered heading IDs | ✅ (Playwright) |
| Article tables use `<th scope="col">` and scroll on mobile | ✅ |
| Covers have descriptive alt text and intrinsic `width`/`height` | ✅ |
| Generated cover art disclosed as editorial illustration | ✅ |

## Performance / Core Web Vitals

| Item | Status | Notes |
| --- | --- | --- |
| Static generation for all marketing and blog routes | ✅ | build output shows `○` |
| `next/image` everywhere, AVIF/WebP enabled, explicit dimensions | ✅ | avoids CLS |
| Article bodies rendered on the server; no client data fetching | ✅ | zero API calls on blog |
| Covers compressed to 1600×900 JPEG (~40–160 KB each) | ✅ | measured in the build |
| Fonts self-hosted, `font-display: swap`, ₹ unicode-range subset | ✅ | no third-party font request |
| No blocking third-party scripts on marketing pages | ✅ | none installed |
| Field LCP/INP/CLS (p75) | ⚠️ needs traffic | CrUX requires real visits; verify in PageSpeed Insights after launch |

## Honest limitations

- **FAQ rich results.** Google limited FAQ rich results to authoritative government and
  health sites in 2023. The markup is valid and harmless; the FAQ accordion will usually
  not appear in search.
- **AI-generated covers.** They are illustrations, disclosed on every article. They are
  not customer results, and no page claims otherwise.
- **No rankings or traffic data.** No Search Console access exists in this environment.
- **`www` vs apex** depends on hosting configuration, which is outside this repository.
