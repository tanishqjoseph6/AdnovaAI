-- Grant free credits only after email verification.
-- Prevents duplicate profile emails and removes signup-time credit grants.

create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email))
  where email is not null;

drop trigger if exists on_auth_user_created_credits on auth.users;

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    insert into public.user_credits (user_id, credits, plan)
    values (new.id, 5, 'free')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;

create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  execute function public.handle_user_email_confirmed();

-- Backfill credits for already-verified users missing a credits row.
insert into public.user_credits (user_id, credits, plan)
select u.id, 5, 'free'
from auth.users u
where u.email_confirmed_at is not null
  and not exists (
    select 1 from public.user_credits c where c.user_id = u.id
  )
on conflict (user_id) do nothing;
