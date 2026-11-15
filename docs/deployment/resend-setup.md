# Resend setup

## 1. Account and domain

1. Create a Resend account.
2. **Domains → Add domain** → `pixelise.in`.
3. Add the DNS records Resend shows (SPF, DKIM; DMARC is strongly recommended) and
   wait for verification. Sending from an unverified domain fails with a 403.
4. **API keys → Create** → sending access only → `RESEND_API_KEY`.
5. Set `RESEND_FROM_EMAIL` to a verified address, e.g.
   `Pixelise <hello@pixelise.in>`. The display name is part of the value.

## 2. Templates

Templates live in `src/lib/email/templates.ts` — plain functions returning HTML
and text, so they can be tested and so the sender never computes money.

| Email | Trigger | Data source |
| --- | --- | --- |
| Welcome | after a confirmed sign-up session | profile display name |
| Purchase receipt | after `grant_purchase_credits` commits | payment snapshot (pack, amount, credits, order id, payment id, paid date, balance after) |
| Generation ready | after the settlement commits | generation style name and credits used |
| Generation failed | after the refund commits | style name and credits returned |
| Account suspended / reactivated | after the admin status change commits | reason from the audit entry |

Financial emails never reverse state: `sendEmail` returns a boolean, logs failures,
and the caller ignores it.

## 3. Local development

Leave `RESEND_API_KEY` empty. Every send logs
`email not configured — skipped` and the product continues. Do not add a fake
mailer: a fake inbox would be indistinguishable from working email in a demo.

## 4. Testing

* The welcome email can be verified with a real sign-up in staging.
* The purchase receipt requires a test-mode payment; check the amount and credits
  match the payment row exactly.
* Check that a failed generation email arrives *and* that the wallet was credited
  back before it does.

## 5. Deliverability notes

* Use one verified subdomain for transactional mail (`mail.pixelise.in`) if the
  root domain also sends marketing mail.
* Keep the sender name human ("Pixelise") and the reply-to useful.
* Do not add tracking pixels: the privacy page states the product does not track
  opens, and adding them would make that false.
* Resend rate limits apply; the app sends one message per event and never retries
  automatically.

## 6. Known gaps

* No bounce/complaint webhook is wired. If deliverability becomes a problem, add
  Resend's webhook and record suppressions.
* No unsubscribe link in transactional mail — these are all transactional, but any
  marketing email added later must include one and update the privacy page.
