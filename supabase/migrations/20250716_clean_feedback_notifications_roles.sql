-- Clean, self-contained feedback + notifications + owner/admin role migration.
-- Repo schema audit found no pre-existing feedback table other than the app's
-- intended public.user_feedback table, so this migration creates it before any
-- references, foreign keys, policies, or notification tables use it.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'team_member'
where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'team_member', 'user'));

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

alter table public.user_feedback
  add column if not exists screenshot_url text,
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.user_feedback
  drop constraint if exists user_feedback_category_check;

alter table public.user_feedback
  add constraint user_feedback_category_check
  check (category in ('bug_report', 'feature_request', 'general_feedback'));

alter table public.user_feedback
  drop constraint if exists user_feedback_subject_check;

alter table public.user_feedback
  add constraint user_feedback_subject_check
  check (char_length(subject) between 3 and 120);

alter table public.user_feedback
  drop constraint if exists user_feedback_message_check;

alter table public.user_feedback
  add constraint user_feedback_message_check
  check (char_length(message) between 10 and 2000);

update public.user_feedback
set status = case
  when status in ('new', 'reviewing') then 'open'
  when status = 'resolved' then 'closed'
  else status
end
where status in ('new', 'reviewing', 'resolved');

alter table public.user_feedback
  alter column status set default 'open';

alter table public.user_feedback
  drop constraint if exists user_feedback_status_check;

alter table public.user_feedback
  add constraint user_feedback_status_check
  check (status in ('open', 'reviewed', 'closed'));

create index if not exists user_feedback_user_created_idx
  on public.user_feedback (user_id, created_at desc);

create index if not exists user_feedback_status_created_idx
  on public.user_feedback (status, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 500),
  is_read boolean not null default false,
  feedback_id uuid references public.user_feedback(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

update public.profiles
set role = 'team_member'
where role = 'user'
  and coalesce(is_admin, false) = true;

-- Bootstrap the Advora owner account if it already exists.
-- Change this email before applying if your production owner login differs.
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

alter table public.user_feedback enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users read own feedback" on public.user_feedback;
create policy "Users read own feedback"
  on public.user_feedback
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own feedback" on public.user_feedback;
create policy "Users insert own feedback"
  on public.user_feedback
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all feedback" on public.user_feedback;
create policy "Admins read all feedback"
  on public.user_feedback
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins update all feedback" on public.user_feedback;
create policy "Admins update all feedback"
  on public.user_feedback
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins insert notifications" on public.notifications;
create policy "Admins insert notifications"
  on public.notifications
  for insert
  with check (public.is_admin(auth.uid()));

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

drop policy if exists "Admins read profiles" on public.profiles;
create policy "Admins read profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

revoke update on public.profiles from authenticated;
grant update (email, username, full_name, avatar_url, updated_at)
  on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own feedback screenshots" on storage.objects;
create policy "Users upload own feedback screenshots"
  on storage.objects
  for insert
  with check (
    bucket_id = 'feedback-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users read own feedback screenshots" on storage.objects;
create policy "Users read own feedback screenshots"
  on storage.objects
  for select
  using (
    bucket_id = 'feedback-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own feedback screenshots" on storage.objects;
create policy "Users delete own feedback screenshots"
  on storage.objects
  for delete
  using (
    bucket_id = 'feedback-screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins read all feedback screenshots" on storage.objects;
create policy "Admins read all feedback screenshots"
  on storage.objects
  for select
  using (
    bucket_id = 'feedback-screenshots'
    and public.is_admin(auth.uid())
  );
