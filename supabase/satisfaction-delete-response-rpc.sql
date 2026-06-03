-- Authenticated admin RPC for deleting one satisfaction response.
-- Safe to run multiple times.
-- Deletes only the requested satisfaction response and its child rows.
-- Does not touch trainer-review tables.

begin;

drop function if exists public.delete_satisfaction_response(uuid);

create function public.delete_satisfaction_response(p_response_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_response_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    raise exception 'authenticated role required'
      using errcode = '42501';
  end if;

  delete from public.satisfaction_response_events
  where response_id = p_response_id;

  delete from public.satisfaction_answers
  where response_id = p_response_id;

  delete from public.satisfaction_responses
  where id = p_response_id;

  get diagnostics deleted_response_count = row_count;

  return jsonb_build_object(
    'success', deleted_response_count > 0,
    'response_id', p_response_id,
    'deleted_count', deleted_response_count
  );
end;
$$;

revoke all on function public.delete_satisfaction_response(uuid) from public;
revoke execute on function public.delete_satisfaction_response(uuid) from anon;
grant execute on function public.delete_satisfaction_response(uuid) to authenticated;

commit;
