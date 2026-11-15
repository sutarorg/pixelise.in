# Vercel setup

## 1. Project

1. Import `sutarorg/pixelise.in` into Vercel.
2. Framework preset: **Next.js** (auto-detected). Build `npm run build`, install `npm install`.
3. Node 22.x (matches `@types/node` and the Supabase SDK requirements).
4. Root directory: repository root.

## 2. Environment variables

Add the variables from `.env.example` under **Settings → Environment Variables**.
Use *Production* for live keys and *Preview* for test keys.

Minimum for a working customer app:

| Variable | Scope |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | production origin, e.g. `https://pixelise.in` |
| `NEXT_PUBLIC_SUPABASE_URL` | all |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | all |
| `SUPABASE_SERVICE_ROLE_KEY` | all — server only, mark as *Sensitive* |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | all (server) |
| `FAL_KEY` | all (server) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | test keys on preview, live on production |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | production |
| `CRON_SECRET`, `IP_HASH_SALT` | production (random strings) |

`NEXT_PUBLIC_*` values are visible in the browser. Everything else must never be
prefixed with `NEXT_PUBLIC_`.

## 3. Previews

* Every PR gets a preview deployment. Point preview env at Razorpay **test** keys
  and a development R2 bucket.
* Add the preview origin pattern to the R2 CORS rule, or uploads fail with an
  opaque browser CORS error.
* Supabase Auth redirect allow-list must include
  `https://*-<project>.vercel.app/api/v1/auth/callback` for preview sign-in.

## 4. Async work and limits

* All routes run on the Node runtime (no edge). Money and image paths use
  `node:crypto` and the AWS SDK, neither of which is edge-compatible.
* Generation returns `202` immediately; nothing long-running happens inside the
  request. The fal webhook and the polling endpoint do the follow-up work.
* `POST /api/v1/admin/reconcile` can take up to two minutes when many jobs are
  stuck. Vercel's default function limit is enough; raise it in project settings
  if the deployment grows.

## 5. Cron (optional but recommended)

Create `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/v1/admin/reconcile", "schedule": "*/15 * * * *" }
  ]
}
```

Vercel sends `Authorization: Bearer $CRON_SECRET`; the route accepts that instead
of a session. If cron is not enabled, run reconciliation from the admin console
after any provider incident.

## 6. Webhook URLs

| Provider | URL |
| --- | --- |
| Razorpay | `https://<domain>/api/v1/webhooks/razorpay` (events: `payment.captured`, `payment.failed`, `order.paid`) |
| fal | Sent automatically as `fal_webhook` by the generation service |

Razorpay rejects `localhost` and tunnel domains; the production domain is
required for live webhooks.

## 7. Post-deploy checks

1. `GET /api/v1/public/config` returns `200` with `capabilities.payments: true`.
2. Sign up, confirm the email, sign in — `/dashboard` loads with a real wallet.
3. Upload a small JPEG; the object appears under `originals/<userId>/…`.
4. With generation pricing still unapproved, `POST /api/v1/generations` returns
   `not_configured` — that is correct until the owner approves rates.
5. Razorpay test purchase → wallet increases once; replay the webhook → unchanged.
