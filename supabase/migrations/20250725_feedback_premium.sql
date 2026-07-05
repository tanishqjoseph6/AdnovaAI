-- Premium feedback: ratings, reactions, expanded categories, workflow statuses.

alter table public.user_feedback
  add column if not exists rating smallint,
  add column if not exists reaction text;

-- Migrate legacy statuses before tightening constraint.
update public.user_feedback
set status = case
  when status = 'open' then 'new'
  when status = 'reviewed' then 'in_review'
  when status = 'closed' then 'completed'
  else status
end
where status in ('open', 'reviewed', 'closed');

-- Backfill rating for existing rows.
update public.user_feedback
set rating = 3
where rating is null;

alter table public.user_feedback
  alter column rating set not null,
  alter column rating set default 3;

alter table public.user_feedback
  drop constraint if exists user_feedback_category_check;

alter table public.user_feedback
  add constraint user_feedback_category_check
  check (category in (
    'bug_report',
    'feature_request',
    'improvement_suggestion',
    'general_feedback',
    'ui_ux',
    'performance',
    'ai_output_quality',
    'billing',
    'account_login',
    'mobile_experience'
  ));

alter table public.user_feedback
  drop constraint if exists user_feedback_status_check;

alter table public.user_feedback
  add constraint user_feedback_status_check
  check (status in ('new', 'in_review', 'planned', 'completed', 'dismissed'));

alter table public.user_feedback
  alter column status set default 'new';

alter table public.user_feedback
  drop constraint if exists user_feedback_rating_check;

alter table public.user_feedback
  add constraint user_feedback_rating_check
  check (rating between 1 and 5);

-- Backfill reaction for existing rows.
update public.user_feedback
set reaction = 'okay'
where reaction is null;

alter table public.user_feedback
  alter column reaction set not null,
  alter column reaction set default 'okay';

create index if not exists user_feedback_rating_created_idx
  on public.user_feedback (rating, created_at desc);

create index if not exists user_feedback_reaction_created_idx
  on public.user_feedback (reaction, created_at desc);

create index if not exists user_feedback_category_created_idx
  on public.user_feedback (category, created_at desc);

alter table public.user_feedback
  drop constraint if exists user_feedback_reaction_check;

alter table public.user_feedback
  add constraint user_feedback_reaction_check
  check (
    reaction in (
      'loved_it',
      'amazing',
      'okay',
      'needs_improvement',
      'frustrating'
    )
  );
