-- Diagnostic query for staff_choice answer aggregation.
-- This is read-only. It does not modify satisfaction or trainer-review data.

select
  answer.id as answer_id,
  answer.response_id,
  answer.question_id,
  answer.staff_id,
  answer.staff_name_snapshot,
  answer.staff_role_snapshot,
  answer.question_text_snapshot,
  answer.question_type_snapshot,
  answer.choice_value,
  answer.option_text_snapshot,
  question.question_text as live_question_text,
  question.question_type as live_question_type,
  question.staff_choice_purpose,
  response.branch_id as response_branch_id,
  response.survey_id as response_survey_id,
  response.submitted_at,
  staff.name as live_staff_name,
  staff.role as live_staff_role,
  staff.is_active as live_staff_is_active,
  staff.is_visible_in_survey as live_staff_is_visible_in_survey
from public.satisfaction_answers as answer
left join public.satisfaction_questions as question
  on question.id = answer.question_id
left join public.satisfaction_responses as response
  on response.id = answer.response_id
left join public.staff as staff
  on staff.id = answer.staff_id
where
  answer.staff_name_snapshot ilike '%허진혁%'
  or staff.name ilike '%허진혁%'
  or answer.question_text_snapshot ilike '%친절%'
  or question.staff_choice_purpose = 'positive'
order by response.submitted_at desc nulls last, answer.created_at desc nulls last;
