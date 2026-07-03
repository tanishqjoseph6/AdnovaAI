-- Secure Owner/Admin/User role model.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user';

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subject text not null,
  message text not null,
  screenshot_url text,
  status text not null default 'open',
  admin_reply text,
  replied_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 500),
  is_read boolean not null default false,
  feedback_id uuid references public.user_feedback(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'team_member'
where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'team_member', 'user'));

update public.profiles
set role = 'team_member'
where role = 'user'
  and coalesce(is_admin, false) = true;

-- Bootstrap the Advora owner account if it already exists.
-- Change this email before applying the migration if your production owner
-- account uses a different login email.
update public.profiles
set role = 'owner',
    is_admin = true
where lower(email) = lower('richietanishq@gmail.com');

update public.profiles
set role = 'user',
    is_admin = false
where lower(coalesce(email, '')) <> lower('richietanishq@gmail.com')
  and role = 'owner';

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

drop policy if exists "Admins read profiles" on public.profiles;
create policy "Admins read profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins read all notifications" on public.notifications;
create policy "Admins read all notifications"
  on public.notifications
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update all notifications" on public.notifications;
create policy "Admins update all notifications"
  on public.notifications
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Prevent client-side self-promotion through direct Supabase updates.
revoke update on public.profiles from authenticated;
grant update (email, username, full_name, avatar_url, updated_at) on public.profiles to authenticated;

-- Keep the legacy is_admin flag in sync for older code paths while role is the source of truth.
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
