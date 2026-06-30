-- AI Content Editor metadata for generated ads.
-- Keeps original versions for restore and tracks user-saved content items.

alter table public.generations
  add column if not exists original_hooks text[],
  add column if not exists original_captions text[],
  add column if not exists original_ctas text[],
  add column if not exists original_ugc_script text,
  add column if not exists saved_content_items jsonb not null default '[]'::jsonb,
  add column if not exists content_updated_at timestamptz;
