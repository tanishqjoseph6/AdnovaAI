-- Ensure users can access only their own generated ad rows.
-- Update is needed by the AI Content Editor for saved edits, saved items, deletes, and restore.

alter table public.generations enable row level security;

drop policy if exists "Users read own generations" on public.generations;
create policy "Users read own generations"
  on public.generations
  for select
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users insert own generations" on public.generations;
create policy "Users insert own generations"
  on public.generations
  for insert
  with check (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users update own generations" on public.generations;
create policy "Users update own generations"
  on public.generations
  for update
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  )
  with check (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );

drop policy if exists "Users delete own generations" on public.generations;
create policy "Users delete own generations"
  on public.generations
  for delete
  using (
    user_email = coalesce(auth.jwt() ->> 'email', auth.uid()::text)
  );
