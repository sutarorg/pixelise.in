# Customer dashboard — research

Stage 2 of the Pixelise build. Everything below was researched on **15 November 2026** before any
application code was written. Sources are listed at the end with the exact URLs and access dates.

Scope of this document: the customer-facing application (`/dashboard`, `/studio`, `/creations`,
`/credits`, `/transactions`, `/settings`, `/help`). The public marketing site is documented in
`docs/research/public-website-research.md`; the backend contract in `docs/API-CONTRACT.md`.

---

## 1. Environment and versions in this repository

| Dependency | Version | Why it matters here |
| --- | --- | --- |
| `next` | 16.4.6 | App Router, Cache Components, `proxy.ts` (not `middleware.ts`) |
| `react` / `react-dom` | 19.3.0 | `use()`, Actions, `useOptimistic` availability |
| `tailwindcss` | 4.3.3 | CSS-first `@theme` tokens — no `tailwind.config.js` |
| `typescript` | 5.x (strict) | Contract types are compiled, not asserted |
| `lucide-react` | 1.73.0 | Icon language inherited from stage 1 |
| `@radix-ui/react-dialog` | 1.3.1 | Confirmation dialog, mobile navigation sheet |

Stage 1 decisions that stage 2 inherits and must not break: Manrope via `next/font/local`, the token
set in `src/styles/globals.css`, `cacheComponents: true` + `partialPrefetching: true`, AVIF/WebP image
negotiation, and the ban on mock data.

---

## 2. Next.js 16 App Router: routing, proxy and authentication boundaries

**`middleware.ts` is deprecated and renamed `proxy.ts`.** In Next.js 16 the file convention is
`proxy.ts` exporting a function named `proxy` (or a default export), located at the project root or
inside `src/` alongside `app/`. A leftover `middleware.ts` is ignored **silently** — no warning, no
error, no protection. The `@next/codemod@latest middleware-to-proxy` codemod performs the rename.
[1][2]

**Proxy is a routing layer, not a security boundary.** The current guidance is explicit: use `proxy.ts`
for redirects, rewrites, headers and coarse "is there a session cookie" checks, and put real
authorization in the Server Component, Server Action or Route Handler that reads the data. Proxy now
runs on the Node.js runtime by default rather than Edge. [1][2][3]

**Decision for this stage.** The demo has no auth provider yet (stage 3 adds Supabase). Adding a
`proxy.ts` that redirects every `/dashboard` request to a `/login` page that does not exist would
produce a site nobody can review and would imply protection this build cannot back up. Instead:

- Route protection lives in `src/app/(app)/layout.tsx` via `requireSession()` — the layout is the
  data-adjacent guard, which is exactly where the 2026 guidance says the check belongs.
- Every server-side data read goes through `src/lib/api/client.ts`, which attaches the session and
  refuses to call out when the workspace service is not configured.
- `proxy.ts` is **not** added in this stage. It arrives in stage 3 alongside `/login`, `/signup` and
  the `__Host-` session cookie, and even then it will only do the cheap cookie check while the layout
  keeps the real authorization.

**Cache Components (`cacheComponents: true`) changes the rendering contract.** Any read of a runtime
API (`cookies()`, `headers()`, `searchParams`, `params`) must be inside a `<Suspense>` boundary, or
the build fails with the blocking-route insight. Static shells prerender; dynamic regions stream. [4]

**Decision.** Every app page renders a static shell (headings, layout, controls) with each
data-dependent region wrapped in its own `<Suspense fallback={<Skeleton/>}>`. This is not cosmetic:
it is the only pattern that survives `cacheComponents` while still letting the shell paint instantly.

`use cache` is deliberately **not** used anywhere in the app. Customer data (wallet, generations,
transactions) is per-user and must never enter a cache entry or a prefetch payload.

---

## 3. Supabase authentication (stage 3 — contract only here)

The current official pattern is `@supabase/ssr` with three clients and cookie-based sessions:

- **Server client** — `createServerClient()` reading `cookies()` from `next/headers`, with
  `getAll`/`setAll`. The `setAll` implementation is wrapped in `try/catch` because Server Components
  cannot write cookies; swallowing that specific failure is intended, and the token refresh is
  written by the proxy instead. [5][6]
- **Proxy client** — reads `request.cookies`, writes refreshed cookies onto the response, and must
  return the *same* response object it mutated, otherwise refreshed cookies are dropped. [5]
- **Browser client** — `createBrowserClient()` for realtime and client-side auth only.

**Use `getUser()` on the server, never `getSession()`.** `getSession()` returns whatever is in the
cookie without verifying the JWT; `getUser()` validates it with Supabase Auth. In the proxy,
`getClaims()` is the cheap check. [5][6]

**Decision for stage 2.** None of this is implemented. `src/lib/session.ts` defines the shape the
rest of the app consumes (`authenticated | unauthenticated | unconfigured`) and resolves
`unconfigured` until `PIXELISE_API_BASE_URL` exists. When Supabase lands, only that file and the
API client's auth header change; no page or component changes.

---

## 4. Razorpay checkout (contract only in this stage)

The flow is fixed and is not a design choice: [7][8]

1. Browser asks **our** server to create an order.
2. Our server calls `orders.create({ amount: paise, currency: "INR", receipt })` with the secret key.
3. Browser opens Razorpay Checkout with the returned `order_id` + public `key_id`.
4. Checkout hands back `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
5. Our server recomputes `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` and compares.
6. Only after verification — and ideally the `payment.captured` webhook — are credits added.

Consequences the UI must respect, and this build does:

- **The amount is never taken from the request body.** The client sends `{ packId }`; the server
  decides the amount. Credits are never granted from the frontend.
- **A successful checkout callback is not proof of payment.** The UI shows a *verifying* state after
  the callback and waits for the server's verified status; it never shows "Payment successful" from
  the client callback alone.
- **Webhooks are the source of truth.** Duplicate `x-razorpay-event-id` deliveries must be
  idempotent, so verification is keyed by order.
- The secret key never reaches the browser.

The frontend in this stage produces the request and handles every documented failure
(`payment_failed`, `verification_failed`, `order_expired`) with a retry path — but no credits, no
success screen.

---

## 5. Cloudflare R2 direct uploads (contract only in this stage)

Browser-to-R2 uploads use a server-minted presigned `PUT`: [9][10][11]

- The server validates the session, checks the MIME type against an allowlist, and binds **both**
  `ContentType` and `ContentLength` into the signature, so R2 itself rejects an oversized or
  retyped body.
- `expiresIn` is in **seconds** (120 is typical), not milliseconds.
- The browser `PUT`s the bytes directly to R2 with a `Content-Type` that is **byte-for-byte** the
  string that was signed. A mismatch returns `403 SignatureDoesNotMatch`; there is no fallback.
- R2 CORS must allow the app origin, `PUT`, and the `Content-Type` header.
- Object keys are namespaced by user id: `{userId}/{uuid}-{safeName}`.

**Decision.** The uploader validates file type/size *before* requesting the URL (better errors, less
wasted bandwidth), requests `POST /api/v1/uploads`, `PUT`s to the returned URL, then calls
`POST /api/v1/uploads/{id}/complete` so the server records the key and byte count. Files never pass
through a Next.js route handler, and the browser never sees a provider key.

---

## 6. Accessible application interfaces

WCAG 2.2 AA additions that matter most in this build: [12][13][14]

| Criterion | Level | What it demands here |
| --- | --- | --- |
| 2.4.11 Focus Not Obscured | AA | Sticky header + sticky mobile generate bar must never cover the focused control |
| 2.5.7 Dragging Movements | AA | Drag-and-drop upload needs a clickable "Browse files" equivalent (the `<input type="file">` itself) |
| 2.5.8 Target Size | AA | Every control ≥ 24×24 CSS px; mobile nav items are 44 px tall |
| 3.2.6 Consistent Help | A | Help lives in the same place on every page (sidebar item + account menu, same order) |
| 3.3.7 Redundant Entry | A | Profile data is never re-asked during checkout |
| 3.3.8 Accessible Authentication | AA | No cognitive test; password managers and paste must work in stage 3 |

File-upload specifics from the research: [15][16]

- A drop zone is not keyboard operable by default. The label must wrap a real file input so
  Enter/Space opens the picker, and the drop zone itself gets `tabIndex=0` + Enter/Space handling.
- Progress must be announced through a polite live region, and **not** on every percentage tick —
  meaningful transitions only ("Uploading", "Preparing your scene", "Done").
- Errors are attached to the field with `aria-describedby` and `aria-invalid`, and focus moves to the
  message when the operation finishes.
- A drag-only interaction is not acceptable; the file input is the canonical path and drag is an
  enhancement.

General application patterns applied: a real `<nav>` with `aria-current="page"`, skip link that lands
on `<main>`, one `<h1>` per page, disclosure-based account menu (not `role="menu"`), dialogs from
Radix Dialog for focus trapping, `prefers-reduced-motion` honoured globally (already in stage 1), and
no colour-only status (every status carries an icon and text).

---

## 7. What the closest products actually do

Reviewed from published product pages, help-centre documentation and 2026 comparisons — not copied,
only used to understand the shape of the workflow. [17][18][19]

| Product | Observed pattern | What Pixelise adopts | What Pixelise rejects |
| --- | --- | --- | --- |
| **Photoroom** | Product-first: remove → stage → resize → batch; strong "one product, many outputs" framing | Persistent source product on the left, outputs on the right | Batch/catalogued templates — out of scope for stage 2 |
| **Pixelcut** | Single workspace where upload, style presets and export sit together; mobile parity | One screen, no wizard; the phone layout keeps Generate reachable | Watermarked free tier, upsell modals on entry |
| **Pebblely** | Preset scenes as the primary creative choice, minimal configuration | Scene presets grouped and explained in plain language | Hidden credit burn on retries |
| **Canva** | Left tool rail + centre canvas + right inspector | Three-zone mental model (configure / preview / act) | Endless template browsing; the studio is a task, not a library |
| **Linear** | Dense but calm; keyboard-first; one accent colour; no card soup | Restrained elevation, hairline separators, one violet accent | Command palette, keyboard shortcuts (not warranted yet) |
| **Shopify** | Explicit credit/usage surfaces; empty states that teach | Wallet always visible in the header; empty states with one clear action | Dashboard KPI grids with fabricated trends |

The single most reusable insight: **creative tools fail at the "what happens after I click" moment.**
Every reviewed tool that felt trustworthy showed the cost before the click, kept the product visible
during processing, and made the result downloadable in one action. That drives the studio's
cost-before-generate rule and the always-present source thumbnail.

---

## 8. Credit wallets: what the UI is allowed to know

- The wallet has **available** and **reserved** balances. Reserved credits exist because a generation
  reserves before it settles; showing only "available" makes credits appear to vanish mid-job, so the
  dashboard surfaces both when the API provides them.
- The generation cost is **server-authored**. The frontend displays the number returned by
  `GET /api/v1/studio/config` and the per-request `estimatedCredits` from `POST /api/v1/generations`.
  It never computes cost from a local formula, and never deducts locally.
- Insufficient credits is a pre-flight state, not an error after the click: the Generate button
  becomes a Buy-credits action with an explanation of the shortfall.
- Reservations settle or refund on the server. The UI shows "reserved" until the job reaches a
  terminal state.

---

## 9. Decisions taken for this build

| # | Decision | Reason |
| --- | --- | --- |
| 1 | No `proxy.ts`; guard in `(app)/layout.tsx` | Next 16 proxy is a routing layer, not a security boundary; no `/login` exists yet |
| 2 | Every dynamic region in `<Suspense>` | Required by `cacheComponents`; shell stays static |
| 3 | `ApiResult<T>` discriminated union, never thrown | Loading/empty/error/unavailable are designed states, not exceptions |
| 4 | One documented capability seed (`src/config/studio.ts`) for styles, scenes, aspect ratios and quality | The prompt mandates these three styles and gives the scene families; the API contract makes the same file the seed the backend must return |
| 5 | No local credit cost, ever | Pricing is server-authored; a local formula would drift and lie |
| 6 | Upload validates before requesting a signed URL | Fewer round trips, better errors, and the server still re-validates |
| 7 | Checkout shows "verifying" after the Razorpay callback | A client callback is not proof of payment |
| 8 | No toast library, no chart library, no new dependency | Everything needed is CSS + Radix Dialog already installed |
| 9 | Account menu is a disclosure, not `role="menu"` | Same correction as stage 1: a nav is not a menu |
| 10 | Mobile: bottom tab bar (4 + Account sheet), not a hamburger drawer | Primary actions stay one tap away; matches how creative tools behave on phones |

---

## 10. Sources (all accessed 15 November 2026)

1. Next.js — `proxy.js` file convention (rename, matcher, migration).
   https://nextjs.org/docs/app/api-reference/file-conventions/proxy
2. "Goodbye middleware.ts, Hello proxy.ts: The Next.js 16 Migration Guide" (May 2026).
   https://www.rabinarayanpatra.com/blogs/hello-proxy-ts-nextjs-16
3. "Next.js Proxy vs Middleware in 2026: Auth, Redirects, and What Not to Put There" (July 2026).
   https://www.pean.dev/blog/nextjs-proxy-vs-middleware-in-2026-auth-redirects-and-when-not-to-use-it
4. Next.js — Caching with Cache Components (`use cache`, Suspense for uncached data, runtime APIs).
   https://nextjs.org/docs/app/getting-started/caching
5. "Supabase Auth + Middleware: Session Guide for Next.js 15" (July 2026) — three clients,
   `setAll` try/catch, return the mutated response.
   https://www.iloveblogs.blog/guides/supabase-auth-complete-session-middleware-guide
6. "How to set up Supabase Auth in Next.js App Router with shadcn/ui — fully wired" (Feb 2026) —
   `getClaims()` in the proxy, `getUser()` everywhere else.
   https://shadcnship.com/blog/supabase-auth-nextjs-15-app-router
7. Razorpay — Integration steps, Node.js server integration (order → checkout → HMAC verification).
   https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/
8. "Razorpay Integration in React + Node.js" (June 2026) — signature recomputation, webhooks as
   source of truth, amount never from the body.
   https://medium.com/@rajg1011/razorpay-integration-in-react-node-js-67efa2d2e1c5
9. "Cloudflare R2 Object Storage: Zero Egress, Signed Access, and Workers Bindings" (Aug 2026) —
   presigned PUT, `expiresIn` seconds, exact `ContentType` match, CORS.
   https://thearchitecturedeepdive.blog/articles/cloudflare-r2-object-storage.html
10. "Image Upload with Cloudflare R2" (June 2026) — `ContentLength` bound into the signature, MIME
    normalisation contract.
    https://zread.ai/InvolutionHell/involutionhell.github.io/14-image-upload-with-cloudflare-r2
11. "Browser uploads to Cloudflare R2 with AWS SDK" — CORS JSON, byte verification after upload.
    https://transloadit.com/devtips/browser-uploads-to-cloudflare-r2-with-aws-sdk/
12. WCAG 2.2 — nine new success criteria, complete guide (Oct 2025).
    https://a11yied.com/blog/wcag-2-2-complete-guide
13. "WCAG 2.2 Explained" (Sept 2026) — 2.5.7/2.5.8/2.4.11 testing steps.
    https://www.accessiblemetrics.com/blog/wcag-2-2-deep-dive-what-changed-what-is-new-and-how-to-comply/
14. Penn State Accessibility — WCAG 2.2 new guidelines text.
    https://accessibility.psu.edu/guidelines/wcag2update/
15. "How to Make React File Upload Progress and Errors Accessible" (Aug 2026) — keyboard drop zone,
    live-region cadence, error association.
    https://blog.filestack.com/accessible-react-file-upload/
16. "HTML File Upload Accessibility with WCAG and ARIA Best Practices" (June 2026).
    https://blog.filestack.com/html-file-upload-accessibility/
17. "PhotoRoom vs Pixelcut vs Pebblely: Which Is Best in 2026?" (Sept 2026) — workflow models.
    https://aitoolfinder.org/photoroom-vs-pixelcut-vs-pebblely/
18. "5 Photoroom Alternatives for AI Product Photography (2026)" (Aug 2026) — mobile parity,
    credit burn on retries.
    https://snappyit.ai/blog/photoroom-alternatives
19. "25 Best AI Photo Generators for Ecommerce Products (2026)" (Oct 2026) — entry workflows.
    https://pineable.com/blog/best-ai-photo-generators-for-ecommerce

### Limitations of this research

- These products were reviewed from their public documentation and published comparisons, not by
  using paid accounts; some interaction details (keyboard behaviour, error copy) are inference.
- No Supabase, Razorpay or Cloudflare account exists in this environment, so provider behaviour is
  implemented to the documented contract and cannot be integration-tested until stage 4.
- No headless browser is available in this sandbox, so accessibility was verified through rendered
  HTML, ARIA attributes, focus order analysis and CSS — not screen-reader testing.
