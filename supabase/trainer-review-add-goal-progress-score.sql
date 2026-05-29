alter table public.trainer_reviews
  add column if not exists goal_progress_score integer;

update public.trainer_reviews
set goal_progress_score = 3
where goal_progress_score is null;

alter table public.trainer_reviews
  alter column goal_progress_score set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trainer_reviews_goal_progress_score_check'
  ) then
    alter table public.trainer_reviews
      add constraint trainer_reviews_goal_progress_score_check
      check (goal_progress_score between 1 and 5);
  end if;
end $$;

drop policy if exists "Public can submit trainer reviews" on public.trainer_reviews;

create policy "Public can submit trainer reviews"
  on public.trainer_reviews
  for insert
  to anon, authenticated
  with check (
    routine_delivery_score between 1 and 5
    and session_log_score between 1 and 5
    and kindness_score between 1 and 5
    and schedule_coordination_score between 1 and 5
    and goal_progress_score between 1 and 5
  );
