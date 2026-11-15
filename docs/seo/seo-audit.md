# SEO audit — Stage 5

Scope: the public site at `https://pixelise.in` (11 marketing routes before this stage),
plus the new journal. The audit was run against a production build served locally, using
HTTP responses only — no tool that requires Search Console access was available.

**Result:** 12 defects found and fixed, 5 owner actions identified, 1,343 automated checks
now passing. Numbers below are counts of assertions from `npm run seo:check`, not
estimates.

## What was wrong

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| 1 | Critical | `robots.txt` disallowed `/_next/`, blocking the CSS/JS Googlebot needs to render the App Router | Removed; private prefixes stay disallowed (`src/app/robots.ts`) |
| 2 | High | Sitemap stamped one hardcoded date on every URL | Per-route dates in `src/config/seo.ts` + article dates (`src/app/sitemap.ts`) |
| 3 | High | Homepage title was `Pixelise — AI Product Photography Studio` | Now exactly `AI Product Photography to Boost Sales Online`, absolute |
| 4 | High | No blog: no `/blog`, no articles, no nav entry, no sitemap entries | Journal with 12 articles, 4 category pages, nav + footer links |
| 5 | Medium | Dashboards were crawlable with no `noindex` | Layout-level `noindex, nofollow, nocache` (already existed for `(app)`/`admin`); asserted now |
| 6 | Medium | `pageMetadata()` could not express an article (`og:type`, dates, per-page image) | Extended helper; all pages still go through it |
| 7 | Medium | No automated SEO verification | `seo:check` (1,343 assertions) + `e2e/seo` spec |
| 8 | Medium | Heading outline had `h1 → h3` jumps on `/pricing`, `/examples` and category pages | Added section `h2`s; `seo:check` now enforces no skipped levels |
| 9 | Low | Sitemap carried `priority`/`changeFrequency` guesses | Kept (harmless hints) but documented as hints, not signals |
| 10 | Low | `FAQPage` markup could be mistaken for a rich-result play | Kept, documented: Google restricted FAQ rich results to gov/health sites |
| 11 | Low | Blog covers needed dimensions and alt text to avoid CLS and unlabelled images | 1600×900, descriptive alt, disclosed as generated illustration |
| 12 | Low | No internal linking plan | `docs/seo/internal-linking-map.md` + enforced sibling/commercial links |

## What was already correct (verified, not assumed)

- One `h1` per page, semantic landmarks (`header`/`main`/`footer`), skip link.
- Canonicals resolved correctly through `metadataBase`; OG and Twitter were already
  present on marketing pages.
- `Organization`, `WebSite`, `SoftwareApplication` and `BreadcrumbList` JSON-LD existed
  and contained no invented ratings or reviews.
- Self-hosted Manrope with a ₹ fallback subset: no third-party font request.
- `next/image` with AVIF/WebP and explicit dimensions on marketing imagery.
- Pricing facts (₹499/₹999, one-time) are centralised and reused by page, schema and API.

## Automated verification

| Suite | Assertions | Status |
| --- | --- | --- |
| `npm run seo:check` | 1,343 | passing against the production build |
| `e2e/seo/seo.spec.ts` | 8 tests | passing (browser-free, `request` fixture) |
| Playwright browser suites | 197 tests / 15 files | run in CI; browser binaries unavailable in the build sandbox |

`seo:check` covers: robots directives, sitemap completeness and dates, per-page metadata
and canonical correctness, heading outline, private-route noindex, JSON-LD validity and
prohibited properties, article length and structure, cover image existence/alt/dimensions,
internal link requirements, and a scan for fabricated audience or rating claims.

## Owner actions (cannot be done from this repository)

1. **Search Console**: verify the domain, submit `https://pixelise.in/sitemap.xml`, watch
   the Pages report for the first four weeks.
2. **Hosting**: decide apex vs `www`, add the permanent redirect, keep one canonical host.
3. **OG image**: `/opengraph-image` is generated; confirm it renders the brand lockup at
   1200×630 on real social platforms.
4. **Analytics**: if added, use a consent-aware tool; none is installed today.
5. **Content review**: read the 12 articles as the business owner. Any claim that does not
   match the product must be corrected before promotion.

## Honest limitations

- No ranking, impression or click data. No Search Console access in this environment.
- No keyword volume or difficulty data; see `docs/research/blog-keyword-research.md`.
- Rich results are never guaranteed; markup only makes a page eligible.
- Field Core Web Vitals require real traffic; only build-level checks were possible.
- Amazon's image requirements live behind Seller Central; articles point readers there
  rather than quoting numbers that may have changed.
