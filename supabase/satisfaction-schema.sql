-- Satisfaction survey schema
-- This file is independent from the trainer-review schema.

create extension if not exists "pgcrypto";

-- Branch ids are text so new branches can be added without changing the schema.
create table if not exists public.branches (
  id text primary key,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references public.branches(id) on update cascade on delete restrict,
  name text not null,
  role text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_visible_in_survey boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare
  role_constraint_name text;
begin
  for role_constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'staff'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role%'
  loop
    execute format('alter table public.staff drop constraint if exists %I', role_constraint_name);
  end loop;
end $$;

update public.staff
set
  role = case
    when role = 'manager' then 'branch_manager'
    when role in ('info', 'cleaning', 'other') then 'weekend_part_timer'
    else role
  end,
  updated_at = now()
where role in ('manager', 'info', 'cleaning', 'other');

update public.staff
set
  role = 'weekend_part_timer',
  updated_at = now()
where role is not null
  and role not in ('trainer', 'fc', 'branch_manager', 'pt_leader', 'weekend_part_timer');

update public.staff
set
  role = 'trainer',
  updated_at = now()
where role is null;

alter table public.staff
  add constraint staff_role_check
  check (
    role is not null
    and role in ('trainer', 'fc', 'branch_manager', 'pt_leader', 'weekend_part_timer')
  );

create table if not exists public.satisfaction_surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year integer not null,
  quarter integer,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.satisfaction_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.satisfaction_surveys(id) on update cascade on delete restrict,
  category text,
  question_text text not null,
  question_type text not null,
  staff_choice_purpose text,
  is_required boolean not null default true,
  is_active boolean not null default true,
  is_core_metric boolean not null default false,
  display_order integer not null default 0,
  placeholder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.satisfaction_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.satisfaction_questions(id) on update cascade on delete restrict,
  option_text text not null,
  option_value text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.satisfaction_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.satisfaction_surveys(id) on update cascade on delete restrict,
  branch_id text not null references public.branches(id) on update cascade on delete restrict,
  member_name text,
  member_phone text,
  client_token text,
  status text not null default 'normal',
  admin_note text,
  assigned_to text,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.satisfaction_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.satisfaction_responses(id) on update cascade on delete restrict,
  question_id uuid not null references public.satisfaction_questions(id) on update cascade on delete restrict,
  rating_value integer,
  text_value text,
  choice_value text,
  choice_values text[],
  staff_id uuid references public.staff(id) on update cascade on delete restrict,
  question_text_snapshot text,
  question_type_snapshot text,
  option_text_snapshot text,
  option_value_snapshot text,
  staff_name_snapshot text,
  staff_role_snapshot text,
  staff_branch_id_snapshot text,
  created_at timestamptz not null default now()
);

create table if not exists public.satisfaction_response_events (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.satisfaction_responses(id) on update cascade on delete restrict,
  event_type text not null,
  previous_status text,
  new_status text,
  note text,
  created_by text default auth.uid()::text,
  created_at timestamptz not null default now()
);

alter table public.satisfaction_surveys
  drop constraint if exists satisfaction_surveys_quarter_check;

alter table public.satisfaction_surveys
  add constraint satisfaction_surveys_quarter_check
  check (quarter is null or quarter between 1 and 4);

alter table public.satisfaction_surveys
  drop constraint if exists satisfaction_surveys_status_check;

alter table public.satisfaction_surveys
  add constraint satisfaction_surveys_status_check
  check (status in ('draft', 'scheduled', 'active', 'closed', 'archived'));

alter table public.satisfaction_surveys
  drop constraint if exists satisfaction_surveys_date_range_check;

alter table public.satisfaction_surveys
  add constraint satisfaction_surveys_date_range_check
  check (start_date <= end_date);

alter table public.satisfaction_questions
  drop constraint if exists satisfaction_questions_question_type_check;

alter table public.satisfaction_questions
  add constraint satisfaction_questions_question_type_check
  check (
    question_type in (
      'rating',
      'text_short',
      'text_long',
      'single_choice',
      'multiple_choice',
      'staff_choice'
    )
  );

alter table public.satisfaction_questions
  drop constraint if exists satisfaction_questions_staff_choice_purpose_check;

alter table public.satisfaction_questions
  add constraint satisfaction_questions_staff_choice_purpose_check
  check (
    (
      question_type = 'staff_choice'
      and staff_choice_purpose is not null
      and staff_choice_purpose in ('positive', 'improvement')
    )
    or (
      question_type <> 'staff_choice'
      and staff_choice_purpose is null
    )
  );

alter table public.satisfaction_responses
  drop constraint if exists satisfaction_responses_status_check;

alter table public.satisfaction_responses
  add constraint satisfaction_responses_status_check
  check (status in ('normal', 'needs_review', 'reviewed', 'in_progress', 'resolved'));

alter table public.satisfaction_answers
  drop constraint if exists satisfaction_answers_rating_value_check;

alter table public.satisfaction_answers
  add constraint satisfaction_answers_rating_value_check
  check (rating_value is null or rating_value between 1 and 5);

alter table public.satisfaction_response_events
  drop constraint if exists satisfaction_response_events_previous_status_check;

alter table public.satisfaction_response_events
  add constraint satisfaction_response_events_previous_status_check
  check (
    previous_status is null
    or previous_status in ('normal', 'needs_review', 'reviewed', 'in_progress', 'resolved')
  );

alter table public.satisfaction_response_events
  drop constraint if exists satisfaction_response_events_new_status_check;

alter table public.satisfaction_response_events
  add constraint satisfaction_response_events_new_status_check
  check (
    new_status is null
    or new_status in ('normal', 'needs_review', 'reviewed', 'in_progress', 'resolved')
  );

create index if not exists branches_active_order_idx
  on public.branches (is_active, display_order, name);

create index if not exists staff_branch_visible_order_idx
  on public.staff (branch_id, is_active, is_visible_in_survey, display_order, name);

create index if not exists satisfaction_surveys_status_dates_idx
  on public.satisfaction_surveys (status, start_date, end_date);

create index if not exists satisfaction_questions_survey_order_idx
  on public.satisfaction_questions (survey_id, is_active, display_order);

create index if not exists satisfaction_question_options_question_order_idx
  on public.satisfaction_question_options (question_id, is_active, display_order);

create index if not exists satisfaction_responses_survey_branch_status_idx
  on public.satisfaction_responses (survey_id, branch_id, status, submitted_at desc);

create index if not exists satisfaction_responses_client_token_idx
  on public.satisfaction_responses (client_token)
  where client_token is not null;

create index if not exists satisfaction_answers_response_idx
  on public.satisfaction_answers (response_id);

create index if not exists satisfaction_answers_question_idx
  on public.satisfaction_answers (question_id);

create index if not exists satisfaction_answers_staff_idx
  on public.satisfaction_answers (staff_id)
  where staff_id is not null;

create index if not exists satisfaction_response_events_response_idx
  on public.satisfaction_response_events (response_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists staff_set_updated_at on public.staff;
create trigger staff_set_updated_at
before update on public.staff
for each row execute function public.set_updated_at();

drop trigger if exists satisfaction_surveys_set_updated_at on public.satisfaction_surveys;
create trigger satisfaction_surveys_set_updated_at
before update on public.satisfaction_surveys
for each row execute function public.set_updated_at();

drop trigger if exists satisfaction_questions_set_updated_at on public.satisfaction_questions;
create trigger satisfaction_questions_set_updated_at
before update on public.satisfaction_questions
for each row execute function public.set_updated_at();

drop trigger if exists satisfaction_question_options_set_updated_at on public.satisfaction_question_options;
create trigger satisfaction_question_options_set_updated_at
before update on public.satisfaction_question_options
for each row execute function public.set_updated_at();

drop trigger if exists satisfaction_responses_set_updated_at on public.satisfaction_responses;
create trigger satisfaction_responses_set_updated_at
before update on public.satisfaction_responses
for each row execute function public.set_updated_at();

create or replace function public.set_satisfaction_response_review_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('reviewed', 'in_progress', 'resolved') and new.reviewed_at is null then
      new.reviewed_at = now();
    end if;

    if new.status = 'resolved' and new.resolved_at is null then
      new.resolved_at = now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists satisfaction_responses_set_review_timestamps on public.satisfaction_responses;
create trigger satisfaction_responses_set_review_timestamps
before update of status on public.satisfaction_responses
for each row execute function public.set_satisfaction_response_review_timestamps();

create or replace function public.log_satisfaction_response_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.satisfaction_response_events (
      response_id,
      event_type,
      previous_status,
      new_status,
      note,
      created_by
    )
    values (
      new.id,
      'status_changed',
      old.status,
      new.status,
      new.admin_note,
      auth.uid()::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists satisfaction_responses_log_status_change on public.satisfaction_responses;
create trigger satisfaction_responses_log_status_change
after update of status on public.satisfaction_responses
for each row execute function public.log_satisfaction_response_status_change();

create or replace function public.hydrate_satisfaction_answer_snapshots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  question_record record;
  option_record record;
  staff_record record;
begin
  select q.question_text, q.question_type
    into question_record
  from public.satisfaction_questions q
  where q.id = new.question_id;

  if found then
    new.question_text_snapshot = coalesce(new.question_text_snapshot, question_record.question_text);
    new.question_type_snapshot = coalesce(new.question_type_snapshot, question_record.question_type);
  end if;

  if new.choice_value is not null then
    select o.option_text, o.option_value
      into option_record
    from public.satisfaction_question_options o
    where o.question_id = new.question_id
      and (
        o.option_value = new.choice_value
        or o.option_text = new.choice_value
      )
    order by o.display_order asc, o.created_at asc
    limit 1;

    if found then
      new.option_text_snapshot = coalesce(new.option_text_snapshot, option_record.option_text);
      new.option_value_snapshot = coalesce(new.option_value_snapshot, option_record.option_value);
    else
      new.option_value_snapshot = coalesce(new.option_value_snapshot, new.choice_value);
    end if;
  elsif new.choice_values is not null and array_length(new.choice_values, 1) > 0 then
    select
      string_agg(o.option_text, ', ' order by o.display_order asc, o.created_at asc) as option_text,
      string_agg(coalesce(o.option_value, o.option_text), ', ' order by o.display_order asc, o.created_at asc) as option_value
      into option_record
    from public.satisfaction_question_options o
    where o.question_id = new.question_id
      and (
        o.option_value = any(new.choice_values)
        or o.option_text = any(new.choice_values)
      );

    if option_record.option_text is not null then
      new.option_text_snapshot = coalesce(new.option_text_snapshot, option_record.option_text);
      new.option_value_snapshot = coalesce(new.option_value_snapshot, option_record.option_value);
    else
      new.option_value_snapshot = coalesce(new.option_value_snapshot, array_to_string(new.choice_values, ', '));
    end if;
  end if;

  if new.staff_id is not null then
    select s.name, s.role, s.branch_id
      into staff_record
    from public.staff s
    where s.id = new.staff_id;

    if found then
      new.staff_name_snapshot = coalesce(new.staff_name_snapshot, staff_record.name);
      new.staff_role_snapshot = coalesce(new.staff_role_snapshot, staff_record.role);
      new.staff_branch_id_snapshot = coalesce(new.staff_branch_id_snapshot, staff_record.branch_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists satisfaction_answers_hydrate_snapshots on public.satisfaction_answers;
create trigger satisfaction_answers_hydrate_snapshots
before insert or update on public.satisfaction_answers
for each row execute function public.hydrate_satisfaction_answer_snapshots();

drop function if exists public.delete_satisfaction_response(uuid);

create function public.delete_satisfaction_response(p_response_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_response_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    raise exception 'authenticated role required'
      using errcode = '42501';
  end if;

  delete from public.satisfaction_response_events
  where response_id = p_response_id;

  delete from public.satisfaction_answers
  where response_id = p_response_id;

  delete from public.satisfaction_responses
  where id = p_response_id;

  get diagnostics deleted_response_count = row_count;

  return jsonb_build_object(
    'success', deleted_response_count > 0,
    'response_id', p_response_id,
    'deleted_count', deleted_response_count
  );
end;
$$;

revoke all on function public.delete_satisfaction_response(uuid) from public;
revoke execute on function public.delete_satisfaction_response(uuid) from anon;
grant execute on function public.delete_satisfaction_response(uuid) to authenticated;

create or replace function public.can_submit_satisfaction_answer(
  p_response_id uuid,
  p_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.satisfaction_responses r
    join public.satisfaction_questions q on q.id = p_question_id
    join public.satisfaction_surveys s on s.id = r.survey_id
    where r.id = p_response_id
      and q.survey_id = r.survey_id
      and q.is_active = true
      and s.status = 'active'
      and current_date between s.start_date and s.end_date
  );
$$;

revoke all on function public.can_submit_satisfaction_answer(uuid, uuid) from public;
grant execute on function public.can_submit_satisfaction_answer(uuid, uuid) to anon, authenticated;

alter table public.branches enable row level security;
alter table public.staff enable row level security;
alter table public.satisfaction_surveys enable row level security;
alter table public.satisfaction_questions enable row level security;
alter table public.satisfaction_question_options enable row level security;
alter table public.satisfaction_responses enable row level security;
alter table public.satisfaction_answers enable row level security;
alter table public.satisfaction_response_events enable row level security;

drop policy if exists "Public can view active branches" on public.branches;
drop policy if exists "Authenticated admins can view branches" on public.branches;
drop policy if exists "Authenticated admins can insert branches" on public.branches;
drop policy if exists "Authenticated admins can update branches" on public.branches;

drop policy if exists "Public can view visible active staff" on public.staff;
drop policy if exists "Authenticated admins can view staff" on public.staff;
drop policy if exists "Authenticated admins can insert staff" on public.staff;
drop policy if exists "Authenticated admins can update staff" on public.staff;

drop policy if exists "Public can view active open surveys" on public.satisfaction_surveys;
drop policy if exists "Authenticated admins can view surveys" on public.satisfaction_surveys;
drop policy if exists "Authenticated admins can insert surveys" on public.satisfaction_surveys;
drop policy if exists "Authenticated admins can update surveys" on public.satisfaction_surveys;

drop policy if exists "Public can view active questions for open surveys" on public.satisfaction_questions;
drop policy if exists "Authenticated admins can view questions" on public.satisfaction_questions;
drop policy if exists "Authenticated admins can insert questions" on public.satisfaction_questions;
drop policy if exists "Authenticated admins can update questions" on public.satisfaction_questions;

drop policy if exists "Public can view active options for open surveys" on public.satisfaction_question_options;
drop policy if exists "Authenticated admins can view question options" on public.satisfaction_question_options;
drop policy if exists "Authenticated admins can insert question options" on public.satisfaction_question_options;
drop policy if exists "Authenticated admins can update question options" on public.satisfaction_question_options;

drop policy if exists "Public can insert satisfaction responses" on public.satisfaction_responses;
drop policy if exists "Authenticated admins can view responses" on public.satisfaction_responses;
drop policy if exists "Authenticated admins can insert responses" on public.satisfaction_responses;
drop policy if exists "Authenticated admins can update responses" on public.satisfaction_responses;
drop policy if exists "Authenticated admins can delete responses" on public.satisfaction_responses;

drop policy if exists "Public can insert satisfaction answers" on public.satisfaction_answers;
drop policy if exists "Authenticated admins can view answers" on public.satisfaction_answers;
drop policy if exists "Authenticated admins can insert answers" on public.satisfaction_answers;
drop policy if exists "Authenticated admins can update answers" on public.satisfaction_answers;
drop policy if exists "Authenticated admins can delete answers" on public.satisfaction_answers;

drop policy if exists "Authenticated admins can view response events" on public.satisfaction_response_events;
drop policy if exists "Authenticated admins can insert response events" on public.satisfaction_response_events;
drop policy if exists "Authenticated admins can update response events" on public.satisfaction_response_events;
drop policy if exists "Authenticated admins can delete response events" on public.satisfaction_response_events;

create policy "Public can view active branches"
on public.branches
for select
to anon, authenticated
using (is_active = true);

create policy "Authenticated admins can view branches"
on public.branches
for select
to authenticated
using (true);

create policy "Authenticated admins can insert branches"
on public.branches
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update branches"
on public.branches
for update
to authenticated
using (true)
with check (true);

create policy "Public can view visible active staff"
on public.staff
for select
to anon, authenticated
using (
  is_active = true
  and is_visible_in_survey = true
  and exists (
    select 1
    from public.branches b
    where b.id = staff.branch_id
      and b.is_active = true
  )
);

create policy "Authenticated admins can view staff"
on public.staff
for select
to authenticated
using (true);

create policy "Authenticated admins can insert staff"
on public.staff
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update staff"
on public.staff
for update
to authenticated
using (true)
with check (true);

create policy "Public can view active open surveys"
on public.satisfaction_surveys
for select
to anon, authenticated
using (
  status = 'active'
  and current_date between start_date and end_date
);

create policy "Authenticated admins can view surveys"
on public.satisfaction_surveys
for select
to authenticated
using (true);

create policy "Authenticated admins can insert surveys"
on public.satisfaction_surveys
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update surveys"
on public.satisfaction_surveys
for update
to authenticated
using (true)
with check (true);

create policy "Public can view active questions for open surveys"
on public.satisfaction_questions
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.satisfaction_surveys s
    where s.id = satisfaction_questions.survey_id
      and s.status = 'active'
      and current_date between s.start_date and s.end_date
  )
);

create policy "Authenticated admins can view questions"
on public.satisfaction_questions
for select
to authenticated
using (true);

create policy "Authenticated admins can insert questions"
on public.satisfaction_questions
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update questions"
on public.satisfaction_questions
for update
to authenticated
using (true)
with check (true);

create policy "Public can view active options for open surveys"
on public.satisfaction_question_options
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.satisfaction_questions q
    join public.satisfaction_surveys s on s.id = q.survey_id
    where q.id = satisfaction_question_options.question_id
      and q.is_active = true
      and s.status = 'active'
      and current_date between s.start_date and s.end_date
  )
);

create policy "Authenticated admins can view question options"
on public.satisfaction_question_options
for select
to authenticated
using (true);

create policy "Authenticated admins can insert question options"
on public.satisfaction_question_options
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update question options"
on public.satisfaction_question_options
for update
to authenticated
using (true)
with check (true);

create policy "Public can insert satisfaction responses"
on public.satisfaction_responses
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.satisfaction_surveys s
    join public.branches b on b.id = satisfaction_responses.branch_id
    where s.id = satisfaction_responses.survey_id
      and s.status = 'active'
      and current_date between s.start_date and s.end_date
      and b.is_active = true
  )
);

create policy "Authenticated admins can view responses"
on public.satisfaction_responses
for select
to authenticated
using (true);

create policy "Authenticated admins can insert responses"
on public.satisfaction_responses
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update responses"
on public.satisfaction_responses
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete responses"
on public.satisfaction_responses
for delete
to authenticated
using (true);

create policy "Public can insert satisfaction answers"
on public.satisfaction_answers
for insert
to anon, authenticated
with check (
  public.can_submit_satisfaction_answer(response_id, question_id)
);

create policy "Authenticated admins can view answers"
on public.satisfaction_answers
for select
to authenticated
using (true);

create policy "Authenticated admins can insert answers"
on public.satisfaction_answers
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update answers"
on public.satisfaction_answers
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete answers"
on public.satisfaction_answers
for delete
to authenticated
using (true);

create policy "Authenticated admins can view response events"
on public.satisfaction_response_events
for select
to authenticated
using (true);

create policy "Authenticated admins can insert response events"
on public.satisfaction_response_events
for insert
to authenticated
with check (true);

create policy "Authenticated admins can update response events"
on public.satisfaction_response_events
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated admins can delete response events"
on public.satisfaction_response_events
for delete
to authenticated
using (true);

insert into public.branches (id, name, display_order, is_active)
values
  ('munjeong', '문정점', 1, true),
  ('dapsimni', '답십리점', 2, true),
  ('bulgwang', '불광점', 3, true)
on conflict (id) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

comment on table public.branches is 'Survey branch master data. Keep rows and set is_active=false for soft delete.';
comment on table public.staff is 'Survey staff master data. Keep rows and set is_active=false or is_visible_in_survey=false instead of deleting.';
comment on table public.satisfaction_surveys is 'Survey rounds. Use status changes instead of deleting historical rounds.';
comment on table public.satisfaction_questions is 'Survey questions. Keep rows and set is_active=false instead of deleting.';
comment on table public.satisfaction_question_options is 'Choice options. Keep rows and set is_active=false instead of deleting.';
comment on table public.satisfaction_answers is 'Survey answers with question, option, and staff snapshots for historical interpretation.';
comment on table public.satisfaction_response_events is 'Admin response status and processing event history.';
