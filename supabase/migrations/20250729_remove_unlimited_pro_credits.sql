-- ===========================================================================
-- Remove unlimited Pro credits — all plans use finite monthly allowances
-- Free: 50 | Starter: 500 | Pro: 2500 (mirrors lib/billing/plans.ts)
-- Monthly credits refill every 30 days; purchased credits persist.
-- ===========================================================================

-- 1. deduct_user_credits: Pro users are metered like every other plan
create or replace function public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer default 1,
  p_feature_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
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
        'deducted', false, 'insufficient', true,
        'credits', 0, 'plan', 'free', 'cost', v_cost
      );
    end if;

    return jsonb_build_object(
      'deducted', false, 'insufficient', false,
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
      'deducted', false, 'insufficient', true,
      'credits', 0, 'plan', 'free', 'cost', v_cost
    );
  end if;

  if v_row.current_credits < v_cost then
    return jsonb_build_object(
      'deducted', false, 'insufficient', true,
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
      'deducted', false, 'insufficient', true,
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
      'from_purchased', v_from_purchased,
      'plan', v_row.plan
    )
  );

  return jsonb_build_object(
    'deducted', true, 'insufficient', false,
    'credits', v_new_current, 'plan', v_row.plan, 'cost', v_cost,
    'credit_source', v_source
  );
end;
$$;

-- 2. try_refill_user_credits: refill Pro with 2500 monthly credits
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

  v_signup_date := coalesce(
    v_credits_row.signup_date,
    v_profile.created_at,
    (select u.created_at from auth.users u where u.id = p_user_id)
  );

  if v_credits_row.signup_date is null and v_signup_date is not null then
    update public.user_credits set signup_date = v_signup_date where user_id = p_user_id;
  end if;

  if v_billing_plan = 'starter'
     and v_subscription_status = 'active'
     and v_profile.purchase_date is not null then
    v_anchor := v_profile.purchase_date;
  elsif (v_billing_plan in ('pro', 'custom'))
     and v_subscription_status = 'active'
     and v_profile.purchase_date is not null then
    v_anchor := v_profile.purchase_date;
  else
    v_anchor := v_signup_date;
  end if;

  if v_anchor is null then
    return jsonb_build_object(
      'refilled', false, 'reason', 'missing_anchor',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_row.plan, 'billing_plan', v_billing_plan
    );
  end if;

  v_reference := coalesce(v_credits_row.last_credit_refill_at, v_anchor);

  if v_now < v_reference + v_period then
    return jsonb_build_object(
      'refilled', false, 'reason', 'not_due',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_row.plan, 'billing_plan', v_billing_plan,
      'next_refill_at', v_reference + v_period
    );
  end if;

  v_refill_amount := case
    when v_billing_plan in ('pro', 'custom') and v_subscription_status = 'active' then 2500
    when v_billing_plan = 'starter' and v_subscription_status = 'active' then 500
    else 50
  end;

  update public.user_credits
  set
    monthly_credits = v_refill_amount,
    monthly_allowance = v_refill_amount,
    plan = case
      when v_billing_plan in ('pro', 'custom') and v_subscription_status = 'active' then 'pro'
      else 'free'
    end,
    last_credit_refill_at = v_now
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
      'previous_monthly', v_credits_row.monthly_credits,
      'purchased_preserved', v_credits_row.purchased_credits
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
    'previous_credits', v_credits_row.current_credits
  );
end;
$$;

-- 3. sync_user_credits_for_plan: grant finite monthly credits on plan activation
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
begin
  perform public.ensure_user_credits(p_user_id);

  if p_profiles_plan in ('pro', 'custom') and p_subscription_status = 'active' then
    v_monthly := coalesce(p_reset_credits, 2500);

    update public.user_credits
    set
      plan = 'pro',
      monthly_credits = v_monthly,
      monthly_allowance = v_monthly,
      current_credits = v_monthly + purchased_credits,
      last_credit_refill_at = v_now
    where user_id = p_user_id;

    insert into public.credit_transactions (
      user_id, amount, balance_after, transaction_type, credit_source, metadata
    )
    select
      p_user_id, v_monthly,
      uc.monthly_credits + uc.purchased_credits,
      'subscription_sync', 'monthly',
      jsonb_build_object('plan', p_profiles_plan, 'monthly_credits', v_monthly)
    from public.user_credits uc where uc.user_id = p_user_id;

    return;
  end if;

  if p_profiles_plan = 'starter' and p_subscription_status = 'active' then
    v_monthly := coalesce(p_reset_credits, 500);

    update public.user_credits
    set
      plan = 'free',
      monthly_credits = v_monthly,
      monthly_allowance = v_monthly,
      current_credits = v_monthly + purchased_credits,
      last_credit_refill_at = v_now
    where user_id = p_user_id;

    insert into public.credit_transactions (
      user_id, amount, balance_after, transaction_type,
      credit_source, metadata
    )
    select
      p_user_id, v_monthly,
      uc.monthly_credits + uc.purchased_credits,
      'subscription_sync', 'monthly',
      jsonb_build_object('plan', 'starter', 'monthly_credits', v_monthly)
    from public.user_credits uc where uc.user_id = p_user_id;

    return;
  end if;

  if p_profiles_plan = 'free' or p_subscription_status <> 'active' then
    update public.user_credits
    set
      plan = 'free',
      monthly_credits = least(monthly_credits, coalesce(p_reset_credits, monthly_credits)),
      monthly_allowance = 50
    where user_id = p_user_id;
  end if;
end;
$$;

-- 4. Backfill existing Pro rows that were on unlimited (null allowance)
update public.user_credits
set
  monthly_allowance = 2500,
  monthly_credits = case
    when monthly_credits = 0 and purchased_credits = 0 then 2500
    else monthly_credits
  end
where plan = 'pro'
  and monthly_allowance is null;
