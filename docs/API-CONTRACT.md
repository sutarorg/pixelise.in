# API contract — foundation for stage 4

**Status:** documentation and types only. **No API route, database, payment integration or AI
generation exists in this repository.** Stage 1 ships the public website; this file is the agreed
shape the backend must satisfy so the marketing site can be connected without a redesign.

Machine-readable types for the one endpoint the public site owns live in
`src/lib/contact/contract.ts`. Everything else is specified here as the contract for the studio app.

> **Part II (§9–§16)** specifies the customer application API delivered with stage 2 and is
> authoritative where it differs from §4–§6.

---

## 1. Conventions

| Topic | Rule |
| --- | --- |
| Base URL | The studio application (`NEXT_PUBLIC_APP_URL`). The marketing site talks to it only through absolute URLs held in `src/config/site.ts`. |
| Transport | HTTPS, JSON (`application/json; charset=utf-8`). Multipart only for image upload. |
| Auth | HTTP-only, `Secure`, `SameSite=Lax` session cookie scoped to the app domain. No tokens in `localStorage`. The public site never holds a session. |
| Versioning | `/api/v1/…`. Breaking changes ship a new version rather than mutating a response shape. |
| Idempotency | `Idempotency-Key: <uuid>` required on `POST /checkout` and `POST /generations`. |
| Errors | Single envelope, always with a stable machine code: |

```jsonc
// 4xx / 5xx
{
  "error": {
    "code": "VALIDATION_FAILED",     // stable, documented enum
    "message": "Human readable summary.",
    "fields": { "email": "Enter a valid email address." }, // optional, field-keyed
    "requestId": "req_01J..."        // safe to show in support conversations
  }
}
```

| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Payload failed schema validation |
| `UNAUTHENTICATED` | 401 | No/expired session |
| `FORBIDDEN` | 403 | Authenticated, not allowed |
| `NOT_FOUND` | 404 | Resource does not exist for this actor |
| `INSUFFICIENT_CREDITS` | 402 | Balance too low for the requested generation |
| `RATE_LIMITED` | 429 | Retry-After header set |
| `CONFLICT` | 409 | Duplicate idempotency key with a different payload |
| `INTERNAL` | 500 | Unexpected; requestId logged |

Rate limits (per session, per minute): contact `5`, auth `10`, generations `20`, reads `120`.

---

## 2. `POST /api/v1/contact` — public support message

The **only** endpoint the marketing site will call, from `/contact`. Types:
`src/lib/contact/contract.ts`.

**Request**

```http
POST /api/v1/contact
Content-Type: application/json
```

```jsonc
{
  "name": "Riya Sharma",                    // 2–80 chars
  "email": "riya@brand.example",            // RFC 5322, ≤254 chars
  "topic": "billing-and-credits",           // product-question | billing-and-credits | technical-issue | partnership
  "message": "Which pack suits a 30-product catalogue?",  // 20–2000 chars
  "sourcePath": "/contact",                 // path the message was sent from
  "website": ""                             // honeypot: must be empty
}
```

**Responses**

```jsonc
// 202 Accepted
{ "ok": true, "ticketId": "PX-7F3K2A" }

// 400 Bad Request
{
  "ok": false,
  "errors": {
    "email": "Enter a valid email address.",
    "form": "Check the highlighted fields and try again."
  }
}
```

**Requirements**

1. Server-side validation must mirror `contactLimits` — never trust the client.
2. Honeypot filled or rate-limit exceeded → return `202` with a ticket id and drop the message
   (never tell a bot it failed).
3. Persist `createdAt`, hashed IP, `sourcePath`, and the user agent for abuse handling; do not store
   the raw IP beyond the retention window agreed in the privacy policy.
4. Send a notification to the support inbox and an acknowledgement to the sender only once an
   inbound mailbox is confirmed (see `docs/owner-inputs.md` #1).
5. **Marketing-site behaviour until this endpoint exists:** the form is rendered disabled with a
   visible explanation. It must not be re-enabled against a stub, and no success state may be
   simulated.

---

## 3. Catalogue and pricing

The two packs are real business configuration (`src/config/pricing.ts`), duplicated into the app's
own config at build time rather than fetched, so pricing never depends on a network call:

| id | name | price | currency | credits | payment |
| --- | --- | --- | --- | --- | --- |
| `creator` | Creator | 499 | INR | 150 | `one-time` |
| `studio` | Studio | 999 | INR | 350 | `one-time` |

```ts
// GET /api/v1/packs  (public, cacheable 1h)
type PackListResponse = {
  packs: Array<{
    id: "creator" | "studio";
    name: string;
    price: number;        // whole rupees
    currency: "INR";
    credits: number;
    paymentType: "one-time";
    highlighted: boolean;
  }>;
};

// GET /api/v1/generation-costs  (authenticated, cacheable 5m)
// The credit cost of a generation is backend configuration — the marketing site
// deliberately publishes no exchange rate.
type GenerationCostsResponse = {
  styles: Array<{
    style: "studio" | "lifestyle" | "advertising";
    creditsPerImage: number;
    variants: Array<{ id: string; label: string; creditsPerImage: number }>;
  }>;
};
```

---

## 4. Accounts

```ts
// POST /api/v1/auth/signup
type SignupRequest = { email: string; password: string; name?: string };
type SignupResponse = { user: User };

// POST /api/v1/auth/login
type LoginRequest = { email: string; password: string };
type LoginResponse = { user: User };      // sets the session cookie

// POST /api/v1/auth/logout   → 204
// GET  /api/v1/me            → { user: User; balance: CreditBalance }

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;        // ISO 8601
  emailVerified: boolean;
};

type CreditBalance = {
  credits: number;
  lifetimePurchased: number;
  lifetimeSpent: number;
  updatedAt: string;
};
```

Requirements: passwords hashed with Argon2id (or bcrypt cost ≥ 12); no credential ever logged;
login and signup rate-limited per IP **and** per email; email verification before first generation.

---

## 5. Checkout

```ts
// POST /api/v1/checkout        Idempotency-Key required
type CheckoutRequest = {
  packId: "creator" | "studio";
  successUrl: string;   // must be an allow-listed origin
  cancelUrl: string;
};
type CheckoutResponse = {
  sessionId: string;
  redirectUrl: string;  // hosted payment page
};

// POST /api/v1/webhooks/payments   (provider → server, signature verified)
// On success: credit the balance exactly once per payment id.
```

Rules: the amount charged is derived **server-side** from `packId`; the client never sends a price.
Credits are granted from a verified webhook, never from the browser redirect. Duplicate webhook
delivery must be idempotent on the provider's payment id.

---

## 6. Generations

```ts
// POST /api/v1/uploads          multipart/form-data, field "file"
type UploadResponse = {
  uploadId: string;
  width: number;
  height: number;
  bytes: number;
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

// POST /api/v1/generations      Idempotency-Key required
type GenerationRequest = {
  uploadId: string;
  style: "studio" | "lifestyle" | "advertising";
  variantId?: string;
  productName?: string;   // used for the customer's own library labels
};
type GenerationResponse = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  creditsReserved: number;  // must match GET /generation-costs
  createdAt: string;
};

// GET /api/v1/generations/:id
type Generation = GenerationResponse & {
  creditsCharged: number | null;
  images: Array<{ id: string; url: string; width: number; height: number }>;
  failureReason?: string;   // present only when status === "failed"
};

// POST /api/v1/generations/:id/refund   → returns credits to the balance (failed generations)
```

Rules: reserve credits at request time, commit on success, release on failure — this is what the
refund policy promises (“credits returned if a generation fails on our side”). Storage keys must be
private; image URLs are signed and short-lived. Deletion must be honour-able per the retention policy.

---

## 7. What the marketing site needs from the backend

Only three integration points, all environment-driven:

| Env var | Purpose | Default in stage 1 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, JSON-LD | `https://pixelise.in` |
| `NEXT_PUBLIC_APP_URL` | Sign-up, log-in and studio entry points | unset → CTAs resolve on-site |
| — | Contact endpoint | not called; form disabled |

When the app is live:

1. Set `NEXT_PUBLIC_APP_URL`. Header “Log in” and every “Get started” CTA switch automatically
   (see `links` in `src/config/site.ts`).
2. Enable the contact form by wiring `POST /api/v1/contact`; remove the disabled notice in
   `src/components/marketing/contact-form.tsx` in the same change.
3. Add the support address and entity details from `docs/owner-inputs.md` to the footer and policies.

---

## 8. Explicitly not implemented in this repository

- No `src/app/api/**` route handlers beyond `sitemap.ts`, `robots.ts` and `opengraph-image.tsx`.
- No database, ORM, migration, storage bucket or queue.
- No authentication, session, or cookie handling.
- No payment provider, checkout session or webhook.
- No AI provider call, prompt template, or generation job.
- No admin or customer-facing CRUD.

Any future route must live outside `(marketing)` so it inherits no marketing metadata, and must be
excluded from the sitemap and disallowed in `robots.ts` (already configured).

---

# Part II — customer application (stage 2)

This part is **authoritative for the dashboard**. Where it disagrees with §4–§6, this wins; those
sections were written against the marketing site's needs and are kept for history. The matching
TypeScript lives in `src/lib/api/types.ts` (types) and `src/lib/api/{server,browser}.ts` (calls), so a
backend can be validated against the client by compiling.

## 9. Transport, errors and ownership

| Topic | Rule |
| --- | --- |
| Base URL | `PIXELISE_API_BASE_URL` on the server, `NEXT_PUBLIC_API_BASE_URL` in the browser (empty ⇒ same origin). When neither is set the app renders its "not connected" states and issues no requests. |
| Auth | Session cookie forwarded by the server client; `credentials: "include"` in the browser. Every endpoint below returns `401 UNAUTHENTICATED` without one. |
| Ownership | Every read is scoped to the session's user. A row that exists but belongs to someone else returns `403 FORBIDDEN` or `404 NOT_FOUND` — never a partially redacted object. |
| Idempotency | `Idempotency-Key: <uuid>` on `POST /generations` and `POST /billing/orders`. Replays return the original resource; a replay with a different body returns `409 CONFLICT`. |
| Lists | Cursor pagination. `?cursor=<opaque>&limit=<1..100>`, response `{ items, nextCursor, total }`, `total` may be `null` when counting is expensive. |
| Caching | Customer responses are `Cache-Control: no-store`. No CDN caching, no shared cache keys. |
| Error envelope | `{ "error": { "code", "message", "requestId"? } }` — `code` is one of the snake_case values below (parsing is case-insensitive). `message` is customer-safe and may be rendered verbatim. |

Codes used by the dashboard: `unauthenticated` (401), `forbidden` (403), `not_found` (404),
`conflict` (409), `validation_failed` (422), `insufficient_credits` (402), `rate_limited` (429),
`payment_failed` (402), `service_unavailable` (503), `internal_error` (500). A non-JSON error body is
treated by the client as `service_unavailable`.

## 10. Account

```ts
interface CustomerProfile {
  id: string;
  displayName: string | null;   // null ⇒ neutral greeting, never a guessed name
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;            // ISO 8601
  lastSignInAt?: string | null;
}

interface NotificationPreferences {
  generationComplete: boolean;
  creditReceipts: boolean;
  productUpdates: boolean;
}

// GET    /api/v1/me                     → CustomerProfile        (cached per request on the client)
// PATCH  /api/v1/me                     { displayName: string }  → CustomerProfile
// DELETE /api/v1/me                     { confirmation: "DELETE" } → { status: "deleted" }
// GET    /api/v1/me/preferences         → NotificationPreferences
// PATCH  /api/v1/me/preferences         Partial<NotificationPreferences> → NotificationPreferences
// POST   /api/v1/auth/sign-out          → { status: "signed_out" }
```

`PATCH /me/preferences` returns the full object so the UI can re-render from server truth in one
round trip. A preference is only switched in the UI after this response arrives.

## 11. Credits

```ts
interface CreditWallet {
  available: number;   // spendable now
  reserved: number;    // held by in-flight generations
  updatedAt: string;
}

type CreditTransactionType = "purchase" | "generation" | "refund" | "adjustment";
type CreditTransactionStatus = "pending" | "completed" | "failed" | "reversed";

interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  status: CreditTransactionStatus;
  description: string;        // server-written, e.g. "Studio pack purchase"
  credits: number;            // signed: +150 added, -12 spent
  amountPaise: number | null; // present for purchases/refunds
  currency: "INR" | null;
  createdAt: string;
  generationId: string | null;
}

interface CreditPack {
  id: string;                 // "creator" | "studio"
  name: string;
  pricePaise: number;         // server-authored; 49900 and 99900 today
  currency: "INR";
  credits: number;            // 150 and 350
  purchaseType: "one-time";
  highlighted: boolean;
  badge: string | null;       // "Most popular"
  description: string;
  includes: string[];
}

// GET /api/v1/credits/wallet                          → CreditWallet
// GET /api/v1/credits/transactions?type=&cursor=&limit → Paginated<CreditTransaction>
// GET /api/v1/credits/packs                            → CreditPack[]
```

Rules the UI relies on: the wallet is the only source of a balance (the client never derives one);
`available + reserved` is the total the user still owns; transactions are append-only and every
purchase, generation settlement and refund appears exactly once, with the same id.

## 12. Studio configuration

```ts
interface PhotographyStyle { id: string; name: string; summary: string; description: string; thumbnailUrl: string | null }
interface StudioScene { id: string; name: string; description: string; styleIds: string[] }
interface AspectRatioOption { id: string; label: string; width: number; height: number; description: string }
interface QualityOption { id: string; label: string; description: string; credits: number | null }

interface StudioConfig {
  styles: PhotographyStyle[];
  scenes: StudioScene[];
  aspectRatios: AspectRatioOption[];
  qualities: QualityOption[];
  maxUploadBytes: number;
  acceptedMimeTypes: string[];
}

// GET /api/v1/studio/config → StudioConfig
```

This endpoint is the single source of truth for what the studio may offer. The repository ships a
**seed** (`src/config/studio.ts`) with the three mandated styles, six scene families, four aspect
ratios and two quality modes; it is used only while the service is unreachable, and it deliberately
contains **no credit prices** (`QualityOption.credits === null`), so the UI cannot invent a rate.
`maxUploadBytes` today = 20 MB, MIME allow-list = `image/jpeg`, `image/png`, `image/webp`.

## 13. Uploads (presigned, direct to R2)

```ts
interface CreateUploadInput { filename: string; mimeType: string; bytes: number }

interface UploadTicket {
  id: string;                       // upload id for the complete call
  uploadUrl: string;                // presigned PUT, ~120s
  headers: Record<string, string>;  // must be sent verbatim (Content-Type)
  key: string;                      // {userId}/{uuid}-{safeName}
  expiresAt: string;
}

interface UploadAsset { id: string; width: number | null; height: number | null; bytes: number; mimeType: string; createdAt: string }

// POST /api/v1/uploads                  CreateUploadInput → UploadTicket
// PUT  <ticket.uploadUrl>               raw bytes, headers exactly as signed
// POST /api/v1/uploads/{id}/complete    → UploadAsset
```

Requirements: the server validates the session, MIME allow-list, byte size and (recommended) binds
`ContentLength` into the signature; the key is namespaced by user id; the browser never sees an R2
credential and no file byte passes through the Next.js server. `complete` verifies the stored object
(dimensions, bytes, content type) before returning an id that `POST /generations` will accept.

## 14. Generation

```ts
type GenerationStatus = "queued" | "preparing" | "rendering" | "completed" | "failed" | "cancelled";

interface Generation {
  id: string;
  status: GenerationStatus;
  styleId: string; styleName: string;
  sceneId: string | null; sceneName: string | null;
  aspectRatio: string;
  qualityId: string; qualityLabel: string;
  width: number | null; height: number | null;
  creditsCharged: number | null;    // settled; 0 when refunded
  creditsReserved: number | null;   // held while running
  createdAt: string; completedAt: string | null;
  failureReason: string | null;     // customer-safe
  sourceUrl: string | null; resultUrl: string | null; thumbnailUrl: string | null;
}

interface CreateGenerationInput { assetId: string; styleId: string; sceneId: string; aspectRatioId: string; qualityId: string }
interface CreateGenerationResult { generation: Generation; estimatedCredits: number }

// POST   /api/v1/generations          Idempotency-Key + CreateGenerationInput → CreateGenerationResult
// GET    /api/v1/generations/{id}     → Generation
// GET    /api/v1/generations?style=&sort=newest|oldest&cursor=&limit= → Paginated<Generation>
// DELETE /api/v1/generations/{id}     → { id }
```

Rules: credits are **reserved** inside the create call and settled or released by the worker — the
client never deducts, refunds or retries a charge on its own; `estimatedCredits` is the server's price
for that exact configuration and is what the UI shows before/after the click; status polling runs
every 2.5 s for at most two minutes, then the client stops and points at My Creations (the job keeps
running either way); `DELETE` removes the row and its objects but does not return already-settled
credits; signed URLs must live long enough for a download that starts right after the page renders.

## 15. Billing (Razorpay)

```ts
interface BillingOrder {
  orderId: string;      // rzp order id
  keyId: string;        // public key for Checkout — never the secret
  amountPaise: number;
  currency: "INR";
  packId: string; credits: number;
  expiresAt: string;
}

interface PaymentVerificationInput { orderId: string; paymentId: string; signature: string }
interface PaymentVerificationResult {
  status: "verifying" | "paid" | "failed";
  creditsAdded: number | null;
  wallet: CreditWallet | null;
}

interface PaymentRecord {
  id: string; orderId: string; packName: string;
  amountPaise: number; currency: "INR";
  status: "created" | "attempted" | "paid" | "failed" | "refunded";
  credits: number; createdAt: string;
}

// POST /api/v1/billing/orders     { packId } → BillingOrder   (amount derived server-side)
// POST /api/v1/billing/verify     PaymentVerificationInput → PaymentVerificationResult
// GET  /api/v1/billing/payments?cursor= → Paginated<PaymentRecord>
```

`verify` recomputes `HMAC_SHA256(orderId + "|" + paymentId, key_secret)` and must be the only thing
that can move a wallet to `paid`. It may return `verifying` while the webhook is still in flight — the
UI treats that as "not yet", never as success. Credits are granted from the verified webhook, keyed by
order id, so a duplicate delivery cannot double-credit.

## 16. What stage 4 must not change

- The names and shapes above, or the snake_case error codes the client parses.
- The rule that no price, cost or balance is ever computed in the browser.
- The rule that uploads never proxy through the Next.js server.
- The rule that a Checkout callback is not proof of payment.
