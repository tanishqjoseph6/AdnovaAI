-- Production payments ledger for Razorpay checkout.
-- Idempotent on razorpay_payment_id; RLS isolates user data.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  plan text not null check (plan in ('starter', 'pro')),
  amount integer not null check (amount >= 0),
  currency text not null default 'INR' check (currency in ('INR', 'USD')),
  razorpay_payment_id text not null,
  razorpay_order_id text not null,
  status text not null default 'success' check (status in ('success', 'failed', 'refunded')),
  billing_interval text check (billing_interval in ('monthly', 'yearly')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists payments_razorpay_payment_id_key
  on public.payments (razorpay_payment_id);

create index if not exists payments_user_created_idx
  on public.payments (user_id, created_at desc);

create index if not exists payments_status_created_idx
  on public.payments (status, created_at desc);

create index if not exists payments_plan_created_idx
  on public.payments (plan, created_at desc);

create index if not exists payments_email_idx
  on public.payments (lower(email));

-- Backfill successful payments from profiles (best-effort amounts from monthly pricing).
insert into public.payments (
  user_id,
  email,
  plan,
  amount,
  currency,
  razorpay_payment_id,
  razorpay_order_id,
  status,
  billing_interval,
  created_at,
  updated_at
)
select
  p.id,
  p.email,
  p.plan,
  case
    when p.plan = 'starter' then 5000
    when p.plan = 'pro' then 299900
    else 0
  end,
  'INR',
  p.payment_id,
  p.razorpay_order_id,
  'success',
  'monthly',
  coalesce(p.purchase_date, p.created_at, timezone('utc', now())),
  coalesce(p.purchase_date, p.updated_at, timezone('utc', now()))
from public.profiles p
where p.payment_id is not null
  and p.razorpay_order_id is not null
  and p.plan in ('starter', 'pro')
on conflict (razorpay_payment_id) do nothing;

alter table public.payments enable row level security;

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments"
  on public.payments
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins read all payments" on public.payments;
create policy "Admins read all payments"
  on public.payments
  for select
  using (public.is_admin(auth.uid()));
