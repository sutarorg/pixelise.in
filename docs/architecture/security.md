# Security

Secure-by-default posture, the threats each control answers, and what is left for
the owner to do. Nothing here claims a certification.

## Identity and authorization

* **Session** — Supabase Auth with the SSR cookie flow. Identity is read with
  `auth.getUser()`, which validates the JWT with the Auth server. `getSession()`
  is never used for authorization; `user_metadata` is never trusted.
* **Per-request checks** — `requireUser()` and `requireAdmin(permission)` run in
  every route. Hiding a button is not authorization.
* **Console roles** — `app_metadata.app_role` (`admin`) and
  `app_metadata.admin_role` (`owner|admin|support|analyst`) are writable only by
  the service role. Permissions come from a fixed table in
  `src/lib/auth/session.ts`.
* **Suspension** — `profiles.account_status` is checked in `requireUser()`, so a
  suspended account cannot call any customer endpoint, not merely see an error
  page.
* **No self-promotion** — `protect_profile_columns()` raises if a non-service role
  changes `role` or `account_status`; the publishable key cannot write those
  columns at all.

## Database

* RLS on every table; customer tables are `SELECT`-only for `authenticated`.
* Writes are service-role only, through the functions in `0002_functions.sql`.
* Percentages, balances and totals are computed in SQL, never in the browser.
* `0003_rls.sql` explicitly revokes the default grants Supabase applies to new
  tables — a missing revoke is the classic Supabase footgun.

## Uploads

| Control | Implementation |
| --- | --- |
| Key ownership | `originals/{userId}/{assetId}.{ext}` generated server-side from the session |
| Type binding | `ContentType` is part of the signed PUT |
| Magic bytes | `sniffImage()` re-reads the first 64 KB; a mismatch with the declared type is rejected |
| Size | `HEAD` on the stored object, not the browser's claim; 20 MB ceiling |
| Dimensions | parsed from the real header, minimum 640 px per side |
| Private bucket | downloads only through 5-minute signed GETs |
| No arbitrary fetch | the only server-side fetch of a remote file is a provider result, restricted to an allow-list of hosts over https with no redirects |

## Payments

* Amounts come from `src/config/packs.ts` and are snapshotted onto the payment
  row. The browser names a pack id and nothing else.
* Checkout signature = `HMAC_SHA256(order_id|payment_id, KEY_SECRET)`, compared in
  constant time.
* Webhook signature = `HMAC_SHA256(raw_body, WEBHOOK_SECRET)` over the **raw**
  body, compared in constant time.
* A valid signature is not treated as proof of capture: the payment is re-read
  from the Razorpay API and must be `captured` with a matching amount before
  credits are granted.
* Idempotency: unique `(provider, event_id)` in `webhook_events`, unique
  `razorpay_payment_id`, and `credits_granted_at` guarding the grant RPC.

## Credits

Reserve/settle/release happen inside single transactions with `SELECT … FOR
UPDATE` on the wallet row. Non-negative checks live in table constraints and in
`credit_apply`. A duplicate webhook cannot double-settle because the generation
row's `credits_reserved` is the guard. See `credit-system.md`.

## Rate limiting and abuse

Postgres-backed fixed windows (`consume_rate_limit`), keyed by user id or hashed
IP. Buckets in `api-reference.md`. Order creation fails closed if the limiter is
unavailable; the other buckets fail open with a logged warning, because a broken
limiter must not break reading your own wallet.

## Transport and headers

`src/proxy.ts` sets `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `X-DNS-Prefetch-Control`. `X-Frame-Options` is intentionally
absent: the deployment is previewed inside an iframe and the app does not need
clickjacking protection on public pages. HSTS is provided by the platform.

## Secrets

* Every server module that reads a secret imports `server-only`; a client import
  fails the build.
* `.env*` is git-ignored; `.env.example` documents purpose and scope.
* Logs run through `src/lib/logging.ts`, which redacts authorization headers,
  cookies, tokens, keys and signed URLs.
* Provider errors are reduced to a code before logging; raw payloads never reach a
  customer response.

## Privacy

* No image bytes or signed URLs in logs.
* Assets are private; a URL is minted per request and expires in minutes.
* Account deletion marks the account unusable immediately and is completed by the
  documented retention workflow (payments and the ledger must survive for
  accounting).
* AI processing is disclosed on the privacy page: the image is sent to fal.ai for
  rendering and returned; it is not used to train models by Pixelise.

## What this does not do

* No penetration test has been performed.
* No DPDP/GDPR certification is claimed; the privacy page states practices, not
  compliance status.
* No WAF or bot management. Rate limiting is the only abuse control.
* `docs/owner-inputs.md` lists the operational decisions still needed (retention
  period, refund policy, refund approver).

## Test coverage

| Area | Where |
| --- | --- |
| Envelope, error safety, status codes | `src/lib/http/route.test.ts` |
| Request validation (packs, generations, uploads, contact) | `src/lib/validations/index.test.ts` |
| Checkout + webhook signatures (including tampering) | `src/lib/payments/signature.test.ts` |
| Magic-byte sniffing and dimension parsing | `src/lib/storage/image-metadata.test.ts` |
| Ledger translation | `src/services/credits/credit-ledger.test.ts` |
| Pricing consistency across website and checkout | `src/config/pricing-consistency.test.ts` |

SQL invariants (concurrency, duplicate reservation, refund on failure) are **not**
unit-testable without a database; they are covered by the manual checklist in
`credit-system.md` §7, which must be run once against a staging project.
