-- One-time: set all Free billing-plan users to exactly 5 credits.
-- Starter, Pro, and Custom (Business) profiles are not modified.
-- Safe to run multiple times (idempotent for free users).

update public.user_credits uc
set
  credits = 5,
  plan = 'free',
  updated_at = now()
from public.profiles p
where uc.user_id = p.id
  and p.plan = 'free';

-- Backfill credits rows for free profiles that never received one.
insert into public.user_credits (user_id, credits, plan, updated_at)
select p.id, 5, 'free', now()
from public.profiles p
where p.plan = 'free'
  and not exists (
    select 1
    from public.user_credits uc
    where uc.user_id = p.id
  )
on conflict (user_id) do nothing;
