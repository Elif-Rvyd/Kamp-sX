-- Additive production migration. No existing posts/messages/files are deleted.
-- Run the WHOLE file in djhezivksrvcyqxzpiau. Requires messaging migration 27.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $check$
begin
 if to_regprocedure('private.kx_dm_sendable(uuid)') is null
   or to_regprocedure('private.can_view_user_content(uuid,uuid)') is null
   or to_regprocedure('private.kx_profile_in_audience(uuid,uuid)') is null then
   raise exception 'Expected messaging/privacy contract missing; no changes applied';
 end if;
 if to_regclass('private.post_views') is not null and coalesce(obj_description(to_regclass('private.post_views'),'pg_class'),'')<>'KampusX unique views 2026102202' then
   raise exception 'An unrecognized view table already exists; inspect before installation';
 end if;
end $check$;
alter table public.messages add column if not exists shared_post_id uuid references public.posts(id) on delete set null;
alter table public.posts add column if not exists views_count bigint not null default 0;
grant select(views_count) on public.posts to authenticated;
-- Existing message INSERT/UPDATE grants are deliberately not widened.
create table if not exists private.post_views (
 post_id uuid not null references public.posts(id) on delete cascade,
 viewer_id uuid not null references auth.users(id) on delete cascade,
 viewed_at timestamptz not null default clock_timestamp(),
 primary key(post_id,viewer_id)
);
comment on table private.post_views is 'KampusX unique views 2026102202';
alter table private.post_views enable row level security;
revoke all on private.post_views from public,anon,authenticated;

create or replace function private.kx_post_readable(p_id uuid, viewer uuid) returns boolean
language sql stable security definer set search_path=public as $fn$
 select viewer is not null and exists(select 1 from public.posts p where p.id=p_id and p.deleted_at is null
   and private.kx_profile_in_audience(viewer,p.user_id)
   and (p.user_id=viewer or (p.archived_at is null and private.can_view_user_content(viewer,p.user_id))));
$fn$;
create or replace function private.kx_view_totals(p_ids uuid[], record_view boolean)
returns table(post_id uuid,views_count bigint) language plpgsql security definer set search_path=public as $fn$
declare target uuid; actor uuid := (select auth.uid()); owner uuid;
begin
 if actor is null or cardinality(p_ids)>50 then raise exception using errcode='42501',message='views_unavailable'; end if;
 for target in select distinct unnest(p_ids) loop
   if private.kx_post_readable(target,actor) then
     select user_id into owner from public.posts where id=target;
     if record_view and owner<>actor then
       insert into private.post_views(post_id,viewer_id) values(target,actor) on conflict do nothing;
       if found then update public.posts p set views_count=p.views_count+1 where p.id=target; end if;
     end if;
     return query select p.id,p.views_count from public.posts p where p.id=target;
   end if;
 end loop;
end $fn$;
create or replace function public.kx_record_post_views(p_ids uuid[]) returns table(post_id uuid,views_count bigint)
language sql security invoker set search_path=public as $fn$ select * from private.kx_view_totals(p_ids,true); $fn$;
create or replace function public.kx_get_post_views(p_ids uuid[]) returns table(post_id uuid,views_count bigint)
language sql stable security invoker set search_path=public as $fn$ select * from private.kx_view_totals(p_ids,false); $fn$;

create or replace function private.kx_dm_shared_guard() returns trigger
language plpgsql security definer set search_path=public as $fn$
declare peer uuid;
begin
 if new.shared_post_id is null then return new; end if;
 select case when c.user_a=(select auth.uid()) then c.user_b else c.user_a end into peer
   from public.conversations c where c.id=new.conversation_id and (select auth.uid()) in(c.user_a,c.user_b);
 if not private.kx_dm_sendable(new.conversation_id)
   or not private.kx_post_readable(new.shared_post_id,(select auth.uid()))
   or not private.kx_post_readable(new.shared_post_id,peer)
   or exists(select 1 from public.posts p where p.id=new.shared_post_id and p.archived_at is not null) then
   raise exception using errcode='42501',message='shared_post_unavailable';
 end if;
 return new;
end $fn$;
drop trigger if exists kx_dm_shared_guard on public.messages;
create trigger kx_dm_shared_guard before insert on public.messages for each row execute function private.kx_dm_shared_guard();
create or replace function private.kx_dm_share(conv uuid,target uuid) returns uuid
language plpgsql security definer set search_path=public as $fn$
declare result uuid;
begin
 if target is null then raise exception using errcode='42501',message='shared_post_unavailable'; end if;
 if not private.kx_dm_sendable(conv) then raise exception using errcode='42501',message='dm_unavailable'; end if;
 -- Existing message guard fills sender/time and takes the follow/block locks. The new guard
 -- checks both viewers. Only the pointer is shared; no post text/media is copied into a message.
 insert into public.messages(conversation_id,content,shared_post_id)
   values(conv,'Post shared',target) returning id into result;
 return result;
end $fn$;
create or replace function public.kx_share_post(conv uuid,target uuid) returns uuid
language sql security invoker set search_path=public as $fn$ select private.kx_dm_share(conv,target); $fn$;

-- V2 adds a typed preview field while preserving kx_inbox() for older clients.
create or replace function private.kx_dm_inbox_v2() returns table(
 conversation_id uuid,peer_id uuid,peer_username text,peer_full_name text,peer_avatar_url text,
 last_content text,last_created_at timestamptz,last_deleted_at timestamptz,unread_count bigint,can_send boolean,last_shared_post_id uuid
) language sql stable security definer set search_path=public as $fn$
 select c.id,p.user_id,p.username,p.full_name,p.avatar_url,m.content,m.created_at,m.deleted_at,
 (select count(*) from public.messages u where u.conversation_id=c.id and u.sender_id<>(select auth.uid())
  and u.deleted_at is null and u.created_at>coalesce(case when c.user_a=(select auth.uid()) then c.user_a_last_read_at else c.user_b_last_read_at end,'-infinity'::timestamptz)),
 private.kx_dm_allowed(p.user_id),m.shared_post_id
 from public.conversations c join public.profiles p
 on p.user_id=case when c.user_a=(select auth.uid()) then c.user_b else c.user_a end
 left join lateral(select content,created_at,deleted_at,shared_post_id from public.messages
   where conversation_id=c.id order by created_at desc,id desc limit 1) m on true
 where (select auth.uid()) in(c.user_a,c.user_b) and not private.is_blocked(c.user_a,c.user_b)
 order by c.last_message_at desc nulls last,c.id;
$fn$;
create or replace function public.kx_inbox_v2() returns table(
 conversation_id uuid,peer_id uuid,peer_username text,peer_full_name text,peer_avatar_url text,
 last_content text,last_created_at timestamptz,last_deleted_at timestamptz,unread_count bigint,can_send boolean,last_shared_post_id uuid
) language sql stable security invoker set search_path=public as $fn$ select * from private.kx_dm_inbox_v2(); $fn$;
create or replace function public.kx_social_release_version() returns bigint language sql immutable set search_path=public as $fn$ select 2026102204::bigint; $fn$;
do $acl$
declare f record;
begin
 for f in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where(n.nspname='private' and p.proname in('kx_post_readable','kx_view_totals','kx_dm_shared_guard','kx_dm_share','kx_dm_inbox_v2'))
 or(n.nspname='public' and p.proname in('kx_record_post_views','kx_get_post_views','kx_share_post','kx_inbox_v2','kx_social_release_version')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname not in('kx_dm_shared_guard','kx_post_readable') then execute format('grant execute on function %s to authenticated',f.signature); end if;
 end loop;
end $acl$;
notify pgrst,'reload schema';
commit;
select public.kx_social_release_version() as social_release_version;
