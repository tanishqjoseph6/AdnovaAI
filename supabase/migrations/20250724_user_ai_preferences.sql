-- Persist per-user AI generation preferences.

create table if not exists public.user_ai_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  language text not null default 'English',
  tone text not null default 'Professional',
  caption_length text not null default 'Medium',
  emoji_usage text not null default 'Low',
  cta_style text not null default 'Direct',
  creative_level smallint not null default 50,
  generation_quality text not null default 'Balanced',
  platform text not null default 'Instagram',
  audience text not null default 'Professionals',
  brand_voice text not null default 'Friendly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_ai_preferences_creative_level_check
    check (creative_level >= 0 and creative_level <= 100),
  constraint user_ai_preferences_language_check
    check (language in (
      'English', 'Hindi', 'Spanish', 'French', 'German', 'Italian',
      'Portuguese', 'Dutch', 'Japanese', 'Korean', 'Chinese (Simplified)'
    )),
  constraint user_ai_preferences_tone_check
    check (tone in (
      'Professional', 'Friendly', 'Luxury', 'Funny', 'Bold', 'Minimal',
      'Emotional', 'Gen Z', 'Corporate', 'Premium', 'Storytelling', 'Persuasive'
    )),
  constraint user_ai_preferences_caption_length_check
    check (caption_length in ('Very Short', 'Short', 'Medium', 'Long', 'Detailed')),
  constraint user_ai_preferences_emoji_usage_check
    check (emoji_usage in ('None', 'Low', 'Medium', 'High')),
  constraint user_ai_preferences_cta_style_check
    check (cta_style in (
      'Direct', 'Soft Sell', 'Urgency', 'FOMO', 'Luxury', 'Educational', 'Community'
    )),
  constraint user_ai_preferences_generation_quality_check
    check (generation_quality in ('Fast', 'Balanced', 'Premium')),
  constraint user_ai_preferences_platform_check
    check (platform in (
      'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'X', 'YouTube', 'Google Ads'
    )),
  constraint user_ai_preferences_audience_check
    check (audience in (
      'Gen Z', 'Millennials', 'Professionals', 'Parents', 'Students', 'Business Owners'
    )),
  constraint user_ai_preferences_brand_voice_check
    check (brand_voice in (
      'Minimal', 'Premium', 'Luxury', 'Friendly', 'Corporate', 'Funny', 'Bold'
    ))
);

alter table public.user_ai_preferences enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_ai_preferences'
      and policyname = 'Users can read own AI preferences'
  ) then
    create policy "Users can read own AI preferences"
      on public.user_ai_preferences
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_ai_preferences'
      and policyname = 'Users can insert own AI preferences'
  ) then
    create policy "Users can insert own AI preferences"
      on public.user_ai_preferences
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_ai_preferences'
      and policyname = 'Users can update own AI preferences'
  ) then
    create policy "Users can update own AI preferences"
      on public.user_ai_preferences
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
