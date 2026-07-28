-- AI Thumbnail Generator
-- Stores generated thumbnails, reusable templates, and image assets.

create table if not exists public.thumbnails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  format text not null check (
    format in (
      'youtube',
      'instagram_cover',
      'reel_cover',
      'product',
      'advertisement'
    )
  ),
  prompt text not null,
  product_url text,
  brand_name text not null,
  brand_colors jsonb not null default '{"primary":"#8b5cf6","secondary":"#22d3ee","accent":"#ec4899"}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  template_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists thumbnails_user_id_created_at_idx
  on public.thumbnails (user_id, created_at desc);

alter table public.thumbnails enable row level security;

drop policy if exists "Users can view own thumbnails" on public.thumbnails;
create policy "Users can view own thumbnails"
  on public.thumbnails
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own thumbnails" on public.thumbnails;
create policy "Users can insert own thumbnails"
  on public.thumbnails
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own thumbnails" on public.thumbnails;
create policy "Users can update own thumbnails"
  on public.thumbnails
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own thumbnails" on public.thumbnails;
create policy "Users can delete own thumbnails"
  on public.thumbnails
  for delete
  using (auth.uid() = user_id);

create table if not exists public.thumbnail_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  format text not null check (
    format in (
      'youtube',
      'instagram_cover',
      'reel_cover',
      'product',
      'advertisement'
    )
  ),
  prompt text not null,
  brand_name text not null,
  brand_colors jsonb not null default '{"primary":"#8b5cf6","secondary":"#22d3ee","accent":"#ec4899"}'::jsonb,
  product_url text,
  preview_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists thumbnail_templates_user_id_updated_at_idx
  on public.thumbnail_templates (user_id, updated_at desc);

alter table public.thumbnail_templates enable row level security;

drop policy if exists "Users can view own thumbnail templates" on public.thumbnail_templates;
create policy "Users can view own thumbnail templates"
  on public.thumbnail_templates
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own thumbnail templates" on public.thumbnail_templates;
create policy "Users can insert own thumbnail templates"
  on public.thumbnail_templates
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own thumbnail templates" on public.thumbnail_templates;
create policy "Users can update own thumbnail templates"
  on public.thumbnail_templates
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own thumbnail templates" on public.thumbnail_templates;
create policy "Users can delete own thumbnail templates"
  on public.thumbnail_templates
  for delete
  using (auth.uid() = user_id);

alter table public.thumbnails
  drop constraint if exists thumbnails_template_id_fkey;

alter table public.thumbnails
  add constraint thumbnails_template_id_fkey
  foreign key (template_id)
  references public.thumbnail_templates (id)
  on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnail-images',
  'thumbnail-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read thumbnail images" on storage.objects;
create policy "Users can read thumbnail images"
  on storage.objects
  for select
  using (bucket_id = 'thumbnail-images');

drop policy if exists "Users can upload own thumbnail images" on storage.objects;
create policy "Users can upload own thumbnail images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'thumbnail-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own thumbnail images" on storage.objects;
create policy "Users can delete own thumbnail images"
  on storage.objects
  for delete
  using (
    bucket_id = 'thumbnail-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

insert into public.credit_feature_costs (feature_id, cost, label, description)
values
  (
    'generate_thumbnail',
    15,
    'AI Thumbnail Generator',
    'Generate multiple HD thumbnail variations with AI headlines and CTAs'
  )
on conflict (feature_id) do update
set
  cost = excluded.cost,
  label = excluded.label,
  description = excluded.description,
  updated_at = timezone('utc', now());
