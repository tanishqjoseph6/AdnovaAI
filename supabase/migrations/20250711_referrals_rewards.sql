-- Referral & Rewards system.
-- One code per user, one referral per referred user, and idempotent rewards.

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_codes(code),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referred_email_lower text not null,
  status text not null default 'pending' check (status in ('pending', 'successful', 'blocked')),
  signup_at timestamptz not null default timezone('utc', now()),
  email_verified_at timestamptz,
  onboarding_completed_at timestamptz,
  first_generation_at timestamptz,
  reward_granted_at timestamptz,
  block_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint referrals_no_self_referral check (referrer_user_id <> referred_user_id)
);

create unique index if not exists referrals_referred_user_unique
  on public.referrals (referred_user_id);

create unique index if not exists referrals_referred_email_unique
  on public.referrals (referred_email_lower);

create index if not exists referrals_referrer_status_idx
  on public.referrals (referrer_user_id, status, created_at desc);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  reward_key text not null unique,
  reward_type text not null check (reward_type in ('credits', 'starter_month')),
  credits_amount integer not null default 0 check (credits_amount >= 0),
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists referral_rewards_user_created_idx
  on public.referral_rewards (user_id, created_at desc);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "Users read own referral code" on public.referral_codes;
create policy "Users read own referral code"
  on public.referral_codes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own referral code" on public.referral_codes;
create policy "Users insert own referral code"
  on public.referral_codes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own sent referrals" on public.referrals;
create policy "Users read own sent referrals"
  on public.referrals
  for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists "Users read own referral rewards" on public.referral_rewards;
create policy "Users read own referral rewards"
  on public.referral_rewards
  for select
  using (auth.uid() = user_id);

alter table public.profiles
  add column if not exists referral_starter_expires_at timestamptz;

create or replace function public.create_referral_code_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_base text;
  v_code text;
  v_attempt integer := 0;
begin
  v_base := lower(split_part(coalesce(new.email, ''), '@', 1));
  v_base := regexp_replace(v_base, '[^a-z0-9_-]', '', 'g');

  if length(v_base) < 3 then
    v_base := 'adv' || substring(replace(new.id::text, '-', '') from 1 for 10);
  end if;

  v_base := substring(v_base from 1 for 24);

  loop
    v_code := case
      when v_attempt = 0 then v_base
      else substring(v_base from 1 for 24) || v_attempt::text
    end;

    begin
      insert into public.referral_codes (user_id, code)
      values (new.id, v_code)
      on conflict (user_id) do nothing;

      return new;
    exception
      when unique_violation then
        v_attempt := v_attempt + 1;
        if v_attempt > 20 then
          insert into public.referral_codes (user_id, code)
          values (
            new.id,
            'adv' || substring(replace(new.id::text, '-', '') from 1 for 16)
          )
          on conflict (user_id) do nothing;
          return new;
        end if;
    end;
  end loop;
end;
$$;

drop trigger if exists on_auth_user_created_referral_code on auth.users;
create trigger on_auth_user_created_referral_code
  after insert on auth.users
  for each row
  execute function public.create_referral_code_for_new_user();

insert into public.referral_codes (user_id, code)
select
  u.id,
  'adv' || substring(replace(u.id::text, '-', '') from 1 for 16)
from auth.users u
where not exists (
  select 1
  from public.referral_codes rc
  where rc.user_id = u.id
)
on conflict do nothing;
