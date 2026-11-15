# Database schema

Postgres (Supabase). Migrations in `supabase/migrations/`:

| File | Contents |
| --- | --- |
| `0001_schema.sql` | enums, tables, indexes, triggers |
| `0002_functions.sql` | atomic credit, payment, rate-limit and aggregation functions |
| `0003_rls.sql` | RLS policies and grants |
| `0004_admin_support.sql` | admin aggregation helpers |
| `supabase/seed.sql` | capability seed (models off, no pricing) |

> **Verification status:** these files were reviewed by hand and exercised through
> the service layer, but they have **not** been executed against a live Postgres
> instance in this environment (no database is reachable here). Run
> `supabase db push` on a disposable project before launch and follow
> `production-readiness.md` §2.

## Conventions

* Money is integer **paise**; credits are integers. No floats.
* Every customer-owned row has `user_id` and an RLS policy.
* Customer-visible tables are `SELECT`-only for the `authenticated` role; all
  writes go through the service role and the functions in `0002`.
* Timestamps are `timestamptz`, defaulting to `now()`.

## Tables

### Identity

**profiles** — one row per `auth.users` row (created by the `on_auth_user_created`
trigger). `display_name`, `role` (`user`|`admin`), `account_status`
(`active`|`suspended`|`pending_verification`|`deleted`), suspension metadata.
`protect_profile_columns()` blocks a non-service role from changing `role` or
`account_status`.

**notification_preferences** — per-user toggles: `generation_complete`,
`credit_receipts`, `product_updates`.

### Credits

**credit_wallets** — `available_credits`, `reserved_credits`, both `>= 0`. The
only mutable balance in the system; a hot row per user, always mutated under
`SELECT … FOR UPDATE`.

**credit_transactions** — append-only ledger: `transaction_type`
(`purchase|reservation|consumption|refund|admin_adjustment`), `credit_delta`,
`balance_after`, `reserved_after`, `reference_type/id`, `idempotency_key` (unique),
`description`, `metadata`. `credit_delta` may be `0` only for `consumption`
(the hold already left `available`).

### Assets and generations

**assets** — `asset_type` (`original|generated`), unique `object_key`, MIME, size,
dimensions, optional `generation_id`, `deleted_at` for soft delete.

**pending_uploads** — one row per signed upload; `object_key`, declared MIME,
expected bytes, `expires_at`, status (`pending|completed|expired|rejected`).

**generations** — style, scene, quality, aspect ratio, resolution, model id and
endpoint, status (`queued|processing|completed|failed|cancelled`), `credit_cost`,
`credits_reserved`, provider request/status/response URLs, unique
`provider_request_id`, unique `idempotency_key`, safe failure fields.

**generation_outputs** — `generation_id` → `asset_id` (unique), one row per output.

**model_configs** — provider, endpoint, availability, image modes, output
resolutions, `provider_cost_usd`, `routing_enabled`, `quality_params`.

**generation_pricing** — `(style_id, quality_id)` → `credits`, `resolution`,
`approved`. Generation is impossible unless an approved row exists.

### Payments

**payments** — pack snapshot (`pack_id`, `pack_name`, `amount_paise`, `currency`,
`credits_to_grant`), status (`created|attempted|paid|failed|refunded`), unique
`razorpay_order_id`, unique `razorpay_payment_id`, `razorpay_signature_verified`,
`webhook_verified`, `credits_granted_at`, safe failure fields, `paid_at`.

**refunds** — payment id, amount, status, provider refund id, reason, actor.

**webhook_events** — unique `(provider, event_id)`, event type, raw payload,
processing status and a safe error string. The dedupe table for both providers.

### Platform

**admin_audit_logs** — actor, action, target, reason, metadata, result.
**contact_messages** — name, email, topic, message, source path, status, hashed IP.
**system_settings** — key/value JSONB with `updated_by`.
**rate_limits** — `(bucket, key, window_start)` → hits.

## Functions (all `SECURITY DEFINER`, service-role only)

| Function | Guarantee |
| --- | --- |
| `credit_apply(user, type, delta, ref…, idempotency_key)` | locks the wallet, refuses to go negative, writes the ledger row, returns balances |
| `credit_reserve(user, generation, credits)` | moves available → reserved and stamps `generations.credits_reserved`; idempotent per generation |
| `credit_close_hold(generation, 'consumed'\|'released')` | converts or releases the hold exactly once, keyed on the locked generation row |
| `grant_purchase_credits(payment)` | grants once per payment (`credits_granted_at` guard) |
| `admin_adjust_credits(admin, user, direction, credits, reason)` | validates a reason, refuses overdraw, writes ledger + audit |
| `consume_rate_limit(bucket, key, window, limit)` | fixed-window counter with opportunistic cleanup |
| `admin_overview(from, to)` | all dashboard figures in one round trip |
| `admin_user_stats(uuid[])`, `admin_active_customers(from,to)` | per-customer aggregates, active-customer definition |
| `set_user_role(admin, user, role, reason)` | role mirror + `app_metadata` + audit |
| `handle_new_user()` | profile, wallet and preferences for a new auth user |

## Indexes and access patterns

* `credit_transactions (user_id, created_at desc)` — history page.
* `generations (user_id, created_at desc)`, `(generation_status, created_at)`,
  `(provider_request_id)` — gallery, webhook lookup, reconciliation.
* `payments (user_id, created_at desc)`, `(payment_status, created_at)` —
  receipts, reconciliation.
* `assets (user_id, created_at desc)`, `(generation_id)`; `assets.object_key` unique.
* `admin_audit_logs (created_at desc)`, `(admin_user_id, created_at desc)`.

## RLS summary

| Table | `authenticated` policy |
| --- | --- |
| profiles, preferences, wallet, transactions, assets, generations, payments | `auth.uid() = user_id` |
| generation_outputs, refunds | via the owning generation / payment |
| pending_uploads, webhook_events, audit logs, contact, settings, models, pricing, rate_limits | no policy — denied |

Grants and revokes are explicit in `0003_rls.sql` because Supabase grants broad
privileges on new tables by default.

## Regenerating types

Once the schema is live:

```bash
supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/database.types.ts
```

The service layer narrows rows at its boundary today; generated types should
replace those local interfaces without changing call sites.
