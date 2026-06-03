-- Satisfaction response delete policies for authenticated admins.
-- Safe to run multiple times.
-- This grants DELETE only to authenticated users for individual response cleanup.
-- It does not touch trainer-review tables and does not delete any data by itself.

begin;

drop policy if exists "Authenticated admins can delete response events" on public.satisfaction_response_events;
drop policy if exists "Authenticated admins can delete answers" on public.satisfaction_answers;
drop policy if exists "Authenticated admins can delete responses" on public.satisfaction_responses;

create policy "Authenticated admins can delete response events"
on public.satisfaction_response_events
for delete
to authenticated
using (true);

create policy "Authenticated admins can delete answers"
on public.satisfaction_answers
for delete
to authenticated
using (true);

create policy "Authenticated admins can delete responses"
on public.satisfaction_responses
for delete
to authenticated
using (true);

commit;
