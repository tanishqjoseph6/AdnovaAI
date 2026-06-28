-- Server-side auth rate limiting (fixed-window counters).

create table if not exists public.auth_rate_limit_buckets (
  bucket_key text not null,
  action text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default now(),
  primary key (bucket_key, action)
);

create index if not exists auth_rate_limit_buckets_window_idx
  on public.auth_rate_limit_buckets (window_started_at);

alter table public.auth_rate_limit_buckets enable row level security;

create or replace function public.check_auth_rate_limit(
  p_bucket_key text,
  p_action text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.auth_rate_limit_buckets%rowtype;
  v_elapsed_seconds numeric;
  v_retry_after integer;
begin
  if p_bucket_key is null
    or trim(p_bucket_key) = ''
    or p_action is null
    or trim(p_action) = ''
    or p_max_attempts is null
    or p_max_attempts < 1
    or p_window_seconds is null
    or p_window_seconds < 1
  then
    return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  end if;

  select *
  into v_row
  from public.auth_rate_limit_buckets
  where bucket_key = p_bucket_key
    and action = p_action
  for update;

  if not found then
    insert into public.auth_rate_limit_buckets (
      bucket_key,
      action,
      attempt_count,
      window_started_at
    )
    values (p_bucket_key, p_action, 1, v_now);

    return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  end if;

  v_elapsed_seconds := extract(epoch from (v_now - v_row.window_started_at));

  if v_elapsed_seconds >= p_window_seconds then
    update public.auth_rate_limit_buckets
    set
      attempt_count = 1,
      window_started_at = v_now
    where bucket_key = p_bucket_key
      and action = p_action;

    return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  end if;

  if v_row.attempt_count >= p_max_attempts then
    v_retry_after := greatest(
      1,
      ceil(p_window_seconds - v_elapsed_seconds)::integer
    );

    return jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', v_retry_after
    );
  end if;

  update public.auth_rate_limit_buckets
  set attempt_count = attempt_count + 1
  where bucket_key = p_bucket_key
    and action = p_action;

  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;
