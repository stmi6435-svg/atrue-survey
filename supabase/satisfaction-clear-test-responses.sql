-- Clear satisfaction survey test response data only.
-- Keeps branches, staff, surveys, questions, and options intact.
-- Does not touch trainer-review tables.
--
-- Scope:
-- - Deletes responses linked to the seeded test survey id.
-- - Seeded test survey id: 10000000-0000-4000-8000-000000000001

begin;

create temporary table satisfaction_test_response_ids_to_delete (
  id uuid primary key
) on commit drop;

insert into satisfaction_test_response_ids_to_delete (id)
select response.id
from public.satisfaction_responses as response
where response.survey_id = '10000000-0000-4000-8000-000000000001';

delete from public.satisfaction_response_events as event
using satisfaction_test_response_ids_to_delete as target
where event.response_id = target.id;

delete from public.satisfaction_answers as answer
using satisfaction_test_response_ids_to_delete as target
where answer.response_id = target.id;

delete from public.satisfaction_responses as response
using satisfaction_test_response_ids_to_delete as target
where response.id = target.id;

commit;
