# Public website research — Pixelise stage 1

**Research window:** 15 November 2026
**Scope:** design direction, frontend architecture, SEO, performance and accessibility for the
public Pixelise marketing site (`pixelise.in`).
**Recorded by:** design + frontend build, stage 1 of 4.

This document records what was researched, what was verified in the running project, and the
decision taken for each item. Anything that could not be verified directly is called out in
[Verification limits](#verification-limits).

---

## 1. Version and toolchain decisions

Versions were resolved from the npm registry on 15 November 2026, not assumed from memory.

| Package | Resolved version | Decision |
| --- | --- | --- |
| `next` | 16.4.6 (`latest`) | Used. App Router, Turbopack build, Cache Components enabled. |
| `react` / `react-dom` | 19.3.0 (scaffolded), 19.3.1 latest | Used as scaffolded by `create-next-app@latest`. |
| `tailwindcss` | 4.3.3 | Used with the CSS-first `@theme` configuration (no `tailwind.config.js`). |
| `@tailwindcss/turbopack` | 4.3.3 | Used; replaces the PostCSS pipeline in this scaffold. |
| `typescript` | 5.x (latest) | `strict: true`. |
| `lucide-react` | 1.73.0 | Used for generic UI glyphs only (chevrons, close, menu). |
| `sharp` | 0.35.5 | Used in the asset pipeline, not at runtime. |

**Sources:** npm registry metadata (`npm view <pkg> dist-tags`), Next.js docs
(<https://nextjs.org/docs/app/getting-started/metadata-and-og-images>, accessed 15 Nov 2026),
Tailwind CSS v4 theme docs (<https://tailwindcss.com/docs/theme>, accessed 15 Nov 2026).

### 1.1 Next.js 16 specifics that changed the implementation

These were verified against the bundled documentation shipped inside
`node_modules/next/dist/docs/01-app/` for the installed version, which is the authoritative copy
for the exact release.

1. **Cache Components is on.** `create-next-app` enables `cacheComponents: true`. Consequence:
   reading the clock during prerender is an error. Using `new Date().getFullYear()` in the footer
   failed the production build with
   *“Next.js encountered the unstable value `new Date()` while prerendering.”*
   → **Decision:** the copyright year is a build-time config constant
   (`siteConfig.copyrightYear`), not a runtime clock read.
2. **Typed routes.** Route types are generated (`.next/types`). A group layout's props type is not
   stable across versions, so shared layouts use an explicit `{ children: React.ReactNode }`.
3. **`next lint` is gone.** Linting is `eslint` directly (`eslint-config-next` core-web-vitals +
   typescript presets, flat config).
4. **`params` are promises** in `generateMetadata` and pages. The public site is fully static, so
   this only applies to future dynamic routes; the pattern is documented in `docs/API-CONTRACT.md`.
5. **Metadata file conventions** (`opengraph-image.tsx`, `icon.svg`, `sitemap.ts`, `robots.ts`)
   are supported and used. Verified in the built HTML.
6. **Streaming metadata is disabled for crawlers** that expect metadata in `<head>`; because every
   marketing page is prerendered this is not relied on.

### 1.2 shadcn/ui: vendored rather than fetched

`npx shadcn@latest init` failed in this environment (`Request to https://ui.shadcn.com/init… failed,
reason: Client network socket disconnected before TLS handshake`), and the registry host is not
reachable from the build sandbox.

→ **Decision:** the shadcn primitive pattern was implemented directly — Radix UI primitives +
`class-variance-authority` + `tailwind-merge` + `clsx`, with the same component API and
`components.json`-style conventions, in `src/components/ui/`. Components used: Button, Card, Badge,
Accordion, Dialog (as `Sheet`), and form fields. This keeps the later dashboard able to adopt the
same primitives without a rewrite.

### 1.3 Fonts

- Requirement: a refined pairing with Manrope, loaded through `next/font`, self-hosted, with no
  layout shift.
- `next/font/google` downloads font files at build time from `fonts.googleapis.com`, which is not
  reachable from the build sandbox → build would fail for reasons unrelated to the code.
- **Decision:** `next/font/local` with the Manrope variable font (`wght 200–800`, OFL) from the
  `@fontsource-variable/manrope` package, copied into `src/fonts/`. Licence text is stored next to
  the files (`src/fonts/Manrope-OFL-LICENSE.txt`).
- **Verified limitation:** the Latin subset of Manrope does **not** contain `₹` (U+20B9); it lives in
  the Latin-Extended subset, which has no digits. Two `@font-face` families are therefore stacked:
  Manrope first, then a currency-only face declared with `unicode-range: U+20B9`. Digits render in
  Manrope, the rupee sign falls through to the matching currency face. Verified by instantiating the
  font at weight 700 and rendering `₹499 ₹999`.
- `adjustFontFallback: "Arial"` generates metric-compatible fallback overrides, which reduces
  layout shift while the woff2 loads.

---

## 2. Google Search Central guidance applied

Guidance reviewed 15 November 2026 from Google Search Central
(<https://developers.google.com/search/docs>), its structured-data policies
(<https://developers.google.com/search/docs/appearance/structured-data/policies>), and the
Next.js metadata docs.

| Requirement | Implementation |
| --- | --- |
| Unique, descriptive `<title>` per page | `pageMetadata()` helper; every route passes its own title. Homepage uses an absolute title. Verified: 11 distinct titles. |
| Unique meta description | Same helper; each description written per page, 143–160 characters (verified in built HTML). |
| Canonical URLs | `metadataBase` + `alternates.canonical` per route. Verified output, e.g. `https://pixelise.in/pricing`. |
| Semantic heading hierarchy | One `<h1>` per page; `<h2>` for sections; `<h3>` for cards. Verified: exactly one `h1` on every route. |
| Descriptive alt text | Written per image in config; all `<img>` tags have `alt`. Verified: 0 images without alt across all routes. |
| Optimised image dimensions | Generated WebP at fixed intrinsic sizes; `sizes` on every `next/image`; blur placeholders from the asset build. |
| Open Graph + Twitter metadata | `openGraph` and `twitter` in every page's metadata, with an explicit `/opengraph-image` (1200×630) entry. Verified: exactly one `og:image` and one `twitter:image` per page. |
| XML sitemap | `src/app/sitemap.ts`, 11 public routes only. |
| robots.txt | `src/app/robots.ts`, disallows `/api/`, `/admin/`, `/dashboard/`, `/account/`, `/login`, `/signup`, `/checkout`, `/studio/`. |
| Breadcrumbs | Visible trail on every inner page + `BreadcrumbList` JSON-LD. |
| Internal linking | Every section links forward (styles → examples, pricing → get started, FAQ → contact); footer carries the full public map. |
| Descriptive URLs | `/features`, `/examples`, `/how-it-works`, `/pricing`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund-policy`. |
| Structured data, truthful only | `Organization`, `WebSite` (all pages), `SoftwareApplication` (home + pricing, with the two real offers), `FAQPage` (home + /faq), `BreadcrumbList`. No `aggregateRating`, no `review`, no invented offers. |
| Customer/admin routes out of the sitemap | Enforced in `sitemap.ts` and `robots.ts`. |

**Keyword themes** (used naturally, never stuffed): primary — *AI product photography*, *AI product
photo generator*, *AI product photography studio*; secondary — *ecommerce product photography*,
*AI lifestyle product photography*, *product advertising image generator*, *Shopify product
photography*, *product photo editor*.

**`FAQPage` eligibility.** Google restricts FAQ rich results to well-known, authoritative
government and health sites, so this markup is unlikely to produce a rich result for Pixelise. It is
included anyway because it is accurate, on-page and low risk — and it is the standard way to publish
question/answer pairs as structured data. No answer is invented: each one matches the visible copy.

---

## 3. Core Web Vitals and performance

Thresholds confirmed against web.dev/vitals (accessed 15 Nov 2026): **LCP ≤ 2.5 s, INP ≤ 200 ms,
CLS ≤ 0.1**, measured at the 75th percentile of real visits. INP replaced FID in March 2024.

Decisions taken against those targets:

1. **Static generation for every marketing route.** Built output shows `○` (prerendered) for all 11
   pages. No request-time data on the critical path.
2. **LCP is the hero photograph.** It is the only `priority` image, receives a `<link rel="preload"
   as="image">` with a full `imageSrcSet` (verified in the head), and has explicit dimensions via the
   asset manifest, so it cannot shift layout.
3. **CLS.** Every image renders inside an `aspect-*` box or with intrinsic `width`/`height`;
   `next/font` with metric-adjusted fallbacks; no banners injected above content; no animation that
   moves layout (hero entrance animates `transform`/`opacity` only).
4. **INP / JavaScript budget.** Interactivity is limited to: header scroll state + mobile drawer +
   one disclosure menu (Radix), two accordion groups, and the examples filter. Everything else is a
   Server Component with no hydration. No animation library, no carousel, no client-side data
   fetching.
5. **Images.** Generated WebP at 84 quality with Lanczos3 resampling, 16-pixel blur placeholders,
   and explicit `sizes` per breakpoint so mobile never downloads a desktop-sized file. The hero
   stylesheet uses `next/image`'s optimiser, which serves AVIF/WebP per browser.
6. **Fonts.** Two self-hosted woff2 files (variable Latin ≈25 kB, currency subset ≈22 kB, the latter
   only fetched when `₹` is rendered). No third-party font requests.
7. **No third-party scripts.** No analytics, no tag manager, no chat widget — so no third-party
   main-thread work or cookie banner requirement.

---

## 4. WCAG 2.2 AA

WCAG 2.2 adds nine criteria; the Level A/AA ones were reviewed (accessed 15 Nov 2026) and addressed
as follows.

| Criterion | Level | How it is addressed |
| --- | --- | --- |
| 1.4.3 Contrast (Minimum) | AA | Body text `#6F7083` on white = 4.87:1; strong muted on tinted panels = 5.66:1; white on violet = 5.7:1. Small text was moved off lavender backgrounds onto a darker muted token. |
| 2.1.1 Keyboard | A | All controls are native buttons/links or Radix primitives with full keyboard support (accordion, menu, dialog). |
| 2.4.1 Bypass Blocks | A | “Skip to content” link, visible on focus, targets `#main`. |
| 2.4.7 Focus Visible | AA | Global `:focus-visible` outline (2 px violet, 3 px offset) plus per-component rings. |
| **2.4.11 Focus Not Obscured (Minimum)** | AA | Sticky header is 64 px; `scroll-margin-top: 6.5rem` on every `[id]` so anchored content and focused elements never sit under it. |
| **2.5.8 Target Size (Minimum)** | AA | Buttons are 36/44/48/54 px tall; icon-only controls are 36–40 px; filter chips are 36 px tall with ≥8 px separation. |
| 2.5.7 (Dragging) | AA | No drag-only interaction exists. |
| 3.2.6 Consistent Help | A | Support route is in the header disclosure, the footer and the FAQ — same place on every page. |
| 3.3.7 (Redundant Entry) | A | No multi-step forms on the public site. |
| 3.3.8 (Accessible Authentication) | AA | No authentication on the public site; the studio app is out of scope for stage 1. |
| 1.4.12 Text Spacing / 1.4.4 Resize | AA | Fluid type, no fixed-height text containers, layouts reflow to 320 px. |
| 1.3.1 / 4.1.2 | A | Landmarks (`header`/`nav`/`main`/`footer`), labelled navs, `aria-current="page"`, `aria-pressed` on filters, real `<table>` with `<caption>` and row/column headers. |
| 2.3.3 Animation from Interactions | AAA-adjacent | Global `prefers-reduced-motion` rule removes transitions, animations and smooth scrolling. |

Accessible names were checked across the built HTML: the logo link has an explicit
`aria-label`, the drawer trigger is `aria-label="Open menu"` with `aria-haspopup`, decorative SVGs
are `aria-hidden`, and the contact form's disabled state is announced via `aria-describedby`.

---

## 5. Competitive review

Products reviewed as references (public landing pages and product descriptions): Photoroom,
Pebblely, Flair AI, Pixelcut, remove.bg, Shopify, Linear, Framer.

**What each contributes, and what was deliberately not copied**

| Reference | Pattern worth learning from | Decision for Pixelise |
| --- | --- | --- |
| remove.bg | One-sentence promise, tool immediately usable, price ladder underneath. | Adopt the single-promise hero; reject the “upload widget in the hero” because generation is a stage-2 capability. |
| Photoroom | Strong before/after demonstration, dense but organised feature grid, template thumbnails. | Adopt the *transformation* story, but show it as an art-directed composition (source photo → rendered result) rather than a slider widget. |
| Pebblely | Category-led use-case navigation, playful product-tile gallery. | Adopt category-led use cases (beauty, fashion, jewellery, food, home); reject the playful illustration style. |
| Flair AI | Editorial, campaign-style imagery; positions itself around brands and art direction. | Adopt editorial restraint and campaign imagery over dashboards; keep our type and spacing tighter. |
| Pixelcut | Mobile-first, tool-per-card layout, aggressive conversion prompts. | Adopt clarity of tool cards; reject the density and the repeated CTAs. |
| Shopify | Pricing clarity, trust through specificity, excellent documentation linking. | Adopt the “explain the money plainly” discipline; no invented trust badges or logo walls. |
| Linear | Type-led hierarchy, hairline borders, minimal colour, deliberate motion, sticky note-free pages. | Primary visual influence: restrained palette, tight tracking on display type, 1 px borders, low-contrast surfaces, one accent. |
| Framer | Bold hero composition, product imagery treated as content, generous section rhythm. | Adopt the art-directed hero and section rhythm; reject heavy motion and gradient-heavy backgrounds. |

**Common failure modes deliberately avoided**

- Hero screenshots of a dashboard as the main visual (ours is a photography composition).
- Logo walls of unverifiable customers, star ratings, “10,000+ brands” counters.
- Bento-grid-everywhere layouts with no hierarchy.
- Neon gradients, floating blobs, glassmorphism cards.
- Pricing pages with five invented tiers and crossed-out prices.

---

## 6. Originality decisions

1. **One product, three lighting decisions.** A single source photograph (a frosted serum bottle)
   is used across Studio, Lifestyle and Advertising, then reused for the use-case section and
   gallery. This is the site's core storytelling device and cannot be mistaken for a template.
2. **Labels intentionally blank.** Every product label in the image set is an unprinted cream panel
   with at most one fine rule. This avoids gibberish typography, avoids implying a third-party brand,
   and keeps the photography the subject.
3. **The drawn arrow.** A hand-drawn violet directional mark between the “your photo” card and the
   rendered result is the only illustration on the site — a single deliberate human mark against a
   precise photographic grid.
4. **Editorial numerals.** Section indices (`01`–`06`) in a monospaced face act as a page rhythm, and
   are the only decorative typography beyond the display scale.
5. **Violet used as punctuation.** The accent appears in the hero's one highlighted word, icon tiles,
   the primary button, the final CTA panel and the logo tile — never as a page-wide gradient.

---

## 7. Verification limits

- **Competitor sites were not fetched directly.** Outbound HTTP from the build sandbox is restricted;
  `photoroom.com`, `pebblely.com`, `flair.ai`, `pixelcut.ai`, `remove.bg` and `framer.com` could not
  be retrieved. The comparison above is based on their publicly documented landing-page structure and
  product positioning rather than a live pixel review on 15 Nov 2026. **Action for the owner:** re-run
  the visual review in a browser before launch, and re-check pricing/positioning of those products so
  the differentiation claims in this document stay current.
- **`ui.shadcn.com` was unreachable**, hence the vendored component approach (§1.2).
- **`fonts.googleapis.com` was unreachable**, hence the local font pipeline (§1.3).
- **No browser is available in the build sandbox**, so visual QA was done through the rendered HTML,
  compiled CSS and layout arithmetic rather than screenshots. The owner should review
  `/`, `/pricing`, `/examples` at 1440, 1280, 1024, 768, 390 and 360 px before launch; the layouts
  were authored for exactly those widths.
- **Lighthouse/field data does not exist yet** for the domain. The performance decisions in §3 are
  structural (static output, one priority image, self-hosted fonts, minimal client JS) and should be
  confirmed with Lighthouse on the first deployment.
