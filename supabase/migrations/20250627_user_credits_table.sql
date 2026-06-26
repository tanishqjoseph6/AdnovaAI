-- Advora AI: user_credits table + RLS (required for credits system).
-- The app uses direct table operations; Postgres RPC functions are optional.
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
