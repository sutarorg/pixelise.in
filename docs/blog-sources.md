# Blog sources

Every factual claim in the journal that is not general craft knowledge is traceable to a
primary source below. Where a source is gated or could not be verified from this
environment, the article says so instead of restating it as fact.

Verified during this build (fetched 2026-11-15):

| Source | URL | Used for |
| --- | --- | --- |
| Shopify Help Center — Product media types | <https://help.shopify.com/en/manual/products/product-media/product-media-types> | Max 5000 × 5000 px / 25 MP, <20 MB, 2048 × 2048 px recommended for square, PNG then JPEG, accepted formats, automatic resizing |
| Shopify Help Center — File requirements | <https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads> | Upload file requirements referenced from the product media page |
| Google Search Central — Article structured data | <https://developers.google.com/search/docs/appearance/structured-data/article> | `BlogPosting` properties: headline, image, datePublished, dateModified, author, publisher |
| Google Search Central — Creating helpful content | <https://developers.google.com/search/docs/fundamentals/creating-helpful-content> | People-first content rules; the basis for the "no fabricated stats/case studies" policy |
| Google Search Central — Image SEO | <https://developers.google.com/search/docs/appearance/google-images> | Descriptive alt text, filenames, stable dimensions |
| Google Search Central — Search Essentials / robots | <https://developers.google.com/search/docs/crawling-indexing/robots/intro> | Why `Disallow` must not block render-critical assets |
| Playwright — Test configuration | <https://playwright.dev/docs/test-configuration> | `projects`, `webServer`, retries, reporters used in `playwright.config.ts` |
| schema.org — BlogPosting | <https://schema.org/BlogPosting> | Property names in `blogPostingSchema()` |
| web.dev — Core Web Vitals | <https://web.dev/articles/vitals> | LCP/INP/CLS thresholds referenced in the checklist |

Gated or unverifiable from this environment (articles instruct the reader to check the
platform directly, and do **not** quote numbers):

| Source | Status | Handling |
| --- | --- | --- |
| Amazon Seller Central — Product image requirements (<https://sellercentral.amazon.com/help/hub/reference/external/G1881>) | Sign-in required | Articles state the *categories* of requirement (pure white background, framing, no added text, resolution for zoom) and tell the seller to verify the current rule for their category in Seller Central |
| Marketplace category style guides | Sign-in required, change frequently | Never quoted as fixed numbers |
| Keyword volume / difficulty / CPC data | No tool available | Not published anywhere; see `docs/research/blog-keyword-research.md` |

## Per-article source list

| Article | Primary sources cited in the article |
| --- | --- |
| AI product photography for ecommerce | Shopify media specs, Google image SEO, Google helpful content, Amazon image requirements (gated) |
| Shopify product photography | Shopify product media types, Shopify file requirements, Google image SEO, Google product structured data |
| Amazon product images | Amazon Seller Central image requirements (gated), Google image SEO, Shopify media types (contrast) |
| DIY product photography | Shopify media specs, Google image SEO, web.dev Core Web Vitals, Amazon image requirements (gated) |
| Product lifestyle photography | Shopify media types, Google image SEO, Google helpful content, web.dev vitals |
| Studio vs lifestyle | Shopify media types, Google image SEO, Amazon requirements (gated), web.dev vitals |
| Skincare | Shopify media types, Google image SEO, Google helpful content, Amazon requirements (gated) |
| Jewellery | Shopify media types, Google image SEO, Amazon requirements (gated), web.dev vitals |
| Fashion | Shopify media types, Google image SEO, Amazon requirements (gated), web.dev vitals |
| Food | Shopify media types, Google image SEO, Amazon requirements (gated), web.dev vitals |
| Backgrounds | Shopify media types, Google image SEO, Amazon requirements (gated), web.dev vitals |
| Ad creatives | Google image SEO, Google helpful content, Shopify media types, web.dev vitals |

## Claims deliberately not made

- No conversion lift, revenue increase, cost saving or time saving percentages.
- No customer counts, testimonial quotes, brand logos or case studies.
- No "ranked #1", "guaranteed rich results" or "approved by" statements.
- No invented expert bylines, credentials or photographs of authors.
- No prices other than the frozen Creator ₹499 / Studio ₹999 one-time packs.

If a future article needs a statistic that is not on this page, add the primary source
first. `scripts/seo-check.mjs` scans for fabricated audience/rating claims as a backstop.
