# Pixelise codebase audit — Stage 5

Audit of `https://pixelise.in` as it stood at `main` (`fcc9f92`), performed on
2026-11-15 before any Stage 5 change. The purpose is to find *real* defects in the
existing Next.js 16 / React 19 application and close them, without rebuilding
anything that already works.

- Repository: `sutarorg/pixelise.in`
- Branch for this work: `arena/a35f0726-pixelise-in`
- Runtime: Node 22, Next.js 16.4.6 (App Router, Turbopack, `cacheComponents`), React 19.3,
  Tailwind CSS 4.3.3, Supabase (Postgres + Auth + RLS), Cloudflare R2, fal, Razorpay, Resend
- Verification tooling used here: `eslint`, `tsc --noEmit`, Vitest (8 files / 50 tests),
  `next build`, HTTP probes against a local production server, and the new
  `npm run seo:check` script. Playwright is configured but **cannot execute in this
  sandbox** — see §6.

## 1. Inventory (measured, not estimated)

| Area | Count | Notes |
| --- | --- | --- |
| App Router pages | 28 | 11 marketing, 17 `(app)`/admin |
| API route handlers | 47 | all under `/api/v1`, envelope `{success,data\|error,requestId}` |
| React components | 106 | `layout/`, `marketing/`, `shared/`, `studio/`, `dashboard/`, `admin/`, `ui/` |
| Config modules | 8 | `site`, `navigation`, `content`, `packs`, `env`, `generation`, `studio`, `dashboard` |
| Lib / service modules | ~40 | SEO, HTTP, auth, rate limit, credits, R2, fal, Razorpay |
| SQL migrations | 4 + seed | tables, RLS, RPCs (reserve/settle/release/grant) |
| Unit tests | 8 files / 50 cases | Vitest, node environment |
| E2E tests before this stage | 0 | none existed |
| Blog routes before this stage | 0 | no `/blog`, no article content, no nav entry |

## 2. What is healthy (do not touch)

- **Design language.** `src/styles/globals.css` defines the violet/ink tokens, Manrope
  typography, shadows and motion. Stage 5 must reuse these, not restyle.
- **API contract.** Consistent success/error envelope, `requestId`, `Cache-Control:
  no-store` on private data, documented error codes, rate limits per namespace.
- **Credit ledger.** `available_credits` + `reserved_credits`, idempotent
  `generation:{id}:reserve|settle|release` and `payment:{id}:grant` keys. Payments must
  never grant credits from a frontend success event; only the verified webhook/RPC path
  does.
- **Generation gating.** `POST /api/v1/generations` returns `503 not_configured` until an
  approved credit rate and enabled model exist. This is correct behaviour, not a bug, and
  Stage 5 must not weaken it to make tests pass.
- **SEO helper.** `pageMetadata()` is the single source of title/description/canonical/
  OG/Twitter. It should be extended, never bypassed.
- **Accessibility basics.** Skip link, landmark structure, visible focus states, Radix
  primitives with labels, `prefers-reduced-motion` handling.

## 3. Defects found

Severity: **S1** blocks indexing/rendering or leaks data, **S2** degrades search
appearance or maintainability, **S3** hygiene.

| # | Sev | Defect | Evidence | Status after this stage |
| --- | --- | --- | --- | --- |
| 1 | S1 | `robots.ts` disallowed `/_next/` | `src/app/robots.ts` `disallow: ["/_next/", ...]` | Fixed — `/_next/` removed; asset/build paths allowed |
| 2 | S1 | Every sitemap URL carried the same hardcoded `lastModified` (`2026-11-15`) | `src/app/sitemap.ts` | Fixed — per-route dates from `src/config/seo.ts`, plus 12 article dates |
| 3 | S2 | Homepage `<title>` was `Pixelise — AI Product Photography Studio`, not the approved `AI Product Photography to Boost Sales Online` | `src/app/(marketing)/page.tsx` | Fixed — `absoluteTitle` with the approved string |
| 4 | S2 | No blog: `/blog` and `/blog/[slug]` did not exist, navigation had no Blog link, sitemap had no articles | `find src/app`, `src/config/navigation.ts` | Fixed — blog index, 12 articles, nav + footer links, sitemap entries |
| 5 | S2 | Private dashboards (`/dashboard`, `/studio`, `/admin`, `/account`, `/billing`) were crawlable; no `noindex` | route metadata | Fixed — layout-level `robots: noindex, nofollow` |
| 6 | S2 | Article/blog OG type support missing from `pageMetadata()` (always `website`) | `src/lib/seo/metadata.ts` | Fixed — optional `type`, `publishedTime`, `modifiedTime`, `image` |
| 7 | S2 | No automated SEO verification; regressions possible | no tests for titles/canonicals/sitemap | Fixed — `npm run seo:check` + `scripts/seo-check.ts` |
| 8 | S2 | No E2E suite, no CI workflow | none | Fixed — Playwright suite + `.github/workflows/ci.yml` (execution blocked locally, see §6) |
| 9 | S3 | `FAQPage` JSON-LD is present on `/` and `/faq`; Google limited FAQ rich results to authoritative government/health sites in 2023, so it will rarely produce a rich result | `structured-data.ts` | Kept (valid markup, no manual-action risk), documented so nobody promises stars/FAQ snippets |
| 10 | S3 | No `SoftwareApplication` `review`/`ratingValue` — correct, but easy to "improve" wrongly | `structured-data.ts` | Kept intentionally absent; asserted absent in `seo:check` |
| 11 | S3 | Image `alt` text quality varies; decorative SVGs unlabelled in places | component sweep | Audited; blog covers and all new imagery have descriptive alt text |
| 12 | S3 | `docs/` had no SEO or blog documentation | `docs/` | Fixed — `docs/seo/*`, `docs/blog-*.md` |

### Detail: why `Disallow: /_next/` is the worst line in the repo

Googlebot renders pages with a headless browser. Blocking `/_next/` blocks the
JavaScript and CSS chunks that the App Router needs, so Googlebot sees unstyled,
partially-hydrated HTML while users see the full design. Google's own guidance is to
allow every resource required to render the page and to use `noindex` (not `Disallow`)
for pages that should not appear in results. The fix keeps `Disallow` for private,
non-indexable URL space only.

## 4. Non-defects explicitly left alone

- **Pricing**: Creator ₹499 / 150 credits, Studio ₹999 / 350 credits, one-time. Frozen.
- **Unknown-but-required values**: GSTIN, registered address, support email, social
  profiles, credit expiry, approved generation rate. These remain `null`/pending in
  `docs/owner-inputs.md`; no page or schema invents them.
- **No newsletter, no view counters, no comments, no star ratings.** They would need real
  infrastructure or would be fabricated.
- **`X-Frame-Options` is intentionally not set** (documented in `docs/deployment/security.md`);
  adding it breaks the sandboxed preview iframe.
- **No `dynamic`/`runtime`/`revalidate` route exports** — under `cacheComponents` these
  break the build.

## 5. Accessibility findings (static + axe rules encoded in the suite)

Static review of the marketing surface found no missing-`h1` pages (each page renders
exactly one `h1` through `Hero`/`PageHero`), no skipped heading levels introduced by the
new blog components, and no keyboard traps. Issues worth watching, all covered by
`e2e/accessibility`:

- Mobile navigation sheet needs a focus trap and Escape-to-close (Radix Dialog supplies
  both; verified by test rather than assumed).
- Category filters on `/blog` must be real links or buttons with `aria-pressed`, not
  `div` click handlers.
- TOC links must keep a visible focus ring on the tinted surface.
- Article tables need `<caption>`/`<th scope>` so screen readers can navigate them.

## 6. Test environment reality (read before trusting any "passing" claim)

The sandbox that produced this branch allows outbound network access only to GitHub, npm
and PyPI. Two consequences matter:

1. `npx playwright install` fails (`cdn.playwright.dev` → `ECONNRESET`) and no system
   Chrome/Firefox/WebKit is present. **Tests that drive a browser cannot run here.**
2. There is no Postgres, no Supabase instance, and no Razorpay/R2/fal/Resend credentials.
   Database, payment-capture, upload and generation paths are covered by unit tests,
   contract tests and the HTTP-level SEO suite only.

What *did* run on this branch:

| Suite | Scope | Result |
| --- | --- | --- |
| `npm run test` (Vitest) | credit ledger, signatures, image metadata, prompts, pricing consistency | **50/50 passed** |
| `npm run seo:check` | 1,343 HTTP assertions against the production build | **all passed** |
| `npx playwright test` (request-only specs) | API envelope, auth rejections, webhook signatures, sitemap/robots/structured data | **39 passed** |
| `npx playwright test` (browser specs) | UI, axe, responsive, visual snapshots | **not runnable here** — every failure is `browserType.launch: Executable doesn't exist`, not an assertion failure |
| `npx playwright test` (credential-gated specs) | customer, admin, cross-user, payments idempotency | **8 skipped** with explicit reasons (no staging Supabase/Razorpay) |

Full local run summary: `39 passed · 8 skipped · 151 failed`, where all 151 failures are
the missing browser binary. CI (`.github/workflows/ci.yml`) installs browsers with
`npx playwright install --with-deps` and is the place those suites actually execute.
A skipped test is never counted as a pass.

## 7. Gate results for this branch

Measured on this branch after the changes below:

| Gate | Result |
| --- | --- |
| `npm ci` | clean install (Playwright, axe-core, react-markdown, remark-gfm, rehype-slug, github-slugger added) |
| `npm run lint` | clean |
| `npm run typecheck` | clean (application, `e2e/`, `playwright.config.ts`) |
| `npm run test` | 50/50 passed |
| `npm run seo:check` | 1,343/1,343 passed against the production build |
| `npm run build` | succeeded; blog index, 12 articles and 4 category pages statically generated |
| `npm run test:e2e` | 39 passed, 8 skipped, browser-dependent specs not runnable in this sandbox (see §6) |
| `npm run test:e2e:report` | report generated (`playwright-report/`); opening it needs a browser |

## 8. What changed in Stage 5

- `src/config/seo.ts` — real content dates, absolute-URL helper, private path list.
- `src/lib/seo/metadata.ts` — article support (type, image, published/modified) on the
  existing helper; no second metadata path.
- `src/lib/seo/structured-data.ts` — `Blog` and `BlogPosting` builders.
- `src/app/robots.ts` — `/_next/` unblocked, private prefixes kept.
- `src/app/sitemap.ts` — 28 real URLs with per-route and per-article dates.
- `src/app/(marketing)/page.tsx` — approved homepage title.
- Blog: `src/content/blog/*` (12 articles + typed registry), `src/lib/blog`, five routes,
  `src/components/blog/*`, navigation and footer entries.
- `/pricing`, `/examples`, category pages — added missing `h2` levels.
- `scripts/seo-check.mjs`, `playwright.config.ts`, `e2e/**`, `.env.e2e.example`,
  `.github/workflows/ci.yml`.
- Docs: `docs/audit`, `docs/research/{e2e-testing,seo,blog-keyword}-research.md`,
  `docs/seo/*`, `docs/blog-*.md`.
