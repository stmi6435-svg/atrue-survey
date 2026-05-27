drop policy if exists "Admin UI can delete trainer reviews" on public.trainer_reviews;

create policy "Admin UI can delete trainer reviews"
  on public.trainer_reviews
  for delete
  to anon, authenticated
  using (true);
