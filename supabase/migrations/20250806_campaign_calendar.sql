-- Campaign Calendar: campaigns, draft status, colors, team visibility.

-- ---------------------------------------------------------------------------
-- 1. campaigns table
-- ---------------------------------------------------------------------------

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  color text not null default '#8b5cf6'
    check (color ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$'),
  visibility text not null default 'private'
    check (visibility in ('private', 'team')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists campaigns_user_id_updated_at_idx
  on public.campaigns (user_id, updated_at desc);

alter table public.campaigns enable row level security;

drop policy if exists "Users can view own campaigns" on public.campaigns;
create policy "Users can view own campaigns"
  on public.campaigns
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own campaigns" on public.campaigns;
create policy "Users can insert own campaigns"
  on public.campaigns
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own campaigns" on public.campaigns;
create policy "Users can update own campaigns"
  on public.campaigns
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own campaigns" on public.campaigns;
create policy "Users can delete own campaigns"
  on public.campaigns
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Extend scheduled_posts for calendar (draft + campaign linkage)
-- ---------------------------------------------------------------------------

alter table public.scheduled_posts
  drop constraint if exists scheduled_posts_status_check;

alter table public.scheduled_posts
  add constraint scheduled_posts_status_check
  check (status in ('draft', 'upcoming', 'published', 'failed'));

alter table public.scheduled_posts
  add column if not exists campaign_id uuid references public.campaigns (id) on delete set null;

alter table public.scheduled_posts
  add column if not exists campaign_color text
    check (
      campaign_color is null
      or campaign_color ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$'
    );

create index if not exists scheduled_posts_campaign_id_idx
  on public.scheduled_posts (campaign_id)
  where campaign_id is not null;

create index if not exists scheduled_posts_user_scheduled_asc_idx
  on public.scheduled_posts (user_id, scheduled_for asc);

-- Enable realtime for calendar sync (safe if already added).
do $$
begin
  alter publication supabase_realtime add table public.scheduled_posts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.campaigns;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
