# API reference (`/api/v1`)

Every route returns the same envelope:

```json
{ "success": true,  "data": { }, "requestId": "3f0c…" }
{ "success": false, "error": { "code": "insufficient_credits", "message": "…", "details": { "field": "…" } }, "requestId": "3f0c…" }
```

| Concern | Rule |
| --- | --- |
| Auth | session cookie (Supabase SSR). `Authorization: Bearer` is accepted by the reconcile route for cron only |
| Content type | `application/json` for bodies; webhooks verify raw bytes |
| Errors | codes from `src/lib/api/types.ts`; `details` only for `validation_failed` |
| Caching | `Cache-Control: no-store` on every response except `GET /credits/packs` |
| Request id | echoed from `x-request-id` when it matches `[A-Za-z0-9._-]{8,64}`, else generated |

## Public

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/public/config` | none | pack prices + capability flags (booleans only) |
| POST | `/public/contact` | none, rate limited 5/h/IP | validates against `contactLimits`; honeypot `website`; returns `{ok:true,ticketId}` |
| GET | `/credits/packs` | none | the two packs, cacheable |
| GET | `/studio/config` | none | styles, scenes, aspect ratios, qualities (credits `null` unless approved), upload limits |

## Customer

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | profile incl. `emailVerified`, `lastSignInAt` |
| PATCH | `/me` | `{ displayName }` only |
| DELETE | `/me` | `{ confirmation: "DELETE" }`; marks the account deleted and ends the session |
| GET/PATCH | `/me/preferences` | `generationComplete`, `creditReceipts`, `productUpdates` |
| GET | `/credits/wallet` | `{ available, reserved, updatedAt }` |
| GET | `/credits/transactions?type=&cursor=&limit=` | `Paginated<CreditTransaction>` |
| POST | `/uploads` | `{ filename, mimeType, bytes }` → `UploadTicket` (120 s signed PUT) |
| POST | `/uploads/{id}/complete` | verifies the stored object; returns `UploadAsset` |
| GET | `/generations?style=&sort=&cursor=&limit=` | own creations |
| POST | `/generations` | `{ assetId, styleId, sceneId, qualityId, aspectRatioId }` + `Idempotency-Key` → `202` `{ generation, estimatedCredits }` |
| GET | `/generations/{id}` | also advances a running job |
| DELETE | `/generations/{id}` | soft delete |
| POST | `/generations/{id}/cancel` | only while queued/running; releases the hold |
| GET | `/creations`, `/creations/{id}`, DELETE `/creations/{id}` | aliases of the generation reads |
| POST | `/payments/orders` | `{ packId }` → `BillingOrder` (`orderId`, `keyId`, `amountPaise`, `credits`, `expiresAt`) |
| POST | `/payments/verify` | `{ orderId, paymentId, signature }` → `{ status, creditsAdded, wallet }` |
| GET | `/payments` | purchase history |

**Deprecated aliases** (same handlers, kept for the stage-2 client):
`/billing/orders`, `/billing/verify`, `/billing/payments`.

## Auth

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/sign-up` | `{ email, password, displayName? }`; `signed_in` or `pending_verification` |
| POST | `/auth/sign-in` | `{ email, password }`; sets session cookies |
| POST | `/auth/sign-out` | clears cookies |
| GET | `/auth/callback?code=&next=` | PKCE exchange for email links; `next` must be relative |
| POST | `/auth/recovery` | always `{ status: "sent" }` (no account enumeration) |
| POST | `/auth/update-password` | authenticated; `{ password }` |

## Webhooks

| Method | Path | Verification |
| --- | --- | --- |
| POST | `/webhooks/razorpay` | `X-Razorpay-Signature` HMAC over the raw body; dedupe on `x-razorpay-event-id`; grants only on `payment.captured`/`order.paid` after a provider re-read |
| POST | `/webhooks/fal` | no signature exists; body is a hint, `refreshGeneration` re-reads the queue. Always `200` once recorded |

## Admin

All admin routes require `app_metadata.app_role = "admin"` and the capability
named below.

| Method | Path | Capability |
| --- | --- | --- |
| GET | `/admin/me` | audience: console |
| GET | `/admin/overview?range=7d\|30d\|90d` or `?from=&to=` | `audit:read` |
| GET | `/admin/users?q=&status=&cursor=&limit=` | `audit:read` |
| GET | `/admin/users/{id}` | `audit:read` |
| PATCH | `/admin/users/{id}/status` | `users:write` (`{status:"active"\|"suspended", reason}`) |
| GET | `/admin/generations`, `/admin/generations/{id}` | `audit:read` |
| GET | `/admin/payments`, `/admin/payments/{id}` | `audit:read` |
| GET | `/admin/credits?type=&user=&range=` | `audit:read` |
| POST | `/admin/credits/adjust` | `credits:write` (`{userId, direction, credits, reason}`) |
| GET | `/admin/models`, PATCH `/admin/models/{id}` | `models:write` (PATCH needs `reason`) |
| GET | `/admin/config` | `audit:read` |
| GET/PATCH | `/admin/settings` | `config:write` |
| GET/POST | `/admin/pricing` | `config:write` to write |
| GET | `/admin/audit-logs?action=&admin=&range=` | `audit:read` |
| POST | `/admin/reconcile?dryRun=1` | `config:write` or `Authorization: Bearer $CRON_SECRET` |

List endpoints return `{ items, nextCursor, prevCursor, total }` (`total` is
`null` — counting every filtered row is not worth the query cost; the console
labels it as such).

## Status codes

`200` ok · `201` created · `202` accepted (generation queued) · `204` deleted ·
`401` unauthenticated · `402` insufficient credits / payment failed · `403`
forbidden · `404` not found / not yours · `409` conflict (duplicate, wrong state) ·
`422` validation · `429` rate limited · `500` internal · `502` provider · `503`
not configured / unavailable.

## Rate limits

| Bucket | Limit |
| --- | --- |
| `auth.otp` (sign-in, sign-up, recovery per IP) | 10 / hour |
| `contact` (per IP) | 5 / hour |
| `uploads` (per user) | 60 / hour |
| `generations` (per user) | 30 / hour |
| `orders` (per user) | 10 / hour (fails closed if the limiter is down) |
| `admin` (per admin) | 120 / minute |
| `webhook` | 300 / minute |

## Contract changes from Parts I–III

Documented in `docs/API-CONTRACT.md` Part IV. In short: the envelope is now
explicit, `payments/*` is canonical (`billing/*` aliases), and generation credit
costs are `null` until pricing is approved.
