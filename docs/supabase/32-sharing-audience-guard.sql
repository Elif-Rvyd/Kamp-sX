-- Apply after SQL 29. Mirrors BOTH SELECT predicates from the supplied live posts policies.
-- No table/column/data changes; public Storage and existing post RLS are untouched.
begin;
set local lock_timeout='5s';
do $check$ begin
 if to_regprocedure('private.kx_profile_in_audience(uuid,uuid)') is null
   or to_regprocedure('private.kx_dm_share(uuid,uuid)') is null then
   raise exception 'Expected audience/messaging contract missing';
 end if;
end $check$;
create or replace function private.kx_post_readable(p_id uuid, viewer uuid) returns boolean
language sql stable security definer set search_path=public as $fn$
 select viewer is not null and exists(select 1 from public.posts p where p.id=p_id and p.deleted_at is null
   and private.kx_profile_in_audience(viewer,p.user_id)
   and (p.user_id=viewer or (p.archived_at is null and private.can_view_user_content(viewer,p.user_id))));
$fn$;
create or replace function private.kx_dm_share(conv uuid,target uuid) returns uuid
language plpgsql security definer set search_path=public as $fn$
declare result uuid;
begin
 if target is null then raise exception using errcode='42501',message='shared_post_unavailable'; end if;
 if not private.kx_dm_sendable(conv) then raise exception using errcode='42501',message='dm_unavailable'; end if;
 insert into public.messages(conversation_id,content,shared_post_id)
   values(conv,'Post shared',target) returning id into result;
 return result;
end $fn$;
revoke all on function private.kx_post_readable(uuid,uuid) from public,anon,authenticated;
revoke all on function private.kx_dm_share(uuid,uuid) from public,anon;
grant execute on function private.kx_dm_share(uuid,uuid) to authenticated;
create or replace function public.kx_social_release_version() returns bigint language sql immutable set search_path=public as $fn$ select 2026102204::bigint; $fn$;
notify pgrst,'reload schema';
commit;
select public.kx_social_release_version() as social_release_version;
