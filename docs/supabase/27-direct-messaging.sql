-- KampüsX direct messages, 22 October 2026. Run the WHOLE file in project djhezivksrvcyqxzpiau.
-- Adds only the two requested DM tables. Existing profiles/follows/blocks and Storage are unchanged.
-- Re-running preserves messages. Rollback disables the feature without deleting its data.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $preflight$
begin
  if to_regclass('public.profiles') is null or to_regclass('public.follows') is null
     or to_regclass('public.blocks') is null
     or to_regprocedure('private.is_blocked(uuid,uuid)') is null
     or to_regprocedure('private.kx_follow_pair_lock(uuid,uuid)') is null then
    raise exception 'DM prerequisites missing. Check the project; no changes applied.';
  end if;
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
    raise exception 'supabase_realtime publication missing; no changes applied.';
  end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('conversations','messages')
      and coalesce(obj_description(c.oid,'pg_class'),'') <> 'KampusX DM contract 2026102201') then
    raise exception 'Unrecognized DM tables already exist. Inspect their contract before installing.';
  end if;
end
$preflight$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  user_a_last_read_at timestamptz,
  user_b_last_read_at timestamptz,
  constraint kx_dm_canonical_pair check(user_a < user_b),
  constraint kx_dm_one_pair unique(user_a,user_b)
);
comment on table public.conversations is 'KampusX DM contract 2026102201';
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint kx_dm_content check (
    (deleted_at is null and char_length(content) between 1 and 2000 and content ~ '[^[:space:]]')
    or (deleted_at is not null and content='')
  )
);
comment on table public.messages is 'KampusX DM contract 2026102201';
create index if not exists kx_dm_messages_page on public.messages(conversation_id,created_at desc,id desc);
create index if not exists kx_dm_conversations_b on public.conversations(user_b);
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- These are NEW tables: remove Supabase default broad grants before exposing their narrow API.
revoke all on public.conversations,public.messages from public,anon,authenticated;
grant select on public.conversations,public.messages to authenticated;
grant insert(conversation_id,content),update(deleted_at) on public.messages to authenticated;
grant usage on schema private to authenticated;

-- The caller is always auth.uid(); no arbitrary viewer argument is exposed to the API.
create or replace function private.kx_dm_allowed(other uuid) returns boolean
language sql stable security definer set search_path=public as $fn$
  select (select auth.uid()) is not null and other is not null
    and other <> (select auth.uid())
    and not private.is_blocked((select auth.uid()),other)
    and exists(select 1 from public.follows f where f.status='accepted' and
      ((f.follower_id=(select auth.uid()) and f.following_id=other)
       or (f.following_id=(select auth.uid()) and f.follower_id=other)));
$fn$;
create or replace function private.kx_dm_member(conv uuid) returns boolean
language sql stable security definer set search_path=public as $fn$
  select exists(select 1 from public.conversations c where c.id=conv
    and (select auth.uid()) in (c.user_a,c.user_b)
    and not private.is_blocked(c.user_a,c.user_b));
$fn$;
create or replace function private.kx_dm_sendable(conv uuid) returns boolean
language sql stable security definer set search_path=public as $fn$
  select exists(select 1 from public.conversations c where c.id=conv
    and (select auth.uid()) in (c.user_a,c.user_b)
    and private.kx_dm_allowed(case when c.user_a=(select auth.uid()) then c.user_b else c.user_a end));
$fn$;

drop policy if exists kx_dm_conversations_read on public.conversations;
create policy kx_dm_conversations_read on public.conversations for select to authenticated
  using(private.kx_dm_member(id));
drop policy if exists kx_dm_messages_read on public.messages;
create policy kx_dm_messages_read on public.messages for select to authenticated
  using(private.kx_dm_member(conversation_id));
drop policy if exists kx_dm_messages_send on public.messages;
create policy kx_dm_messages_send on public.messages for insert to authenticated
  with check(sender_id=(select auth.uid()) and deleted_at is null and private.kx_dm_sendable(conversation_id));
drop policy if exists kx_dm_messages_delete on public.messages;
create policy kx_dm_messages_delete on public.messages for update to authenticated
  using(sender_id=(select auth.uid()) and deleted_at is null and private.kx_dm_member(conversation_id))
  with check(sender_id=(select auth.uid()) and private.kx_dm_member(conversation_id));

-- Serialize with existing Part A block/start operations. Lock the accepted follow row as well:
-- a concurrent unfollow must finish before authorization or wait for this message to commit.
create or replace function private.kx_dm_lock_permission(peer uuid) returns void
language plpgsql security definer set search_path=public as $fn$
begin
  if peer is null or (select auth.uid()) is null or peer=(select auth.uid()) then
    raise exception using message='dm_unavailable',errcode='42501';
  end if;
  perform private.kx_follow_pair_lock((select auth.uid()),peer);
  perform 1 from public.follows f where f.status='accepted' and
    ((f.follower_id=(select auth.uid()) and f.following_id=peer)
    or (f.following_id=(select auth.uid()) and f.follower_id=peer))
    order by f.follower_id,f.following_id for share;
  if not found or private.is_blocked((select auth.uid()),peer) then
    raise exception using message='dm_unavailable',errcode='42501';
  end if;
end
$fn$;
create or replace function private.kx_dm_message_guard() returns trigger
language plpgsql security definer set search_path=public as $fn$
declare peer uuid;
begin
  if tg_op='INSERT' then
    select case when c.user_a=(select auth.uid()) then c.user_b else c.user_a end into peer
      from public.conversations c where c.id=new.conversation_id
      and (select auth.uid()) in (c.user_a,c.user_b);
    perform private.kx_dm_lock_permission(peer);
    new.sender_id := (select auth.uid());
    new.created_at := clock_timestamp();
    new.deleted_at := null;
  else
    if old.sender_id is distinct from (select auth.uid()) or old.deleted_at is not null
       or not private.kx_dm_member(old.conversation_id) then
      raise exception using message='dm_unavailable',errcode='42501';
    end if;
    if new.id is distinct from old.id or new.conversation_id is distinct from old.conversation_id
       or new.sender_id is distinct from old.sender_id or new.created_at is distinct from old.created_at
       or new.content is distinct from old.content or new.deleted_at is null then
      raise exception using message='dm_invalid_update',errcode='42501';
    end if;
    new.content := '';
    new.deleted_at := clock_timestamp();
  end if;
  return new;
end
$fn$;
drop trigger if exists kx_dm_message_guard on public.messages;
create trigger kx_dm_message_guard before insert or update on public.messages
  for each row execute function private.kx_dm_message_guard();
create or replace function private.kx_dm_activity() returns trigger
language plpgsql security definer set search_path=public as $fn$
begin
  update public.conversations set last_message_at=greatest(last_message_at,new.created_at)
    where id=new.conversation_id;
  return null;
end
$fn$;
drop trigger if exists kx_dm_activity on public.messages;
create trigger kx_dm_activity after insert on public.messages for each row execute function private.kx_dm_activity();

create or replace function private.kx_dm_start(other uuid) returns uuid
language plpgsql security definer set search_path=public as $fn$
declare result uuid; a uuid; b uuid;
begin
  perform private.kx_dm_lock_permission(other);
  a := least((select auth.uid()),other); b := greatest((select auth.uid()),other);
  insert into public.conversations(user_a,user_b) values(a,b)
    on conflict(user_a,user_b) do nothing returning id into result;
  if result is null then select id into result from public.conversations where user_a=a and user_b=b; end if;
  return result;
end
$fn$;
create or replace function public.kx_can_message(other uuid) returns boolean
language sql stable security invoker set search_path=public as $fn$ select private.kx_dm_allowed(other); $fn$;
create or replace function public.kx_start_conversation(other uuid) returns uuid
language sql security invoker set search_path=public as $fn$ select private.kx_dm_start(other); $fn$;

create or replace function private.kx_dm_inbox() returns table(
  conversation_id uuid,peer_id uuid,peer_username text,peer_full_name text,peer_avatar_url text,
  last_content text,last_created_at timestamptz,last_deleted_at timestamptz,unread_count bigint,can_send boolean
) language sql stable security definer set search_path=public as $fn$
  select c.id,p.user_id,p.username,p.full_name,p.avatar_url,m.content,m.created_at,m.deleted_at,
    (select count(*) from public.messages u where u.conversation_id=c.id and u.sender_id<>(select auth.uid())
      and u.deleted_at is null and u.created_at>coalesce(
        case when c.user_a=(select auth.uid()) then c.user_a_last_read_at else c.user_b_last_read_at end,'-infinity'::timestamptz)),
    private.kx_dm_allowed(p.user_id)
  from public.conversations c
  join public.profiles p on p.user_id=case when c.user_a=(select auth.uid()) then c.user_b else c.user_a end
  left join lateral(select content,created_at,deleted_at from public.messages
    where conversation_id=c.id order by created_at desc,id desc limit 1) m on true
  where (select auth.uid()) in(c.user_a,c.user_b) and not private.is_blocked(c.user_a,c.user_b)
  order by c.last_message_at desc nulls last,c.id;
$fn$;
create or replace function public.kx_inbox() returns table(
  conversation_id uuid,peer_id uuid,peer_username text,peer_full_name text,peer_avatar_url text,
  last_content text,last_created_at timestamptz,last_deleted_at timestamptz,unread_count bigint,can_send boolean
) language sql stable security invoker set search_path=public as $fn$ select * from private.kx_dm_inbox(); $fn$;
create or replace function private.kx_dm_read(conv uuid) returns boolean
language plpgsql security definer set search_path=public as $fn$
begin
  if not private.kx_dm_member(conv) then raise exception using message='dm_unavailable',errcode='42501'; end if;
  update public.conversations set
    user_a_last_read_at=case when user_a=(select auth.uid()) then greatest(user_a_last_read_at,clock_timestamp()) else user_a_last_read_at end,
    user_b_last_read_at=case when user_b=(select auth.uid()) then greatest(user_b_last_read_at,clock_timestamp()) else user_b_last_read_at end
    where id=conv and (select auth.uid()) in(user_a,user_b);
  return found;
end
$fn$;
create or replace function public.kx_mark_read(conv uuid) returns boolean
language sql security invoker set search_path=public as $fn$ select private.kx_dm_read(conv); $fn$;
create or replace function public.kx_messaging_version() returns bigint
language sql immutable security invoker set search_path=public as $fn$ select 2026102201::bigint; $fn$;

-- Explicit allowlist, including wrappers: no PUBLIC/anon execution and no client trigger execution.
do $acl$
declare f record;
begin
  for f in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='private' and p.proname in('kx_dm_allowed','kx_dm_member','kx_dm_sendable','kx_dm_lock_permission',
      'kx_dm_message_guard','kx_dm_activity','kx_dm_start','kx_dm_inbox','kx_dm_read'))
    or(n.nspname='public' and p.proname in('kx_can_message','kx_start_conversation','kx_inbox','kx_mark_read','kx_messaging_version'))
  loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    if f.proname not in('kx_dm_message_guard','kx_dm_activity','kx_dm_lock_permission') then
      execute format('grant execute on function %s to authenticated',f.signature);
    end if;
  end loop;
end
$acl$;
do $realtime$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$realtime$;
notify pgrst,'reload schema';
commit;
select public.kx_messaging_version() as messaging_contract_version;
