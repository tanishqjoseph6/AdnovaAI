-- Credits live only in public.user_credits. Remove legacy profiles.generations_used.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, subscription_status)
  values (new.id, new.email, 'free', 'inactive')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.activate_subscription_from_payment(
  p_user_id uuid,
  p_email text,
  p_plan text,
  p_payment_id text,
  p_order_id text,
  p_purchase_date timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.profiles%rowtype;
begin
  if p_plan not in ('starter', 'pro') then
    raise exception 'Invalid plan: %', p_plan;
  end if;

  if p_payment_id is null or p_order_id is null then
    raise exception 'payment_id and order_id are required';
  end if;

  select * into v_existing
  from public.profiles
  where payment_id = p_payment_id
  limit 1;

  if found then
    return jsonb_build_object(
      'activated', false,
      'already_processed', true,
      'plan', v_existing.plan,
      'user_id', v_existing.id
    );
  end if;

  select * into v_existing
  from public.profiles
  where razorpay_order_id = p_order_id
  limit 1;

  if found then
    return jsonb_build_object(
      'activated', false,
      'already_processed', true,
      'plan', v_existing.plan,
      'user_id', v_existing.id
    );
  end if;

  insert into public.profiles (id, email, plan, subscription_status, updated_at)
  values (p_user_id, p_email, 'free', 'inactive', p_purchase_date)
  on conflict (id) do nothing;

  select * into v_existing
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  if exists (
    select 1
    from public.profiles
    where payment_id = p_payment_id
       or razorpay_order_id = p_order_id
  ) then
    select * into v_existing
    from public.profiles
    where payment_id = p_payment_id
       or razorpay_order_id = p_order_id
    limit 1;

    return jsonb_build_object(
      'activated', false,
      'already_processed', true,
      'plan', v_existing.plan,
      'user_id', v_existing.id
    );
  end if;

  update public.profiles
  set
    email = coalesce(p_email, email),
    plan = p_plan,
    subscription_status = 'active',
    payment_id = p_payment_id,
    razorpay_order_id = p_order_id,
    purchase_date = p_purchase_date,
    updated_at = p_purchase_date
  where id = p_user_id;

  return jsonb_build_object(
    'activated', true,
    'already_processed', false,
    'plan', p_plan,
    'user_id', p_user_id
  );
end;
$$;

alter table public.profiles drop column if exists generations_used;
