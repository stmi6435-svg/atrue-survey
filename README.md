# 어트루짐 PT 사전 설문 웹앱

Next.js App Router, TypeScript, Tailwind CSS 기반의 어트루짐 PT 사전 설문 웹앱입니다.

## 실행

```bash
npm install
npm run dev
```

- 설문: `http://localhost:3000`
- 관리자: `http://localhost:3000/admin`

## Supabase 환경 변수

`.env.local`에 아래 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## 구조

- `features/survey`: 설문 타입, 선택지, Step Form UI
- `features/admin`: 관리자 목록 UI
- `lib/supabase.ts`: Supabase client 생성
- `lib/storage`: Supabase 기반 저장소 adapter

## Supabase 테이블 컬럼

`pt_survey_submissions` 테이블은 설문 데이터를 평평한 컬럼 구조로 저장합니다.

```sql
create table if not exists pt_survey_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  survey_type text not null,
  referral_source text not null,
  name text not null,
  phone text not null,
  age integer not null,
  job text not null,
  hobby text not null,
  gender text not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  fitness_experience text not null,
  goals jsonb not null,
  pain_areas jsonb not null,
  diseases jsonb not null,
  medical_restriction boolean not null,
  medical_restriction_detail text not null default '',
  activity_level text not null,
  sleep_hours text not null,
  stress_level text not null,
  meal_regularity text not null,
  weekly_workout_count text not null,
  preferred_time_zone text not null,
  preferred_time_1 text not null,
  preferred_time_2 text not null,
  want_to_learn text not null,
  request_to_consultant text not null,
  privacy_agreed boolean not null,
  status text not null default '신규'
);
```
