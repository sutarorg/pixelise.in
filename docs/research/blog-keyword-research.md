# Blog keyword research

## Method (and its limits)

No paid keyword tool (Ahrefs, Semrush, Keyword Planner exports) is reachable from this
environment, and no traffic, Search Console or Analytics data exists for `pixelise.in`.
So this research does **not** contain search volumes, keyword difficulty, CPC or traffic
projections. Any number of that kind in a proposal for this site would be fabricated.

What was actually used:

1. **Business context.** AI product photography, sold as one-time credit packs to Shopify,
   D2C, Amazon and marketplace sellers plus agencies in India, priced in INR, with
   generation currently gated (`not_configured`). Content must therefore earn trust and
   explain the *problem*; it must not promise a working demo or results.
2. **Platform documentation**, because those pages define the requirements sellers search
   for: Shopify Help Center product media specifications, Amazon Seller Central image
   requirements, Google Search Central image and structured-data guidance.
3. **Query-intent patterns** from how product-photography searches are phrased
   (how-to, platform requirements, category-specific, comparison, DIY-vs-studio,
   ad-creative). This is qualitative pattern matching, not keyword-tool data.

Every quantitative claim in the articles that survives into publication is traceable to a
primary source in `docs/blog-sources.md`, or is omitted.

## Cluster design

The 12 articles form three commercial clusters plus one supporting cluster. Each article
has exactly one primary intent, a distinct reader, and at least one link to a sibling and
to a commercial page.

| Cluster | Articles | Commercial job |
| --- | --- | --- |
| AI product photography | 1 | Explain the category, when AI helps, and its limits |
| Ecommerce platforms | 2, 3 | Meet sellers where they search: Shopify specs, Amazon listing rules |
| Practical photography guides | 4, 5, 6, 11 | Teach the craft so advice is credible; DIY vs studio vs lifestyle vs AI trade-offs |
| Category guides | 7, 8, 9, 10 | Skincare, jewellery, fashion, food — high-intent category searches |
| Advertising | 12 | Connect imagery to paid performance without inventing uplift numbers |

Deliberate gaps (do **not** write yet): "best AI product photography tools" comparison
pages (would require competitor claims we cannot verify), "product photography near me"
(local service we do not offer), pricing-comparison content (pricing is frozen and not
being repositioned), and any "case study" or "results" page (no customers to cite).

## Intent notes per article

- **AI Product Photography for Ecommerce** (`ai-product-photography-ecommerce-guide`) —
  informational, top of funnel. Reader: ecommerce manager who has heard of AI imagery and
  wants to know where it fits. Must state limitations (fidelity, category-specific risk,
  disclosure) and that Pixelise generation is not yet open, rather than imply instant
  availability.
- **Shopify guide** (`shopify-product-photography-guide`) — platform-requirements intent.
  Reader: Shopify merchant fixing images before/after launch. Cite Shopify's own specs
  (up to 5000×5000 px / 25 MP, under 20 MB, 2048×2048 recommended for square).
- **Amazon guide** (`amazon-product-image-guide`) — compliance intent. Reader: Amazon
  seller whose listing images were suppressed or who is preparing a launch. Amazon's
  Seller Central requirements are behind login; the article therefore states the
  categories of requirement (main image purity, framing, file formats) and instructs the
  reader to verify against their own Seller Central help page instead of quoting numbers
  that may have changed.
- **DIY guide** (`diy-product-photography-small-business`) — budget/DIY intent, strong for
  small Indian D2C sellers. Reader has a phone, a window and ₹0 budget.
- **Lifestyle guide** (`product-lifestyle-photography-guide`) — craft intent. Reader wants
  context shots, not packshots.
- **Studio vs lifestyle** (`studio-vs-lifestyle-product-photography`) — comparison intent,
  decision stage.
- **Skincare / jewellery / fashion / food** — category intent. Each has different physics:
  reflective liquids and label legibility; metal reflections and scale; fabric drape and
  fit; freshness and steam/condensation. The articles must actually say those things or
  they are interchangeable filler.
- **Backgrounds** (`product-photography-background-guide`) — practical search with high
  snippet potential (seamless paper, sweep, textured surfaces, environmental sets,
  transparency, shadows).
- **Ad creatives** (`ecommerce-ad-creatives-product-photography`) — commercial intent with
  a paid-media reader; connects to Meta/Google creative formats without claiming
  performance lift.

## On-page targets (no volume claims)

| # | Article | Primary phrasing | Supporting phrasing |
| --- | --- | --- | --- |
| 1 | AI product photography for ecommerce | ai product photography for ecommerce | ai product photos, ecommerce product imagery, ai packshots |
| 2 | Shopify product photography | shopify product photography | shopify product image size, shopify image requirements |
| 3 | Amazon product images | amazon product image requirements | amazon main image, listing photos |
| 4 | DIY product photography | diy product photography | product photography at home, phone product photos |
| 5 | Product lifestyle photography | lifestyle product photography | in-context product photos |
| 6 | Studio vs lifestyle | studio vs lifestyle product photography | which product photos to use |
| 7 | Skincare photography | skincare product photography | cosmetic product photos, label legibility |
| 8 | Jewellery photography | jewellery product photography | reflective product photography, jewelry on white |
| 9 | Fashion photography | fashion product photography | apparel ecommerce photos, flat lay vs on-model |
| 10 | Food photography | food product photography | packaged food photos, food ecommerce imagery |
| 11 | Backgrounds | product photography backgrounds | white background product photos, seamless backdrop |
| 12 | Ad creatives | product photography for ads | ecommerce ad creatives, social ad imagery |

## Measurement plan (once the site has traffic)

1. Verify the 12 URLs in Search Console; submit the sitemap. 2. Track impressions/clicks
per query in the "Queries" report; group by cluster. 3. Only after 8–12 weeks, prune or
merge pages with no impressions and no internal link traffic. 4. Never add fabricated
"updated" dates to fake freshness — `dateModified` changes only when content changes.
