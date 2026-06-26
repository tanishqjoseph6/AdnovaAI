-- Run in Supabase SQL Editor for Advora billing (profiles table)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'custom')),
  payment_id text,
  subscription_status text not null default 'inactive' check (
    subscription_status in ('active', 'inactive', 'cancelled', 'past_due')
  ),
  purchase_date timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_payment_id_key on public.profiles (payment_id)
where payment_id is not null;

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Inserts/updates are performed via service role in payment verify + webhook routes.
