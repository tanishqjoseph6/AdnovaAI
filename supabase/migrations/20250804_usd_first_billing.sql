-- USD-first billing: provider-agnostic payments ledger + FX metadata.

alter table public.payments
  alter column razorpay_payment_id drop not null;

alter table public.payments
  alter column razorpay_order_id drop not null;

alter table public.payments
  drop constraint if exists payments_currency_check;

alter table public.payments
  alter column currency set default 'USD';

alter table public.payments
  add column if not exists provider text not null default 'razorpay'
    check (provider in ('razorpay', 'stripe'));

alter table public.payments
  add column if not exists amount_usd_minor integer
    check (amount_usd_minor is null or amount_usd_minor >= 0);

alter table public.payments
  add column if not exists exchange_rate numeric(18, 8)
    check (exchange_rate is null or exchange_rate > 0);

alter table public.payments
  add column if not exists stripe_payment_id text;

alter table public.payments
  add column if not exists stripe_invoice_id text;

alter table public.payments
  add column if not exists stripe_subscription_id text;

create unique index if not exists payments_stripe_payment_id_key
  on public.payments (stripe_payment_id)
  where stripe_payment_id is not null;

create unique index if not exists payments_stripe_invoice_id_key
  on public.payments (stripe_invoice_id)
  where stripe_invoice_id is not null;

-- Best-effort backfill for legacy Razorpay rows.
update public.payments
set
  provider = 'razorpay',
  amount_usd_minor = case
    when plan = 'starter' and billing_interval = 'yearly' then 18200
    when plan = 'pro' and billing_interval = 'yearly' then 56600
    when plan = 'starter' then 1900
    when plan = 'pro' then 5900
    else amount_usd_minor
  end
where provider = 'razorpay'
  and amount_usd_minor is null
  and plan in ('starter', 'pro');

alter table public.credit_purchases
  drop constraint if exists credit_purchases_currency_check;

alter table public.credit_purchases
  alter column currency set default 'USD';

update public.credit_purchases
set currency = 'USD'
where currency = 'INR';
