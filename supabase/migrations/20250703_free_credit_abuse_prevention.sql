-- One verified email may claim free credits once.
-- Prevents duplicate profiles, duplicate free grants, and client-side credit inserts.

create table if not exists public.free_credit_claims (
  email_lower text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);

create unique index if not exists free_credit_claims_user_id_key
  on public.free_credit_claims (user_id);

alter table public.free_credit_claims enable row level security;

-- Server-only table; no client policies.

create or replace function public.email_is_registered(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.email is not null
      and lower(u.email) = lower(trim(p_email))
  );
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
  v_claimed boolean := false;
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

  insert into public.free_credit_claims (email_lower, user_id)
  values (v_email_lower, p_user_id)
  on conflict (email_lower) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    return false;
  end if;

  insert into public.user_credits (user_id, credits, plan, updated_at)
  values (p_user_id, 5, 'free', now())
  on conflict (user_id) do nothing;

  return true;
end;
$$;

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.try_claim_free_credits(new.id, new.email);
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is not null and exists (
    select 1
    from public.profiles p
    where p.email is not null
      and lower(p.email) = lower(new.email)
      and p.id <> new.id
  ) then
    raise exception 'duplicate_email'
      using errcode = '23505',
            message = 'An account already exists with this email.';
  end if;

  insert into public.profiles (id, email, plan, subscription_status)
  values (new.id, new.email, 'free', 'inactive')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Legacy RPC: never grant free credits without a claim row.
create or replace function public.ensure_user_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.user_credits where user_id = p_user_id
  ) then
    return;
  end if;

  if exists (
    select 1 from public.free_credit_claims where user_id = p_user_id
  ) then
    insert into public.user_credits (user_id, credits, plan, updated_at)
    values (p_user_id, 5, 'free', now())
    on conflict (user_id) do nothing;
  end if;
end;
$$;

drop policy if exists "Users can insert own credits" on public.user_credits;

-- Backfill claims for verified users who already received free credits.
insert into public.free_credit_claims (email_lower, user_id, claimed_at)
select lower(u.email), uc.user_id, coalesce(u.email_confirmed_at, uc.updated_at, now())
from public.user_credits uc
inner join auth.users u on u.id = uc.user_id
where u.email is not null
  and u.email_confirmed_at is not null
  and uc.plan = 'free'
on conflict (email_lower) do nothing;
