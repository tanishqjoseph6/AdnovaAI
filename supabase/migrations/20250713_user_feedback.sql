-- Beta launch feedback storage.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug_report', 'feature_request', 'general_feedback')),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 2000),
  screenshot_url text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'closed')),
  created_at timestamptz not null default timezone('utc', now())
);

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
