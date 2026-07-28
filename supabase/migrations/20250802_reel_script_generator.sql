-- AI Reel Script Generator
-- Stores generated reel scripts and registers credit cost.

create table if not exists public.reel_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_url text,
  product_description text not null,
  brand_name text not null,
  brand_voice text not null default 'Professional',
  target_audience text not null default '',
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube_shorts')),
  duration integer not null check (duration in (15, 30, 60)),
  goal text not null check (goal in ('sales', 'awareness', 'launch', 'educational', 'ugc')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reel_scripts_user_id_created_at_idx
  on public.reel_scripts (user_id, created_at desc);

alter table public.reel_scripts enable row level security;

drop policy if exists "Users can view own reel scripts" on public.reel_scripts;
create policy "Users can view own reel scripts"
  on public.reel_scripts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reel scripts" on public.reel_scripts;
create policy "Users can insert own reel scripts"
  on public.reel_scripts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reel scripts" on public.reel_scripts;
create policy "Users can update own reel scripts"
  on public.reel_scripts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reel scripts" on public.reel_scripts;
create policy "Users can delete own reel scripts"
  on public.reel_scripts
  for delete
  using (auth.uid() = user_id);

insert into public.credit_feature_costs (feature_id, cost, label, description)
values
  (
    'generate_reel_script',
    10,
    'Reel Script Generator',
    'Generate a full AI reel script with hooks, scenes, VO, CTA, caption, and hashtags'
  )
on conflict (feature_id) do update
set
  cost = excluded.cost,
  label = excluded.label,
  description = excluded.description,
  updated_at = timezone('utc', now());
