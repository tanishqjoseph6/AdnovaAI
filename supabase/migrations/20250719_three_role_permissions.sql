-- Final production role model: owner, team_member, user.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'team_member'
where role = 'admin';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'team_member', 'user'));

update public.profiles
set role = 'owner',
    is_admin = true
where lower(email) = lower('richietanishq@gmail.com');

update public.profiles
set role = 'user',
    is_admin = false
where lower(coalesce(email, '')) <> lower('richietanishq@gmail.com')
  and role = 'owner';

update public.profiles
set is_admin = role in ('owner', 'team_member');

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(coalesce(profiles.email, '')) = lower('richietanishq@gmail.com')
        or profiles.role = 'team_member'
      from public.profiles
      where profiles.id = user_id
    ),
    false
  );
$$;

create or replace function public.is_owner(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select lower(coalesce(profiles.email, '')) = lower('richietanishq@gmail.com')
      from public.profiles
      where profiles.id = user_id
    ),
    false
  );
$$;

create or replace function public.sync_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) = lower('richietanishq@gmail.com') then
    new.role := 'owner';
    new.is_admin := true;
  else
    if new.role = 'owner' then
      new.role := 'user';
    end if;
    new.is_admin := new.role = 'team_member';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_admin_flag_before_write on public.profiles;
create trigger sync_profile_admin_flag_before_write
  before insert or update on public.profiles
  for each row
  execute function public.sync_profile_admin_flag();
