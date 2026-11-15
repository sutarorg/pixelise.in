-- Pixelise · 0003 — RLS, grants and role hygiene
--
-- Supabase grants `anon`/`authenticated` broad privileges on new tables by
-- default. This migration removes them, re-grants read-only access to the
-- customer's own rows, and enables RLS so even a leaked publishable key cannot
-- read another customer's images, wallet or payments.
--
-- The backend uses the service role, which bypasses RLS. That is deliberate: the
-- browser never talks to these tables directly, and every privileged write goes
-- through the functions in 0002.

alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.assets enable row level security;
alter table public.pending_uploads enable row level security;
alter table public.generations enable row level security;
alter table public.generation_outputs enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.webhook_events enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.system_settings enable row level security;
alter table public.model_configs enable row level security;
alter table public.generation_pricing enable row level security;
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------- base grants

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.notification_preferences to authenticated;
grant select on public.credit_wallets to authenticated;
grant select on public.credit_transactions to authenticated;
grant select on public.assets to authenticated;
grant select on public.generations to authenticated;
grant select on public.generation_outputs to authenticated;
grant select on public.payments to authenticated;
grant select on public.refunds to authenticated;

-- ------------------------------------------------------------------- policies

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "preferences: read own"
  on public.notification_preferences for select to authenticated
  using (auth.uid() = user_id);

create policy "wallets: read own"
  on public.credit_wallets for select to authenticated
  using (auth.uid() = user_id);

create policy "transactions: read own"
  on public.credit_transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "assets: read own"
  on public.assets for select to authenticated
  using (auth.uid() = user_id);

create policy "generations: read own"
  on public.generations for select to authenticated
  using (auth.uid() = user_id);

create policy "generation outputs: read own"
  on public.generation_outputs for select to authenticated
  using (
    exists (
      select 1 from public.generations g
       where g.id = generation_outputs.generation_id
         and g.user_id = auth.uid()
    )
  );

create policy "payments: read own"
  on public.payments for select to authenticated
  using (auth.uid() = user_id);

create policy "refunds: read own"
  on public.refunds for select to authenticated
  using (
    exists (
      select 1 from public.payments p
       where p.id = refunds.payment_id
         and p.user_id = auth.uid()
    )
  );

-- Tables with no customer-facing policy: pending_uploads, webhook_events,
-- admin_audit_logs, contact_messages, system_settings, model_configs,
-- generation_pricing, rate_limits. RLS is on and no policy exists, so every
-- non-service-role query returns zero rows / is rejected.

-- ------------------------------------------------------------------ functions

-- Functions that move money must not be executable by a browser session.
revoke all on function public.credit_apply(uuid, public.credit_txn_type, integer, text, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.credit_reserve(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.credit_close_hold(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_purchase_credits(uuid) from public, anon, authenticated;
revoke all on function public.admin_adjust_credits(uuid, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_overview(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.set_user_role(uuid, uuid, public.app_role, text) from public, anon, authenticated;

grant execute on function public.credit_apply(uuid, public.credit_txn_type, integer, text, uuid, text, text, jsonb) to service_role;
grant execute on function public.credit_reserve(uuid, uuid, integer) to service_role;
grant execute on function public.credit_close_hold(uuid, text) to service_role;
grant execute on function public.grant_purchase_credits(uuid) to service_role;
grant execute on function public.admin_adjust_credits(uuid, uuid, text, integer, text) to service_role;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.admin_overview(timestamptz, timestamptz) to service_role;
grant execute on function public.set_user_role(uuid, uuid, public.app_role, text) to service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- The auth trigger function is invoked by Supabase's auth schema, not by users.
revoke all on function public.handle_new_user() from public, anon, authenticated;
