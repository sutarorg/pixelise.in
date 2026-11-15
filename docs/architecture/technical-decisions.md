# Technical decisions (stage 4)

Short ADRs. Each records the decision, the alternatives, and what it costs us. Deeper prose lives in
`docs/architecture/system-architecture.md`; sources in `docs/research/backend-architecture-research.md`.

---

## ADR-01 · Next.js Route Handlers are the backend

**Decision.** All backend logic runs in `app/api/v1/**/route.ts` on the Node runtime, with business
logic in `src/services/**` and provider adapters in `src/lib/**`.

**Rejected.** A separate Express/Fastify service, edge functions, or Server Actions for writes.

**Why.** One deployable, one auth model, no second origin to CORS. Server Actions are excellent for
forms but poor for signed webhooks and for a public API contract that three frontends share.
**Cost.** Vercel function limits apply to request duration — so generation is async (queue + webhook).

## ADR-02 · Supabase is the only database; RLS is the client-facing boundary

**Decision.** Postgres via Supabase. RLS enabled on every customer-readable table with
`auth.uid() = user_id` policies. All privileged mutations are `SECURITY DEFINER` functions called by
the service-role client.

**Why.** Two independent layers: even if a policy is missing, the browser cannot reach the table
without a key; even if the service is misused, SQL constraints and functions keep balances correct.

**Cost.** Business rules exist in two places (SQL for invariants, TS for orchestration). Mitigated by
keeping every balance change inside three functions (`credit_apply`, `credit_reserve`, `credit_settle`).

## ADR-03 · One wallet row, mutated only inside transactions

**Decision.** `credit_wallets` holds `available_credits` and `reserved_credits`. Every change goes
through a PL/pgSQL function that locks the row (`SELECT … FOR UPDATE`), checks the non-negative
invariant, writes the ledger entry, and returns the resulting balances.

**Rejected.** Computing balances by summing the ledger at read time; optimistic client-side updates.

**Why.** Reservation/settlement must be atomic; a sum-at-read design cannot prevent two concurrent
jobs from reserving the same credits. **Cost.** A hot row per user; fine at this scale.

## ADR-04 · API envelope with request ids; legacy paths kept as aliases

**Decision.** Responses are `{ success, data | error, requestId }`. The existing client
(`src/lib/api/core.ts`) unwraps the envelope, so the three frontends keep their typed contracts.
Where stage-2/3 code already called a path that differs from the canonical spec (e.g.
`/api/v1/credits/wallet` vs `/api/v1/credits`, `/api/v1/billing/orders` vs `/api/v1/payments/orders`),
both paths are served by the same handler.

**Why.** Rewriting every page to chase a path rename adds risk without changing behaviour; the spec
stays authoritative and the aliases are documented and deprecated. **Cost.** Two route files per
legacy pair — thin re-exports, no duplicated logic.

## ADR-05 · Server components read through the API via a self-referential base URL

**Decision.** `PIXELISE_API_BASE_URL` defaults to the deployment's own origin
(`NEXT_PUBLIC_APP_URL`, then `VERCEL_URL`, then `http://127.0.0.1:3000`), and the server client
forwards the session cookie.

**Rejected.** Rewriting every stage-2/3 page to call services directly.

**Why.** Zero rewrite of 20+ reviewed pages; one code path for authorization; cookie forwarding is
already implemented. **Cost.** One extra internal HTTP hop per server render. Mitigated by `cache()`
per-request memoisation and by marking admin/customer segments dynamic. The direct-service path stays
available for a later optimisation.

## ADR-06 · Upload direct to R2 with a 120-second signed PUT

**Decision.** The server signs `PutObjectCommand` with `ContentType` (and no user filename), the
browser PUTs directly, then calls `/uploads/complete`, which HEADs the object, sniffs the first bytes,
and records the asset.

**Why.** The Next.js server never proxies image bytes; private bucket; content type is bound into the
signature. **Cost.** Two round trips and a bucket CORS rule that must match the deployed origin.

## ADR-07 · Generation is queue-first, webhook-verified, polling-reconciled

**Decision.** Submit to the fal queue with a webhook URL; store `provider_request_id`. The webhook is
treated as an *untrusted ping*: on receipt we re-read status/result from the queue API before
completing. A reconcile service covers lost webhooks, stuck jobs and expired results.

**Why.** fal documents retries and asks for idempotency but the fetched page documents no HMAC
signature; re-reading is the only defensible way to trust completion. **Cost.** One extra provider
call per job.

## ADR-08 · Credits are reserved before dispatch and settled once

**Decision.** `queued` = reserved; success = convert reserved → consumed; failure/expiry = release and
write a refund ledger row. All three are conditional on the generation's current status, so a duplicate
webhook cannot double-settle.

**Why.** A customer must never lose credits to a failed job, and must never be charged twice for a
successful one. **Cost.** Status transitions must be guarded in SQL, not just in TypeScript.

## ADR-09 · Payments: order → checkout → signature → webhook → atomic grant

**Decision.** Credits are granted only inside `grant_purchase_credits(payment_id)` keyed by the
payment row, after either a valid checkout signature *and* a provider-confirmed `captured` status, or
a verified `payment.captured` webhook. Duplicate deliveries hit a unique `(provider, event_id)` row and
a unique `payments.razorpay_payment_id`.

**Rejected.** Trusting the browser callback; granting on `order.paid` alone.

**Why.** The two documented failure modes are a forged callback and a duplicated webhook. **Cost.**
The checkout response can return `verifying` — which the existing UI already models.

## ADR-10 · Configuration is data, not code, wherever the owner may change it

**Decision.** Packs live in code (they are business facts for this release: Creator ₹499/150, Studio
₹999/350). Styles, scenes, model endpoints, model cost, and generation credit pricing live in
Postgres. Generation is **disabled** unless an enabled model and an `approved` pricing row exist.

**Why.** Avoids inventing rates while keeping the switch a data change. **Cost.** A fresh install
cannot generate images until the owner approves pricing — by design, and surfaced in the UI as
"pricing not configured".

## ADR-11 · Postgres-backed rate limiting

**Decision.** `rate_limits` table + `consume_rate_limit(bucket, key, window, limit)` function, called
with the user id or a hashed IP. Limits: contact 5/hour/IP, uploads 30/hour/user, generations
20/hour/user, order creation 10/hour/user, auth is delegated to Supabase.

**Rejected.** Redis/Upstash. **Why.** No extra service to secure or pay for at this scale.
**Cost.** A write per limited request; acceptable.

## ADR-12 · Email is best-effort and never transactional with money

**Decision.** Resend calls happen after the database commit, wrapped so a failure only logs. Purchase
emails carry the stored pack snapshot, amount and payment reference — never computed values.

**Why.** Mail outages must not roll back a paid order or a delivered image.

## ADR-13 · Tests split into pure unit tests and service tests with fakes

**Decision.** Vitest unit tests for validation, credit math, prompt building, model routing, payment
state transitions and signature verification. Service tests use an in-memory fake of the Supabase
client; no test hits fal, Razorpay or R2, and no test makes a real payment.

**Why.** CI must be deterministic and free. **Cost.** SQL functions are not covered by unit tests;
they are covered by the SQL self-test migration and the documented manual checklist
(`docs/architecture/credit-system.md` §7).
