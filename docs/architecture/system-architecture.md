# System architecture

How the Pixelise production backend is put together, and why each boundary is
where it is. Implementation lives under `src/app/api/v1`, `src/lib` and
`src/services`; decisions are recorded in `technical-decisions.md`.

```
Browser ──────────────► Next.js (Vercel, Node runtime)
  │  session cookie        │
  │                        ├─ RSC pages ──► src/lib/api/server.ts ─┐
  │                        │                                        │ (same origin)
  └── direct R2 PUT ◄── presigned URL ── /api/v1/uploads            │
                           │                                        ▼
                           ├─ /api/v1/** route handlers ◄── /api/v1/** (transport)
                           │        │
                           │        ├─ src/services/**  business logic
                           │        ├─ src/lib/**       adapters (fal, R2, Razorpay, Resend)
                           │        └─ Supabase        Postgres + Auth (service role / RLS)
                           │
                           └─ /api/v1/webhooks/* ◄── fal, Razorpay
```

## Layers

| Layer | Location | Responsibility | Must not |
| --- | --- | --- | --- |
| Transport | `src/app/api/v1/**/route.ts` | auth guard, validation, rate limit, envelope | contain business rules or SQL |
| Service | `src/services/**` | orchestration, transactions, invariants | know about `NextRequest` |
| Adapter | `src/lib/{ai,storage,payments,email,supabase}` | one provider each, plain fetch/SDK | decide money or policy |
| Domain config | `src/config/**` | packs, styles, scenes, quality mapping | call a provider |
| Data | `supabase/migrations/*` | schema, RLS, atomic functions | hold secrets |

The rule that keeps this honest: **the browser only ever sends identifiers**.
Pack id, style id, quality id, asset id. Prices, credit costs, model endpoints and
resolutions are resolved server-side from the tables in `database-schema.md`.

## Request lifecycle

1. `src/proxy.ts` refreshes the Supabase session cookie, redirects signed-out
   visitors away from private pages, and sets the security headers.
2. The route handler calls `requireUser()` / `requireAdmin(permission)`.
   `getUser()` validates the JWT with Supabase Auth; the profile row provides
   `account_status`; the console role comes from `app_metadata`.
3. `parseBody()` validates with Zod and returns field-level errors.
4. `enforceRateLimit()` consults the Postgres limiter (`consume_rate_limit`).
5. The service executes; every balance change is an RPC in
   `supabase/migrations/0002_functions.sql`.
6. `ok()` / `fail()` wrap the result as `{success,data|error,requestId}`.

Server Components reach the same handlers through `src/lib/api/server.ts`, which
forwards the incoming cookie. `PIXELISE_API_BASE_URL` can point that client at a
stub; otherwise it targets this deployment's own origin. This is why the reviewed
stage-2/3 pages needed no rewrite (ADR-05).

## Asynchronous work

* **Generation** — `POST /api/v1/generations` reserves credits and submits to the
  fal queue, then returns `202` with a `preparing`/`rendering` status. Progress
  arrives by webhook (`/api/v1/webhooks/fal`) or by polling the generation
  endpoint; both call the same idempotent `refreshGeneration`.
* **Payments** — the browser callback (`/api/v1/payments/verify`) and the webhook
  (`/api/v1/webhooks/razorpay`) both call `grantPurchaseCreditsForPayment`, which
  re-reads the capture and lets the database decide whether credits apply.
* **Reconciliation** — `POST /api/v1/admin/reconcile` (cron or admin) repairs
  stuck jobs, captured-but-uncredited payments and expired uploads. No state lives
  in memory, so a cold start cannot lose work.

## Failure philosophy

Every failure has a defined financial outcome:

| Failure | Credits |
| --- | --- |
| Upload rejected | none taken |
| Provider rejects submit | hold released, refund row |
| Provider reports ERROR / job times out | hold released, refund row |
| Result cannot be stored or read | hold released, refund row |
| Customer cancels before completion | hold released, refund row |
| Payment signature invalid | no grant, payment marked failed |
| Payment captured but grant not yet applied | retried by webhook and reconciliation; `verifying` in the UI |
| Email fails after a grant | no effect on money |

## Environments

| Concern | Local | Production |
| --- | --- | --- |
| Database | Supabase project (or local stack) | Supabase project, PITR recommended |
| Storage | R2 bucket (private) | same, with CORS for the deployed origin |
| fal | test key, routing disabled until approved | routing enabled per model |
| Razorpay | test keys | live keys + live webhook secret |
| Resend | optional | verified domain |
| Rate limiting | Postgres table | same |

## What is deliberately absent

No Redis, no message broker, no second payment gateway, no Supabase Storage, no
edge runtime for money paths, no client-side pricing, no service worker cache of
private data. Each omission is recorded with its reasoning in
`technical-decisions.md`.
