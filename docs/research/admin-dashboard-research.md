# Admin dashboard — research

Stage 3 of the Pixelise build. Researched on **15 November 2026**, before any admin code was written.
Sources are listed with access dates at the end.

Scope: the internal console at `/admin` — overview metrics, users, generations, payments, credit
ledger, AI models, configuration and audit logs. Frontend only; the backend is stage 4.

---

## 1. Environment

| Dependency | Version | Relevance to this stage |
| --- | --- | --- |
| `next` | 16.4.6 | App Router, Cache Components, `proxy.ts` naming |
| `react` / `react-dom` | 19.3.0 | Server Components for tables, client islands for drawers/dialogs |
| `tailwindcss` | 4.3.3 | `@theme` tokens shared with the marketing site and customer app |
| `@radix-ui/react-dialog` | 1.3.1 | Detail drawer, confirmation modal, adjustment dialog |

Inherited decisions that must not change: the token set in `src/styles/globals.css`, Manrope, the
`ApiResult<T>` transport, the `(app)` shell patterns, and the no-mock-data rule.

---

## 2. Admin authorization: where the truth lives

The prompt's constraint is the important one — *hiding the navigation is not authorization* — and the
current guidance matches it: **the server decides on every request**, and the UI mirrors that decision
rather than making it.

**Roles belong in `app_metadata`, never `user_metadata`.** `user_metadata` is writable by the user
themselves through the SDK (`updateUser`), so authorizing on it is trivially exploitable; `app_metadata`
can only be written with the service-role key or an auth hook. [1][2][3]

**JWT claims alone are not enough for destructive operations.** `app_metadata` claims make RLS cheap
(`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`), but the recommended belt-and-braces pattern for
privileged actions is a second check against a controlled `user_roles` table inside the trusted server
path. Claims are a cache of the decision, not the decision as far as finance-affecting writes go. [2][3]

**Custom Access Token Hook** is the sanctioned way to inject a role into the JWT: a Postgres function
that reads `user_roles`, writes `claims.app_metadata.app_role`, and is granted execute **only** to
`supabase_auth_admin` (revoked from `authenticated`, `anon`, `public`). [3][4]

**Role changes are stale for up to the token lifetime.** JWTs are not invalidated when `app_metadata`
changes; a demoted admin keeps the old claim until refresh (often 60 minutes). The admin UI therefore
must not show permissions as instantaneous — and the backend must re-check the role on the server for
every write. [2]

**The service-role key never reaches the browser.** Every admin capability lives behind our own
`/api/v1/admin/*` routes, which call the service role server-side. [1][4]

### Decisions taken for this stage

| # | Decision | Reason |
| --- | --- | --- |
| 1 | `getAdminSession()` in `src/lib/admin-session.ts` is the only role reader; it calls `GET /api/v1/admin/me` | The UI cannot invent an admin. No `localStorage`, no decoded-JWT trust in the browser |
| 2 | `unauthenticated` → sign-in gate; `forbidden` → explicit 403 surface with **zero** data rendered | A non-admin must not see counts, names or even "not found" hints |
| 3 | Admin routes render server-side only; every mutation posts to an admin endpoint that re-authorizes | Client-side guards are UX, not security |
| 4 | A persistent "server-authorized" note sits on every write surface (suspend, adjust, refund) | Sets the expectation that the button is a request, not a capability |
| 5 | No admin route is indexable; all are disallowed in `robots.txt` | Same treatment as the customer app |

---

## 3. Accessible data tables (the core of this stage)

Tables are the product here, so the accessibility research drove the component design.

- **Native semantics first**: `<table>` with `<caption>`, `<th scope="col">`, `<th scope="row">` where a
  row has a name, `<thead>`/`<tbody>`. ARIA roles for tables are unnecessary and usually wrong. [5][6]
- **Sortable columns** put a real `<button>` inside the `<th>` (keyboard operable, natively focusable),
  set `aria-sort` on the `<th>` to `ascending` / `descending` / `none`, and only one column carries an
  active value at a time. [5][7]
- **Announce changes** that do not move focus: sorting and filtering results go to a polite live region
  ("12 users, sorted by signup date, newest first"). [5][7]
- **Scrollable regions must be reachable**: a horizontally scrollable wrapper needs `tabindex="0"` and an
  accessible name, otherwise keyboard users cannot scroll the table (WCAG 2.1.1). [8]
- **Reflow at 320px**: a two-dimensional scroll of the whole page is a 1.4.10 failure. Either a labelled
  scroll region for the table alone, or a card view of the same rows on small screens. This build does
  **both**: the table gets a labelled scroll region from `md` up, and below `md` the same records render
  as a definition-list card, so nothing needs horizontal dragging on a phone. [6][8]
- **Numbers right-align, identifiers use tabular figures**, and status is never colour-only — every
  badge carries a word as well as a tone. [8]
- **Pagination** is links with explicit names ("Next page of users"), not bare chevrons, and the result
  count is announced. [7]

## 4. What operational consoles actually do

Reviewed from public product documentation and screenshots (Stripe, Linear, Shopify, Vercel, Supabase
dashboards); used to understand structure, never copied visually.

| Product | Observed pattern | Adopted | Rejected |
| --- | --- | --- | --- |
| **Stripe** | Filter bar above the table, one row per object, click-through detail, money always right-aligned with its currency, status pills | Filter row → dense table → detail drawer/page; `₹` in every amount; explicit status words | Multi-step exports, radar charts |
| **Linear** | Very tight rows (32–36px), muted chrome, one accent, keyboard-first | 40px rows, hairline separators, violet only on primary actions | Command palette (not warranted yet) |
| **Shopify** | Contextual right-hand detail panels, empty states that teach, explicit "no results" vs "no data" | Drawer for generation/payment detail; two distinct empty states | Bulk-action toolbars |
| **Vercel** | Metric cards with a period selector, sparkline, "no data" honesty | 4 metric cards + period control; empty charts say so | Auto-refreshing live counters |
| **Supabase** | Configuration pages that show status of integrations without exposing secrets | Configuration page reports "configured / not configured" only | Embedded SQL/secret fields |

The recurring insight: **operational trust comes from precision, not decoration.** Every console that
felt trustworthy showed the exact period a number covers, distinguished "zero" from "unknown", and
attached an actor and a timestamp to every state change. That drives the metric-card footnote, the
`null → "Not available"` rule and the audit log.

## 5. Financial and audit surfaces

- **Nothing is declared successful on the client.** Payment status, refunds and credit adjustments are
  server-authored; the UI re-reads after a mutation instead of writing a local success state.
- **Every mutation carries a reason.** Credit adjustments require free-text justification and show the
  resulting balance before confirming; the same string is what the audit log records. [9]
- **Idempotency and confirmation** for money: a refund or adjustment is a two-step, confirmed,
  attributed action; the response returns the new balance so the table can be refreshed from truth.
- **Unknown is a state.** When the backend cannot compute a metric (for example "active customers"
  without a documented definition), the card shows "Not available" with the backend's explanation
  rather than a plausible-looking number. This is the direct consequence of the prompt's ban on
  invented active-user definitions.

## 6. Charts without lying

- The volume chart renders only aggregated series returned by the API, keyed by date, with the period
  printed above it.
- No percentage axis, no smoothing, no gradient fill, no animation — a flat bar per day is enough to see
  a spike or a gap.
- The chart carries a text summary and an equivalent visually-hidden table for assistive technology, and
  a "no data in this period" state when every bucket is zero.
- Success rate is shown as `completed / (completed + failed)` from server-provided counts, or
  "Not available" — never derived from a sample.

## 7. Sources (accessed 15 November 2026)

1. Supabase Auth Advanced — custom claims, `app_metadata` vs `user_metadata`, RLS with admin claims.
   https://dev.to/kanta13jp1/supabase-auth-advanced-custom-claims-row-level-security-and-session-management-32di
2. "How to Add Role-Based Access Control to Your App" (July 2026) — role assignment, JWT staleness,
   protecting the last admin.
   https://www.rapidevelopers.com/app-features/role-based-access-control
3. "Supabase RLS: Production Guide + Policy Recipes" (June 2026) — admin policies, claims lookup.
   https://www.agilesoftlabs.com/blog/2026/06/supabase-row-level-security-guide-2026
4. "Supabase Security Checklist for AI-Built Apps" (April 2026) — custom access token hook, grants,
   service-role handling.
   https://ubserve.com/platform-guides/supabase-security-checklist-ai-built-apps
5. "Accessible Data Table Pattern" (A11yPath, 2026) — caption, scope, sort buttons, `aria-sort`.
   https://a11ypath.com/patterns/data-table/
6. "Accessible Data Tables: Semantic HTML, scope & headers" (Aug 2026) — 1.3.1, 1.4.10 reflow, cell
   alternatives.
   https://accessibility.build/guides/accessible-data-tables
7. "Your data table probably fails screen readers (and WCAG 2.2)" (July 2026) — live regions,
   server-side paging, keyboard model.
   https://botmonster.com/web-dev/accessible-data-table-sorting-filtering-keyboard-navigation/
8. "Accessible Data Tables — a guide to WCAG & ADA compliance" (July 2026) — scroll regions, focus
   visibility, pagination naming.
   https://www.adacompliancepros.com/blog/accessible-data-tables
9. UX Patterns — Data Table anatomy and localization strings (March 2026).
   https://uxpatterns.dev/patterns/data-display/table

### Limitations

- The five consoles were reviewed from public documentation and screenshots, not by using internal
  accounts; interaction details are inference.
- No Supabase instance exists here, so RLS and claims are implemented to the documented contract and
  cannot be integration-tested until stage 4.
- No headless browser is available, so table accessibility was verified through markup, ARIA attributes
  and focus-order analysis rather than screen-reader passes.

## 8. What the build changed about the plan

Four findings from implementing the research, kept here so the next stage does not re-learn them.

1. **Portals have no server markup.** A Radix `Dialog.Portal` needs a DOM container, so a portalled
   drawer renders nothing in the first HTML frame — its content only exists in the flight payload.
   The console's record drawer therefore renders its content *in place* (still `fixed`, still
   focus-trapped) via a `portal={false}` option on the shared `SheetContent`. The acceptance criterion
   "shareable record URL" is only honest if the record is actually in the response.
2. **An authenticated segment must not be prerendered.** With `cacheComponents: true`, a build that
   had no `PIXELISE_API_BASE_URL` prerendered the "not connected" console shell; the first connected
   request then resumed into a different tree (`Expected the resume to render <div> … rendered <a>`).
   `await connection()` in the admin layout forces per-request rendering. The rule generalises: never
   let a staff surface become a static artifact whose shape depends on build-time environment.
3. **Sort controls belong inside `<th>` as links.** A `<button>` inside a header cell needs client
   state to work and loses the URL; a link keeps the console server-driven, bookmarkable and
   operable without JavaScript. `aria-sort` stays on the `<th>` and the accessible name of the link
   says whether the column is currently ascending or descending.
4. **The gate cannot set an HTTP status.** App Router layouts cannot change the response status
   without the experimental auth-interrupt API. The console therefore returns `200` with no
   privileged content for unauthenticated/non-staff visitors, and the *API* still answers `401`/`403`
   on every data request. This is recorded as a limitation in `docs/admin-dashboard.md` §8 and is the
   reason stage 4 should also reject at the proxy/API layer, not only in the layout.

No research conclusion was reversed: tables stayed native and server-driven, the overview stayed
honest about unknown metrics, and none of the five consoles' visual designs were copied.
