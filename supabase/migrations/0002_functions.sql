-- Pixelise · 0002 — transactional credit + payment functions
--
-- Every balance change in the product goes through one of these functions. They
-- are SECURITY DEFINER, lock the wallet row, and are idempotent by key. The API
-- calls them with the service role; nothing here is reachable from a browser
-- session (see 0003 for grants).

-- ---------------------------------------------------------------- credit_apply

create or replace function public.credit_apply(
  p_user_id uuid,
  p_type public.credit_txn_type,
  p_delta integer,
  p_reference_type text,
  p_reference_id uuid,
  p_idempotency_key text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  transaction_id uuid,
  available_credits integer,
  reserved_credits integer,
  applied boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.credit_wallets;
  v_existing public.credit_transactions;
  v_txn uuid;
begin
  if p_delta = 0 then
    raise exception 'credit delta must not be zero' using errcode = '22023';
  end if;

  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'a ledger entry needs a description' using errcode = '22023';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing
      from public.credit_transactions
     where idempotency_key = p_idempotency_key;

    if found then
      select * into v_wallet from public.credit_wallets where user_id = v_existing.user_id;
      return query select v_existing.id, v_wallet.available_credits, v_wallet.reserved_credits, false;
      return;
    end if;
  end if;

  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if not found then
    raise exception 'wallet_not_found' using errcode = 'P0002';
  end if;

  if p_delta < 0 and v_wallet.available_credits + p_delta < 0 then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.credit_wallets
     set available_credits = credit_wallets.available_credits + p_delta,
         updated_at = now()
   where user_id = p_user_id
   returning * into v_wallet;

  insert into public.credit_transactions (
    user_id, transaction_type, credit_delta, balance_after, reserved_after,
    reference_type, reference_id, idempotency_key, description, metadata
  )
  values (
    p_user_id, p_type, p_delta, v_wallet.available_credits, v_wallet.reserved_credits,
    p_reference_type, p_reference_id, p_idempotency_key, p_description, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_txn;

  return query select v_txn, v_wallet.available_credits, v_wallet.reserved_credits, true;
end;
$$;

-- -------------------------------------------------------------- credit_reserve

-- Moves credits from available to reserved for one generation. Idempotent per
-- generation: a retried request returns the existing hold instead of taking a
-- second one.
create or replace function public.credit_reserve(
  p_user_id uuid,
  p_generation_id uuid,
  p_credits integer
)
returns table (
  available_credits integer,
  reserved_credits integer,
  applied boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.credit_wallets;
  v_key text := 'generation:' || p_generation_id || ':reserve';
begin
  if p_credits is null or p_credits <= 0 then
    raise exception 'invalid_credit_amount' using errcode = '22023';
  end if;

  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if not found then
    raise exception 'wallet_not_found' using errcode = 'P0002';
  end if;

  -- Already held for this generation?
  if exists (select 1 from public.credit_transactions where idempotency_key = v_key) then
    return query select v_wallet.available_credits, v_wallet.reserved_credits, false;
    return;
  end if;

  if v_wallet.available_credits < p_credits then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  update public.credit_wallets
     set available_credits = credit_wallets.available_credits - p_credits,
         reserved_credits = credit_wallets.reserved_credits + p_credits,
         updated_at = now()
   where user_id = p_user_id
   returning * into v_wallet;

  insert into public.credit_transactions (
    user_id, transaction_type, credit_delta, balance_after, reserved_after,
    reference_type, reference_id, idempotency_key, description, metadata
  )
  values (
    p_user_id, 'reservation', -p_credits, v_wallet.available_credits, v_wallet.reserved_credits,
    'generation', p_generation_id, v_key,
    'Credits held for a generation',
    jsonb_build_object('kind', 'hold')
  );

  -- The hold amount lives on the generation row so that settlement/release can
  -- find it from a single locked row, even after a process restart.
  update public.generations
     set credits_reserved = p_credits
   where id = p_generation_id;

  return query select v_wallet.available_credits, v_wallet.reserved_credits, true;
end;
$$;

-- ------------------------------------------------- settlement helpers (shared)

create or replace function public.credit_close_hold(
  p_generation_id uuid,
  p_outcome text
)
returns table (
  available_credits integer,
  reserved_credits integer,
  credits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_generation public.generations;
  v_wallet public.credit_wallets;
  v_hold integer;
begin
  if p_outcome not in ('consumed', 'released') then
    raise exception 'invalid_outcome' using errcode = '22023';
  end if;

  select * into v_generation
    from public.generations
   where id = p_generation_id
   for update;

  if not found then
    raise exception 'generation_not_found' using errcode = 'P0002';
  end if;

  select * into v_wallet from public.credit_wallets where user_id = v_generation.user_id for update;
  v_hold := v_generation.credits_reserved;

  -- Guarded by the generation row: a second caller sees credits_reserved = 0 and
  -- gets a no-op, so a duplicated webhook cannot settle twice.
  if v_hold <= 0 then
    return query select v_wallet.available_credits, v_wallet.reserved_credits, 0;
    return;
  end if;

  if p_outcome = 'consumed' then
    update public.credit_wallets
       set reserved_credits = greatest(credit_wallets.reserved_credits - v_hold, 0),
           updated_at = now()
     where user_id = v_generation.user_id
     returning * into v_wallet;

    insert into public.credit_transactions (
      user_id, transaction_type, credit_delta, balance_after, reserved_after,
      reference_type, reference_id, idempotency_key, description, metadata
    )
    values (
      v_generation.user_id, 'consumption', 0, v_wallet.available_credits, v_wallet.reserved_credits,
      'generation', p_generation_id, 'generation:' || p_generation_id || ':settle',
      'Generation completed — held credits used',
      jsonb_build_object('kind', 'settles_reservation', 'credits', v_hold)
    );
  else
    update public.credit_wallets
       set available_credits = credit_wallets.available_credits + v_hold,
           reserved_credits = greatest(credit_wallets.reserved_credits - v_hold, 0),
           updated_at = now()
     where user_id = v_generation.user_id
     returning * into v_wallet;

    insert into public.credit_transactions (
      user_id, transaction_type, credit_delta, balance_after, reserved_after,
      reference_type, reference_id, idempotency_key, description, metadata
    )
    values (
      v_generation.user_id, 'refund', v_hold, v_wallet.available_credits, v_wallet.reserved_credits,
      'generation', p_generation_id, 'generation:' || p_generation_id || ':release',
      'Generation did not complete — credits returned',
      jsonb_build_object('kind', 'hold_released')
    );
  end if;

  update public.generations
     set credits_reserved = 0
   where id = p_generation_id;

  return query select v_wallet.available_credits, v_wallet.reserved_credits, v_hold;
end;
$$;

-- -------------------------------------------------------------- purchase grant

-- Grants the credits for a verified payment exactly once. Returns the wallet and
-- whether this call was the one that applied them.
create or replace function public.grant_purchase_credits(p_payment_id uuid)
returns table (
  available_credits integer,
  reserved_credits integer,
  credits_granted integer,
  applied boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_wallet public.credit_wallets;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;

  if v_payment.credits_granted_at is not null then
    select * into v_wallet from public.credit_wallets where user_id = v_payment.user_id;
    return query select v_wallet.available_credits, v_wallet.reserved_credits, v_payment.credits_to_grant, false;
    return;
  end if;

  if v_payment.payment_status = 'failed' then
    raise exception 'payment_not_payable' using errcode = 'P0001';
  end if;

  perform public.credit_apply(
    v_payment.user_id,
    'purchase',
    v_payment.credits_to_grant,
    'payment',
    p_payment_id,
    'payment:' || p_payment_id || ':grant',
    v_payment.pack_name || ' pack purchase',
    jsonb_build_object('amountPaise', v_payment.amount_paise, 'orderId', v_payment.razorpay_order_id)
  );

  update public.payments
     set payment_status = 'paid',
         paid_at = coalesce(paid_at, now()),
         credits_granted_at = now(),
         updated_at = now()
   where id = p_payment_id;

  select * into v_wallet from public.credit_wallets where user_id = v_payment.user_id;
  return query select v_wallet.available_credits, v_wallet.reserved_credits, v_payment.credits_to_grant, true;
end;
$$;

-- ----------------------------------------------------------- admin adjustments

create or replace function public.admin_adjust_credits(
  p_admin_id uuid,
  p_user_id uuid,
  p_direction text,
  p_credits integer,
  p_reason text
)
returns table (
  transaction_id uuid,
  available_credits integer,
  reserved_credits integer,
  applied boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
  v_result record;
begin
  if p_direction not in ('credit', 'debit') then
    raise exception 'invalid_direction' using errcode = '22023';
  end if;
  if p_credits is null or p_credits <= 0 or p_credits > 100000 then
    raise exception 'invalid_credit_amount' using errcode = '22023';
  end if;
  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  v_delta := case when p_direction = 'credit' then p_credits else -p_credits end;

  select * into v_result from public.credit_apply(
    p_user_id,
    'admin_adjustment',
    v_delta,
    'adjustment',
    null,
    'admin_adjustment:' || gen_random_uuid()::text,
    'Admin credit adjustment',
    jsonb_build_object('reason', trim(p_reason), 'adminId', p_admin_id)
  );

  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata, result)
  values (
    p_admin_id, 'credit_adjustment', 'user', p_user_id::text, trim(p_reason),
    jsonb_build_object('direction', p_direction, 'credits', p_credits, 'transactionId', v_result.transaction_id),
    'success'
  );

  return query select v_result.transaction_id, v_result.available_credits, v_result.reserved_credits, v_result.applied;
end;
$$;

-- ---------------------------------------------------------------- rate limiting

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_key text,
  p_window_seconds integer,
  p_limit integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits (bucket, key, window_start, hits)
  values (p_bucket, p_key, v_window, 1)
  on conflict (bucket, key, window_start)
  do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup: keeps the table small without a scheduled job.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return query
    select v_hits <= p_limit,
           greatest(p_limit - v_hits, 0),
           v_window + make_interval(secs => p_window_seconds);
end;
$$;

-- ------------------------------------------------------------- overview metrics

create or replace function public.admin_overview(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_users jsonb;
  v_revenue jsonb;
  v_credits jsonb;
  v_generations jsonb;
  v_volume jsonb;
begin
  select jsonb_build_object(
    'total', (select count(*) from public.profiles where account_status <> 'deleted'),
    'newInPeriod', (select count(*) from public.profiles where created_at >= p_from and created_at < p_to)
  ) into v_users;

  select jsonb_build_object(
    'grossPaise', coalesce((select sum(amount_paise) from public.payments
                             where payment_status = 'paid' and paid_at >= p_from and paid_at < p_to), 0),
    'refundedPaise', coalesce((select sum(amount_paise) from public.refunds
                                where status = 'processed' and created_at >= p_from and created_at < p_to), 0),
    'successfulPayments', (select count(*) from public.payments
                            where payment_status = 'paid' and paid_at >= p_from and paid_at < p_to),
    'pendingPayments', (select count(*) from public.payments
                         where payment_status in ('created', 'attempted')
                           and created_at >= p_from and created_at < p_to),
    'failedPayments', (select count(*) from public.payments
                        where payment_status = 'failed' and created_at >= p_from and created_at < p_to)
  ) into v_revenue;

  select jsonb_build_object(
    'purchased', coalesce((select sum(credit_delta) from public.credit_transactions
                            where transaction_type = 'purchase' and created_at >= p_from and created_at < p_to), 0),
    'consumed', coalesce((select sum((metadata ->> 'credits')::int) from public.credit_transactions
                           where transaction_type = 'consumption' and created_at >= p_from and created_at < p_to), 0),
    'reserved', coalesce((select sum(reserved_credits) from public.credit_wallets), 0),
    'adjusted', coalesce((select sum(credit_delta) from public.credit_transactions
                           where transaction_type = 'admin_adjustment' and created_at >= p_from and created_at < p_to), 0)
  ) into v_credits;

  select jsonb_build_object(
    'total', (select count(*) from public.generations where created_at >= p_from and created_at < p_to),
    'completed', (select count(*) from public.generations where generation_status = 'completed' and created_at >= p_from and created_at < p_to),
    'failed', (select count(*) from public.generations where generation_status = 'failed' and created_at >= p_from and created_at < p_to),
    'cancelled', (select count(*) from public.generations where generation_status = 'cancelled' and created_at >= p_from and created_at < p_to),
    'averageDurationMs', (
      select round(avg(extract(epoch from (completed_at - started_at)) * 1000))
        from public.generations
       where generation_status = 'completed' and started_at is not null and completed_at is not null
         and created_at >= p_from and created_at < p_to
    )
  ) into v_generations;

  select coalesce(jsonb_agg(point order by point ->> 'date'), '[]'::jsonb)
    into v_volume
    from (
      select jsonb_build_object(
               'date', to_char(day, 'YYYY-MM-DD'),
               'total', total,
               'failed', failed
             ) as point
        from (
          select date_trunc('day', created_at) as day,
                 count(*) as total,
                 count(*) filter (where generation_status = 'failed') as failed
            from public.generations
           where created_at >= p_from and created_at < p_to
           group by 1
        ) daily
    ) points;

  return jsonb_build_object(
    'users', v_users,
    'revenue', v_revenue,
    'credits', v_credits,
    'generations', v_generations || jsonb_build_object(
      'successRate',
      case
        when (v_generations ->> 'completed')::int + (v_generations ->> 'failed')::int = 0 then null
        else round(
          (v_generations ->> 'completed')::numeric /
          ((v_generations ->> 'completed')::int + (v_generations ->> 'failed')::int), 4)
      end
    ),
    'volume', v_volume
  );
end;
$$;

-- --------------------------------------------------------------- role management

-- The only supported way to change a role. Updates both the profile mirror and
-- the auth record's app_metadata, and writes an audit entry.
create or replace function public.set_user_role(
  p_admin_id uuid,
  p_user_id uuid,
  p_role public.app_role,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  update public.profiles set role = p_role where id = p_user_id;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('app_role', p_role::text)
   where id = p_user_id;

  insert into public.admin_audit_logs (admin_user_id, action, target_type, target_id, reason, metadata)
  values (p_admin_id, 'role_change', 'user', p_user_id::text, trim(p_reason),
          jsonb_build_object('role', p_role));
end;
$$;
