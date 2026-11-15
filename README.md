# Pixelise — public website (stage 1)

The public marketing site for **Pixelise**, an AI product photography studio.
Next.js App Router, React 19, TypeScript, Tailwind CSS v4.

> Stage 1 of 4. This repository contains the public website only: no dashboard, no admin, no
> payment flow, no AI generation and no API routes. Every interface for the later stages is
> documented in `docs/API-CONTRACT.md`.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (all public routes prerender)
npm run start      # serve the production build
npm run lint       # eslint (next lint was removed in Next 16)
npm run typecheck  # tsc --noEmit
npm run assets     # rebuild WebP derivatives + image manifest from the raw masters
```

## Environment

Optional — the site builds and runs with no environment variables.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used for metadata, sitemap and JSON-LD | `https://pixelise.in` |
| `NEXT_PUBLIC_APP_URL` | Studio app origin. When set, “Log in” and every “Get started” CTA point at the app (`/login`, `/signup`) instead of the on-site `/get-started` page. | unset |

## Structure

```
src/
  app/
    layout.tsx              root layout: fonts, metadata defaults, viewport
    (marketing)/            public route group (header + footer chrome)
      page.tsx              homepage
      features/ examples/ how-it-works/ pricing/ faq/ contact/
      get-started/ privacy/ terms/ refund-policy/
    opengraph-image.tsx     1200×630 social card rendered with the real Manrope file
    icon.svg                brand favicon
    sitemap.ts robots.ts    generated crawl files (public routes only)
    not-found.tsx           404 with real navigation
  components/
    ui/                     vendored shadcn-style primitives (Radix + cva)
    layout/                 container, section, header, footer, logo, drawer
    shared/                 eyebrow, section heading, breadcrumbs, JSON-LD, icons, image
    marketing/              page sections (hero, styles, process, pricing, gallery, …)
  config/                   site, navigation, pricing (real business config),
                            content (all copy), gallery, generated image manifest
  lib/
    seo/                    metadata builder + structured-data builders
    contact/contract.ts     typed contact API contract (implementation is stage 4)
  fonts/                    Manrope variable woff2 (OFL) + currency subset
  styles/globals.css        design tokens, base layer, type utilities, motion
docs/                       research, design system, routes, assets, owner inputs, API contract
scripts/build-assets.mjs    image pipeline (WebP + dimensions + blur placeholders)
```

## Design system

Tokens live in `src/styles/globals.css` as Tailwind v4 `@theme` variables — one white/violet palette,
Manrope throughout, three shadow tokens, 1 px hairline borders. See `docs/design-system.md`.

## Honesty rules enforced in this build

- No lorem ipsum, no placeholder copy, no fictional users, testimonials, logos or counters.
- Pricing is only Creator ₹499 / 150 credits and Studio ₹999 / 350 credits, both one-time.
  No subscriptions, trials, bonus credits or extra tiers.
- No email address, phone number, registered address, GSTIN or legal entity is invented anywhere.
- The support form is rendered **disabled** with a visible explanation, because its backend does not
  exist yet. No submission is simulated.
- Marketing imagery is original and Pixelise-owned, and is never presented as customer work.

## Documentation

| File | Contents |
| --- | --- |
| `docs/research/public-website-research.md` | Sources, versions, verified Next 16 / Tailwind v4 behaviour, SEO, Core Web Vitals, WCAG 2.2, competitive review, verification limits |
| `docs/design-system.md` | Tokens, type scale, spacing, components, states, responsive intent, extension rules |
| `docs/route-map.md` | Every route, its metadata, CTA destination, structured data and internal links |
| `docs/creative-assets.md` | Art direction, verbatim generation prompts, derivative map, reuse rules |
| `docs/owner-inputs.md` | Unknown business facts and policy decisions still required |
| `docs/API-CONTRACT.md` | Typed contracts for the stage-4 backend, and what is explicitly not built |

## Image pipeline

Masters live in `public/images/marketing/raw/` (git-ignored, ~23 MB). `npm run assets` produces the
17 committed WebP derivatives plus `src/config/images.ts`, which carries intrinsic dimensions and a
base64 blur placeholder per image so `next/image` never causes layout shift.
