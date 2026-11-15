# fal.ai setup

## 1. Key

1. Create an account at fal.ai → **Keys** → add a key.
2. Set `FAL_KEY` in Vercel (production and preview) and in `.env.local`.
3. The key format is `key_id:key_secret`; store it whole.

Without `FAL_KEY`, `POST /api/v1/generations` returns `not_configured` and the
studio shows "generation not connected". Nothing is charged.

## 2. Webhook

The generator passes `?fal_webhook=<NEXT_PUBLIC_APP_URL>/api/v1/webhooks/fal` on
every submission, so there is nothing to configure in the dashboard for the basic
flow. If the dashboard asks for a webhook URL, use the same path.

fal documents retries but no request signature. The receiver therefore treats the
delivery as a hint and re-reads the queue status before completing anything. A
secret (`FAL_WEBHOOK_SECRET`) can be appended if the dashboard supports it, but the
system does not depend on it.

## 3. Models

Seeded models are **disabled**. Enable exactly one:

```
PATCH /api/v1/admin/models/fal-google-nano-banana-2.1-edit
{ "routingEnabled": true, "availability": "available", "reason": "Approved default model for launch" }
```

Requirements before enabling:

* The endpoint id is taken from fal's current docs (not a blog post).
* The model supports image-to-image editing with `image_urls`.
* `output_resolutions` matches what the endpoint accepts; the router only sends
  `resolution` when the value is listed.
* `provider_cost_usd` is filled in if fal publishes it, for margin reporting.

## 4. Cost expectations

fal bills per image. The published price for `fal-ai/nano-banana/edit` is
$0.039/image; other models' prices vary. Because credit rates are not approved,
the studio cannot generate at all — which also means no provider spend can occur
by accident.

Before enabling generation in production, compute the intended margin from
`model_configs.provider_cost_usd` and the pack economics
(₹499/150 ≈ ₹3.33 per credit, ₹999/350 ≈ ₹2.85 per credit).

## 5. Testing without spend

* Unit tests never call fal.
* In staging, one real generation per release is enough. The failure path can be
  exercised by disabling the model mid-flight or by pointing `FAL_QUEUE_BASE_URL`
  at a stub that returns an error shape.
* A 402 `insufficient_credits` path needs no provider call at all.

## 6. Troubleshooting

| Symptom | Check |
| --- | --- |
| `not_configured` | `FAL_KEY` missing, or no model has `routing_enabled = true` |
| Job stuck in `processing` | webhook URL reachable? Run `POST /admin/reconcile` |
| `unreadable_output` | provider returned a non-image; check the model's response shape |
| 401 from fal | key revoked or the `Key ` header format changed |
