# Pixelise — website + customer dashboard (stages 1–2)

**Pixelise** is an AI product photography studio for ecommerce. This repository holds the public
marketing site and the customer workspace, built as one Next.js App Router application.
Next.js 16.4, React 19.3, TypeScript (strict), Tailwind CSS v4.

> **Stage 2 of 4.** No database, auth provider, payment verification, AI generation or API route
> exists yet. Every interface the backend must implement is documented in `docs/API-CONTRACT.md`
> (Part II for the dashboard), and the frontend is typed against it. Nothing is mocked: an
> unconnected workspace shows designed "not connected" states instead of invented data.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (marketing routes static, app routes partial)
npm run start      # serve the production build
npm run lint       # eslint (next lint was removed in Next 16)
npm run typecheck  # tsc --noEmit
npm run assets     # rebuild WebP derivatives + image manifest from the raw masters
```

## Environment

Everything is optional — the app builds and runs with no environment variables, which is how the
"not connected" states are exercised.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap and JSON-LD | `https://pixelise.in` |
| `NEXT_PUBLIC_APP_URL` | Studio origin. When set, “Log in” and every “Get started” CTA point at it instead of the on-site `/get-started`. | unset |
| `PIXELISE_API_BASE_URL` | Server-side base URL of the workspace API. Unset ⇒ the app renders its unavailable states and issues no requests. | unset |
| `NEXT_PUBLIC_API_BASE_URL` | Browser base URL for the same API. Empty ⇒ same origin. | empty |

## Routes

**Public** (`src/app/(marketing)/`): `/`, `/features`, `/examples`, `/how-it-works`, `/pricing`,
`/faq`, `/contact`, `/get-started`, `/privacy`, `/terms`, `/refund-policy`.

**Customer** (`src/app/(app)/`, noindex, disallowed in robots): `/dashboard`, `/studio`, `/creations`,
`/creations/[id]`, `/credits`, `/transactions`, `/settings`, `/help`.

## Structure

```
src/
  app/
    layout.tsx              root layout: fonts, metadata defaults, viewport
    (marketing)/            public route group (header + footer chrome)
    (app)/                  customer workspace (sidebar shell, session gate)
      layout.tsx            the guard + shell; the only place a session is resolved
      dashboard/ studio/ creations/ creations/[id]/ credits/ transactions/ settings/ help/
      error.tsx             route-level failure boundary
    opengraph-image.tsx     1200×630 social card rendered with the real Manrope file
    icon.svg                brand favicon
    sitemap.ts robots.ts    generated crawl files (public routes only)
    not-found.tsx           404 with real navigation
  components/
    ui/                     shared primitives (Radix + cva): button, card, field, sheet,
                            alert, progress, switch, dialog, skeleton
    layout/                 marketing container, section, header, footer, logo, drawer
    shared/                 eyebrow, section heading, breadcrumbs, JSON-LD, image
    marketing/              marketing page sections
    app/                    shell: sidebar, header, mobile nav, account menu, credit balance,
                            page header, section card, state views (empty/error/gated)
    studio/                 uploader, style/scene/settings pickers, status, preview, workspace
    creations/ transactions/ credits/ settings/   page-level components
  config/                   site, navigation, pricing (real business config), content, gallery,
                            generated image manifest, dashboard nav, studio capability seed
  lib/
    api/                    types (domain + transport), core (fetch, errors), server, browser
    session.ts              session resolution consumed by the shell
    format.ts               locale-stable money, credits, dates, byte sizes
    upload.ts               client-side file validation
    seo/  contact/          metadata + structured data, typed contact contract
  fonts/                    Manrope variable woff2 (OFL) + currency subset
  styles/globals.css        design tokens, base layer, type utilities, motion
docs/                       research, design system, routes, assets, owner inputs, API contract,
                            customer dashboard
scripts/build-assets.mjs    image pipeline (WebP + dimensions + blur placeholders)
```

## How the workspace behaves without a backend

`src/lib/session.ts` returns `unconfigured` when `PIXELISE_API_BASE_URL` is absent. The shell still
renders — sidebar, header, credit chip, navigation — and each data region shows its own designed state:
a skeleton while loading, an honest "not connected / unavailable" panel with a retry, or the real empty
state once the service answers with an empty collection. Nothing is seeded, simulated or optimistic:

- The contact form stays disabled with an explanation.
- Credit balance shows `—`, never a made-up number.
- The studio costs show `—` until the service prices the job; Generate asks the API and reports its
  refusal honestly, with no local credit deduction and no fake progress.
- Checkout asks the server to create an order; when it can't, nothing is charged and the message says so.
- Settings controls (switches, delete, sign-out) are wired to real endpoints and fail visibly.

## Honesty rules enforced in this build

- No lorem ipsum, no placeholder copy, no fictional users, testimonials, logos, counters or payments.
- Pricing is only Creator ₹499 / 150 credits and Studio ₹999 / 350 credits, both one-time.
  No subscriptions, trials, bonus credits or extra tiers.
- No credit-to-image rate is invented; costs are server-authored.
- No email address, phone number, registered address, GSTIN or legal entity is invented anywhere.
- Marketing imagery is original and Pixelise-owned and is never presented as customer work.
- App imagery is the customer's own upload or a service response; there are no stock photos.

## Documentation

| File | Contents |
| --- | --- |
| `docs/research/public-website-research.md` | Sources, versions, verified Next 16 / Tailwind v4 behaviour, SEO, Core Web Vitals, WCAG 2.2, competitive review |
| `docs/research/customer-dashboard-research.md` | Next 16 proxy vs. layout guards, Cache Components, Supabase/Auth, Razorpay, R2 presigned uploads, accessible application UI, competitor workflows |
| `docs/customer-dashboard.md` | Shell, rendering model, state matrix, studio flow, component inventory, a11y, perf, backend checklist, QA |
| `docs/design-system.md` | Tokens, type scale, spacing, components, states, responsive intent, extension rules |
| `docs/route-map.md` | Every route (public and app), metadata, CTA destinations, structured data, internal links |
| `docs/creative-assets.md` | Art direction, verbatim generation prompts, derivative map, reuse rules |
| `docs/owner-inputs.md` | Unknown business facts and policy decisions still required |
| `docs/API-CONTRACT.md` | Typed contracts for the stage-4 backend (Part II = dashboard), and what is explicitly not built |

## Image pipeline

Masters live in `public/images/marketing/raw/` (git-ignored, ~23 MB). `npm run assets` produces the
17 committed WebP derivatives plus `src/config/images.ts`, which carries intrinsic dimensions and a
base64 blur placeholder per image so `next/image` never causes layout shift. Customer images are
never processed locally: they are uploaded straight to object storage through a signed URL and served
back from the API.
