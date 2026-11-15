# Production-readiness checklist

Status legend: **verified here** (proved in this environment), **needs staging**
(implemented, must be run against real infrastructure), **owner action** (blocked
on a decision or credential).

## 1. Database

| Item | Status |
| --- | --- |
| Migrations written and reviewed | verified here (not executed — no Postgres in this sandbox) |
| Run `supabase db push` on a disposable project, then again on staging | needs staging |
| Seed applied (models disabled, no pricing) | needs staging |
| RLS enabled on all tables; publishable key reads only own rows | needs staging |
| `credit_reserve` / `credit_close_hold` / `grant_purchase_credits` concurrency checklist (`credit-system.md` §7) | needs staging |
| PITR enabled, backup restored once as a drill | owner action (§29) |

## 2. Auth

| Item | Status |
| --- | --- |
| Sign-up → confirm → sign-in → dashboard | needs staging |
| Sign-out clears the session; protected routes redirect | verified here (proxy + guards compiled; redirect logic is exercised by the sign-in page) |
| Suspended account blocked at the API, not just the UI | verified here (guard code) / needs staging (behaviour) |
| Admin role granted only via `app_metadata`, console 403 for a normal user | needs staging |
| Password recovery link works end-to-end | needs staging |
| Supabase redirect allow-list matches every deployment origin | owner action |

## 3. Storage

| Item | Status |
| --- | --- |
| Presigned PUT works from the deployed origin (CORS) | needs staging |
| Magic-byte rejection for a renamed file | needs staging |
| Oversize rejection after upload | needs staging |
| Signed GET expires; no public object access | needs staging |
| No object key contains a user filename | verified here (key builder + tests) |

## 4. AI generation

| Item | Status |
| --- | --- |
| No approved pricing ⇒ `not_configured`, zero credits spent | verified here (service guard + HTTP probe returned `not_configured`) |
| One enabled model; submission accepted by fal | needs staging |
| Webhook completes a job; duplicate webhook is a no-op | needs staging |
| Failure releases the hold exactly once | needs staging |
| Stuck job is failed and refunded by reconciliation | needs staging |
| Prompt keeps identity rules; no accuracy claim | verified here (unit tests) |

## 5. Payments

| Item | Status |
| --- | --- |
| Both packs create orders with the exact snapshot amounts | needs staging (Razorpay test) |
| Signature verification rejects tampering | verified here (unit tests) |
| Webhook signature verified over raw body; replay is a no-op | verified here (logic) / needs staging (delivery) |
| Credits granted once per payment | needs staging |
| Amount mismatch is refused | verified here (logic) / needs staging |
| Reconciliation credits a captured-but-uncredited order | needs staging |

## 6. Email

| Item | Status |
| --- | --- |
| Domain verified, sender configured | owner action |
| Receipt shows the stored snapshot, not computed values | verified here (template + call site) |
| Email failure cannot reverse money | verified here (best-effort sender) |
| Unconfigured email logs and continues | verified here (probe) |

## 7. Frontend integration

| Item | Status |
| --- | --- |
| Website pricing matches the backend pack table | verified here (unit test) |
| Contact form submits, shows validation, ticket id, and honest failure states | verified here (build + validation probe) / needs staging (delivery) |
| Customer pages read real endpoints (no mock data) | verified here (all API calls resolve through `src/lib/api`) |
| Studio shows pending/failed/refunded states without inventing a result | verified here (existing stage-2 UI + real statuses) |
| Admin console renders real aggregates or `Not available` | verified here (types + services) / needs staging |
| Noindex on `/dashboard`, `/studio`, `/creations`, `/credits`, `/transactions`, `/settings`, `/admin`, `/api`, `/login`, `/signup` | verified here (robots + metadata from stage 1–3) |

## 8. Deployment and operations

| Item | Status |
| --- | --- |
| `.env.example` complete; no secret committed | verified here |
| `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test` clean | verified here (90 routes, 50 tests) |
| Webhook URLs reachable over https from both providers | needs staging |
| Vercel cron for reconciliation created | owner action (§31) |
| Structured logs include a request id on every API response | verified here |
| Error responses carry no stack trace, provider text or internal host | verified here (unit test) |
| Rate limits active on auth, contact, uploads, generations, orders | verified here (code + probe of 429 path via bucket limits) |

## 9. What is explicitly not ready

1. **No real credentials have been used.** Supabase, Razorpay, fal, R2 and Resend
   were never contacted from this environment. Every provider flow is
   contract-tested, not integration-tested.
2. **Generation is disabled** until the owner approves a credit rate and enables a
   model. That is intentional, not a bug.
3. **GST, invoices, refund policy, retention and credit expiry** are unimplemented
   and unclaimed (`docs/owner-inputs.md` §23–§26).
4. **Migrations have not been executed.** They must be run on a disposable project
   first; only then can any statement about database behaviour be made.
5. **No penetration test, load test or accessibility audit** was performed for the
   backend.

Launch readiness is therefore: *the code paths exist and are tested at the unit and
contract level; the product is not launch-ready until §1–§8 marked “needs staging”
have been run against real infrastructure and the owner actions in
`docs/owner-inputs.md` are answered.*
