# Credit system

Credits are the only currency inside Pixelise. They are bought in two one-time
packs and spent on generations. This document defines the model, the invariants,
and the tests that must pass on a staging database before launch.

## Packs (fixed)

| Pack | Price | Credits | Type |
| --- | --- | --- | --- |
| Creator | ₹499 (49 900 paise) | 150 | one-time |
| Studio | ₹999 (99 900 paise) | 350 | one-time |

Defined once in `src/config/packs.ts`; the marketing copy in
`src/config/pricing.ts` is asserted equal by
`src/config/pricing-consistency.test.ts`. Subscriptions, trials, bonus credits and
extra tiers do not exist.

## Wallet model

```
available_credits   spendable now
reserved_credits    held by jobs that have not finished
```

Both are `>= 0` by table constraint. A generation costs `C` credits:

| Step | Wallet | Ledger row | Guard |
| --- | --- | --- | --- |
| Reserve | available −C, reserved +C | `reservation`, delta −C | `available >= C`, else `insufficient_credits` |
| Success | reserved −C | `consumption`, delta 0, `metadata.credits = C` | generation still queued/processing |
| Failure / cancel | available +C, reserved −C | `refund`, delta +C | generation still queued/processing |

Why the consumption row carries delta 0: the reservation already removed the
credits from `available`, so the ledger sum equals the balance only if settlement
does not subtract again. The consumption row records *which* hold was used and how
much — that is the audit value — while the money moved at reservation.

## Ledger invariants

For every user, at any time:

```
available = Σ(reservation, consumption, refund, purchase, admin_adjustment deltas)
reserved  = Σ(open holds)  where an open hold is a reservation with no matching
           consumption/refund for the same generation
```

`credit_transactions` is append-only: no update path exists in the application,
`authenticated` has only `SELECT`, and `idempotency_key` is unique.

## Idempotency

| Operation | Key |
| --- | --- |
| Reserve | `generation:{id}:reserve` |
| Settle | `generation:{id}:settle` |
| Release | `generation:{id}:release` |
| Purchase | `payment:{id}:grant` |
| Adjustment | a fresh uuid per admin action (deliberately not retry-safe; the console asks for confirmation) |

Two callers racing on the same generation cannot both settle: `credit_close_hold`
locks the generation row, reads `credits_reserved`, and returns a no-op when it is
already 0.

## Generation pricing (not yet approved)

`generation_pricing(style_id, quality_id) → credits, approved`.

* `approved = false` (the default, and the state of a fresh install) means the
  studio shows "pricing not configured" and `POST /generations` returns
  `not_configured` **without charging anything**.
* `approved = true` is the owner's explicit decision, made through
  `POST /api/v1/admin/pricing`, and is audited as a config change.
* The studio shows a credit figure per quality only when every approved style
  shares the same number; otherwise it stays `null`.

The rate is never sent by the browser, never hard-coded in the frontend, and never
derived from the provider's price. What to charge per generation is listed as an
open owner input.

## Expiry

No expiry is implemented and none is implied. `expiry` is a documented owner
decision (`docs/owner-inputs.md`). When a policy exists, it becomes a scheduled
`admin_adjustment`-style debit with a published notice period — not a silent
balance change.

## Refunds

* Failed, cancelled or timed-out generation → automatic hold release plus a
  `refund` ledger row. The customer message is exact: "Your image could not be
  processed. Your reserved credits have been returned."
* A refund of money (Razorpay) is a separate, owner-approved action. Credits that
  were already spent are not silently clawed back; a clawback is an explicit
  `admin_adjustment` with a reason. Policy and approver are open owner inputs.

## Admin adjustments

`admin_adjust_credits` requires a reason of at least 10 characters, refuses to
take `available` below zero, writes the ledger row and the audit row in the same
transaction. UI: `/admin/credits` → Adjust.

## Verification checklist (staging)

Run once against a disposable Supabase project, with two test accounts:

1. **Purchase** — Razorpay test payment for Creator; wallet +150; ledger
   `purchase` row with `amountPaise = 49900`; receipt email once.
2. **Duplicate webhook** — replay the same `payment.captured` with the same event
   id; wallet unchanged; `webhook_events` still one row.
3. **Duplicate callback** — call `/payments/verify` twice with the same payload;
   second returns `paid` with the same balance.
4. **Wrong signature** — tamper with the signature; `failed`, no grant.
5. **Amount mismatch** — capture a payment whose amount differs from the snapshot;
   `failed`, alert logged, no grant.
6. **Successful generation** — wallet −cost at reserve, `reserved` visible; on
   completion `consumption` row, `reserved` back to 0, balance unchanged after
   settlement.
7. **Failed generation** — force a provider error; `refund` row, balance restored
   exactly once, failure message safe.
8. **Insufficient credits** — start with 5 credits and a 10-credit rate; `402
   insufficient_credits`, no generation row stuck in `queued`.
9. **Concurrency** — two tabs, one generation each, wallet with exactly one
   generation's worth of credits: exactly one succeeds, the other gets `402`, and
   `reserved` never exceeds the balance that was available.
10. **Duplicate reservation** — call `POST /generations` twice with the same
    `Idempotency-Key`; one generation row, one hold.
11. **Adjustment** — credit 10 as owner; ledger + audit rows; as `analyst` the
    request is `403`.
12. **Cross-user access** — with account B's session, request account A's
    generation id: `404`, and the direct Supabase read with the publishable key
    returns no rows.
