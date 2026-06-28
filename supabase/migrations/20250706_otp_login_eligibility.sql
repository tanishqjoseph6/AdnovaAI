-- Login OTP eligibility: existing account required, separate from signup verification.

create or replace function public.email_login_eligibility(p_email text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_user auth.users%rowtype;
begin
  if coalesce(length(v_email), 0) = 0 then
    return jsonb_build_object('registered', false, 'confirmed', false);
  end if;

  select *
  into v_user
  from auth.users u
  where u.email is not null
    and lower(u.email) = v_email
  limit 1;

  if not found then
    return jsonb_build_object('registered', false, 'confirmed', false);
  end if;

  return jsonb_build_object(
    'registered', true,
    'confirmed', v_user.email_confirmed_at is not null
  );
end;
$$;
