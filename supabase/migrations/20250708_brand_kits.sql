-- Brand Kit: one saved brand identity per user.

create table if not exists public.brand_kits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  brand_name text,
  website_url text,
  logo_url text,
  brand_description text,
  industry text,
  target_audience text,
  usp text,
  brand_voice text not null default 'Professional',
  custom_brand_voice text,
  primary_color text not null default '#8b5cf6',
  secondary_color text not null default '#22d3ee',
  cta_color text not null default '#ec4899',
  caption_length text not null default 'Medium',
  emoji_usage text not null default 'Low',
  cta_style text not null default 'Direct',
  writing_style text not null default 'Sales',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint brand_kits_brand_voice_check check (
    brand_voice in (
      'Professional',
      'Luxury',
      'Minimal',
      'Friendly',
      'Bold',
      'Gen Z',
      'Premium Tech',
      'Fashion',
      'Beauty',
      'Fitness',
      'Funny',
      'Custom'
    )
  ),
  constraint brand_kits_caption_length_check check (
    caption_length in ('Short', 'Medium', 'Long')
  ),
  constraint brand_kits_emoji_usage_check check (
    emoji_usage in ('None', 'Low', 'Medium', 'High')
  ),
  constraint brand_kits_cta_style_check check (
    cta_style in ('Soft', 'Direct', 'Urgent')
  ),
  constraint brand_kits_writing_style_check check (
    writing_style in ('Storytelling', 'Sales', 'Educational', 'Emotional')
  ),
  constraint brand_kits_primary_color_check check (
    primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  constraint brand_kits_secondary_color_check check (
    secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  constraint brand_kits_cta_color_check check (
    cta_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

create index if not exists brand_kits_updated_at_idx
  on public.brand_kits (updated_at desc);

alter table public.brand_kits enable row level security;

drop policy if exists "Users read own brand kit" on public.brand_kits;
create policy "Users read own brand kit"
  on public.brand_kits
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own brand kit" on public.brand_kits;
create policy "Users insert own brand kit"
  on public.brand_kits
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own brand kit" on public.brand_kits;
create policy "Users update own brand kit"
  on public.brand_kits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own brand kit" on public.brand_kits;
create policy "Users delete own brand kit"
  on public.brand_kits
  for delete
  using (auth.uid() = user_id);
