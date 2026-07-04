-- Rolling 30-day credit refills anchored to signup or subscription purchase date.

alter table public.user_credits
  add column if not exists signup_date timestamptz,
  add column if not exists last_credit_refill_at timestamptz;

-- Backfill signup dates from profile / auth.users.
update public.user_credits uc
set signup_date = coalesce(
  uc.signup_date,
  p.created_at,
  u.created_at
)
from auth.users u
left join public.profiles p on p.id = u.id
where uc.user_id = u.id
  and uc.signup_date is null;

-- Existing users: treat last credit update as the last refill so we do not
-- immediately double-grant on deploy.
update public.user_credits
set last_credit_refill_at = coalesce(last_credit_refill_at, updated_at, signup_date)
where last_credit_refill_at is null
  and signup_date is not null;

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
begin
  select * into v_credits_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'refilled', false,
      'reason', 'no_credits_row'
    );
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id;

  v_billing_plan := coalesce(v_profile.plan, 'free');
  v_subscription_status := coalesce(v_profile.subscription_status, 'inactive');

  if v_credits_row.plan = 'pro' then
    return jsonb_build_object(
      'refilled', false,
      'reason', 'unlimited_plan',
      'credits', v_credits_row.credits,
      'plan', v_credits_row.plan,
      'billing_plan', v_billing_plan
    );
  end if;

  if v_billing_plan in ('pro', 'custom') and v_subscription_status = 'active' then
    return jsonb_build_object(
      'refilled', false,
      'reason', 'unlimited_plan',
      'credits', v_credits_row.credits,
      'plan', v_credits_row.plan,
      'billing_plan', v_billing_plan
    );
  end if;

  v_signup_date := coalesce(
    v_credits_row.signup_date,
    v_profile.created_at,
    (select u.created_at from auth.users u where u.id = p_user_id)
  );

  if v_credits_row.signup_date is null and v_signup_date is not null then
    update public.user_credits
    set signup_date = v_signup_date
    where user_id = p_user_id;
  end if;

  if v_billing_plan = 'starter'
     and v_subscription_status = 'active'
     and v_profile.purchase_date is not null then
    v_anchor := v_profile.purchase_date;
  else
    v_anchor := v_signup_date;
  end if;

  if v_anchor is null then
    return jsonb_build_object(
      'refilled', false,
      'reason', 'missing_anchor',
      'credits', v_credits_row.credits,
      'plan', v_credits_row.plan,
      'billing_plan', v_billing_plan
    );
  end if;

  v_reference := coalesce(v_credits_row.last_credit_refill_at, v_anchor);

  if v_now < v_reference + v_period then
    return jsonb_build_object(
      'refilled', false,
      'reason', 'not_due',
      'credits', v_credits_row.credits,
      'plan', v_credits_row.plan,
      'billing_plan', v_billing_plan,
      'next_refill_at', v_reference + v_period
    );
  end if;

  if v_billing_plan = 'starter' and v_subscription_status = 'active' then
    v_refill_amount := 100;
  else
    v_refill_amount := 5;
  end if;

  update public.user_credits
  set
    credits = v_refill_amount,
    last_credit_refill_at = v_now,
    updated_at = v_now
  where user_id = p_user_id;

  return jsonb_build_object(
    'refilled', true,
    'credits', v_refill_amount,
    'plan', v_credits_row.plan,
    'billing_plan', v_billing_plan,
    'refilled_at', v_now,
    'anchor_date', v_anchor,
    'previous_credits', v_credits_row.credits
  );
end;
$$;

-- Initial free grant should start the 30-day refill window.
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
begin
  if p_user_id is null or v_email_lower is null or v_email_lower = '' then
    return false;
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = p_user_id
      and u.email_confirmed_at is not null
      and lower(u.email) = v_email_lower
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.free_credit_claims c
    where c.email_lower = v_email_lower
      and c.user_id <> p_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.free_credit_claims c
    where c.user_id = p_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.user_credits uc
    where uc.user_id = p_user_id
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

  select coalesce(u.created_at, v_now)
  into v_signup_date
  from auth.users u
  where u.id = p_user_id;

  insert into public.user_credits (
    user_id,
    credits,
    plan,
    signup_date,
    last_credit_refill_at,
    updated_at
  )
  values (p_user_id, 5, 'free', v_signup_date, v_now, v_now)
  on conflict (user_id) do nothing;

  return true;
end;
$$;

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
begin
  perform public.ensure_user_credits(p_user_id);

  if p_profiles_plan in ('pro', 'custom') and p_subscription_status = 'active' then
    update public.user_credits
    set
      plan = 'pro',
      last_credit_refill_at = v_now,
      updated_at = v_now
    where user_id = p_user_id;
    return;
  end if;

  if p_profiles_plan = 'starter' and p_subscription_status = 'active' then
    update public.user_credits
    set
      plan = 'free',
      credits = coalesce(p_reset_credits, 100),
      last_credit_refill_at = v_now,
      updated_at = v_now
    where user_id = p_user_id;
    return;
  end if;

  if p_profiles_plan = 'free' or p_subscription_status <> 'active' then
    update public.user_credits
    set
      plan = 'free',
      credits = least(credits, coalesce(p_reset_credits, credits)),
      updated_at = v_now
    where user_id = p_user_id
      and plan <> 'pro';
  end if;
end;
$$;
