-- Admin feedback review, user notifications, and mini support-ticket replies.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

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

create index if not exists user_feedback_user_created_idx
  on public.user_feedback (user_id, created_at desc);

create index if not exists user_feedback_status_created_idx
  on public.user_feedback (status, created_at desc);

alter table public.user_feedback enable row level security;

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
      from public.profiles
      where profiles.id = user_id
    ),
    false
  );
$$;

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

alter table public.notifications enable row level security;

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

drop policy if exists "Admins read all feedback screenshots" on storage.objects;
create policy "Admins read all feedback screenshots"
  on storage.objects
  for select
  using (
    bucket_id = 'feedback-screenshots'
    and public.is_admin(auth.uid())
  );
