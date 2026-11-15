# Customer dashboard — stage 2

The customer application for Pixelise: the workspace a signed-in seller uses to spend credits, make
product visuals and manage their account. It extends the stage-1 repository — same tokens, fonts,
components and voice — and adds no second app.

- **Frontend only.** No database, no auth provider, no payment verification, no AI call, no API route.
- **No mock data anywhere.** Every panel has a designed loading, empty, success, error, unauthorized
  and service-unavailable state; none of them contains invented people, credits, images or payments.
- **Contract-first.** `src/lib/api/types.ts` + `docs/API-CONTRACT.md` Part II are the interface stage 4
  implements.

---

## 1. Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Welcome, balance, primary action, styles, recent creations, usage |
| `/studio` | `src/app/(app)/studio/page.tsx` | Upload → configure → generate → review → download |
| `/creations` | `src/app/(app)/creations/page.tsx` | Gallery with style filter, date sort, cursor pagination |
| `/creations/[id]` | `src/app/(app)/creations/[id]/page.tsx` | Full visual, source photo, metadata, download, delete |
| `/credits` | `src/app/(app)/credits/page.tsx` | The two packs, checkout, how credits work |
| `/transactions` | `src/app/(app)/transactions/page.tsx` | Credit movements and payments with type filter |
| `/settings` | `src/app/(app)/settings/page.tsx` | Profile, security, preferences, account deletion |
| `/help` | `src/app/(app)/help/page.tsx` | Answers, policies, how to reach a person |

All eight live in the `(app)` route group, are `noindex`, are disallowed in `robots.txt` and absent
from `sitemap.xml`. There is no `/login`: auth arrives in stage 3 and the shell already renders the
sign-in gate it will need (see §4).

## 2. The shell

```
┌───────────────┬────────────────────────────────────────────────┐
│ Pixelise      │ breadcrumb        credits · Buy · avatar menu   │ 64px sticky
│ 248px sidebar ├────────────────────────────────────────────────┤
│ Workspace     │                                                │
│  Dashboard    │   page content (bg #FAF9FF, cards on white)    │
│  AI Studio    │   max-width 78rem, 16–32px gutters             │
│  My Creations │                                                │
│ Account       │                                                │
│  Buy Credits  │                                                │
│  Transactions │                                                │
│  Settings     │                                                │
│  Help         │                                                │
│ ───────────── │                                                │
│ credits card  │                                                │
│ account       │                                                │
└───────────────┴────────────────────────────────────────────────┘
   ≤1023px: sidebar and header collapse to a logo + credit chip + avatar,
            and a 5-slot bottom bar (Dashboard, Studio, Creations, Credits, Account).
```

- **Credit balance is always on screen** — header chip everywhere, a second compact card at the
  bottom of the desktop sidebar, and the big card on the dashboard.
- **Phone navigation** is a bottom bar with 56px targets, safe-area padding and an account drawer for
  Transactions, Settings, Help and sign-out. Nothing important hides behind a hamburger.
- **Account menu** is an APG disclosure (button + `aria-expanded` + `aria-controls`), not a
  `role="menu"`: its contents are links, and a menu role would promise arrow-key behaviour that does
  not exist. Escape closes it and returns focus.

## 3. Rendering model

`cacheComponents: true` is on from stage 1, so the rules are strict:

- Every page renders a **static shell** (headings, layout, form scaffolding) and wraps each
  data-dependent region in its own `<Suspense>` with a skeleton sized like the real content.
- Reads go through `src/lib/api/server.ts`, which forwards the session cookie and returns
  `ApiResult<T>` — never throws. `getProfile`, `getWallet`, `getPacks`, `getPreferences` and
  `getStudioConfig` are wrapped in React `cache()` so the frame and the page body share one request
  per render.
- Nothing customer-specific is ever put in `use cache`, a CDN cache or a prefetch payload;
  responses are `no-store`.
- The shell itself reads the session, so the layout suspends once, then streams the page. Build output
  confirms it: the eight app routes are `◐` (partial prerender) with static shells, the eleven
  marketing routes remain `○`.

## 4. Session and the gate

`src/lib/session.ts` is the only place that answers "who is signed in?":

| State | When | What renders |
| --- | --- | --- |
| `unconfigured` | no `PIXELISE_API_BASE_URL` (this build) | Full shell; every region shows its "not connected" state; no request is made |
| `unauthenticated` | service answers 401/403 | Sign-in gate in place of the page, with a link back to pixelise.in |
| `unavailable` | service unreachable | Service-unavailable panel with retry |
| `authenticated` | `/me` returns a profile | The workspace, with real name and balance |

Route protection lives in `src/app/(app)/layout.tsx`, next to the data. There is **no** `proxy.ts` in
this stage: Next 16 renamed it and explicitly describes it as a routing layer rather than a security
boundary, and there is no `/login` to redirect to yet. Stage 3 adds Supabase (`@supabase/ssr`,
`getUser()` server-side, `getClaims()` in the proxy) plus `/login` and `/signup`; only `getSession()`
changes.

## 5. State coverage per page

| Page | Loading | Empty | Error / unavailable | Success | Unauthorized |
| --- | --- | --- | --- | --- | --- |
| Dashboard | welcome, balance, recent skeleton | "Your creative workspace is ready." | per-region notice + retry | balances, cards, gallery | gate |
| Studio | 4 step skeletons + canvas | "Add a product photo to begin" | upload or generate failure with retry | result + metadata + download | gate |
| Creations | filter bar + 8 card skeletons | "No creations yet" / filtered variant | full-page error with retry | grid, load-more, delete | gate |
| Creation detail | 2-block skeleton | "This visual isn't available" (deleted/foreign, same surface) | error panel + back | image, details, source | gate |
| Buy credits | 2 pack skeletons | n/a (fixed catalogue) | "Checkout isn't connected here" + honest failure | packs, Razorpay, verifying | gate |
| Transactions | chips + row skeletons | "No credit activity yet" / filtered variant | error panel | table + cursor paging | gate |
| Settings | 4 section skeletons | "No account is connected" | preference save errors inline | forms with saved state | gate |
| Help | static | static | static | static | gate |

## 6. The studio

The only page with real client logic; everything else is mostly server-rendered.

### 6.1 Flow

```
photo chosen (local object URL only)
   → Generate
   → POST /uploads        → presigned PUT ticket
   → PUT  <uploadUrl>     → bytes go browser → R2, never via Next.js
   → POST /uploads/:id/complete → assetId
   → POST /generations    → { generation, estimatedCredits }
   → GET  /generations/:id every 2.5s (max 48 polls)
   → completed | failed
```

`StudioPhase` (`src/components/studio/types.ts`) keeps the browser's work separate from the service's:
`idle → uploading → preparing → processing → completed | failed`. The generate button is disabled
while any of those are in flight, so a double click cannot create two jobs.

### 6.2 What the UI refuses to invent

- **Cost.** `QualityOption.credits` is `null` in the seed and comes from the service otherwise. Until
  it is known the panel shows `—` and says the studio confirms the number before reserving anything.
- **Progress.** No percentage. The bar is indeterminate and the label is the real job status
  (`queued` → `preparing` → `rendering`), because the provider does not report a fraction.
- **Results.** Nothing is shown until a response contains `status: "completed"` and a `resultUrl`.
- **Credits.** No local deduction. Reserved/settled values come back from the service; the failure
  copy says reserved credits are released automatically, which is the contract's behaviour.
- **Upload completion.** A local object URL is only a preview of the customer's own file; it is never
  presented as an uploaded asset.

### 6.3 Upload accessibility

The drop zone is an enhancement, not the only path: the `<input type="file">` is present and
keyboard-operable, and a "Browse files" button opens the same picker (WCAG 2.5.7). Validation runs
before any network call — type, size and a 640px minimum short edge — with the message attached to the
input through `aria-describedby` and `role="alert"`. Upload progress is announced once per phase, not
per tick.

### 6.4 Scene catalogue

Scenes come from `GET /studio/config` and are filtered by the selected style. While the service is
unavailable, the documented seed in `src/config/studio.ts` is shown and labelled as the default
catalogue in a visible notice — the UI never lists a scene that the backend has not agreed to render.

## 7. Components

All 18 requested components exist, built on the stage-1 primitives (no duplicate buttons, dialogs or
tokens):

| Component | File |
| --- | --- |
| DashboardSidebar | `src/components/app/app-sidebar.tsx` (+ `sidebar-nav.tsx`) |
| DashboardHeader | `src/components/app/app-header.tsx` (+ `header-title.tsx`) |
| MobileNavigation | `src/components/app/mobile-nav.tsx` |
| CreditBalance | `src/components/app/credit-balance.tsx` (chip, summary card, buy button) |
| BuyCreditButton | `src/components/app/credit-balance.tsx` |
| ImageUploader | `src/components/studio/image-uploader.tsx` |
| PhotographyStyleCard | `src/components/studio/photography-style-card.tsx` |
| SceneSelector | `src/components/studio/scene-selector.tsx` |
| GenerationSettings | `src/components/studio/generation-settings.tsx` |
| GenerationStatus | `src/components/studio/generation-status.tsx` |
| GenerationPreview | `src/components/studio/generation-preview.tsx` |
| ImageGrid / ImageCard | `src/components/creations/creations-browser.tsx`, `generation-card.tsx` |
| EmptyState / ErrorState | `src/components/app/state-views.tsx` |
| LoadingSkeleton | `src/components/ui/skeleton.tsx` + per-page skeletons |
| ConfirmationDialog | `src/components/ui/confirmation-dialog.tsx` |
| TransactionTable | `src/components/transactions/transaction-table.tsx` |
| CreditPackCard | `src/components/credits/credit-pack-card.tsx` |

Supporting pieces: `section-card.tsx`, `page-header.tsx`, `retry-button.tsx`, `alert.tsx`,
`progress.tsx`, `switch.tsx`, `delete-creation-button.tsx`, `checkout-button.tsx`,
`creations-filters.tsx`, profile/security/preferences/delete settings panels.

## 8. Design language, extended not replaced

Nothing in `src/styles/globals.css`'s token set changed. The dashboard adds only *applications* of it:

- White sidebar and header, `#FAF9FF` workspace canvas, `#ECEAF4` hairlines, `14–18px` radii.
- One violet (`#6045F5`) reserved for the primary action, the active nav state and brand marks;
  filters and secondary selections use `violet/10` tints so the CTA stays the loudest thing on screen.
- Type: 11px uppercase section labels, 13–14px UI text, 15–16px card titles, 24–30px page titles —
  smaller than the marketing site, which is what makes a workspace feel dense rather than shouty.
- Elevation: `shadow-card` on panels, `shadow-lift` on the canvas status pill, `shadow-float` on
  dialogs. No glassmorphism, no gradient text, no neon.
- Empty states are designed objects (icon tile, one sentence, one action), not grey boxes.
- Icons are Lucide only, at 1.8–2.2 stroke, 14–18px, always paired with text — status is never
  colour-only.

## 9. Accessibility (WCAG 2.2 AA target)

- Skip link to `<main id="main" tabIndex={-1}>` on every app page.
- One `<h1>` per page; sections use `<h2>`; cards use `<h3>`.
- Navigation is `<nav aria-label="Dashboard">` with `aria-current="page"`; filters use
  `aria-current` on links and `role="group"` + `aria-label` on the cluster.
- Style, scene, aspect-ratio and quality pickers are **real radio groups** in `<fieldset>`/`<legend>`,
  so arrow keys work, the label is the target, and selection is announced.
- Drag-and-drop has a keyboard equivalent (`input[type=file]` + Browse button) — WCAG 2.5.7.
- Targets ≥ 24×24 CSS px (bottom bar 56px, icon buttons 32–36px).
- Focus is never obscured: the sticky header is 64px and every in-page anchor carries
  `scroll-margin-top`; the mobile bottom bar sits below content padding.
- Dialogs come from Radix Dialog: focus trap, Escape, `aria-modal`, return focus.
- Live regions for asynchronous results (`role="status"` on generation progress, `role="alert"` on
  failures), announced once per state change rather than per poll.
- `prefers-reduced-motion` collapses every animation globally (inherited from stage 1); the studio's
  auto-scroll uses `behavior: "auto"` in that case.
- Images carry descriptive alt text; decorative artwork carries `alt=""`.

## 10. Performance

- Static shells; no client-side data fetching on first paint.
- Gallery renders the first 24 items and appends on demand — an account with 400 creations never
  ships 400 image tags.
- Remote images use a fixed aspect ratio + `loading="lazy"` + `decoding="async"`, so there is no
  layout shift and no optimiser rewrite of a signed URL.
- Local artwork continues to use `next/image` with AVIF/WebP negotiation and blur placeholders.
- No new runtime dependencies: the only additions to `package.json` are zero (Radix Dialog, Slot,
  CVA and Lucide were already present). `server-only` was added as the guard for the server client.
- Client JS is limited to the shell's two disclosures, the studio, the gallery's load-more, the
  checkout button and the settings forms.

## 11. Connecting the backend (stage 4 checklist)

1. Set `PIXELISE_API_BASE_URL` (server) and `NEXT_PUBLIC_API_BASE_URL` (browser). Every "not
   connected" state disappears on the next deploy; no component changes.
2. Implement the endpoints in `docs/API-CONTRACT.md` §10–§15 with the exact shapes in
   `src/lib/api/types.ts` — the client compiles against them.
3. Add Supabase for `/login`, `/signup`, the session cookie and the proxy; replace the body of
   `getSession()`.
4. Configure R2 (bucket, CORS for `PUT` + `Content-Type`, 20 MB limit) and Razorpay (orders,
   verification, webhook).
5. Delete the stage-1 note in `docs/owner-inputs.md` items that this stage can now answer (invoice
   copy, refund window, support address) and publish them.

## 12. QA evidence — 15 November 2026

| Check | Result |
| --- | --- |
| `npm run lint` | clean (React Compiler rules included — no `setState` in effects) |
| `npm run typecheck` | clean |
| `npm run build` | 25 routes: 11 static marketing, 8 partial-prerender app routes, 6 asset/meta routes |
| Route smoke test | all 19 routes return 200; 29 internal links resolve; 0 broken |
| Sitemap / robots | 11 public URLs; all eight app routes disallowed; app pages `noindex` |
| Shell structure | `#main`, skip link, `aria-current`, sidebar hidden < 1024px on every app page |
| Images | 0 `<img>` without `alt` on any app route |
| Studio contract | file input accepts the 3 MIME types; 3 style radios, style-filtered scenes, 4 ratios; cost renders `—`; Generate disabled with no photo |
| Deleting / checkout / settings | every mutation calls the API and reports failure honestly; no optimistic success |

Not tested here: real device/browser rendering, screen-reader passes and provider integrations — see
the limitations at the end of `docs/research/customer-dashboard-research.md`.

## 13. Known limits and open inputs

- Visual QA is HTML/CSS/layout analysis, not screenshots: no headless browser is available.
- Empty-state designs are only reachable once the service returns an empty collection; with no
  backend, those pages show the explicit "unavailable" state instead.
- The scene catalogue, aspect ratios and quality modes are a **proposal** in `src/config/studio.ts`
  until stage 4 returns its own config.
- Unknowns a human must decide: GST/invoice wording, refund window, support inbox, data-retention
  period, password policy. Tracked in `docs/owner-inputs.md`.
