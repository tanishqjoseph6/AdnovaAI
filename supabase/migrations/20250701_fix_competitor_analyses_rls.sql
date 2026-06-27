-- Fix permissive RLS on competitor_analyses (replaces using(true) / with check(true))

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
