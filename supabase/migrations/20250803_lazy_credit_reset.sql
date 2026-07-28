-- Lazy monthly credit reset: gate on next_reset_date instead of cron.
-- Renames next_refill_at -> next_reset_date and rewrites refill RPC for idempotent lazy checks.

-- ---------------------------------------------------------------------------
-- 1. Column: next_reset_date (rename from next_refill_at when present)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_credits'
      and column_name = 'next_refill_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_credits'
      and column_name = 'next_reset_date'
  ) then
    alter table public.user_credits
      rename column next_refill_at to next_reset_date;
  end if;
end $$;

alter table public.user_credits
  add column if not exists next_reset_date timestamptz;

update public.user_credits uc
set next_reset_date = coalesce(
  uc.next_reset_date,
  coalesce(uc.last_credit_refill_at, uc.signup_date, uc.updated_at) + interval '30 days'
)
where uc.next_reset_date is null;

-- ---------------------------------------------------------------------------
-- 2. Lazy reset RPC (row-locked, single grant per billing cycle)
-- ---------------------------------------------------------------------------

create or replace function public.try_refill_user_credits(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_credits_row public.user_credits%rowtype;
  v_profile public.profiles%rowtype;
  v_anchor timestamptz;
  v_now timestamptz := timezone('utc', now());
  v_period interval := interval '30 days';
  v_refill_amount integer;
  v_billing_plan text;
  v_subscription_status text;
  v_signup_date timestamptz;
  v_new_current integer;
  v_next_reset timestamptz;
  v_effective_plan text;
  v_credits_plan text;
  v_previous_monthly integer;
  v_cycles_advanced integer := 0;
  v_max_cycles integer := 12;
begin
  select * into v_credits_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('refilled', false, 'reason', 'no_credits_row');
  end if;

  select * into v_profile from public.profiles where id = p_user_id;

  v_billing_plan := coalesce(v_profile.plan, 'free');
  v_subscription_status := coalesce(v_profile.subscription_status, 'inactive');

  v_refill_amount := public.resolve_plan_monthly_credits(
    v_billing_plan,
    v_subscription_status
  );

  v_effective_plan := case
    when v_subscription_status = 'active' and v_billing_plan in ('pro', 'custom') then v_billing_plan
    when v_subscription_status = 'active' and v_billing_plan = 'starter' then 'starter'
    else 'free'
  end;

  v_credits_plan := case
    when v_effective_plan in ('pro', 'custom') then 'pro'
    else 'free'
  end;

  v_signup_date := coalesce(
    v_credits_row.signup_date,
    v_profile.created_at,
    (select u.created_at from auth.users u where u.id = p_user_id)
  );

  if v_credits_row.signup_date is null and v_signup_date is not null then
    update public.user_credits set signup_date = v_signup_date where user_id = p_user_id;
  end if;

  if v_subscription_status = 'active'
     and v_billing_plan in ('starter', 'pro', 'custom')
     and v_profile.purchase_date is not null then
    v_anchor := v_profile.purchase_date;
  else
    v_anchor := v_signup_date;
  end if;

  if v_anchor is null then
    return jsonb_build_object(
      'refilled', false, 'reason', 'missing_anchor',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_row.plan, 'billing_plan', v_billing_plan,
      'next_reset_date', v_credits_row.next_reset_date
    );
  end if;

  v_next_reset := coalesce(v_credits_row.next_reset_date, v_anchor + v_period);

  if v_now < v_next_reset then
    update public.user_credits
    set
      plan = v_credits_plan,
      monthly_allowance = v_refill_amount,
      next_reset_date = v_next_reset
    where user_id = p_user_id
      and (
        plan is distinct from v_credits_plan
        or monthly_allowance is distinct from v_refill_amount
        or next_reset_date is distinct from v_next_reset
      );

    return jsonb_build_object(
      'refilled', false, 'reason', 'not_due',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_plan, 'billing_plan', v_billing_plan,
      'next_reset_date', v_next_reset
    );
  end if;

  v_previous_monthly := v_credits_row.monthly_credits;

  while v_next_reset <= v_now and v_cycles_advanced < v_max_cycles loop
    v_next_reset := v_next_reset + v_period;
    v_cycles_advanced := v_cycles_advanced + 1;
  end loop;

  update public.user_credits
  set
    plan = v_credits_plan,
    monthly_credits = v_refill_amount,
    monthly_allowance = v_refill_amount,
    last_credit_refill_at = v_now,
    next_reset_date = v_next_reset
  where user_id = p_user_id
  returning * into v_credits_row;

  v_new_current := v_credits_row.monthly_credits + v_credits_row.purchased_credits;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    credit_source, metadata
  ) values (
    p_user_id, v_refill_amount, v_new_current, 'monthly_refill',
    'monthly',
    jsonb_build_object(
      'billing_plan', v_billing_plan,
      'effective_plan', v_effective_plan,
      'previous_monthly', v_previous_monthly,
      'purchased_preserved', v_credits_row.purchased_credits,
      'cycles_advanced', v_cycles_advanced,
      'anchor_date', v_anchor,
      'lazy_reset', true
    )
  );

  return jsonb_build_object(
    'refilled', true,
    'credits', v_new_current,
    'monthly_credits', v_refill_amount,
    'purchased_credits', v_credits_row.purchased_credits,
    'plan', v_credits_row.plan,
    'billing_plan', v_billing_plan,
    'refilled_at', v_now,
    'anchor_date', v_anchor,
    'next_reset_date', v_next_reset,
    'cycles_advanced', v_cycles_advanced,
    'previous_credits', v_previous_monthly + v_credits_row.purchased_credits
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Plan sync + signup helpers use next_reset_date
-- ---------------------------------------------------------------------------

create or replace function public.sync_user_credits_for_plan(
  p_user_id uuid,
  p_profiles_plan text,
  p_subscription_status text,
  p_reset_credits integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_monthly integer;
  v_allowance integer;
  v_credits_plan text;
  v_existing public.user_credits%rowtype;
begin
  perform public.ensure_user_credits(p_user_id);

  select * into v_existing
  from public.user_credits
  where user_id = p_user_id
  for update;

  v_monthly := coalesce(
    p_reset_credits,
    public.resolve_plan_monthly_credits(p_profiles_plan, p_subscription_status)
  );
  v_allowance := v_monthly;

  if p_profiles_plan in ('pro', 'custom') and p_subscription_status = 'active' then
    v_credits_plan := 'pro';
  else
    v_credits_plan := 'free';
  end if;

  update public.user_credits
  set
    plan = v_credits_plan,
    monthly_credits = v_monthly,
    monthly_allowance = v_allowance,
    last_credit_refill_at = v_now,
    next_reset_date = v_now + interval '30 days'
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type, metadata
  )
  select
    p_user_id,
    v_monthly - coalesce(v_existing.monthly_credits, 0),
    uc.current_credits,
    'subscription_sync',
    jsonb_build_object(
      'plan', p_profiles_plan,
      'subscription_status', p_subscription_status,
      'purchased_preserved', uc.purchased_credits
    )
  from public.user_credits uc
  where uc.user_id = p_user_id;
end;
$$;

create or replace function public.try_claim_free_credits(
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email_lower text := lower(trim(p_email));
  v_free_amount integer := 50;
  v_now timestamptz := timezone('utc', now());
  v_signup_date timestamptz;
  v_inserted_claim boolean;
begin
  if p_user_id is null or v_email_lower is null or v_email_lower = '' then
    return false;
  end if;

  if exists (
    select 1 from public.user_credits uc where uc.user_id = p_user_id
  ) then
    return false;
  end if;

  insert into public.free_credit_claims (email_lower, user_id)
  values (v_email_lower, p_user_id)
  on conflict (email_lower) do nothing
  returning true into v_inserted_claim;

  if not coalesce(v_inserted_claim, false) then
    return false;
  end if;

  select coalesce(u.created_at, v_now) into v_signup_date
  from auth.users u where u.id = p_user_id;

  insert into public.user_credits (
    user_id,
    credits,
    monthly_credits,
    purchased_credits,
    current_credits,
    total_used_credits,
    monthly_allowance,
    plan,
    signup_date,
    last_credit_refill_at,
    next_reset_date,
    updated_at
  )
  values (
    p_user_id,
    v_free_amount,
    v_free_amount,
    0,
    v_free_amount,
    0,
    v_free_amount,
    'free',
    v_signup_date,
    v_now,
    v_now + interval '30 days',
    v_now
  )
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    credit_source, metadata
  ) values (
    p_user_id, v_free_amount, v_free_amount, 'grant',
    'grant', jsonb_build_object('reason', 'free_signup')
  );

  return true;
end;
$$;

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (
    user_id,
    credits,
    monthly_credits,
    purchased_credits,
    current_credits,
    total_used_credits,
    monthly_allowance,
    plan,
    signup_date,
    last_credit_refill_at,
    next_reset_date,
    updated_at
  )
  values (
    new.id,
    50,
    50,
    0,
    50,
    0,
    50,
    'free',
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now()),
    timezone('utc', now()) + interval '30 days',
    timezone('utc', now())
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
