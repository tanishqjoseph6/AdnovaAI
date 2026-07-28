-- Team Approval Workflow: teams, roles, approval statuses, comments, activity, audit.

-- ---------------------------------------------------------------------------
-- 1. Teams
-- ---------------------------------------------------------------------------

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_user_id)
);

create index if not exists teams_owner_user_id_idx on public.teams (owner_user_id);

alter table public.teams enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Team members (Owner / Admin / Manager / Editor)
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'manager', 'editor')),
  status text not null default 'active'
    check (status in ('pending', 'active', 'removed')),
  invited_by uuid references auth.users (id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (team_id, email)
);

create unique index if not exists team_members_team_user_unique
  on public.team_members (team_id, user_id)
  where user_id is not null and status <> 'removed';

create index if not exists team_members_user_id_idx
  on public.team_members (user_id)
  where user_id is not null and status = 'active';

create index if not exists team_members_email_idx
  on public.team_members (lower(email));

alter table public.team_members enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Extend scheduled_posts for approval workflow
-- ---------------------------------------------------------------------------

alter table public.scheduled_posts
  drop constraint if exists scheduled_posts_status_check;

alter table public.scheduled_posts
  add constraint scheduled_posts_status_check
  check (
    status in (
      'draft',
      'pending_approval',
      'approved',
      'upcoming',
      'published',
      'failed',
      'rejected'
    )
  );

alter table public.scheduled_posts
  add column if not exists team_id uuid references public.teams (id) on delete set null;

alter table public.scheduled_posts
  add column if not exists submitted_by uuid references auth.users (id) on delete set null;

alter table public.scheduled_posts
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

alter table public.scheduled_posts
  add column if not exists reviewed_at timestamptz;

alter table public.scheduled_posts
  add column if not exists rejection_reason text
    check (
      rejection_reason is null
      or char_length(trim(rejection_reason)) between 1 and 1000
    );

create index if not exists scheduled_posts_team_id_status_idx
  on public.scheduled_posts (team_id, status, updated_at desc)
  where team_id is not null;

create index if not exists scheduled_posts_pending_approval_idx
  on public.scheduled_posts (team_id, updated_at desc)
  where status = 'pending_approval';

-- ---------------------------------------------------------------------------
-- 4. Approval comments
-- ---------------------------------------------------------------------------

create table if not exists public.approval_comments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  post_id uuid not null references public.scheduled_posts (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  author_role text not null
    check (author_role in ('owner', 'admin', 'manager', 'editor')),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists approval_comments_post_id_created_at_idx
  on public.approval_comments (post_id, created_at asc);

alter table public.approval_comments enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Approval activity timeline
-- ---------------------------------------------------------------------------

create table if not exists public.approval_activity (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  post_id uuid not null references public.scheduled_posts (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,
  actor_role text
    check (
      actor_role is null
      or actor_role in ('owner', 'admin', 'manager', 'editor')
    ),
  action text not null check (
    action in (
      'created',
      'submitted',
      'approved',
      'rejected',
      'scheduled',
      'published',
      'commented',
      'resubmitted',
      'edited'
    )
  ),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists approval_activity_post_id_created_at_idx
  on public.approval_activity (post_id, created_at desc);

create index if not exists approval_activity_team_id_created_at_idx
  on public.approval_activity (team_id, created_at desc);

alter table public.approval_activity enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Team audit logs
-- ---------------------------------------------------------------------------

create table if not exists public.team_audit_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,
  actor_role text
    check (
      actor_role is null
      or actor_role in ('owner', 'admin', 'manager', 'editor')
    ),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists team_audit_logs_team_id_created_at_idx
  on public.team_audit_logs (team_id, created_at desc);

alter table public.team_audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- 7. Membership helpers (security definer for RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_active_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members m
    where m.team_id = p_team_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.team_role(p_team_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.team_members m
  where m.team_id = p_team_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.is_active_team_member(uuid) from public;
revoke all on function public.team_role(uuid) from public;
grant execute on function public.is_active_team_member(uuid) to authenticated;
grant execute on function public.team_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. RLS policies
-- ---------------------------------------------------------------------------

drop policy if exists "Members can view their teams" on public.teams;
create policy "Members can view their teams"
  on public.teams
  for select
  using (
    owner_user_id = auth.uid()
    or public.is_active_team_member(id)
  );

drop policy if exists "Owners can insert teams" on public.teams;
create policy "Owners can insert teams"
  on public.teams
  for insert
  with check (owner_user_id = auth.uid());

drop policy if exists "Owners and admins can update teams" on public.teams;
create policy "Owners and admins can update teams"
  on public.teams
  for update
  using (
    owner_user_id = auth.uid()
    or public.team_role(id) in ('owner', 'admin')
  )
  with check (
    owner_user_id = auth.uid()
    or public.team_role(id) in ('owner', 'admin')
  );

drop policy if exists "Members can view team members" on public.team_members;
create policy "Members can view team members"
  on public.team_members
  for select
  using (
    user_id = auth.uid()
    or public.is_active_team_member(team_id)
  );

drop policy if exists "Admins can manage team members" on public.team_members;
create policy "Admins can manage team members"
  on public.team_members
  for all
  using (public.team_role(team_id) in ('owner', 'admin'))
  with check (public.team_role(team_id) in ('owner', 'admin'));

drop policy if exists "Members can view approval comments" on public.approval_comments;
create policy "Members can view approval comments"
  on public.approval_comments
  for select
  using (public.is_active_team_member(team_id));

drop policy if exists "Members can insert approval comments" on public.approval_comments;
create policy "Members can insert approval comments"
  on public.approval_comments
  for insert
  with check (
    author_user_id = auth.uid()
    and public.is_active_team_member(team_id)
  );

drop policy if exists "Members can view approval activity" on public.approval_activity;
create policy "Members can view approval activity"
  on public.approval_activity
  for select
  using (public.is_active_team_member(team_id));

drop policy if exists "Members can insert approval activity" on public.approval_activity;
create policy "Members can insert approval activity"
  on public.approval_activity
  for insert
  with check (public.is_active_team_member(team_id));

drop policy if exists "Admins can view team audit logs" on public.team_audit_logs;
create policy "Admins can view team audit logs"
  on public.team_audit_logs
  for select
  using (public.team_role(team_id) in ('owner', 'admin'));

drop policy if exists "Members can insert team audit logs" on public.team_audit_logs;
create policy "Members can insert team audit logs"
  on public.team_audit_logs
  for insert
  with check (public.is_active_team_member(team_id));

-- Team members can also read shared scheduled posts by team.
drop policy if exists "Team members can view team scheduled posts" on public.scheduled_posts;
create policy "Team members can view team scheduled posts"
  on public.scheduled_posts
  for select
  using (
    auth.uid() = user_id
    or (
      team_id is not null
      and public.is_active_team_member(team_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 9. Realtime (optional, safe if publication missing)
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.approval_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.approval_activity;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
