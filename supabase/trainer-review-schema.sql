create extension if not exists "pgcrypto";

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  branch text not null check (branch in ('munjeong', 'dapsimni', 'bulgwang')),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists trainers_branch_active_idx
  on public.trainers (branch, is_active, created_at);

create table if not exists public.trainer_reviews (
  id uuid primary key default gen_random_uuid(),
  branch text not null check (branch in ('munjeong', 'dapsimni', 'bulgwang')),
  trainer_id uuid references public.trainers(id) on delete set null,
  trainer_name text not null,
  member_name text,
  phone_last4 text check (phone_last4 is null or phone_last4 ~ '^[0-9]{4}$'),
  pt_session_count integer check (pt_session_count is null or pt_session_count >= 0),
  routine_delivery_score integer not null check (routine_delivery_score between 1 and 5),
  session_log_score integer not null check (session_log_score between 1 and 5),
  kindness_score integer not null check (kindness_score between 1 and 5),
  improvement_feedback text,
  created_at timestamptz not null default now()
);

create index if not exists trainer_reviews_branch_trainer_idx
  on public.trainer_reviews (branch, trainer_id, created_at desc);

create index if not exists trainer_reviews_created_at_idx
  on public.trainer_reviews (created_at desc);

alter table public.trainers enable row level security;
alter table public.trainer_reviews enable row level security;

drop policy if exists "Public can view active trainers" on public.trainers;
drop policy if exists "Admin UI can insert trainers" on public.trainers;
drop policy if exists "Admin UI can update trainers" on public.trainers;
drop policy if exists "Public can submit trainer reviews" on public.trainer_reviews;
drop policy if exists "Admin UI can view trainer reviews" on public.trainer_reviews;

create policy "Public can view active trainers"
  on public.trainers
  for select
  to anon, authenticated
  using (is_active = true);

-- NEXT_PUBLIC_ADMIN_PASSWORD protects the admin UI route.
-- For a stricter production setup, move admin mutations behind server API routes with a service role key.
create policy "Admin UI can insert trainers"
  on public.trainers
  for insert
  to anon, authenticated
  with check (true);

create policy "Admin UI can update trainers"
  on public.trainers
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Public can submit trainer reviews"
  on public.trainer_reviews
  for insert
  to anon, authenticated
  with check (
    routine_delivery_score between 1 and 5
    and session_log_score between 1 and 5
    and kindness_score between 1 and 5
  );

create policy "Admin UI can view trainer reviews"
  on public.trainer_reviews
  for select
  to anon, authenticated
  using (true);
