# Pixelise admin console

The internal operations console at `/admin`. Stage 3 ships the **frontend only**: the console reads
a documented API, renders exactly what it receives, and refuses to invent anything while the backend
is being built.

- Research and prior art: `docs/research/admin-dashboard-research.md`
- Endpoint contract: `docs/API-CONTRACT.md` Part III (§17–§29)
- Public routes and the customer dashboard: `docs/route-map.md`, `docs/customer-dashboard.md`

## 1. What it is

A dense, quiet ops surface on the same design system as the rest of Pixelise — white surfaces, dark
navy type, violet primary, hairline borders, compact rows. It is deliberately *not* a marketing page
and *not* the customer studio: fewer shadows, smaller type scale, more data per screen, no decorative
charts, no gradients, no oversized cards, no illustration.

Every number on every screen comes from the API. There is no seeded data, no example revenue, no
sample customers, no placeholder chart series, no "recent activity" carousel and no fake notification
bell. A fresh installation with zero records looks like a finished product with empty states, not
like a demo.

## 2. Route map

| Route | Purpose |
| --- | --- |
| `/admin` | Overview: period select (7/30/90/custom), customer, revenue, credit and generation totals, success rate, daily volume. |
| `/admin/users` | Searchable, sortable, filterable customer list. |
| `/admin/users/[id]` | One customer: account, status, balance, recent generations, payments and ledger. |
| `/admin/generations` | Every job with status/model/style/customer/date filters and a detail panel (`?record=`). |
| `/admin/payments` | Razorpay orders with search, status and date filters and a detail panel (`?record=`). |
| `/admin/credits` | The append-only credit ledger, with the adjustment dialog. |
| `/admin/models` | Provider catalogue with modes, resolutions, credit rules and a routing toggle. |
| `/admin/settings` | Read-only configuration: general, generation, payments, email. |
| `/admin/audit-logs` | The privileged-action trail. |

All nine are `noindex, nofollow, nocache` and `/admin` is disallowed in `robots.txt`. Nothing here is
linked from the public site or the customer dashboard.

## 3. Authorization posture

The console treats the browser as untrusted and the service as the only authority.

- **One role reader.** `src/lib/admin-session.ts` asks `GET /api/v1/admin/me` on every request and maps
  the answer to `authorized | unauthenticated | forbidden | unconfigured | unavailable`. Stage 4
  replaces that function body with a Supabase `getUser()` + `app_metadata.app_role` check; no page or
  component changes.
- **The layout is the gate.** `src/app/admin/layout.tsx` renders the sign-in gate, the bare 403, or the
  service-error page *instead of* the page. A non-admin never receives a record, count or navigation
  item in the HTML — verified against 401/403/empty/mock-API fixtures.
- **Hiding is not authorizing.** `can(session, permission)` only decides whether a control is offered
  and explains a refusal in place (`users:write`, `credits:write`, `models:write`, …). The service
  re-checks every request.
- **No client role state.** No JWT decoding, no `localStorage` role, no cookie written by the
  console, no self-service "become admin" path. Sign-out goes through the auth service.
- **No secrets, ever.** The console renders `null` as "Not available". Model endpoints and provider
  request ids are operational identifiers; credentials, key secrets, webhook secrets and storage keys
  are never part of a payload it displays. Preview images are short-lived signed URLs issued per
  request and are opened in a new tab.
- **Nothing is decided on the client.** A payment is "paid" only because the service says so. A
  refund has no button until a server-authorized, audited endpoint exists. A credit adjustment is a
  request, not a wallet write. The console cannot set a status, a cost or a balance by itself.

## 4. Data flow

```
URL (filters, sort, cursor, ?record=)
        │
        ▼
Server Component page  ──►  src/lib/api/admin-server.ts  ──►  API /api/v1/admin/*
        │                         (forwards session cookie,   (authorizes, aggregates,
        │                          no-store, no cross-request   paginates, audits)
        │                          caching)
        ▼
HTML + streamed RSC  ──►  Admin shell (sidebar, header, breadcrumbs)
        │
        ▼
Client components only for: sign-out, profile menu, mobile drawer, confirmation
dialogs, credit adjustment, status/routing changes. Each posts to the API and
re-renders from the response — never from an optimistic local value.
```

Every list is server-driven: the filter controls are links and GET forms, so the query lives in the
URL, works without JavaScript, is shareable in a ticket, and costs one request per interaction
instead of a debounce storm. The cursor is dropped whenever a filter changes.

## 5. Component map

Admin-specific components live in `src/components/admin/`; they reuse the global tokens and the
shared primitives (`Button`, `Alert`, `Sheet`, `ConfirmationDialog`, `Skeleton`, `SectionCard`) rather
than forking them.

| Component | Notes |
| --- | --- |
| `admin-sidebar`, `admin-nav`, `admin-mobile-nav` | Two groups (Administration, System), one `aria-current` item, footer with admin identity, sign-out and "Return to website". Phones get the same nav in a focus-trapped drawer. |
| `admin-header`, `breadcrumbs`, `profile-menu` | Sticky utility strip: trail derived from the URL, admin menu as a disclosure (Escape closes, focus returns). |
| `admin-page-header` | Per-page `<h1>`, scope line, actions. |
| `metric-card` | One number, optional hint and footnote; `unavailable` renders "Not available", not `0`. |
| `data-table` | Native `<table>` with `<caption>`, `<th scope="col">`, `aria-sort`, sort links inside headers, labelled focusable scroll region. Below `md` the same rows become a definition-list card view. |
| `pagination` | Cursor paging with explicit labels ("Next page of customers"), disabled state when the API has no reverse cursor, "N of M" only when `total` is real. |
| `search-input`, `filter-select`, `date-range-filter`, `toolbar` | GET forms and link groups; all reset the cursor; all keep the other filters. |
| `status-badge` | Word first, colour second; six restrained tones. |
| `detail-drawer` | URL-driven record panel (`?record=<id>`) on Radix Dialog; rendered in place rather than portalled so the record is present in the server markup. |
| `detail-list` | `<dl>` label/value groups, `Unknown` for `null`, monospace `Identifier` for opaque ids. |
| `empty-state`, `error-state`, `loading-skeleton` | Honest states (see §6). |
| `credit-adjustment-dialog` | Search customer → direction → amount → mandatory reason → review → confirm; shows the service's resulting balance and ledger id. |
| `confirmation-modal` | Thin wrapper over the shared dialog (focus trap, Escape, optional typed phrase). |
| `user-status-control`, `model-routing-toggle` | Reason-required, permission-aware writes with the API's refusal shown in place. |
| `audit-log-table` | Reuses `DataTable`; every column is a real audit field. |
| `volume-chart` | Bar strip + "Daily figures" table, built only from returned points; empty array renders an empty state. |

## 6. The six states

| State | What the operator sees |
| --- | --- |
| Loading | Skeletons shaped like the real content, inside `<Suspense>`. No numbers. |
| Empty, no records | "No generations yet" etc., with a sentence about what will appear once the service records one. |
| Empty, filtered | "No customers match these filters" plus a clear-filters link, so zero-result searches are never confused with an empty database. |
| Forbidden | A bare 403 card: no nav, no counts, no record ids, no hint about what exists. |
| Unavailable / not configured | Page or region error naming the condition, with the error code, status and request id behind a disclosure and a retry where retrying can help. |
| Success | The rows, amounts and statuses exactly as returned. |

`unconfigured` (no `PIXELISE_API_BASE_URL`) renders the shell with a yellow "Not connected" strip and
each panel reports `not_configured` — the routes stay reviewable, but nothing is simulated.

## 7. Accessibility decisions

- Semantic tables: `<caption>`, header cells with `scope`, `aria-sort` on the sorted column, sort
  links carrying "currently ascending/descending" in their accessible name.
- The scroll container is focusable and labelled, so keyboard users can scroll a wide table (WCAG
  2.1.1); below `md` the table is replaced by cards so a 320px viewport never needs horizontal
  dragging for the primary content (1.4.10).
- Filters are real forms with `<label>`s; selects have a visible label; date inputs are paired with
  `From`/`To` labels and a native picker.
- Status is never colour-only: the tone is always paired with the word.
- Dialogs come from Radix (focus trap, Escape, scroll lock, `aria-modal`); every destructive action
  states its consequence and a failed request is shown inside the dialog rather than closing it.
- The drawer and profile menu return focus to their trigger; the mobile nav closes on navigation.
- Targets are ≥24×24px; the skip link is the first tab stop; reduced motion collapses the token
  animations; the volume chart's decorative bars are `aria-hidden` with the figures available as a
  table.
- Empty and error states are text, not just icons, and live-region announcements are limited to
  pagination counts and in-flight actions.

## 8. Deliberate limitations

- **Status code of the gate.** The 403/401 surfaces are rendered by the segment layout, so the HTTP
  response is `200` with no privileged content. Next.js cannot set a status from a layout without the
  experimental auth-interrupt API; the response body is the safe part. Stage 4 will also reject
  unauthenticated admin requests at the API, and a `proxy.ts` check can return a real 403/401 once
  auth is wired.
- **No refund control.** The refund endpoint is reserved in the contract (§23) and intentionally not
  called yet, so the console cannot imply that money moved.
- **No configuration editing.** Packs, credit rates and notification switches are read-only: they
  need server validation and audit, which arrive with `config:write` and `PATCH /admin/config`.
- **No user deletion, impersonation, export, bulk actions or role management.** None of them has a
  documented endpoint, and each is a security decision rather than a UI feature.
- **`activeCustomers` is often "Not available".** That is correct until the backend documents a
  definition; the console does not invent one.
- **QA is markup-level.** There is no browser in the build environment, so interaction QA was done by
  requesting every route (including filter, sort, cursor and `?record=` variants) against a throwaway
  local fixture API, inspecting the returned HTML/RSC payload, and checking the logs for React
  resume/hydration mismatch errors. Radix drawer content streams as client payload, so its text
  appears in the flight payload rather than the first HTML frame.

## 9. Verification log (stage 3)

| Check | Result |
| --- | --- |
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run build` | 34 routes, 9 admin routes compiled |
| `/admin` and 8 sub-routes, plus `?q=`, `?status=`, `?sort=&dir=`, `?cursor=`, `?record=`, `?range=` | `200`, no server errors |
| Unauthenticated fixture (401) | sign-in gate, no nav, no data |
| Non-admin fixture (403) | bare 403, no nav, no data |
| Zero-record fixture | every page renders its own honest empty state; overview shows real zeros and "Not available" for the active-customer count and success rate |
| Unconfigured build | shell + "Not connected" strip; every panel reports `not_configured` |
| `robots.txt` / meta | `/admin` disallowed; admin pages emit `noindex, nofollow, nocache` |

## 10. Files

```
src/app/admin/layout.tsx              gate + shell
src/app/admin/error.tsx               segment error boundary
src/app/admin/page.tsx                overview
src/app/admin/users/page.tsx          customer list
src/app/admin/users/[id]/page.tsx     customer record
src/app/admin/generations/page.tsx    job list + detail drawer
src/app/admin/payments/page.tsx       order list + detail drawer
src/app/admin/credits/page.tsx        ledger + adjustment entry point
src/app/admin/models/page.tsx         model catalogue + routing
src/app/admin/settings/page.tsx       configuration (read-only)
src/app/admin/audit-logs/page.tsx     audit trail

src/components/admin/*                console components (§5)
src/config/admin.ts                   navigation, page metadata, status vocabularies
src/lib/admin-session.ts              the only "is this an admin?" reader
src/lib/admin-filters.ts              URL-as-state helpers
src/lib/api/admin-types.ts            admin domain types
src/lib/api/admin.ts                  admin paths + browser mutations
src/lib/api/admin-server.ts           server reads (cookie-forwarding, no-store)
```
