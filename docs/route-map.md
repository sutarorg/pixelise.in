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

- `links.login` is `/login` and `links.signup` is `/signup` — both ship in this app, so they are
  same-origin routes whether or not `NEXT_PUBLIC_APP_URL` is set.
- `getStarted` remains `/get-started`, an on-site page with real content.

**No route linked from the header, the app gates or an email 404s.**

## Account entry routes

| Route | Render | Purpose | Notes |
| --- | --- | --- | --- |
| `/login` | dynamic (`instant = false`) | Sign in; `?mode=recovery` becomes the new-password form; `?error=` explains a failed link; `?next=` is sanitised by `safeNextPath` | `noindex`, `Disallow: /login` |
| `/signup` | static shell + client form | Creates the account through `POST /api/v1/auth/sign-up`; shows "check your inbox" when confirmation is on | `noindex`, `Disallow: /signup` |
| `/forgot-password` | static shell + client form | Requests `POST /api/v1/auth/recovery`; one answer whether or not the account exists | `noindex`, `Disallow: /forgot-password` |

The reset email links to `/api/v1/auth/callback?next=/login?mode=recovery`: the callback exchanges the
one-time code for a session **before** the customer reaches the password form, which is what makes
`POST /api/v1/auth/update-password` succeed.

## Response headers and noindex on those pages

The `(auth)` layout sets `robots: noindex, nofollow, nocache`; `src/config/seo.ts` adds
`/forgot-password` to `privatePathPrefixes`, which drives both `robots.txt` and the SEO script.

## Routes intentionally *not* in stage 1

Delivered later; disallowed in `robots.txt` and absent from the sitemap:

- `/dashboard`, `/studio`, `/creations`, `/credits`, `/transactions`, `/settings`, `/help` — the
  customer workspace; **delivered in stage 2**, see the app route map at the end of this file
- `/checkout`, `/api/*` — commerce + backend (stage 4)

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

---

# Route map — customer application (stage 2)

The application lives in `src/app/(app)/`, inherits no marketing metadata, is `noindex`, disallowed in
`robots.txt` and excluded from `sitemap.xml`.

| Route | Renders | Dynamic regions | Notes |
| --- | --- | --- | --- |
| `/dashboard` | welcome, primary action, styles | wallet, recent creations, usage | The landing page after sign-in |
| `/studio` | four configure steps + canvas | studio config, wallet | The only page with a real client state machine |
| `/creations` | filter bar + gallery | generations list (cursor) | `?style=`, `?sort=`, `?cursor=` |
| `/creations/[id]` | visual, details, source | one generation | Deleted/foreign ids share one safe surface |
| `/credits` | two packs, how credits work | pack catalogue | Checkout creates the order server-side |
| `/transactions` | filters + table | transactions (cursor) | `?type=purchase\|generation\|refund\|adjustment` |
| `/settings` | profile, security, preferences, account | profile, preferences | Deletion requires typing `DELETE` |
| `/help` | topic cards + support note | none | Links out to marketing policies |

Navigation is fixed: Workspace (Dashboard, AI Studio, My Creations) and Account (Buy Credits,
Transactions, Settings, Help & Support). Phones show four of those in a bottom bar plus an account
drawer; nothing else is added to keep the information architecture flat.

**Deliberately absent:** `/checkout` (payment pages) beyond the Razorpay hosted checkout. The auth
pages and the `/api/v1/**` handlers exist; the app shell renders its sign-in gate with a link to
`/login`, which is a real page rather than a redirect loop.

---

# Route map — admin console (stage 3)

The console lives in `src/app/admin/`, inherits no marketing metadata, is `noindex, nofollow, nocache`,
disallowed in `robots.txt` and absent from `sitemap.xml`. It is not linked from the public site or the
customer dashboard; staff reach it by URL or bookmark.

| Route | Renders | Query state | Notes |
| --- | --- | --- | --- |
| `/admin` | customer, revenue, credit and generation totals; success rate; daily volume | `?range=7d\|30d\|90d`, `?from=&to=` | `activeCustomers` is "Not available" until the API documents a definition |
| `/admin/users` | customer table | `?q=`, `?status=`, `?range/from/to`, `?sort=`, `?dir=`, `?cursor=` | Sortable columns: signed up, credits, generations, purchases |
| `/admin/users/[id]` | account, status, balance, recent jobs, payments, ledger | — | Suspend/reactivate requires `users:write` + reason; adjustment requires `credits:write` |
| `/admin/generations` | job table | `?status=`, `?model=`, `?style=`, `?user=`, `?range/from/to`, `?cursor=`, `?record=` | Detail panel (`?record=<id>`) holds assets, provider ids, credits and status history |
| `/admin/payments` | order table | `?q=`, `?status=`, `?range/from/to`, `?cursor=`, `?record=` | Detail panel shows Razorpay ids, credits granted, webhook and verification state |
| `/admin/credits` | ledger table | `?q=`, `?user=`, `?type=`, `?range/from/to`, `?cursor=` | "Adjust credits" opens the search → amount → reason → confirm flow |
| `/admin/models` | model catalogue | — | Routing toggle requires `models:write` + reason; rates and pricing read-only |
| `/admin/settings` | general, generation, payments, email | — | Read-only in this stage; packs are cross-checked against published pricing |
| `/admin/audit-logs` | audit trail | `?q=`, `?action=`, `?admin=`, `?sort=&dir=`, `?range/from/to`, `?cursor=` | Append-only; entries are written by the service |

Gate states: unauthenticated → sign-in gate; authenticated non-staff → bare 403 with no navigation,
counts or record ids; unreachable API → error page; no API configured → shell with a "not connected"
strip. None of these surfaces contains a record, a total or a link into a section.

# Route map — the journal (stage 5)

| Route | Rendering | Metadata | Structured data | Notes |
| --- | --- | --- | --- | --- |
| `/blog` | static | `pageMetadata`, canonical `/blog`, OG website | `Blog` + `BreadcrumbList` | Hero (eyebrow "THE PIXELISE JOURNAL", H1 "Better product photography starts with better ideas."), featured article, 12 cards, 4 category links, editorial disclosure. No newsletter form. |
| `/blog/[slug]` | static, `generateStaticParams` over 12 slugs | `pageMetadata({ type: "article", image: cover, publishedTime, modifiedTime })` | `BlogPosting` + `BreadcrumbList` | Breadcrumbs Home → Journal → Category → Article, cover figure with disclosure caption, sticky TOC (native `<details>` on mobile), article body, author box, related articles, commercial CTA. |
| `/blog/categories/[category]` | static, 4 categories | `pageMetadata`, canonical per category | `BreadcrumbList` | Same category chips with `aria-current`, real counts, article grid. |
| `/blog/not-a-slug` | 404 | noindex | — | `notFound()` for unknown slugs and categories. |

Sitemap: all of the above are included (28 URLs total). Private routes
(`/dashboard`, `/studio`, `/creations`, `/credits`, `/transactions`, `/settings`, `/help`,
`/admin/*`) are excluded and `noindex`.
