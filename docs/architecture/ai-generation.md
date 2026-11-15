# AI generation

fal.ai queue → webhook/poll → validation → R2 → settlement. Everything is
server-driven; the browser never talks to fal and never sees a provider URL.

## Models

Seeded in `supabase/seed.sql`, all with `routing_enabled = false`:

| Id | Endpoint | Notes |
| --- | --- | --- |
| `fal-google-nano-banana-2.1-edit` | `google/nano-banana-2.1/edit` | documented `image_urls` (≤14), `aspect_ratio`, `resolution: "2K"` |
| `fal-nano-banana-2-edit` | `fal-ai/nano-banana-2/edit` | newer variant; capabilities recorded, not assumed |
| `fal-nano-banana-edit` | `fal-ai/nano-banana/edit` | provider list price $0.039/image |

Routing is config, not code: `src/lib/ai/fal-client.ts` speaks the queue API,
`model-router` (inside `generation-service.ts`) picks the cheapest model with
`routing_enabled = true` and `availability in ('available','degraded')`. Turning a
model on is a `PATCH /api/v1/admin/models/{id}` with a reason, audited.

Adding a model requires: the endpoint id from fal's docs, the modes and
resolutions it actually accepts, and its cost if published. Anything unknown stays
`null` rather than guessed.

## Request construction

```
POST https://queue.fal.run/{endpoint}?fal_webhook={appUrl}/api/v1/webhooks/fal
Authorization: Key ${FAL_KEY}

{
  "prompt": "<built server-side>",
  "image_urls": ["<5-minute signed GET of the customer's original>"],
  "aspect_ratio": "1:1",
  "resolution": "2K"          // only when the model lists it
}
```

* The source URL expires after an hour; the queue fetches it during that window.
* Only documented fields are sent. Unsupported parameters are dropped by the
  router rather than risking a 422.
* `num_images` and `output_format` are omitted; the provider defaults are used
  until their behaviour is verified for the chosen endpoint.

## Prompts

`src/lib/ai/prompt-builder.ts` builds a deterministic prompt from `styleId`,
`sceneId` and `aspectRatio`:

1. the product in the input image is the subject;
2. a style direction (studio / lifestyle / advertising);
3. a scene direction (the six scenes the studio offers);
4. explicit identity rules — silhouette, proportions, packaging, print layout,
   **every label word**, logo position, colour values;
5. a realism instruction (shadows, reflection, perspective, no render look).

No template claims guaranteed fidelity; the string "100%" appears nowhere and the
marketing copy never promises it. A test asserts this.

## Pipeline

```
price (approved row) → route (model) → insert generation (queued)
  → credit_reserve (RPC) → submit to queue → store request/status/response URLs (processing)
  → provider webhook or poll → re-read status
      COMPLETED → GET result → download bytes (host allow-list)
                → sniff magic bytes → PUT to R2 generated/{user}/{generation}/{output}
                → insert asset + generation_outputs → mark completed → credit_close_hold('consumed')
      ERROR/CANCELLED → mark failed → credit_close_hold('released') (refund row)
```

`refreshGeneration` is idempotent and is the only function that completes a job;
the webhook and the polling endpoint both call it.

## Failure handling

| Cause | Code | Customer message |
| --- | --- | --- |
| Provider error, submit rejected | `provider_error` | "Your image could not be processed. Your reserved credits have been returned." |
| No progress for 20 minutes | `timeout` | "This generation took too long and was stopped. Your reserved credits have been returned." |
| Result unreadable / not an image | `unreadable_output` | "The generated file could not be read. Your reserved credits have been returned." |
| Could not store the result | `storage` | "Your image was created but could not be saved. Your reserved credits have been returned." |
| Customer cancels | `cancelled` | "This generation was cancelled. Your reserved credits have been returned." |

Raw provider errors are logged with the request id, never returned. The
`generations` row keeps `failure_code` and `failure_message_safe`; nothing
provider-specific is exposed.

## Webhooks

fal documents retries and no request signature. The receiver therefore:

1. records the delivery in `webhook_events` (unique per request id);
2. looks up the generation by `provider_request_id`;
3. calls `refreshGeneration`, which reads the authoritative status/result;
4. answers `200` even when the refresh is deferred, because reconciliation covers
   it and a retry loop would help nothing.

## Cost and margin reporting

`model_configs.provider_cost_usd` is the published per-image price; it feeds the
admin console's cost comparison. Credit revenue per generation is
`generation_pricing.credits × cost per credit` (pack price ÷ pack credits), which
is deliberately shown as a *formula*, not a stored margin, because the owner has
not approved either a rate or a margin.

## What is not implemented

* No upscaling, background removal, or multi-image batches.
* No fine-tuning or customer-specific models.
* No streaming previews; the UI shows a designed pending state instead.
* No automatic retry of a failed generation — the customer decides, and their
  credits are back in the meantime.
