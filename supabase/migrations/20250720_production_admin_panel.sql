-- Production Admin Panel support: roles, account status, announcements, audit logs.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user',
  add column if not exists account_status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'team_member'
where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'team_member', 'user'));

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'deleted'));

update public.profiles
set role = 'owner',
    is_admin = true,
    account_status = 'active'
where lower(email) = lower('richietanishq@gmail.com');

update public.profiles
set role = 'user',
    is_admin = false
where lower(coalesce(email, '')) <> lower('richietanishq@gmail.com')
  and role = 'owner';

update public.profiles
set is_admin = role in ('owner', 'team_member');

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_idx
  on public.admin_audit_logs (admin_user_id, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 3 and 140),
  message text not null check (char_length(message) between 3 and 1000),
  category text not null default 'beta_update' check (category in ('new_feature', 'maintenance', 'beta_update')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists announcements_active_created_idx
  on public.announcements (is_active, created_at desc);

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(coalesce(profiles.email, '')) = lower('richietanishq@gmail.com')
        or profiles.role = 'team_member'
      from public.profiles
      where profiles.id = user_id
    ),
    false
  );
$$;

create or replace function public.is_owner(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(coalesce(profiles.email, '')) = lower('richietanishq@gmail.com')
      from public.profiles
      where profiles.id = user_id
    ),
    false
  );
$$;

create or replace function public.sync_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) = lower('richietanishq@gmail.com') then
    new.role := 'owner';
    new.is_admin := true;
    new.account_status := 'active';
  else
    if new.role = 'owner' then
      new.role := 'user';
    end if;
    new.is_admin := new.role = 'team_member';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_admin_flag_before_write on public.profiles;
create trigger sync_profile_admin_flag_before_write
  before insert or update on public.profiles
  for each row
  execute function public.sync_profile_admin_flag();

alter table public.admin_audit_logs enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs"
  on public.admin_audit_logs
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins insert audit logs" on public.admin_audit_logs;
create policy "Admins insert audit logs"
  on public.admin_audit_logs
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users read active announcements" on public.announcements;
create policy "Users read active announcements"
  on public.announcements
  for select
  using (is_active = true);

drop policy if exists "Admins read all announcements" on public.announcements;
create policy "Admins read all announcements"
  on public.announcements
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Owners insert announcements" on public.announcements;
create policy "Owners insert announcements"
  on public.announcements
  for insert
  with check (public.is_owner(auth.uid()));

drop policy if exists "Owners update announcements" on public.announcements;
create policy "Owners update announcements"
  on public.announcements
  for update
  using (public.is_owner(auth.uid()))
  with check (public.is_owner(auth.uid()));
