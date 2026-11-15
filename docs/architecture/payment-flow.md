# Payment flow

Two one-time packs, one gateway (Razorpay), one rule: **credits are granted only
after the server has seen a captured payment, exactly once.**

## Happy path

```
Browser                 API                              Razorpay
  │ POST /payments/orders │                                   │
  │ {packId:"creator"}    ├─ read PACKS (49900, 150)          │
  │                       ├─ POST /orders ───────────────────►│
  │                       ├─ insert payments (snapshot)       │
  │ ◄── BillingOrder ─────┤                                   │
  │                       │                                   │
  │ Razorpay Checkout (keyId from the response, amount from our snapshot)
  │ ──────────────────────┼──────────────────────────────────►│
  │ ◄── handler {order_id, payment_id, signature} ────────────│
  │                       │                                   │
  │ POST /payments/verify ├─ verify HMAC(order|payment)       │
  │                       ├─ GET /payments/{id} ─────────────►│
  │                       │ ◄── status: captured, amount ─────│
  │                       ├─ grant_purchase_credits (RPC)     │
  │ ◄── {status:"paid",   │                                   │
  │      creditsAdded:150}│                                   │
  │                       └─ send receipt email (best effort) │
```

The webhook (`payment.captured`) can arrive before, after or without the browser
callback. It calls the same grant path, so whichever lands first grants and the
other is a no-op.

## Trust boundaries

| Signal | Trusted? | Why |
| --- | --- | --- |
| `packId` from the browser | validated only | price and credits come from `PACKS` |
| `amount` from the browser | never sent | the order is created server-side |
| Razorpay Checkout signature | verifies the (order, payment) pair | does **not** prove capture |
| Razorpay webhook signature | verifies the delivery | payload is still re-read |
| `payment.captured` webhook body | not authoritative | provider GET is |
| Provider `status: captured` + matching amount | **authoritative** | this is what triggers the grant |

## Idempotency

| Duplicate | Protection |
| --- | --- |
| Same webhook delivered twice | unique `(provider, event_id)`; second returns `duplicate` |
| Webhook + browser callback | `payments.credits_granted_at` guard inside the grant RPC |
| Two payments against one order | unique `razorpay_payment_id` |
| Replayed verify call | returns the stored `paid` state, no second grant |

## Reconciliation

`POST /api/v1/admin/reconcile` (or the Vercel cron) looks for orders older than 15
minutes still `created`/`attempted`, asks Razorpay for their payments, and grants
any capture it finds. It also reports stuck generations and expires abandoned
uploads. Everything it does is individually idempotent.

## Failure modes

| Situation | Result |
| --- | --- |
| Signature invalid | payment marked `failed`, `failure_code = signature_invalid`, 200 with `status: "failed"`, no credits |
| Payment `failed` at the provider | payment `failed`, no credits, UI: "The payment did not go through. No credits were added." |
| Capture not visible yet | response `status: "verifying"`, UI: "Payment verification is still processing…" |
| Amount ≠ snapshot | payment `failed`, `amount_mismatch`, error logged with ids, no credits |
| Grant RPC error | response `verifying`; webhook/reconciliation retry |
| Receipt email fails | logged; payment and credits unaffected |

## Refunds

Refunding money is an owner decision and is **not** exposed as an endpoint yet.
When implemented it must: create a `refunds` row, call Razorpay, and either leave
credits alone or claw them back with an explicit `admin_adjustment` carrying the
reason. Policy, approver and the clawback rule are open owner inputs
(`docs/owner-inputs.md`).

## Tax and invoicing

No GST handling, tax invoice or receipt PDF exists. Razorpay's own receipts are
the only financial document today. GST registration, rate, invoice series and
whether prices are inclusive are open owner inputs; until they are answered the
product must not state a tax position.

## Test mode

Use Razorpay test keys in staging. Test cards are documented by Razorpay; the
project's tests never create a real order and never require network access. Before
launch, run the payment checklist in `credit-system.md` §7 items 1–5.
