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

`pt_survey_submissions` 테이블은 앱 모델을 snake_case 컬럼으로 저장합니다.

```sql
create table if not exists pt_survey_submissions (
  id text primary key,
  survey_type text not null,
  source text not null,
  basic_info jsonb not null,
  body_info jsonb not null,
  fitness_experience text not null,
  goals jsonb not null,
  health jsonb not null,
  lifestyle jsonb not null,
  desired_exercises text not null,
  request_to_coach text not null,
  privacy_consent boolean not null,
  status text not null,
  submitted_at timestamptz not null
);
```
