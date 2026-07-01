-- Phase 1 Social Scheduler: local scheduled-post storage only.

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'x')),
  caption text not null check (char_length(caption) between 1 and 2200),
  image_data_url text,
  scheduled_for timestamptz not null,
  notes text,
  status text not null default 'upcoming' check (status in ('upcoming', 'published', 'failed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists scheduled_posts_user_scheduled_idx
  on public.scheduled_posts (user_id, scheduled_for desc);

create index if not exists scheduled_posts_user_status_idx
  on public.scheduled_posts (user_id, status);

alter table public.scheduled_posts enable row level security;

drop policy if exists "Users read own scheduled posts" on public.scheduled_posts;
create policy "Users read own scheduled posts"
  on public.scheduled_posts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own scheduled posts" on public.scheduled_posts;
create policy "Users insert own scheduled posts"
  on public.scheduled_posts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own scheduled posts" on public.scheduled_posts;
create policy "Users update own scheduled posts"
  on public.scheduled_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own scheduled posts" on public.scheduled_posts;
create policy "Users delete own scheduled posts"
  on public.scheduled_posts
  for delete
  using (auth.uid() = user_id);
