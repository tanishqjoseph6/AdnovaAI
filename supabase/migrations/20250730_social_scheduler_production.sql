-- Social Scheduler production: OAuth connections, publishing metadata, image storage.

-- ---------------------------------------------------------------------------
-- 1. social_connections – OAuth tokens (service-role access only via API)
-- ---------------------------------------------------------------------------

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (
    platform in (
      'x',
      'linkedin',
      'instagram',
      'facebook',
      'threads',
      'tiktok',
      'youtube',
      'pinterest'
    )
  ),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  profile_id text,
  profile_username text,
  profile_name text,
  profile_image_url text,
  connected_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint social_connections_user_platform_key unique (user_id, platform)
);

create index if not exists social_connections_user_id_idx
  on public.social_connections (user_id);

alter table public.social_connections enable row level security;

-- Tokens are never exposed to the client; API uses service role.

-- ---------------------------------------------------------------------------
-- 2. Extend scheduled_posts for all platforms + publishing fields
-- ---------------------------------------------------------------------------

alter table public.scheduled_posts
  drop constraint if exists scheduled_posts_platform_check;

alter table public.scheduled_posts
  add constraint scheduled_posts_platform_check
  check (
    platform in (
      'x',
      'linkedin',
      'instagram',
      'facebook',
      'threads',
      'tiktok',
      'youtube',
      'pinterest'
    )
  );

alter table public.scheduled_posts
  add column if not exists connection_id uuid references public.social_connections (id) on delete set null,
  add column if not exists image_url text,
  add column if not exists image_storage_path text,
  add column if not exists external_post_id text,
  add column if not exists published_at timestamptz,
  add column if not exists error_message text;

create index if not exists scheduled_posts_publish_queue_idx
  on public.scheduled_posts (status, scheduled_for)
  where status = 'upcoming';

-- ---------------------------------------------------------------------------
-- 3. scheduled-post-images storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scheduled-post-images',
  'scheduled-post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own scheduled post images" on storage.objects;
create policy "Users upload own scheduled post images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'scheduled-post-images'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own scheduled post images" on storage.objects;
create policy "Users update own scheduled post images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'scheduled-post-images'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own scheduled post images" on storage.objects;
create policy "Users delete own scheduled post images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'scheduled-post-images'
    and (storage.foldername (name))[1] = auth.uid()::text
  );

drop policy if exists "Public read scheduled post images" on storage.objects;
create policy "Public read scheduled post images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'scheduled-post-images');
