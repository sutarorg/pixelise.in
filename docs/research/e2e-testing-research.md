# E2E testing research

Research notes behind the Playwright suite added in Stage 5. Every claim about
Playwright behaviour was checked against the official documentation
(<https://playwright.dev/docs/intro>); claims about *this* repository were checked by
reading the code and running the app.

## 1. Why Playwright for this app

- The marketing site and both dashboards are React client components inside the App
  Router; correctness depends on hydration, client routing, and Radix portals. Unit tests
  cannot catch a broken menu or a hydration mismatch.
- Secrets must stay server-side. The payment start, credit grant and generation flows are
  API routes with strict contracts, so E2E has to drive the real HTTP surface, not mocks.
- One runner covers Chromium, Firefox and WebKit with the same spec files — useful
  because WebKit exposes Safari-only CSS and focus quirks (e.g. `:focus-visible` on
  buttons, `backdrop-filter`, sticky headers).
- `webServer` support means the suite boots `next start` itself and refuses to test
  against whatever happens to be on port 3000.

Reference: `https://playwright.dev/docs/test-configuration` (top-level options,
`projects`, `webServer`), `https://playwright.dev/docs/test-fixtures`.

## 2. Configuration decisions

| Decision | Value | Reason |
| --- | --- | --- |
| `testDir` | `e2e` | keeps specs out of `src/` and out of the Next build |
| `fullyParallel` | `true` | specs are independent; each test creates its own data or uses read-only pages |
| `forbidOnly` | `!!process.env.CI` | a stray `test.only` must fail CI |
| `retries` | `2` on CI, `0` locally | CI flake tolerance without hiding local failures |
| `workers` | `1` on CI | Supabase-backed tests share seeded rows; serial avoids cross-test credit races |
| `globalTimeout` | 45 min | guarantees a report instead of a hung job |
| `trace` | `on-first-retry` | full trace only when needed; keeps artifacts small |
| `screenshot` / `video` | `only-on-failure` / `retain-on-failure` | CI uploads these |
| `baseURL` | `E2E_BASE_URL` (default `http://127.0.0.1:3100`) | production build served by `webServer` |
| `webServer.command` | `npm run build:e2e` equivalent: `next build && next start -p 3100` | tests must run the production bundle, not dev |
| `webServer.reuseExistingServer` | `!process.env.CI` | fast local loops |

Production is never a valid target: the config fails fast if `E2E_BASE_URL` points at
`pixelise.in` (see `e2e/fixtures/env.ts`), because payment and credit tests must not touch
live data.

## 3. Browser × viewport matrix

Testing 3 browsers × 6 viewports × every spec is 18 runs per test and hours of CI time for
little extra signal. The matrix is split by intent:

- **chromium-desktop** (1280×800): the full functional suite.
- **firefox-desktop** and **webkit-desktop**: the cross-browser smoke subset —
  navigation, mobile menu, blog reading, forms validation, one authenticated page.
- **chromium-mobile** (390×844, `isMobile`, touch): mobile nav, sticky CTA, blog layout.
- **chromium-responsive** (360, 390, 768, 1024, 1280, 1440 in one spec): horizontal
  overflow, tap-target size, heading clipping, table scrolling.

Projects are gated with `grep`/`grepInvert` and `testIgnore` so `@smoke` and `@responsive`
tags select the right specs. Keep the tag list small; tags are checked by the
`e2e/helpers/tags.ts` constants.

## 4. Auth strategy

- Tests never type a password. `e2e/fixtures/auth.ts` calls a staging-only Supabase
  Admin API helper through a setup project and stores `storageState` per role
  (`customer`, `customer-b`, `admin`).
- If staging credentials are absent, auth-dependent specs `test.skip()` with an explicit
  reason string, and the run summary prints which role was unavailable. A skipped test is
  never reported as a pass.
- The two-customer setup exists to prove **cross-user isolation**: customer B must get
  `404`/`403`, never customer A's generation or order.
- No admin session is ever created by an unauthenticated API call; admin specs require
  `E2E_ADMIN_*` and the admin role in the database.

## 5. Payments and generation rules encoded in the suite

- Razorpay **test mode keys only**. `e2e/fixtures/env.ts` asserts the key id starts with
  `rzp_test_`; if it starts with `rzp_live_` the suite aborts before any test.
- No real card entry: the suite uses Razorpay's hosted test checkout with the documented
  test instruments, or asserts the redirect/order-creation contract when the checkout
  frame is unavailable.
- "Credits exactly once": the assertion is a wallet read before and after a duplicate
  webhook delivery. The test posts the same `payment.captured` event twice and expects
  the same balance (`payment:{id}:grant` idempotency).
- "Never grant from the frontend": a test opens the success URL with `?payment_id=` and
  asserts the wallet is unchanged; credits only move after the server-side verification
  endpoint receives a valid signature.
- Generation is currently `not_configured`. The suite asserts exactly that: `503`,
  `error.code === "not_configured"`, wallet unchanged, no `<img>`/result component
  rendered. A real-generation smoke test exists behind `E2E_REAL_GENERATION=1` and is
  skipped otherwise.

## 6. Accessibility

`@axe-core/playwright` runs `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` rules on every
public page, the blog index, one article, the studio, dashboard and admin home. Colour
contrast is included because the design uses tinted violet surfaces. Known accepted
exclusions (if any) are declared per-test with a comment, never globally.

## 7. Visual and responsive snapshots

- Baselines are per-project, per-viewport, and generated on Linux CI images. macOS/WSL
  fonts differ, so local baselines are treated as throwaway.
- Snapshots are limited to stable, data-free surfaces: marketing pages, blog index and
  article header, 404, and empty states. Dashboards with live counts are excluded.
- Every page is also checked for `document.documentElement.scrollWidth <= viewport width`
  — the cheapest reliable way to catch mobile overflow.

## 8. What cannot be verified in this environment

- Browser binaries are unavailable (`cdn.playwright.dev` is unreachable), so every spec
  that drives a `page` **cannot execute** here. Specs written against the `request`
  fixture do run: the API contract, auth-rejection, webhook-signature, sitemap/robots and
  structured-data checks pass locally (39 tests). Browser-dependent specs fail with
  `browserType.launch: Executable doesn't exist` — a missing binary, never an assertion.
  CI installs browsers with `npx playwright install --with-deps`.
- Credential-gated specs (customer, admin, cross-user isolation, payment idempotency) skip
  with explicit reasons so the run never overstates coverage.
- Supabase, Razorpay, R2, fal and Resend are unconfigured; auth, payment capture, upload
  and generation scenarios need staging credentials and seeded data. These are listed as
  owner/staging actions in `docs/deployment/production-readiness.md`.
- Core Web Vitals field data (CrUX) needs real traffic; only synthetic Lighthouse-style
  checks are possible, and are advisory.

## 9. CI shape

`.github/workflows/ci.yml` runs install → lint → typecheck → unit → seo:check → build on
every push and PR, then installs Playwright browsers and runs the E2E suite with the HTML
report, traces, screenshots and videos uploaded as artifacts (always, not only on
failure, so a passing run still proves what was tested).
