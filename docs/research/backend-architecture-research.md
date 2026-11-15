# Backend architecture — research

Stage 4 turns the three-stage frontend into a working backend. This document records what was
verified, against which sources, and which decisions follow from it. Research was done **before**
implementation; every claim below is either fetched from an official page (linked) or marked as
assumed / still unverified.

Environment at the time of research (15 November 2026):

| Package | Version | Notes |
| --- | --- | --- |
| `next` | 16.4.6 | App Router, Route Handlers, Cache Components, `proxy.ts` (no `middleware.ts`) |
| `react` / `react-dom` | 19.3.0 | — |
| `typescript` | 5.x (strict) | — |
| `tailwindcss` | 4.3.3 | unchanged from stage 1 |
| `@supabase/supabase-js` | 2.119.0 | PostgREST + Auth + RPC |
| `@supabase/ssr` | 0.12.7 | cookie-based SSR sessions |
| `zod` | 4.6.7 | request/response validation |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | 3.1169.0 | R2 is S3-compatible |
| `vitest` | 5.1.0 | unit/integration tests |

---

## 1. Next.js 16 backend surface

**Sources:** <https://nextjs.org/docs/app/getting-started/route-handlers>,
<https://nextjs.org/docs/app/getting-started/proxy>, <https://nextjs.org/docs/app/getting-started/caching>

- Route Handlers live in `app/api/**/route.ts` and export `GET`, `POST`, `PATCH`, `DELETE`.
  `export const runtime = "nodejs"` is the default; we need Node for `crypto`, the AWS SDK and the
  Supabase service key, so **no edge runtime** anywhere in `/api/v1`.
- `middleware.ts` is ignored in Next 16. Session refresh for Supabase must happen in **`proxy.ts`**
  (`export async function proxy(request)`), with `config.matcher` as a static array. This matters
  directly: without it the Supabase session never refreshes and users are silently signed out.
- A Proxy is **not** an authorization boundary. It refreshes cookies and can redirect; every route
  must still verify the user server-side. We do both: the proxy refreshes the session, the handlers
  verify it.
- `cookies()` / `headers()` are async and make a route dynamic. Webhook handlers and all `/api/v1`
  routes are dynamic by definition.
- Cache Components (`cacheComponents: true`, already enabled) means: no ambient `Date.now()` during
  prerender, uncached async reads behind `<Suspense>`, and `"use cache"` only where a stable cache
  key exists. Every authenticated read is `no-store`; **nothing user-scoped is cached**.
- Route Handlers may read the raw body with `await request.text()` — required for webhook HMAC
  verification. We never use `request.json()` before verifying a signature.

## 2. Supabase: auth, SSR and RLS

**Sources:** <https://supabase.com/docs/guides/auth/server-side/creating-a-client>,
<https://supabase.com/docs/guides/auth/server-side/nextjs>, <https://supabase.com/docs/guides/database/postgres/row-level-security>

- Two clients per request: a **cookie-bound SSR client** (identifies the caller, refreshes tokens)
  and a **service-role client** (privileged writes, server-only). The service key never reaches the
  browser; there is no `NEXT_PUBLIC_` variant of it.
- Server Components cannot set cookies, so `setAll` must be wrapped in `try/catch` there; the proxy
  is what actually persists refreshed cookies. `setAll`'s `headers` (`Cache-Control: private`,
  `Expires`, `Pragma`) must be copied onto the response in the proxy to stop a CDN caching a session.
- Verify with `supabase.auth.getUser()` (validates the JWT with the Auth server). `getSession()` reads
  a cookie without validation and is never used for authorization. The proxy may use
  `getClaims()` because it is only refreshing, not authorizing.
- Current docs name the public key **publishable key** (`sb_publishable_…`). The legacy anon key still
  works. The code accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **or**
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, in that order, and documents both.
- Admin identity: `app_metadata.app_role` is writable only with the service key, so it is the safe
  place for a role. `user_metadata` is user-writable and must never carry a role. We additionally keep
  `profiles.role` for querying and audit, but the API authorizes from `app_metadata` **and** a server
  lookup, never from a client-supplied claim.
- RLS: enabled on every table a customer can reach. Policies are `auth.uid() = user_id` for selects
  and refuse all client writes to financial tables. Privileged mutations happen exclusively through
  `SECURITY DEFINER` functions called by the service role, so RLS does not need to model admin writes.
- Database functions can be transactional: a PL/pgSQL function runs inside one transaction, and
  `SELECT … FOR UPDATE` on the wallet row serializes concurrent reservations. This is how double
  spending is prevented without Redis.

## 3. fal.ai: queue, webhooks and models

**Sources:** <https://fal.ai/docs/documentation/model-apis/inference/queue>,
<https://fal.ai/docs/documentation/model-apis/inference/webhooks>,
<https://fal.ai/docs/model-api-reference/image-generation-api/nano-banana>,
<https://fal.ai/docs/model-api-reference/image-generation-api/nano-banana-2>

Verified behaviour:

- Queue submit: `POST https://queue.fal.run/{endpoint_id}` with `Authorization: Key $FAL_KEY`.
  The response contains `request_id`, `response_url`, `status_url`, `cancel_url`.
- Status: `GET https://queue.fal.run/{owner}/{app}/requests/{request_id}/status`
  → `IN_QUEUE` / `IN_PROGRESS` / `COMPLETED`. Result: `GET …/requests/{request_id}`.
  The status/result URLs use only owner/app (`fal-ai/flux`, `google/nano-banana-2.1`), not the full
  endpoint path — so we store the URLs fal returns instead of rebuilding them.
- Webhooks: pass `fal_webhook=<url>` on submit (or `webhook_url` in SDKs). The POST body is
  `{ request_id, gateway_request_id, status: "OK" | "ERROR", payload, error? }`. Delivery retries with
  backoff up to ~31 times and explicitly requires **idempotent** handlers.
- The webhook page we fetched documents retries and payloads but **no HMAC signature scheme**. We
  therefore treat the callback as an untrusted notification: look the job up by `provider_request_id`
  and re-fetch the authoritative status/result from the queue API before touching credits or assets.
  This also makes replay harmless.
- Models verified on 15 Nov 2026 (image *editing*, which is what product photography needs):
  - `google/nano-banana-2.1/edit` — image-to-image, accepts `image_urls` (up to 14), `prompt`,
    `aspect_ratio`, `resolution` (`2K`). Newest of the family.
  - `fal-ai/nano-banana-2/edit` — same shape, previous generation.
  - `fal-ai/nano-banana/edit` — documented at **$0.039 per image**, `prompt` + `image_urls`,
    `output_format`, `aspect_ratio`, `num_images`.
- Pricing is per image and model-specific; it is **cost**, not customer price. We store it as a model
  configuration field (nullable) and never derive customer credits from it automatically.

**Not verified in this environment:** live model availability, exact per-model headline pricing for
the 2.1 endpoint, and commercial/licensing terms for each model. They are recorded as owner/verification
items; the router reads endpoints from the database, so swapping a model is configuration, not code.

## 4. Razorpay

**Sources:** <https://razorpay.com/docs/api/orders/>, <https://razorpay.com/docs/api/payments/signature-verification/>,
<https://razorpay.com/docs/webhooks/validate-test/>

- Orders: `POST https://api.razorpay.com/v1/orders` with Basic auth (`KEY_ID:KEY_SECRET`), body
  `{ amount: int paise, currency: "INR", receipt, notes }`. The amount is always ours, never the
  browser's.
- Checkout returns `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`. Verification is
  `HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) === signature`.
- Webhooks are signed over the **raw body** with `RAZORPAY_WEBHOOK_SECRET` and delivered in
  `X-Razorpay-Signature`; duplicates are identified by `x-razorpay-event-id`. Docs are explicit:
  do not parse or re-serialize the body before verifying.
- Event ordering is not guaranteed. `payment.captured` is the authoritative credit trigger;
  `order.paid` is treated as a hint. Each event is stored in `webhook_events` with a unique
  `(provider, event_id)` constraint before processing, so a retry is a no-op.
- Refunds: `POST /v1/payments/{id}/refund` with an amount and notes; refund webhooks
  (`refund.processed`) update our ledger. **Refunds are implemented server-side but only reachable by
  an admin with `payments:refund`, and the customer credit clawback is a separate explicit ledger
  entry** — never a silent negative balance.

## 5. Cloudflare R2

**Source:** <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> (updated 12 Nov 2026)

- R2 is S3-compatible: `S3Client({ region: "auto", endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com, credentials })`.
- Presigned PUT is generated with `PutObjectCommand({ Bucket, Key, ContentType })`; restricting
  `ContentType` in the signature is the documented way to stop uploads of other types. Expiry is
  1 second to 7 days; we sign uploads for **120 seconds** and downloads for **5 minutes**.
- Because `ContentType` is part of the signature, the browser must send a byte-identical
  `Content-Type` header or R2 answers 403.
- Buckets are private. Keys are generated server-side (`originals/{userId}/{assetId}`,
  `generated/{userId}/{generationId}/{outputId}`) — never built from user filenames.
- Server-side uploads (provider result → R2) use `PutObjectCommand` directly.
- Deletion is `DeleteObjectCommand`; soft delete in the database first so a storage failure cannot
  lose the record of what existed.
- CORS must allow the deployed origin, `PUT`, and `Content-Type`; it is configured in the dashboard,
  not in code (documented in `docs/deployment/cloudflare-r2-setup.md`).

**Not verified:** whether the selected fal model accepts a presigned R2 URL as `image_urls`. It should
(PUT-signed URLs differ from GET), but each model's URL fetch requirements must be tested. Our adapter
can also upload the input to fal's storage if a model rejects R2 URLs — the capability is isolated in
`lib/ai/fal-client.ts`.

## 6. Resend

**Sources:** <https://resend.com/docs/api-reference/emails/send-email>, <https://resend.com/docs/dashboard/domains/introduction>

- `POST https://api.resend.com/emails`, `Authorization: Bearer $RESEND_API_KEY`, body
  `{ from, to[], subject, html, text, reply_to?, tags[] }`; success returns `{ id }`.
- The sending domain must be verified before production send; until then Resend only allows the
  test sender and the account's own address. Emails are therefore best-effort: a failure is logged and
  **never rolls back a payment or a generation**.
- Delivery events (delivered/bounced) require a separate Resend webhook; we only log the send result
  in stage 4 and document the webhook as an owner configuration item.

## 7. Security and compliance

**Sources:** <https://owasp.org/www-project-top-ten/>, <https://owasp.org/www-project-application-security-verification-standard/>,
<https://www.meity.gov.in/data-protection-framework> (DPDP Act 2023 reference)

- Upload validation: MIME allow-list, magic-byte sniffing, byte limits, dimension limits, random keys,
  no server-side fetch of arbitrary URLs. We sign the content type into the URL and re-check the object
  with `HeadObject` + a ranged `GetObject` before creating an asset row.
- Payments: signature verification, raw-body webhook verification, event-id dedupe, amount recomputed
  from our pack table, credits granted only inside a single SQL function keyed by the payment row.
- Credits: one ledger, no negative balances, reservations settled or released exactly once, an
  idempotency key on every mutation.
- API: schema validation (zod), request ids, structured logs, safe error codes, per-user rate limits
  stored in Postgres.
- Secrets: only the Supabase URL and publishable key are public. Service role, fal key, Razorpay
  secrets, R2 keys and Resend key are server-only and absent from every client bundle.
- DPDP: minimise collected data (email, display name, images), keep images private and short-lived,
  document the AI sub-processor (fal.ai) and model the deletion request as "delete account + assets"
  with a documented retention exception for financial records (payments must be retained for tax and
  dispute handling). We do **not** claim compliance; we implement the mechanisms and list the legal
  review as an owner input.

## 8. Things explicitly *not* adopted

| Considered | Decision | Why |
| --- | --- | --- |
| Edge runtime for API routes | No | AWS SDK, Supabase service key, `crypto` HMAC and Node-only APIs. |
| Redis / Upstash for rate limits and locks | No | Postgres advisory-lock/`FOR UPDATE` + a `rate_limits` table covers the load; one less service to secure. |
| Supabase Storage | No | R2 is the chosen store; two providers would double the CORS/keys/retention surface. |
| Razorpay server SDK | No | The three calls we need (order, payment, refund) are plain REST; HMAC is `node:crypto`. Avoids a dependency with a Node-only build story. |
| fal SDK | No | Queue REST is documented and small; fewer moving parts in the server bundle. |
| Vercel Cron for reconciliation (v1) | Deferred | The pattern works, but the owner must confirm the plan's cron allowance; the reconciliation service is callable by an authenticated admin in the meantime. |
| Long-lived in-process background tasks on Vercel | No | Serverless functions freeze after the response. Generation is queue + webhook + DB state, with polling as the fallback. |
| Storing provider output URLs as customer assets | No | They expire. Results are copied into R2 before the job is marked complete. |

## 9. Rate limits, retries and failure modes

- Every generation request must be authenticated, reference an owned, validated asset, use an enabled
  model + approved pricing, pass the rate limit, and have enough credits. Any failure refunds
  reservations (or never reserves at all).
- Provider outages: submit failure → release the reservation and fail the job with a safe message.
  Ambiguous submit (network error) → mark `dispatch_unknown`, reconcile by provider request id or
  expiry; the customer sees "we're checking this job", not a false success.
- Stuck jobs: `generations` rows older than a threshold in `queued`/`processing` are reconciled by the
  reconcile service, which re-reads provider state and settles accordingly.
- Webhooks always answer 2xx once the event is durably stored; processing failures are recorded in
  `webhook_events.processing_status` and retried by the provider or by reconciliation.

## 10. Open questions (owner inputs, not invented)

1. Approved **generation credit rates** per style/quality (the pricing table exists; `approved=false`
   by default, so paid generation is disabled until the owner signs off).
2. GST treatment and invoice requirements (no tax is calculated or shown until confirmed).
3. Credit expiry (none implemented; ledger supports expiry later).
4. Commercial usage terms and model licensing for the chosen fal endpoints.
5. Refund policy beyond the published page, and who may approve a refund.
6. Which Supabase plan/region and whether PITR backups are enabled.
