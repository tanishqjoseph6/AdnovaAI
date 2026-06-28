-- Harden signup eligibility and idempotent free credit grants.

create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email))
  where email is not null;

create or replace function public.email_is_available_for_signup(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    coalesce(length(lower(trim(p_email))), 0) > 0
    and not exists (
      select 1
      from auth.users u
      where u.email is not null
        and lower(u.email) = lower(trim(p_email))
    )
    and not exists (
      select 1
      from public.profiles p
      where p.email is not null
        and lower(p.email) = lower(trim(p_email))
    )
    and not exists (
      select 1
      from public.free_credit_claims c
      where c.email_lower = lower(trim(p_email))
    );
$$;

create or replace function public.email_has_free_credit_claim(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.free_credit_claims c
    where c.email_lower = lower(trim(p_email))
  );
$$;

create or replace function public.try_claim_free_credits(
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email_lower text := lower(trim(p_email));
  v_inserted_claim boolean := false;
begin
  if p_user_id is null or v_email_lower is null or v_email_lower = '' then
    return false;
  end if;

  if not exists (
    select 1
    from auth.users u
    where u.id = p_user_id
      and u.email_confirmed_at is not null
      and lower(u.email) = v_email_lower
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.free_credit_claims c
    where c.email_lower = v_email_lower
      and c.user_id <> p_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.free_credit_claims c
    where c.user_id = p_user_id
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.user_credits uc
    where uc.user_id = p_user_id
  ) then
    return false;
  end if;

  insert into public.free_credit_claims (email_lower, user_id)
  values (v_email_lower, p_user_id)
  on conflict (email_lower) do nothing
  returning true into v_inserted_claim;

  if not coalesce(v_inserted_claim, false) then
    return false;
  end if;

  insert into public.user_credits (user_id, credits, plan, updated_at)
  values (p_user_id, 5, 'free', now())
  on conflict (user_id) do nothing;

  return true;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is not null then
    if exists (
      select 1
      from public.profiles p
      where p.email is not null
        and lower(p.email) = lower(new.email)
        and p.id <> new.id
    ) then
      raise exception 'duplicate_email'
        using errcode = '23505',
              message = 'An account already exists with this email. Please log in.';
    end if;

    if exists (
      select 1
      from auth.users u
      where u.email is not null
        and lower(u.email) = lower(new.email)
        and u.id <> new.id
    ) then
      raise exception 'duplicate_email'
        using errcode = '23505',
              message = 'An account already exists with this email. Please log in.';
    end if;

    if exists (
      select 1
      from public.free_credit_claims c
      where c.email_lower = lower(new.email)
    ) then
      raise exception 'duplicate_email'
        using errcode = '23505',
              message = 'An account already exists with this email. Please log in.';
    end if;
  end if;

  insert into public.profiles (id, email, plan, subscription_status)
  values (new.id, new.email, 'free', 'inactive')
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    raise exception 'duplicate_email'
      using errcode = '23505',
            message = 'An account already exists with this email. Please log in.';
end;
$$;

create or replace function public.ensure_user_credits(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.user_credits where user_id = p_user_id
  ) then
    return;
  end if;

  if exists (
    select 1
    from public.free_credit_claims c
    where c.user_id = p_user_id
  ) then
    insert into public.user_credits (user_id, credits, plan, updated_at)
    values (p_user_id, 5, 'free', now())
    on conflict (user_id) do nothing;
  end if;
end;
$$;
