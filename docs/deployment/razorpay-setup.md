# Razorpay setup

## 1. Keys

Dashboard → Account & Settings → API keys → generate.

| Mode | Key id | Use |
| --- | --- | --- |
| Test | `rzp_test_…` | local + preview |
| Live | `rzp_live_…` | production only |

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the matching environment. The
key id is returned to the browser by the order endpoint; the secret never leaves
the server.

## 2. Webhook

Settings → Webhooks → Add new webhook.

* URL: `https://<domain>/api/v1/webhooks/razorpay`
* Secret: a long random string → `RAZORPAY_WEBHOOK_SECRET`
* Active events: `payment.captured`, `payment.failed`, `order.paid`
* Alert email: your on-call address

Razorpay rejects `localhost` and tunnel hosts and does not deliver to them, so a
real webhook test needs a deployed domain. For local work, use the test-mode
checkout callback (`/api/v1/payments/verify`) and the reconcile endpoint to
simulate a missed webhook.

## 3. Checkout

The storefront asks the API for an order:
`POST /api/v1/payments/orders {packId}` → `{ orderId, keyId, amountPaise, currency,
packId, credits, expiresAt }`.

Open Razorpay Checkout with `key: keyId`, `order_id: orderId` and `amount` from the
response. Never pass an amount from a form.

On success the handler posts `{orderId, paymentId, signature}` to
`/api/v1/payments/verify`. A `verifying` response means the capture is not visible
yet — the UI should poll the payments list or retry the verify call rather than
telling the customer they were charged.

## 4. Amounts

| Pack | Amount (paise) | Credits |
| --- | --- | --- |
| Creator | 49 900 | 150 |
| Studio | 99 900 | 350 |

These come from `src/config/packs.ts`. The server re-reads them at order creation
and snapshots them onto the payment row; the verification step compares the
provider's captured amount with that snapshot and refuses to credit a mismatch.

## 5. Refunds

No refund endpoint exists. Refund from the Razorpay dashboard, then record what
happened: a `refunds` row plus, if credits must come back, an `admin_adjustment`
with a written reason. Policy and approver are open owner inputs.

## 6. Test checklist

1. Creator purchase with a test card → wallet +150, one receipt email.
2. Replay the webhook from the dashboard → wallet unchanged.
3. Second purchase → +350 for Studio.
4. Tamper with the signature in the verify call → `failed`, no credits.
5. Close the checkout without paying → payment stays `created`; reconciliation
   marks nothing and takes no credits.
