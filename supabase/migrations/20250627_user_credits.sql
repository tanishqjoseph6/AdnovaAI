-- Advora AI: user credits system (OPTIONAL legacy RPC functions).
-- The app no longer calls these RPCs; it uses direct table operations.
-- Required migration: 20250627_user_credits_table.sql
-- Safe to run multiple times.

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  credits integer not null default 5 check (credits >= 0),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_credits'
      and policyname = 'Users can read own credits'
  ) then
    create policy "Users can read own credits"
      on public.user_credits
      for select
      using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_credits'
      and policyname = 'Users can insert own credits'
  ) then
    create policy "Users can insert own credits"
      on public.user_credits
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Ensure a credits row exists (default: free plan, 5 credits).
create or replace function public.ensure_user_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, credits, plan)
  values (p_user_id, 5, 'free')
  on conflict (user_id) do nothing;
end;
$$;

-- Atomically deduct 1 credit after successful generation (pro = unlimited).
create or replace function public.deduct_user_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_credits%rowtype;
begin
  perform public.ensure_user_credits(p_user_id);

  select * into v_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Credits row not found for user %', p_user_id;
  end if;

  if v_row.plan = 'pro' then
    return jsonb_build_object(
      'deducted', false,
      'unlimited', true,
      'credits', v_row.credits,
      'plan', v_row.plan
    );
  end if;

  if v_row.credits <= 0 then
    return jsonb_build_object(
      'deducted', false,
      'unlimited', false,
      'insufficient', true,
      'credits', 0,
      'plan', v_row.plan
    );
  end if;

  update public.user_credits
  set
    credits = credits - 1,
    updated_at = now()
  where user_id = p_user_id
    and credits = v_row.credits
    and plan = 'free';

  if not found then
    return jsonb_build_object(
      'deducted', false,
      'unlimited', false,
      'insufficient', true,
      'credits', 0,
      'plan', v_row.plan,
      'retry', true
    );
  end if;

  return jsonb_build_object(
    'deducted', true,
    'unlimited', false,
    'insufficient', false,
    'credits', v_row.credits - 1,
    'plan', v_row.plan
  );
end;
$$;

-- Sync credits row when subscription plan changes (called from app on payment).
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
begin
  perform public.ensure_user_credits(p_user_id);

  if p_profiles_plan in ('pro', 'custom') and p_subscription_status = 'active' then
    update public.user_credits
    set plan = 'pro', updated_at = now()
    where user_id = p_user_id;
    return;
  end if;

  if p_profiles_plan = 'starter' and p_subscription_status = 'active' then
    update public.user_credits
    set
      plan = 'free',
      credits = coalesce(p_reset_credits, 100),
      updated_at = now()
    where user_id = p_user_id;
    return;
  end if;

  if p_profiles_plan = 'free' or p_subscription_status <> 'active' then
    update public.user_credits
    set
      plan = 'free',
      credits = least(credits, coalesce(p_reset_credits, credits)),
      updated_at = now()
    where user_id = p_user_id
      and plan <> 'pro';
  end if;
end;
$$;

create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, credits, plan)
  values (new.id, 5, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;

create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row
  execute function public.handle_new_user_credits();
