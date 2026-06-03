-- Satisfaction survey test seed data
-- Safe to run multiple times. This does not touch trainer-review tables or response data.

begin;

insert into public.branches (id, name, display_order, is_active)
values
  ('munjeong', '문정점', 1, true),
  ('dapsimni', '답십리역점', 2, true),
  ('bulgwang', '불광역점', 3, true)
on conflict (id) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.staff (
  id,
  branch_id,
  name,
  role,
  display_order,
  is_active,
  is_visible_in_survey
)
values
  ('00000000-0000-4000-8000-000000000101', 'munjeong', '문정 테스트 트레이너', 'trainer', 1, true, true),
  ('00000000-0000-4000-8000-000000000102', 'munjeong', '문정 테스트 FC', 'fc', 2, true, true),
  ('00000000-0000-4000-8000-000000000201', 'dapsimni', '답십리 테스트 지점장', 'branch_manager', 1, true, true),
  ('00000000-0000-4000-8000-000000000202', 'dapsimni', '답십리 테스트 PT 팀장', 'pt_leader', 2, true, true),
  ('00000000-0000-4000-8000-000000000301', 'bulgwang', '불광 테스트 주말 알바', 'weekend_part_timer', 1, true, true),
  ('00000000-0000-4000-8000-000000000302', 'bulgwang', '불광 테스트 트레이너', 'trainer', 2, true, true)
on conflict (id) do update
set
  branch_id = excluded.branch_id,
  name = excluded.name,
  role = excluded.role,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  is_visible_in_survey = excluded.is_visible_in_survey,
  updated_at = now();

insert into public.satisfaction_surveys (
  id,
  title,
  year,
  quarter,
  start_date,
  end_date,
  status
)
values (
  '10000000-0000-4000-8000-000000000001',
  '2026년 2분기 회원 만족도 조사',
  2026,
  2,
  '2026-06-01',
  '2026-06-30',
  'active'
)
on conflict (id) do update
set
  title = excluded.title,
  year = excluded.year,
  quarter = excluded.quarter,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  updated_at = now();

insert into public.satisfaction_questions (
  id,
  survey_id,
  category,
  question_text,
  question_type,
  staff_choice_purpose,
  is_required,
  is_active,
  is_core_metric,
  display_order,
  placeholder
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'cleanliness',
    '센터 청결 상태에 얼마나 만족하시나요?',
    'rating',
    null,
    true,
    true,
    true,
    1,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'kindness',
    '직원 응대 친절도에 얼마나 만족하시나요?',
    'rating',
    null,
    true,
    true,
    true,
    2,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'facility',
    '운동 시설 및 장비 상태에 얼마나 만족하시나요?',
    'rating',
    null,
    true,
    true,
    true,
    3,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'intention',
    '앞으로도 계속 이용하실 의향이 있으신가요?',
    'single_choice',
    null,
    true,
    true,
    false,
    4,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'intention',
    '지인에게 추천하실 의향이 있으신가요?',
    'single_choice',
    null,
    true,
    true,
    false,
    5,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    'facility',
    '가장 만족스러운 부분은 무엇인가요?',
    'multiple_choice',
    null,
    true,
    true,
    false,
    6,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    'facility',
    '센터 음악 볼륨은 어떠셨나요?',
    'single_choice',
    null,
    true,
    true,
    false,
    7,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    'kindness',
    '가장 친절하다고 느낀 직원은 누구인가요?',
    'staff_choice',
    'positive',
    false,
    true,
    false,
    8,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000001',
    'kindness',
    '가장 개선이 필요하다고 느낀 직원은 누구인가요?',
    'staff_choice',
    'improvement',
    false,
    true,
    false,
    9,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000001',
    'free_text',
    '한 줄로 남기고 싶은 의견이 있다면 적어주세요.',
    'text_short',
    null,
    false,
    true,
    false,
    10,
    '예: 직원분들이 친절해서 좋았어요.'
  ),
  (
    '11000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000001',
    'free_text',
    '센터 이용 중 개선되었으면 하는 점을 자유롭게 적어주세요.',
    'text_long',
    null,
    false,
    true,
    false,
    11,
    '자유롭게 의견을 남겨주세요.'
  )
on conflict (id) do update
set
  survey_id = excluded.survey_id,
  category = excluded.category,
  question_text = excluded.question_text,
  question_type = excluded.question_type,
  staff_choice_purpose = excluded.staff_choice_purpose,
  is_required = excluded.is_required,
  is_active = excluded.is_active,
  is_core_metric = excluded.is_core_metric,
  display_order = excluded.display_order,
  placeholder = excluded.placeholder,
  updated_at = now();

insert into public.satisfaction_question_options (
  id,
  question_id,
  option_text,
  option_value,
  display_order,
  is_active
)
values
  (
    '12000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000006',
    '청결 상태',
    'cleanliness',
    1,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000006',
    '직원 친절',
    'kindness',
    2,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000003',
    '11000000-0000-4000-8000-000000000006',
    '운동 시설 및 장비',
    'facility',
    3,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000004',
    '11000000-0000-4000-8000-000000000006',
    '위치 및 접근성',
    'location',
    4,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000005',
    '11000000-0000-4000-8000-000000000006',
    '운동 프로그램',
    'program',
    5,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000006',
    '11000000-0000-4000-8000-000000000006',
    '기타',
    'other',
    6,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000101',
    '11000000-0000-4000-8000-000000000004',
    '매우 그렇다',
    'very_likely',
    1,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000102',
    '11000000-0000-4000-8000-000000000004',
    '그렇다',
    'likely',
    2,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000103',
    '11000000-0000-4000-8000-000000000004',
    '보통이다',
    'neutral',
    3,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000104',
    '11000000-0000-4000-8000-000000000004',
    '그렇지 않다',
    'unlikely',
    4,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000105',
    '11000000-0000-4000-8000-000000000004',
    '전혀 그렇지 않다',
    'very_unlikely',
    5,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000201',
    '11000000-0000-4000-8000-000000000005',
    '매우 추천하고 싶다',
    'very_likely',
    1,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000202',
    '11000000-0000-4000-8000-000000000005',
    '추천하고 싶다',
    'likely',
    2,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000203',
    '11000000-0000-4000-8000-000000000005',
    '보통이다',
    'neutral',
    3,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000204',
    '11000000-0000-4000-8000-000000000005',
    '추천하기 어렵다',
    'unlikely',
    4,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000205',
    '11000000-0000-4000-8000-000000000005',
    '전혀 추천하지 않겠다',
    'very_unlikely',
    5,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000301',
    '11000000-0000-4000-8000-000000000007',
    '너무 작다',
    'too_low',
    1,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000302',
    '11000000-0000-4000-8000-000000000007',
    '적당하다',
    'good',
    2,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000303',
    '11000000-0000-4000-8000-000000000007',
    '너무 크다',
    'too_high',
    3,
    true
  ),
  (
    '12000000-0000-4000-8000-000000000304',
    '11000000-0000-4000-8000-000000000007',
    '잘 모르겠다',
    'not_sure',
    4,
    true
  )
on conflict (id) do update
set
  question_id = excluded.question_id,
  option_text = excluded.option_text,
  option_value = excluded.option_value,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

commit;
