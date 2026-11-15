# API contract — foundation for stage 4

**Status:** documentation and types only. **No API route, database, payment integration or AI
generation exists in this repository.** Stage 1 ships the public website; this file is the agreed
shape the backend must satisfy so the marketing site can be connected without a redesign.

Machine-readable types for the one endpoint the public site owns live in
`src/lib/contact/contract.ts`. Everything else is specified here as the contract for the studio app.

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
