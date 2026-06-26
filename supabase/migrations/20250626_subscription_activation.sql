-- Subscription activation: razorpay_order_id column + atomic activation function.
-- payment_id stores the Razorpay payment id (pay_xxx). Safe to run multiple times.

alter table public.profiles
  add column if not exists razorpay_order_id text;

create unique index if not exists profiles_razorpay_order_id_key
  on public.profiles (razorpay_order_id)
  where razorpay_order_id is not null;

-- Atomically upgrades a profile after Razorpay payment verification.
-- Uses row-level locking and global idempotency on payment_id / order_id.
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

  -- Idempotency: same Razorpay payment already recorded
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

  -- Idempotency: same Razorpay order already applied
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

  insert into public.profiles (
    id,
    email,
    plan,
    subscription_status,
    generations_used,
    updated_at
  )
  values (p_user_id, p_email, 'free', 'inactive', 0, p_purchase_date)
  on conflict (id) do nothing;

  select * into v_existing
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  -- Re-check after acquiring row lock (concurrent callback + webhook)
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
    generations_used = 0,
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
