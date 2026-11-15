-- Pixelise · seed
--
-- Safe to run on a fresh database and safe to re-run (all inserts are upserts by
-- primary key). It seeds *capability*, never *policy*:
--
--   · model endpoints are real endpoints from the fal documentation, but every
--     row ships with routing_enabled = false, so nothing is dispatched until an
--     owner turns a model on in /admin/models;
--   · no generation_pricing rows are inserted, because the credit rate per
--     generation has not been approved yet. Until an approved row exists for a
--     style + quality, the studio shows "pricing not configured" and the
--     generation API refuses to charge.
--
-- Apply with: supabase db push  (or psql -f supabase/seed.sql)

insert into public.system_settings (key, value)
values
  ('email.notifications_enabled', 'true'::jsonb),
  ('support.recipient', 'null'::jsonb),
  ('generation.failure_refund_note', '"Credits are returned automatically when a generation fails."'::jsonb)
on conflict (key) do nothing;

-- Verified endpoints (docs/research/backend-architecture-research.md §4). The
-- provider cost is only recorded where fal publishes it; unknown costs stay null
-- rather than guessed.
insert into public.model_configs (id, provider, name, endpoint, category, availability, image_modes, output_resolutions, provider_cost_usd, routing_enabled)
values
  ('fal-google-nano-banana-2.1-edit', 'fal', 'Nano Banana 2.1 · edit', 'google/nano-banana-2.1/edit', 'image',
   'available', array['image-to-image'], array['2K'], null, false),
  ('fal-nano-banana-2-edit', 'fal', 'Nano Banana 2 · edit', 'fal-ai/nano-banana-2/edit', 'image',
   'available', array['image-to-image'], array[]::text[], null, false),
  ('fal-nano-banana-edit', 'fal', 'Nano Banana · edit', 'fal-ai/nano-banana/edit', 'image',
   'available', array['image-to-image'], array[]::text[], 0.039, false)
on conflict (id) do nothing;
