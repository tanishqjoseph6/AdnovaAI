-- Admin feedback review, user notifications, and mini support-ticket replies.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select profiles.is_admin from public.profiles where profiles.id = user_id),
    false
  );
$$;

alter table public.user_feedback
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

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
