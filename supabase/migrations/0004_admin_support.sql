-- Pixelise · 0004 — admin aggregation helpers
--
-- The console never computes a metric in the browser, and it never loads a table
-- into memory to count it. These two functions give the list pages what they
-- need in one round trip.

create or replace function public.admin_user_stats(p_user_ids uuid[])
returns table (
  user_id uuid,
  generations_total bigint,
  purchases_total bigint,
  lifetime_paid_paise bigint,
  credits_lifetime_purchased bigint,
  credits_lifetime_consumed bigint
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    coalesce((select count(*) from public.generations g where g.user_id = p.id), 0) as generations_total,
    coalesce((select count(*) from public.payments pay where pay.user_id = p.id and pay.payment_status = 'paid'), 0) as purchases_total,
    coalesce((select sum(pay.amount_paise) from public.payments pay where pay.user_id = p.id and pay.payment_status = 'paid'), 0) as lifetime_paid_paise,
    coalesce((select sum(t.credit_delta) from public.credit_transactions t
               where t.user_id = p.id and t.transaction_type = 'purchase'), 0) as credits_lifetime_purchased,
    coalesce((select sum((t.metadata ->> 'credits')::int) from public.credit_transactions t
               where t.user_id = p.id and t.transaction_type = 'consumption'), 0) as credits_lifetime_consumed
  from public.profiles p
  where p.id = any(p_user_ids);
$$;

revoke all on function public.admin_user_stats(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_user_stats(uuid[]) to service_role;

-- A single place that decides what "active customer" means for the console:
-- someone with at least one generation in the period. Documented in
-- docs/architecture/security.md so the console can label the number honestly.
create or replace function public.admin_active_customers(p_from timestamptz, p_to timestamptz)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(distinct user_id)
    from public.generations
   where created_at >= p_from and created_at < p_to;
$$;

revoke all on function public.admin_active_customers(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_active_customers(timestamptz, timestamptz) to service_role;
