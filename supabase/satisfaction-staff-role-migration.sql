-- Satisfaction staff role migration
-- Safe to run multiple times.
-- This only updates public.staff.role and replaces staff role check constraints.
-- It does not delete or modify satisfaction response/answer/event data or trainer-review tables.

begin;

-- Existing deployments may have a staff role check constraint with a different name.
-- Drop only CHECK constraints on public.staff whose definition references the role column.
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

-- Convert legacy UI role values before applying the new constraint.
update public.staff
set
  role = case
    when role = 'manager' then 'branch_manager'
    when role in ('info', 'cleaning', 'other') then 'weekend_part_timer'
    else role
  end,
  updated_at = now()
where role in ('manager', 'info', 'cleaning', 'other');

-- If any unexpected non-null legacy/custom role exists, normalize it so the
-- new constraint can be applied without deleting staff records.
update public.staff
set
  role = 'weekend_part_timer',
  updated_at = now()
where role is not null
  and role not in ('trainer', 'fc', 'branch_manager', 'pt_leader', 'weekend_part_timer');

-- Normalize empty roles as well so only the five supported role values remain.
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

commit;
