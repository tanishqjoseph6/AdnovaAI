-- Advora AI: scalable credit architecture
-- Replaces the single-bucket `credits` column with split balances:
--   monthly_credits   – plan allocation (resets on refill)
--   purchased_credits – extra credits bought separately (persist across refills)
--   current_credits   – monthly_credits + purchased_credits (spendable balance)
--   total_used_credits – lifetime usage counter
--
-- The legacy `credits` column is kept in sync via trigger for backward compatibility.
-- Safe to run multiple times.

-- ---------------------------------------------------------------------------
-- 1. Extend user_credits
-- ---------------------------------------------------------------------------

alter table public.user_credits
  add column if not exists monthly_credits integer not null default 0
    check (monthly_credits >= 0),
  add column if not exists purchased_credits integer not null default 0
    check (purchased_credits >= 0),
  add column if not exists current_credits integer not null default 0
    check (current_credits >= 0),
  add column if not exists total_used_credits integer not null default 0
    check (total_used_credits >= 0),
  add column if not exists monthly_allowance integer
    check (monthly_allowance is null or monthly_allowance >= 0);

-- Backfill from legacy single-bucket `credits` column.
update public.user_credits
set
  monthly_credits = credits,
  current_credits = credits,
  monthly_allowance = case
    when plan = 'pro' then null
    when credits > 100 then 100
    when credits > 5 then credits
    else 5
  end
where monthly_credits = 0
  and current_credits = 0
  and credits > 0;

-- Users with zero credits still need row consistency.
update public.user_credits
set
  monthly_credits = credits,
  current_credits = credits + purchased_credits
where current_credits = 0
  and monthly_credits = 0;

-- ---------------------------------------------------------------------------
-- 2. Keep legacy `credits` column in sync (backward compat for existing code)
-- ---------------------------------------------------------------------------

create or replace function public.sync_legacy_credits_column()
returns trigger
language plpgsql
as $$
begin
  new.current_credits := new.monthly_credits + new.purchased_credits;
  new.credits := new.current_credits;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_sync_legacy_credits on public.user_credits;

create trigger trg_sync_legacy_credits
  before insert or update of monthly_credits, purchased_credits
  on public.user_credits
  for each row
  execute function public.sync_legacy_credits_column();

-- ---------------------------------------------------------------------------
-- 3. credit_feature_costs – configurable per-feature credit cost
-- ---------------------------------------------------------------------------

create table if not exists public.credit_feature_costs (
  feature_id text primary key,
  cost integer not null default 1 check (cost >= 0),
  label text not null default '',
  description text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.credit_feature_costs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_feature_costs'
      and policyname = 'Anyone can read feature costs'
  ) then
    create policy "Anyone can read feature costs"
      on public.credit_feature_costs
      for select
      using (true);
  end if;
end $$;

insert into public.credit_feature_costs (feature_id, cost, label, description)
values
  ('generate_ads',              1, 'Ad Generation',           'Generate hooks, captions, CTAs and UGC scripts'),
  ('generate_better_competitor_ad', 1, 'Better Competitor Ad', 'Generate improved ad from competitor analysis'),
  ('analyze_competitor_ad',     0, 'Competitor Analysis',   'Analyze a competitor ad screenshot (free)'),
  ('analyze_landing_page',      1, 'Landing Page Analysis', 'AI audit of a landing page URL'),
  ('rewrite_content',           1, 'Content Rewrite',       'AI rewrite of a single content item'),
  ('score_generated_ads',       0, 'Ad Scoring',            'Score generated ad quality (free)'),
  ('analyze_product_image',     0, 'Product Image Analysis','Extract product info from image (free)'),
  ('brand_kit_autofill',        0, 'Brand Kit Autofill',    'Auto-fill brand kit from website URL')
on conflict (feature_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. credit_transactions – immutable ledger
-- ---------------------------------------------------------------------------

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  transaction_type text not null check (
    transaction_type in (
      'debit',
      'monthly_refill',
      'purchase',
      'grant',
      'admin_adjust',
      'referral_reward',
      'subscription_sync'
    )
  ),
  feature_id text references public.credit_feature_costs (feature_id),
  credit_source text check (
    credit_source is null
    or credit_source in ('monthly', 'purchased', 'mixed', 'grant')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_transactions_user_id_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_transactions'
      and policyname = 'Users can read own credit transactions'
  ) then
    create policy "Users can read own credit transactions"
      on public.credit_transactions
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. credit_purchases – extra credit pack purchases
-- ---------------------------------------------------------------------------

create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credits_amount integer not null check (credits_amount > 0),
  amount_paid integer not null check (amount_paid > 0),
  currency text not null default 'INR',
  payment_id text,
  order_id text,
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create unique index if not exists credit_purchases_payment_id_key
  on public.credit_purchases (payment_id)
  where payment_id is not null;

create index if not exists credit_purchases_user_id_idx
  on public.credit_purchases (user_id, created_at desc);

alter table public.credit_purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_purchases'
      and policyname = 'Users can read own credit purchases'
  ) then
    create policy "Users can read own credit purchases"
      on public.credit_purchases
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Helper: resolve feature cost
-- ---------------------------------------------------------------------------

create or replace function public.get_feature_credit_cost(p_feature_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select cost from public.credit_feature_costs
     where feature_id = p_feature_id and enabled = true),
    1
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. Core: deduct credits with variable cost + split-bucket logic
-- ---------------------------------------------------------------------------

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
  -- Zero-cost feature: track usage but don't deduct balance.
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
      'deducted', false, 'unlimited', v_row.plan = 'pro', 'insufficient', false,
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

  -- Pro / unlimited: track usage, no balance deduction.
  if v_row.plan = 'pro' then
    update public.user_credits
    set total_used_credits = total_used_credits + v_cost
    where user_id = p_user_id;

    insert into public.credit_transactions (
      user_id, amount, balance_after, transaction_type,
      feature_id, credit_source, metadata
    ) values (
      p_user_id, -v_cost, v_row.current_credits, 'debit',
      p_feature_id, null,
      jsonb_build_object('unlimited', true, 'plan', v_row.plan)
    );

    return jsonb_build_object(
      'deducted', false, 'unlimited', true, 'insufficient', false,
      'credits', v_row.current_credits, 'plan', v_row.plan, 'cost', v_cost
    );
  end if;

  if v_row.current_credits < v_cost then
    return jsonb_build_object(
      'deducted', false, 'unlimited', false, 'insufficient', true,
      'credits', v_row.current_credits, 'plan', v_row.plan, 'cost', v_cost
    );
  end if;

  -- Deduct monthly first, then purchased.
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

-- Backward-compatible wrapper: deduct exactly 1 credit (legacy callers).
create or replace function public.deduct_user_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.deduct_user_credits(p_user_id, 1, 'generate_ads');
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grant purchased credits after payment
-- ---------------------------------------------------------------------------

create or replace function public.grant_purchased_credits(
  p_user_id uuid,
  p_credits_amount integer,
  p_purchase_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_credits%rowtype;
  v_new_purchased integer;
  v_new_current integer;
begin
  if p_credits_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  perform public.ensure_user_credits(p_user_id);

  select * into v_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  v_new_purchased := v_row.purchased_credits + p_credits_amount;
  v_new_current := v_row.monthly_credits + v_new_purchased;

  update public.user_credits
  set purchased_credits = v_new_purchased
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id, amount, balance_after, transaction_type,
    credit_source, metadata
  ) values (
    p_user_id, p_credits_amount, v_new_current, 'purchase',
    'purchased',
    p_metadata || jsonb_build_object('purchase_id', p_purchase_id)
  );

  return jsonb_build_object(
    'granted', true,
    'credits_added', p_credits_amount,
    'purchased_credits', v_new_purchased,
    'current_credits', v_new_current
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Updated monthly refill (split-bucket aware)
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

  if v_credits_row.plan = 'pro' then
    return jsonb_build_object(
      'refilled', false, 'reason', 'unlimited_plan',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_row.plan, 'billing_plan', v_billing_plan
    );
  end if;

  if v_billing_plan in ('pro', 'custom') and v_subscription_status = 'active' then
    return jsonb_build_object(
      'refilled', false, 'reason', 'unlimited_plan',
      'credits', v_credits_row.current_credits,
      'plan', v_credits_row.plan, 'billing_plan', v_billing_plan
    );
  end if;

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

  if v_billing_plan = 'starter' and v_subscription_status = 'active' then
    v_refill_amount := 100;
  else
    v_refill_amount := 5;
  end if;

  -- Reset monthly bucket; purchased credits persist.
  update public.user_credits
  set
    monthly_credits = v_refill_amount,
    monthly_allowance = v_refill_amount,
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

-- ---------------------------------------------------------------------------
-- 10. Updated plan sync (split-bucket aware)
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
begin
  perform public.ensure_user_credits(p_user_id);

  if p_profiles_plan in ('pro', 'custom') and p_subscription_status = 'active' then
    update public.user_credits
    set
      plan = 'pro',
      monthly_allowance = null,
      last_credit_refill_at = v_now
    where user_id = p_user_id;

    insert into public.credit_transactions (
      user_id, amount, balance_after, transaction_type, metadata
    )
    select
      p_user_id, 0,
      uc.current_credits, 'subscription_sync',
      jsonb_build_object('plan', p_profiles_plan, 'action', 'unlimited')
    from public.user_credits uc where uc.user_id = p_user_id;

    return;
  end if;

  if p_profiles_plan = 'starter' and p_subscription_status = 'active' then
    v_monthly := coalesce(p_reset_credits, 100);
    v_allowance := 100;

    update public.user_credits
    set
      plan = 'free',
      monthly_credits = v_monthly,
      monthly_allowance = v_allowance,
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
      monthly_allowance = 5
    where user_id = p_user_id
      and plan <> 'pro';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Updated signup grant (split-bucket aware)
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
  v_free_amount integer := 5;
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

-- ---------------------------------------------------------------------------
-- 12. Updated new-user trigger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (
    user_id, credits, monthly_credits, purchased_credits,
    current_credits, total_used_credits, monthly_allowance, plan
  )
  values (new.id, 5, 5, 0, 5, 0, 5, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
