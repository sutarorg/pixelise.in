# Internal linking map

Internal links are a product decision here, not an accident of writing. The goals:

1. Every article is reachable in one click from `/blog` and in two from anywhere.
2. Every article can reach the commercial pages (pricing, how-it-works, features).
3. No orphans, no link farms, no "related posts" widgets that link to everything.

## Skeleton

```
Home ─┬─ Features
      ├─ Examples
      ├─ How it works
      ├─ Pricing  ◀───────────────┐
      ├─ FAQ                      │
      ├─ Contact                  │
      └─ Journal (/blog)  ────────┼──▶ 12 articles ──▶ 4 category pages
                                  │        │
                                  └────────┴──▶ Pricing / Get started
```

Header: Journal lives in the **Resources** menu (desktop) and is flattened into the
mobile menu. Footer: "Journal" appears under *Product* and *Support*. The journal index
itself links to all 12 articles and all 4 categories.

## Article → article links

Each article names its three closest siblings in `src/content/blog/posts.ts` (`related`),
and the body carries at least two contextual links plus one commercial link.

| Article | Related (explicit) | Commercial link in body |
| --- | --- | --- |
| AI product photography for ecommerce | Shopify guide · studio vs lifestyle · backgrounds | `/how-it-works` |
| Shopify product photography | Amazon guide · backgrounds · AI guide | (body links to backgrounds/AI; `/pricing` via CTA) |
| Amazon product images | Shopify guide · backgrounds · ad creatives | `/blog/ecommerce-ad-creatives…` + CTA |
| DIY product photography | backgrounds · studio vs lifestyle · Shopify guide | `/pricing` CTA |
| Product lifestyle photography | studio vs lifestyle · DIY · fashion | `/pricing` CTA |
| Studio vs lifestyle | lifestyle guide · DIY · AI guide | `/pricing` CTA |
| Skincare | jewellery · backgrounds · studio vs lifestyle | `/pricing` CTA |
| Jewellery | skincare · backgrounds · fashion | `/pricing` CTA |
| Fashion | lifestyle · jewellery · ad creatives | `/pricing` CTA |
| Food | lifestyle · backgrounds · DIY | `/pricing` CTA |
| Backgrounds | DIY · studio vs lifestyle · Shopify guide | `/pricing` CTA |
| Ad creatives | fashion · AI guide · lifestyle | `/pricing` CTA |

## Category pages

| Category | URL | Contains |
| --- | --- | --- |
| AI Product Photography | `/blog/categories/ai-product-photography` | 1 |
| Ecommerce Photography | `/blog/categories/ecommerce-photography` | 2, 3 |
| Product Photography Guides | `/blog/categories/product-photography-guides` | 4–11 |
| Advertising & Marketing | `/blog/categories/advertising-marketing` | 12 |

Every article links back to its own category; every category links to `/blog` and to all
four categories; each article's breadcrumb repeats Home → Journal → Category → Article.

## Rules going forward

- An article must be linked from `/blog` (automatic) **and** from at least one sibling's
  body or related list. Adding a 13th article means editing at least one existing file.
- Anchor text describes the destination ("the Shopify image requirements"), never
  "click here" or a bare keyword.
- No article links to more than 8 internal URLs. Depth beats volume.
- When an article is retired, its slug 301s to the closest remaining article; do not
  leave a 404 in the sitemap.
- `npm run seo:check` fails if an article has fewer than two sibling links or no
  commercial link, so the map cannot quietly rot.
