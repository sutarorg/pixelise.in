# Route map — Pixelise public website

Every route below exists, is prerendered, is indexable unless stated otherwise, and has a unique
title, description and canonical URL. Built output verified on 15 Nov 2026.

| # | Route | Purpose | `<title>` | Primary CTA | Indexable | In sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` | Primary conversion page | `Pixelise — AI Product Photography Studio` (absolute) | Get started → `/get-started` | Yes | Yes |
| 2 | `/features` | Capability detail | `Features — AI Product Photography for Ecommerce` | Get started | Yes | Yes |
| 3 | `/examples` | Gallery of Pixelise-owned artwork, filterable by style | `AI Product Photography Examples` | Start with your product | Yes | Yes |
| 4 | `/how-it-works` | The four-step workflow in detail | `How AI Product Photography Works` | Get started | Yes | Yes |
| 5 | `/pricing` | The two credit packs, comparison, credit mechanics | `Pricing — One-Time Credit Packs` | Pack CTA → `/get-started` | Yes | Yes |
| 6 | `/faq` | All nine questions, grouped | `FAQ — AI Product Photography & Credits` | Get started | Yes | Yes |
| 7 | `/contact` | Support channel, what to include, honest form state | `Contact Support` | (form disabled by design) | Yes | Yes |
| 8 | `/get-started` | Pack selection + how access works | `Get Started` | Pack CTA → `#studio-access` | Yes | Yes |
| 9 | `/privacy` | Privacy policy | `Privacy Policy` | — | Yes | Yes |
| 10 | `/terms` | Terms of service | `Terms of Service` | — | Yes | Yes |
| 11 | `/refund-policy` | Refund policy | `Refund Policy` | — | Yes | Yes |
| — | `not-found` | 404 with real navigation | — | Back to home | No (`noindex` by default) | No |
| — | `/sitemap.xml` | Generated XML sitemap | — | — | — | — |
| — | `/robots.txt` | Crawl rules + sitemap reference | — | — | — | — |
| — | `/opengraph-image` | 1200×630 social card (ImageResponse + Manrope) | — | — | — | — |
| — | `/icon.svg` | Brand favicon | — | — | — | — |

## Conversion destinations

All conversion is centralised in `src/config/site.ts`:

```ts
links.getStarted  // every "Get started" CTA
links.login       // header "Log in"
links.appStudio   // the studio application entry point
```

Behaviour today:

- `NEXT_PUBLIC_APP_URL` is unset → `getStarted` is `/get-started` (an on-site page with real
  content), and `login` is `/get-started#studio-access`.
- `NEXT_PUBLIC_APP_URL` set → `getStarted` becomes `${APP_URL}/signup`, `login` becomes
  `${APP_URL}/login`. No component changes are required.

This is the documented seam for stage 2. **No route in this repository 404s.**

## Routes intentionally *not* in this stage

Delivered later; disallowed in `robots.txt` and absent from the sitemap:

- `/signup`, `/login`, `/reset-password` — auth (stage 2)
- `/dashboard`, `/dashboard/*`, `/account` — customer area (stage 2)
- `/admin`, `/admin/*` — admin area (stage 3)
- `/checkout`, `/api/*` — commerce + backend (stage 4)
- `/studio/*` — generation workspace (stage 4)

## Internal linking map

| From | To | Anchor context |
| --- | --- | --- |
| Header (all pages) | Features, Examples, Pricing, Resources ▸ (FAQ, Contact, Refund), How it works | Primary nav |
| Header CTA | `/get-started` | “Get started” |
| Header secondary | `/get-started#studio-access` | “Log in” (until the app URL is configured) |
| Hero | `/get-started`, `/examples` | Primary + secondary CTA |
| Features section (home) | `/features` | “See all features” |
| Styles section (home) | `/examples`, `/get-started` | “Browse examples”, per-style “Start with …” |
| Process section (home) | `/how-it-works`, `/get-started` | “How Pixelise works”, “Start with one product” |
| Use cases (home) | `/get-started` | “Start with your product” |
| Pricing section (home) | `/pricing`, `/get-started` | “Compare the packs”, pack CTAs |
| FAQ section (home) | `/faq` | “Read every question” |
| Final CTA (all pages using it) | `/get-started`, `/examples` | CTA pair |
| Footer (all pages) | 14 links + `/sitemap.xml` | Product, Plans & pricing, Support, Legal |
| `/features` | `/examples`, `/how-it-works`, `/pricing`, `/faq` | Section CTAs |
| `/examples` | `/get-started`, `/how-it-works`, `/features` | Hero + disclosure strip |
| `/how-it-works` | `/get-started`, `/pricing`, `/examples`, `/faq` | Hero + sections |
| `/pricing` | `/get-started`, `/faq`, `/contact` | Pack CTAs, FAQ, support |
| `/faq` | `/get-started`, `/pricing`, `/contact`, `/refund-policy` | Hero + closing card |
| `/contact` | `/faq`, `/pricing`, `/refund-policy` | Quick links |
| `/get-started` | `/pricing`, `/how-it-works`, `/examples`, `/contact` | Sections |
| Legal pages | `/contact`, sibling policies | Inline references |

## Metadata conventions

- **Title template:** `%s | Pixelise` from the root layout; the homepage opts out with an absolute
  title so the brand is not repeated.
- **Descriptions:** 143–160 characters, written per page, always naming the specific page intent.
- **Canonical:** `alternates.canonical` relative to `metadataBase` (`https://pixelise.in`).
- **Social:** one `og:image` and one `twitter:image` per page, both pointing at `/opengraph-image`
  (1200×630 PNG, brand typography rendered with the real Manrope file).
- **Structured data per route:**

| Route | JSON-LD |
| --- | --- |
| All | `Organization`, `WebSite` |
| `/` | `SoftwareApplication` (two offers), `FAQPage` (6 visible Q&As) |
| `/pricing` | `SoftwareApplication` (two offers), `BreadcrumbList` |
| `/faq` | `FAQPage` (all 9 Q&As), `BreadcrumbList` |
| All inner pages | `BreadcrumbList` matching the visible trail |

No ratings, reviews, counters or customer data appear in any structured data.

## Breadcrumb trails

Home → page. Legal pages and `/get-started` included. The visible trail and the JSON-LD
`BreadcrumbList` are generated from the same array on each page.
