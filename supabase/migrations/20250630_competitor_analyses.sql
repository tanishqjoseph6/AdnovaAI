-- Competitor ad analyses for history and better-ad generation

create table if not exists public.competitor_analyses (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  image_name text,
  analysis jsonb not null,
  better_ad jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists competitor_analyses_user_created_idx
  on public.competitor_analyses (user_email, created_at desc);

alter table public.competitor_analyses enable row level security;

-- Row owner is stored as auth email, or auth.uid() when email is unavailable.
-- Matches app inserts: user.email ?? user.id

drop policy if exists "Users read own competitor analyses" on public.competitor_analyses;
create policy "Users read own competitor analyses"
  on public.competitor_analyses
  for select
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users insert own competitor analyses" on public.competitor_analyses;
create policy "Users insert own competitor analyses"
  on public.competitor_analyses
  for insert
  with check (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users delete own competitor analyses" on public.competitor_analyses;
create policy "Users delete own competitor analyses"
  on public.competitor_analyses
  for delete
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users update own competitor analyses" on public.competitor_analyses;
create policy "Users update own competitor analyses"
  on public.competitor_analyses
  for update
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  )
  with check (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );
