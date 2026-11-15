-- Pixelise · 0001 — schema
--
-- Conventions
--  · Money is integer paise. Credits are integers. No floats anywhere.
--  · Every user-owned row carries user_id and is protected by RLS (0003).
--  · Customer-facing writes go through the functions in 0002; the tables
--    themselves are read-only to the `authenticated` role.
--  · Nothing here seeds business policy. Model endpoints, credit rates and
--    approval flags are configuration rows (see seed.sql and the admin API).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enumerations

create type public.app_role as enum ('user', 'admin');
create type public.account_status as enum ('active', 'suspended', 'pending_verification', 'deleted');
create type public.credit_txn_type as enum ('purchase', 'reservation', 'consumption', 'refund', 'admin_adjustment');
create type public.asset_type as enum ('original', 'generated');
create type public.generation_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');
create type public.payment_status as enum ('created', 'attempted', 'paid', 'failed', 'refunded');
create type public.refund_status as enum ('created', 'processed', 'failed');
create type public.webhook_status as enum ('received', 'processed', 'failed', 'ignored');
create type public.audit_action as enum (
  'credit_adjustment', 'user_suspension', 'user_reactivation',
  'model_setting', 'config_change', 'refund', 'role_change'
);
create type public.audit_result as enum ('success', 'failure');
create type public.pending_upload_status as enum ('pending', 'completed', 'expired', 'rejected');
create type public.model_availability as enum ('available', 'degraded', 'unavailable');

-- --------------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  role public.app_role not null default 'user',
  account_status public.account_status not null default 'active',
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'Mirror of app_metadata.app_role for joins. Authorization always re-reads app_metadata server-side.';

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  generation_complete boolean not null default true,
  credit_receipts boolean not null default true,
  product_updates boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------- credits

create table public.credit_wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  available_credits integer not null default 0 check (available_credits >= 0),
  reserved_credits integer not null default 0 check (reserved_credits >= 0),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  transaction_type public.credit_txn_type not null,
  -- Zero is allowed only for `consumption`: the reservation already moved the
  -- credits out of `available`, and the consumption row records the settlement of
  -- that hold. Every other type must move the balance.
  credit_delta integer not null check (credit_delta <> 0 or transaction_type = 'consumption'),
  balance_after integer check (balance_after >= 0),
  reserved_after integer check (reserved_after >= 0),
  reference_type text check (reference_type in ('payment', 'generation', 'adjustment', 'system')),
  reference_id uuid,
  idempotency_key text unique,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);
create index credit_transactions_reference_idx
  on public.credit_transactions (reference_type, reference_id);
create index credit_transactions_type_created_idx
  on public.credit_transactions (transaction_type, created_at desc);

-- ----------------------------------------------------------------------- assets

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  asset_type public.asset_type not null,
  object_key text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  generation_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index assets_user_created_idx on public.assets (user_id, created_at desc);
create index assets_generation_idx on public.assets (generation_id);

create table public.pending_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  object_key text not null unique,
  mime_type text not null,
  expected_bytes integer not null check (expected_bytes > 0),
  status public.pending_upload_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_asset_id uuid references public.assets (id) on delete set null
);

create index pending_uploads_user_idx on public.pending_uploads (user_id, created_at desc);

-- ------------------------------------------------------------------ generations

create table public.model_configs (
  id text primary key,
  provider text not null default 'fal',
  name text not null,
  endpoint text not null,
  category text not null default 'image',
  availability public.model_availability not null default 'available',
  image_modes text[] not null default '{}',
  output_resolutions text[] not null default '{}',
  quality_params jsonb not null default '{}'::jsonb,
  provider_cost_usd numeric(10, 4),
  routing_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.generation_pricing (
  id uuid primary key default gen_random_uuid(),
  style_id text not null,
  quality_id text not null,
  resolution text,
  credits integer not null check (credits > 0),
  approved boolean not null default false,
  notes text,
  updated_at timestamptz not null default now(),
  unique (style_id, quality_id)
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_asset_id uuid not null references public.assets (id) on delete restrict,
  photography_style text not null,
  scene_id text,
  quality_id text not null,
  aspect_ratio text not null,
  resolution text,
  model_id text references public.model_configs (id) on delete set null,
  model_endpoint text not null,
  generation_status public.generation_status not null default 'queued',
  credit_cost integer not null check (credit_cost > 0),
  credits_reserved integer not null default 0 check (credits_reserved >= 0),
  provider_request_id text unique,
  provider_status_url text,
  provider_response_url text,
  idempotency_key text unique,
  failure_code text,
  failure_message_safe text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index generations_user_created_idx on public.generations (user_id, created_at desc);
create index generations_status_created_idx on public.generations (generation_status, created_at);
create index generations_provider_request_idx on public.generations (provider_request_id);

create table public.generation_outputs (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  asset_id uuid not null unique references public.assets (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.assets
  add constraint assets_generation_fk
  foreign key (generation_id) references public.generations (id) on delete set null;

-- --------------------------------------------------------------------- payments

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pack_id text not null,
  pack_name text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  credits_to_grant integer not null check (credits_to_grant > 0),
  payment_status public.payment_status not null default 'created',
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  razorpay_signature_verified boolean not null default false,
  webhook_verified boolean not null default false,
  credits_granted_at timestamptz,
  failure_code text,
  failure_message_safe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payments_user_created_idx on public.payments (user_id, created_at desc);
create index payments_status_created_idx on public.payments (payment_status, created_at);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  amount_paise integer not null check (amount_paise > 0),
  status public.refund_status not null default 'created',
  provider_refund_id text unique,
  reason text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index refunds_payment_idx on public.refunds (payment_id);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('razorpay', 'fal')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processing_status public.webhook_status not null default 'received',
  safe_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

-- ------------------------------------------------------------ admin + platform

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles (id) on delete set null,
  action public.audit_action not null,
  target_type text not null,
  target_id text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  result public.audit_result not null default 'success',
  created_at timestamptz not null default now()
);

create index admin_audit_created_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_admin_idx on public.admin_audit_logs (admin_user_id, created_at desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  source_path text,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  ip_hash text,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.rate_limits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, key, window_start)
);

-- ------------------------------------------------------------------- triggers

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger notification_preferences_touch before update on public.notification_preferences
  for each row execute function public.touch_updated_at();
create trigger generations_touch before update on public.generations
  for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- A profile, wallet and preferences row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do nothing;

  insert into public.credit_wallets (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roles and account status are never writable from a customer session.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_setting('role', true) not in ('service_role', 'postgres')
     and (new.role is distinct from old.role
          or new.account_status is distinct from old.account_status) then
    raise exception 'profile role and account status are server-managed';
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();
