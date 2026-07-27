-- Fix monthly credit refills: correct plan amounts, metered Pro, missed resets, next_refill_at.

-- ---------------------------------------------------------------------------
-- 1. Plan credit limits (single source of truth in DB, aligned with app)
-- ---------------------------------------------------------------------------

create table if not exists public.plan_credit_limits (
  plan_id text primary key,
  monthly_credits integer not null check (monthly_credits > 0)
);

insert into public.plan_credit_limits (plan_id, monthly_credits) values
  ('free', 50),
  ('starter', 500),
  ('pro', 2500),
  ('custom', 2500)
on conflict (plan_id) do update
set monthly_credits = excluded.monthly_credits;

-- ---------------------------------------------------------------------------
-- 2. Persist next billing reset for UI + cron
-- ---------------------------------------------------------------------------

alter table public.user_credits
  add column if not exists next_refill_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Resolve monthly allowance from profiles billing state
-- ---------------------------------------------------------------------------

create or replace function public.resolve_plan_monthly_credits(
  p_billing_plan text,
  p_subscription_status text
)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  v_plan text;
begin
  if p_subscription_status = 'active' then
    if p_billing_plan in ('pro', 'custom') then
      v_plan := p_billing_plan;
    elsif p_billing_plan = 'starter' then
      v_plan := 'starter';
    else
      v_plan := 'free';
    end if;
  else
    v_plan := 'free';
  end if;

  return (
    select pcl.monthly_credits
    from public.plan_credit_limits pcl
    where pcl.plan_id = v_plan
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Metered deduction for all plans (remove legacy unlimited Pro bypass)
-- ---------------------------------------------------------------------------

create or replace function public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer default 1,
  p_feature_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_credits%rowtype;
  v_cost integer;
  v_from_monthly integer;
  v_from_purchased integer;
  v_remaining integer;
  v_new_monthly integer;
  v_new_purchased integer;
  v_new_current integer;
  v_source text;
begin
  if p_amount <= 0 then
    raise exception 'Deduction amount must be positive, got %', p_amount;
  end if;

  v_cost := case
    when p_feature_id is not null then public.get_feature_credit_cost(p_feature_id)
    else p_amount
  end;

  if v_cost <= 0 then
    update public.user_credits
    set total_used_credits = total_used_credits + v_cost
    where user_id = p_user_id
    returning * into v_row;

    if not found then
      return jsonb_build_object(
        'deducted', false, 'unlimited', false, 'insufficient', true,
        'credits', 0, 'plan', 'free', 'cost', v_cost
      );
    end if;

    return jsonb_build_object(
      'deducted', false, 'unlimited', false, 'insufficient', false,
      'credits', v_row.current_credits, 'plan', v_row.plan,
      'cost', v_cost, 'zero_cost', true
    );
  end if;

  select * into v_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'deducted', false, 'unlimited', false, 'insufficient', true,
      'credits', 0, 'plan', 'free', 'cost', v_cost
    );
  end if;

  if v_row.current_credits < v_cost then
    return jsonb_build_object(
      'deducted', false, 'unlimited', false, 'insufficient', true,
      'credits', v_row.current_credits, 'plan', v_row.plan, 'cost', v_cost
    );
  end if;

  v_remaining := v_cost;
  v_from_monthly := least(v_row.monthly_credits, v_remaining);
  v_remaining := v_remaining - v_from_monthly;
  v_from_purchased := v_remaining;

  v_new_monthly := v_row.monthly_credits - v_from_monthly;
  v_new_purchased := v_row.purchased_credits - v_from_purchased;
  v_new_current := v_new_monthly + v_new_purchased;

  v_source := case
    when v_from_monthly > 0 and v_from_purchased > 0 then 'mixed'
    when v_from_purchased > 0 then 'purchased'
    else 'monthly'
  end;

  update public.user_credits
  set
    monthly_credits = v_new_monthly,
    purchased_credits = v_new_purchased,
    total_used_credits = total_used_credits + v_cost
  where user_id = p_user_id
    and monthly_credits = v_row.monthly_credits
    and purchased_credits = v_row.purchased_credits;

  if not found then
    return jsonb_build_object(
      'deducted', false, 'unlimited', false, 'insufficient', true,
      'credits', 0, 'plan', v_row.plan, 'cost', v_cost, 'retry', true
    );
  end if;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    feature_id, credit_source, metadata
  ) values (
    p_user_id, -v_cost, v_new_current, 'debit',
    p_feature_id, v_source,
    jsonb_build_object(
      'from_monthly', v_from_monthly,
      'from_purchased', v_from_purchased
    )
  );

  return jsonb_build_object(
    'deducted', true, 'unlimited', false, 'insufficient', false,
    'credits', v_new_current, 'plan', v_row.plan, 'cost', v_cost,
    'credit_source', v_source
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Production-grade monthly refill (all plans, catch-up, timezone-safe UTC)
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
  v_reference timestamptz;
  v_now timestamptz := timezone('utc', now());
  v_period interval := interval '30 days';
  v_refill_amount integer;
  v_billing_plan text;
  v_subscription_status text;
  v_signup_date timestamptz;
  v_new_current integer;
  v_next_refill timestamptz;
  v_effective_plan text;
  v_credits_plan text;
  v_previous_monthly integer;
  v_cycles_applied integer := 0;
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
      'next_refill_at', v_credits_row.next_refill_at
    );
  end if;

  v_reference := coalesce(v_credits_row.last_credit_refill_at, v_anchor);

  if v_now < v_reference + v_period then
    v_next_refill := coalesce(v_credits_row.next_refill_at, v_reference + v_period);

    update public.user_credits
    set
      plan = v_credits_plan,
      monthly_allowance = v_refill_amount,
      next_refill_at = v_next_refill
    where user_id = p_user_id
      and (
        plan is distinct from v_credits_plan
        or monthly_allowance is distinct from v_refill_amount
        or next_refill_at is distinct from v_next_refill
      );

    return jsonb_build_object(
      'refilled', false, 'reason', 'not_due',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_plan, 'billing_plan', v_billing_plan,
      'next_refill_at', v_next_refill
    );
  end if;

  v_previous_monthly := v_credits_row.monthly_credits;

  while v_now >= v_reference + v_period and v_cycles_applied < v_max_cycles loop
    v_reference := v_reference + v_period;
    v_cycles_applied := v_cycles_applied + 1;
  end loop;

  v_next_refill := v_reference + v_period;

  update public.user_credits
  set
    plan = v_credits_plan,
    monthly_credits = v_refill_amount,
    monthly_allowance = v_refill_amount,
    last_credit_refill_at = v_now,
    next_refill_at = v_next_refill
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
      'cycles_applied', v_cycles_applied,
      'anchor_date', v_anchor
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
    'next_refill_at', v_next_refill,
    'cycles_applied', v_cycles_applied,
    'previous_credits', v_previous_monthly + v_credits_row.purchased_credits
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Plan sync on upgrade/downgrade (preserve purchased credits)
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
    next_refill_at = v_now + interval '30 days'
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

-- ---------------------------------------------------------------------------
-- 7. Refund credits after failed AI generation
-- ---------------------------------------------------------------------------

create or replace function public.refund_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_feature_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_credits%rowtype;
  v_new_monthly integer;
  v_new_current integer;
begin
  if p_amount <= 0 then
    raise exception 'Refund amount must be positive';
  end if;

  select * into v_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('refunded', false, 'reason', 'no_credits_row');
  end if;

  v_new_monthly := v_row.monthly_credits + p_amount;
  v_new_current := v_new_monthly + v_row.purchased_credits;

  update public.user_credits
  set monthly_credits = v_new_monthly
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    feature_id, credit_source, metadata
  ) values (
    p_user_id, p_amount, v_new_current, 'refund',
    p_feature_id, 'monthly',
    p_metadata || jsonb_build_object('reason', 'generation_failed')
  );

  return jsonb_build_object(
    'refunded', true,
    'credits', v_new_current,
    'amount', p_amount
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. New user + free signup grants (50 credits)
-- ---------------------------------------------------------------------------

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
  v_inserted_claim boolean := false;
  v_now timestamptz := timezone('utc', now());
  v_signup_date timestamptz;
  v_free_amount integer := 50;
begin
  if p_user_id is null or v_email_lower is null or v_email_lower = '' then
    return false;
  end if;

  if not exists (
    select 1 from auth.users u
    where u.id = p_user_id
      and u.email_confirmed_at is not null
      and lower(u.email) = v_email_lower
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.free_credit_claims c
    where c.email_lower = v_email_lower and c.user_id <> p_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.free_credit_claims c where c.user_id = p_user_id
  ) then
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
    next_refill_at,
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
    next_refill_at,
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

-- ---------------------------------------------------------------------------
-- 9. Backfill allowances + next reset for existing users
-- ---------------------------------------------------------------------------

update public.user_credits uc
set
  monthly_allowance = public.resolve_plan_monthly_credits(
    coalesce(p.plan, 'free'),
    coalesce(p.subscription_status, 'inactive')
  ),
  next_refill_at = coalesce(
    uc.next_refill_at,
    coalesce(uc.last_credit_refill_at, uc.signup_date, uc.updated_at) + interval '30 days'
  )
from public.profiles p
where p.id = uc.user_id;

-- Downgrade credits plan when subscription is no longer active Pro/Custom
update public.user_credits uc
set plan = 'free'
from public.profiles p
where p.id = uc.user_id
  and uc.plan = 'pro'
  and not (
    coalesce(p.subscription_status, 'inactive') = 'active'
    and coalesce(p.plan, 'free') in ('pro', 'custom')
  );
