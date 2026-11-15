# Owner inputs required

Everything on the public site is either verified business information or an explicit description of
what the site does today. The items below are **unknown**, so they were not invented. Each one lists
where it will appear once answered, and what the temporary behaviour is until then.

Priority 1 items block a public launch; priority 2 items are needed before checkout opens.

---

## Priority 1 — needed before the site goes live

| # | Question | Where it lands | Current behaviour |
| --- | --- | --- | --- |
| 1 | **Support channel.** A real support email address, or a help-desk/ticketing URL, and hours of operation (or “no fixed hours”). | Contact page, footer, FAQ answer *How do I contact support?* | The contact form is rendered **disabled** with a notice explaining sending is not enabled. No email address is printed anywhere. |
| 2 | **Legal entity name and registered address** (the name that appears on invoices and in contracts). | Terms of service, Privacy policy, footer copyright line | Footer says `© 2026 Pixelise`; policies refer to “Pixelise” without a registered entity or address. |
| 3 | **GST registration status** — registered (with GSTIN displayed on invoices) or not registered. | Terms of service (pricing clause), checkout, invoices | Terms say taxes are stated at checkout before payment; no GSTIN is claimed. |
| 4 | **Jurisdiction** — the city/state whose courts govern the terms. | Terms of service § Governing law | Terms say “subject to the jurisdiction of Indian courts” with no city named. |
| 5 | **Trademark status of the name “Pixelise”** and confirmation the domain `pixelise.in` is owned and controlled by the business. | Everywhere; `siteConfig.url` | `siteConfig.url` defaults to `https://pixelise.in`. If the production domain differs, set `NEXT_PUBLIC_SITE_URL`. |
| 6 | **Studio application URL** (`app.pixelise.in` or similar) for sign-up, log-in and checkout. | Header “Log in”, every “Get started” CTA, `/get-started` access panel | `NEXT_PUBLIC_APP_URL` is unset, so CTAs resolve to the on-site `/get-started` page and log-in resolves to `/get-started#studio-access`. No route 404s. |
| 7 | **Credit expiry** — do credits expire, and if so after what period? | FAQ *How do Pixelise credits work?*, Terms, Refund policy | Site says credits sit in the balance and are spent as you generate. **No expiry is claimed either way.** This must be stated explicitly once decided. |
| 8 | **Licence granted on generated images** — what exactly may a customer do commercially, and is any attribution required? | FAQ *Can I use images for ecommerce listings and advertising?*, Terms § Your product photos | Site says the visuals are made for listings, marketplaces, ads and social, and points to the Terms for usage. The Terms currently state only that the customer keeps the rights they hold in their own photos and that Pixelise does not claim ownership of uploads. **The full licence needs legal drafting.** |
| 9 | **Image retention and deletion** — how long source photos and outputs are stored, and how a customer requests deletion. | Privacy policy (studio section), Terms | Only the public website is described. The studio's retention policy is explicitly deferred to the studio's own notice. |

---

## Priority 2 — needed before credit checkout opens

| # | Question | Where it lands | Current behaviour |
| --- | --- | --- | --- |
| 10 | **Refund eligibility beyond the stated cases.** The policy currently commits to: full refund if credits are not delivered, credits returned if a generation fails on our side, and statutory rights unaffected. Everything else is “reviewed individually”. | `/refund-policy` | Written as above, so nothing is over-promised. Add a refund window if the business wants one. |
| 11 | **Credit cost per generation** (per style / per setting) | Pricing page footnote, FAQ, `/pricing` notes | The site says the cost is shown in the studio next to the style before generating. **No exchange rate is published or invented.** |
| 12 | **Payment provider and tax handling** (Razorpay/Stripe/etc., inclusive vs exclusive pricing, invoice format) | Terms § Credit packs, checkout | Not referenced by name; the site never names a provider. |
| 13 | **Support response commitment** (e.g. “within 2 working days”) | Contact page, FAQ | No response time is promised. |
| 14 | **Privacy contact** — a dedicated privacy address or a form route | Privacy policy § Contacting us | Points at the contact page and says a dedicated privacy contact will be published with the studio launch. |
| 15 | **Analytics decision.** The site currently ships **zero** third-party scripts and no cookies. If analytics or pixel tracking is added, the privacy policy and a consent mechanism must be updated in the same change. | Privacy policy § Cookies, site-wide | No trackers; privacy policy states this and it is true. |
| 16 | **Social profiles** (Instagram/X/LinkedIn) if they should appear in the footer and in `Organization.sameAs`. | Footer, structured data | Omitted entirely — no unverified profile URLs are claimed. |
| 17 | **Founding/customer proof.** If real reviews, logos or case studies become available, they may be added — with written permission and real numbers. | Home, `/examples` | No testimonials, no logo wall, no counters. The audience strip states the audience, not customers. |
| 18 | **Whether marketing imagery may be described as “made in Pixelise”** in social/newsletter contexts. | `docs/creative-assets.md`, `/examples` disclosure | The site says the images are original Pixelise studio artwork produced for this site, and explicitly *not* customer work. |
| 19 | **Legal review sign-off** on `/terms`, `/privacy` and `/refund-policy`. | All three policy pages | Written to be accurate about today's site; they still need a lawyer's review before launch. |
| 20 | **Stage 2 dashboard route names** so the `/get-started` copy can link directly once the app exists. | `/get-started`, header | Generic “studio application” language. |

---

## Confirmed business facts already used (do not change without instruction)

- **Brand:** Pixelise — AI product photography studio.
- **Tagline:** “Transform ordinary product photos into extraordinary visuals.”
- **Creator:** ₹499 · 150 credits · one-time purchase.
- **Studio:** ₹999 · 350 credits · one-time purchase · visually highlighted as most popular.
- **No subscriptions of any kind**, no bonus credits, no third tier, no trials, no discount codes.
- **Target audience:** Shopify store owners, Indian D2C brands, Amazon/marketplace sellers, ecommerce
  entrepreneurs, small product businesses, marketing and creative agencies.
- **Outcomes:** professional studio photography, realistic lifestyle photography, commercial
  advertising imagery, better-looking ecommerce visuals.

These live in `src/config/pricing.ts` and `src/config/content.ts` so a price or pack change is a
one-line edit that flows to the pricing cards, comparison table, FAQ copy, footer pill and
`SoftwareApplication` structured data together.

---

## Claims deliberately avoided

Recorded so they are not reintroduced by accident:

- No generation speed beyond the hero's brief “in seconds” (supplied copy).
- No “X% cheaper than a photoshoot”, no rupee-savings figures.
- No customer counts, brand counts, image counts, ratings or awards.
- No “trusted by” logo wall.
- No invented response times, refund windows, credit expiry or licence terms.
- No email address, phone number, registered address, GSTIN or CIN anywhere on the site.
- No “demo mode”, sample data or placeholder content of any kind.

---

# Stage 2 additions — customer dashboard

These decisions block published claims in the workspace. Each has a designed placeholder today, so
nothing false ships while they are open.

| # | Needed | Where it appears | Placeholder behaviour |
| --- | --- | --- | --- |
| 1 | GST treatment on credit packs (inclusive/exclusive) and whether invoices are issued | `/credits` support line, `/transactions` amount column | Copy points at the refund policy and contact page; no tax claim is made |
| 2 | Refund window and who approves a refund | `/credits`, `/settings` (delete account), `/refund-policy` | "Handled under the refund policy" with no invented timeframe |
| 3 | Support inbox and response-time promise | `/help`, `/contact`, account menu | "A monitored inbox doesn't exist yet" |
| 4 | Data-retention period for source photos and results after deletion | `/settings` delete dialog | States what is removed, not how long backups persist |
| 5 | Password policy, MFA availability, session lifetime | `/settings` security section | States that the account service owns it; no simulated controls |
| 6 | Credit cost per generation (standard vs premium) | `/studio` cost panel | Shows `—` and explains the service confirms the cost |
| 7 | Final scene catalogue, aspect ratios and quality tiers | `/studio` seed | `src/config/studio.ts` is labelled a default catalogue |
| 8 | Download link lifetime (signed URLs) | `/settings` security note, creation page | Says links are time-limited, without a number |

## Admin console (stage 3)

| Question | Why it matters | Current behaviour |
| --- | --- | --- |
| What counts as an "active customer"? | The overview shows the metric only if the API documents a definition | `activeCustomers: null` → "Not available"; no definition is invented |
| Who may hold each console role (`owner`, `admin`, `analyst`, `support`)? | Determines who can adjust credits, suspend accounts, toggle routing | `GET /admin/me` returns `permissions[]`; the console mirrors them and the service re-checks |
| Which administrator actions require a second approver? | Credits and refunds are money-moving | Every write requires a reason and is audited; two-person approval is not modelled yet |
| Refund policy for the two packs | The console must not imply a refund it cannot perform | No refund control until `POST /admin/payments/{id}/refunds` exists server-side |
| Retention period for audit entries and signed preview URLs | Operational and legal requirement | Audit log is append-only; preview URLs are per-request and short-lived |
| Support inbox address shown in Configuration | It is rendered on the console only — never fabricated | `supportEmail: null` renders "Not available" |
