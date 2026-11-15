# Pixelise — website, customer dashboard, admin console and production backend

**Pixelise** is an AI product photography studio for ecommerce. This repository holds the public
marketing site, the customer workspace and the internal operations console, built as one Next.js App
Router application.
Next.js 16.4, React 19.3, TypeScript (strict), Tailwind CSS v4.

> **Stage 4 of 4.** The backend now lives in this repository: `/api/v1` route handlers, Supabase
> Postgres + Auth, Cloudflare R2 for images, fal.ai for generation, Razorpay for the two credit
> packs, and Resend for transactional email. The three frontends call those routes — nothing is
> mocked, and a surface whose provider is not configured says so instead of inventing data.
>
> Two things are deliberately switched off until the owner decides them: **generation credit
> pricing** (no approved rate ⇒ no charging, no generation) and **admin roles** (granted by hand in
> Supabase). See `docs/owner-inputs.md`, `docs/architecture/production-readiness.md`.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (marketing routes static, app routes partial, /api/v1 dynamic)
npm run start      # serve the production build
npm run lint       # eslint (next lint was removed in Next 16)
npm run typecheck  # tsc --noEmit
npm test           # vitest: unit + contract tests, no network, no database
npm run assets     # rebuild WebP derivatives + image manifest from the raw masters
```

Tests never touch Supabase, fal, Razorpay, R2 or Resend, and never make a payment or a paid AI
call. The database invariants that cannot be unit-tested are covered by the staging checklist in
`docs/architecture/credit-system.md` §7.

## Environment

Copy `.env.example` to `.env.local`. The app still builds with no variables at all — that is how the
"not connected" states are exercised — but nothing real works until Supabase and R2 are set.

| Group | Variables |
| --- | --- |
| App | `NEXT_PUBLIC_APP_URL`, `PIXELISE_API_BASE_URL` (optional), `CRON_SECRET`, `IP_HASH_SALT` |
| Database + auth | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Images | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| Generation | `FAL_KEY` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |

`.env.example` documents purpose, scope (public vs server) and where each value comes from. Setup
walkthroughs: `docs/deployment/{vercel,supabase,cloudflare-r2,razorpay,fal,resend}-setup.md`.

### First run, in order

```bash
npm install
supabase link --project-ref <ref> && supabase db push     # schema + functions + RLS
psql "$DATABASE_URL" -f supabase/seed.sql                 # models disabled, no pricing
npm run dev
```

Then promote yourself to admin (`docs/deployment/supabase-setup.md` §4), enable one model
(`docs/deployment/fal-setup.md` §3) and approve a credit rate
(`POST /api/v1/admin/pricing`). Generation stays off until that last step, by design.

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

**Admin console** (`src/app/admin/`, noindex, disallowed in robots): `/admin` (overview), `/admin/users`,
`/admin/users/[id]`, `/admin/generations`, `/admin/payments`, `/admin/credits`, `/admin/models`,
`/admin/settings`, `/admin/audit-logs`. Staff only — the API decides, on every request.

## Backend

```
src/app/api/v1/
  public/{config,contact}      me, me/preferences       auth/*
  credits/{packs,wallet,transactions}                   studio/config
  uploads, uploads/[id]/complete                        generations, creations
  payments/{orders,verify}, payments      webhooks/{razorpay,fal}
  admin/{me,overview,users,generations,payments,credits,models,config,settings,pricing,audit-logs,reconcile}
src/services/    credits, uploads, generations, payments, email, admin, profile, reconciliation
src/lib/         http (envelope, errors, rate limit), supabase, auth, storage (R2), ai (fal), payments, email, validations
supabase/migrations/  0001 schema · 0002 functions · 0003 RLS · 0004 admin helpers · seed.sql
```

Every response is `{success,data|error,requestId}` with a safe code and no internals. Docs:
`docs/architecture/` (system, decisions, schema, API, security, credits, AI, payments, storage,
readiness).

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
    admin/                  operations console (own shell, admin gate, noindex)
      layout.tsx            the admin gate + shell; the only place an admin is resolved
      users/ generations/ payments/ credits/ models/ settings/ audit-logs/
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
    admin/                  console: sidebar, header, data table, filters, pagination,
                            detail drawer, credit adjustment, audit table, volume chart, states
    creations/ transactions/ credits/ settings/   page-level components
  config/                   site, navigation, pricing (real business config), content, gallery,
                            generated image manifest, dashboard nav, studio capability seed
  lib/
    api/                    types (domain + transport), core (fetch, errors), server, browser,
                            admin-types / admin (paths + mutations) / admin-server (reads)
    session.ts              session resolution consumed by the shell
    admin-session.ts        the only "is this an admin?" reader (stage 4 swaps its body)
    admin-filters.ts        URL-as-state helpers for console filters, sort and cursors
    format.ts               locale-stable money, credits, dates, byte sizes
    upload.ts               client-side file validation
    seo/  contact/          metadata + structured data, typed contact contract
  fonts/                    Manrope variable woff2 (OFL) + currency subset
  styles/globals.css        design tokens, base layer, type utilities, motion
docs/                       research, design system, routes, assets, owner inputs, API contract,
                            customer dashboard, admin console
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

## How the console behaves without a backend

`/admin` resolves the operator through the same API. Without `PIXELISE_API_BASE_URL` the shell renders
with a "not connected" strip and every panel reports `not_configured`; with the service configured but
the caller not signed in, or not staff, the console renders a sign-in gate or a bare 403 with no
navigation, counts or record ids. There are no demo customers, revenue figures, charts, payments,
audit entries or model catalogues anywhere in the build.

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
| `docs/research/admin-dashboard-research.md` | Supabase RBAC, accessible ops tables, patterns adopted/rejected from five SaaS consoles, honest aggregation, 9 sources |
| `docs/admin-dashboard.md` | Console routes, authorization posture, data flow, component map, six states, a11y decisions, deliberate limitations, QA log |
| `docs/API-CONTRACT.md` | Typed contracts for the backend (Part II = dashboard, Part III = console, Part IV = what stage 4 changed) |
| `docs/research/backend-architecture-research.md` | Sources behind the backend: Next 16 route handlers, Supabase SSR/RLS, fal queue, Razorpay, R2, Resend |
| `docs/architecture/system-architecture.md` | Layers, request lifecycle, async work, failure outcomes, environments |
| `docs/architecture/technical-decisions.md` | 13 ADRs with the alternatives that were rejected |
| `docs/architecture/database-schema.md` | Tables, functions, indexes, RLS and the verification status of the migrations |
| `docs/architecture/api-reference.md` | Every `/api/v1` endpoint, codes, limits and the deprecated aliases |
| `docs/architecture/security.md` | Identity, uploads, payments, idempotency, privacy, and what is *not* claimed |
| `docs/architecture/credit-system.md` | Wallet model, ledger invariants, idempotency keys, staging checklist |
| `docs/architecture/ai-generation.md` | Model routing, prompt rules, pipeline, failure messages |
| `docs/architecture/payment-flow.md` | Trust boundaries, grant path, reconciliation, tax gap |
| `docs/architecture/storage-flow.md` | R2 keys, upload verification, signed downloads, CORS, deletion |
| `docs/architecture/production-readiness.md` | Launch checklist: verified here vs needs staging vs owner action |
| `docs/deployment/*.md` | Vercel, Supabase, Cloudflare R2, Razorpay, fal, Resend setup |

## Image pipeline

Masters live in `public/images/marketing/raw/` (git-ignored, ~23 MB). `npm run assets` produces the
17 committed WebP derivatives plus `src/config/images.ts`, which carries intrinsic dimensions and a
base64 blur placeholder per image so `next/image` never causes layout shift. Customer images are
never processed locally: they are uploaded straight to object storage through a signed URL and served
back from the API.
