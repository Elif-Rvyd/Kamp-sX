-- KampüsX / Parça A. Gerçek public.follows tablosunu kullanır; tablo/sütun/veri oluşturmaz.
-- SQL Editor'da tek parça çalıştırın. Önce migration, sonra frontend dağıtımı.
-- Mevcut ilişkilerin status değerlerine dokunmaz. uploads/Auth/posts ayarlarını değiştirmez.
-- Onaylanan taşıma: yalnızca iki katılımcıya private Broadcast; genel DELETE yayını yok.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regclass('public.follows') is null
    or to_regclass('public.profiles') is null
    or to_regclass('public.blocks') is null
    or to_regprocedure('private.is_blocked(uuid,uuid)') is null
    or to_regprocedure('realtime.send(jsonb,text,text,boolean)') is null then
    raise exception 'Adım 1/2 veya Realtime hazır değil. Değişiklik yapılmadı.';
  end if;
  if exists (
    select 1 from pg_catalog.pg_publication_tables
    where schemaname = 'public' and tablename = 'follows'
  ) then
    raise exception 'follows genel yayında. Gizli DELETE olayları için yayın ayarını inceleyin; değişiklik yapılmadı.';
  end if;
  if not exists (select 1 from pg_catalog.pg_class where oid='public.follows'::regclass and relrowsecurity)
    or not exists (select 1 from pg_catalog.pg_class where oid='public.profiles'::regclass and relrowsecurity)
    or not exists (select 1 from pg_catalog.pg_class where oid='realtime.messages'::regclass and relrowsecurity) then
    raise exception 'RLS açık olmalı. Değişiklik yapılmadı.';
  end if;
  if exists (select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='follows'
    and policyname not in ('follows_accept','follows_insert_not_blocked','follows_remove_follower',
      'follows_select','kendi takibini ekler','kendi takibini siler',
      'kx_follows_select','kx_follows_insert','kx_follows_accept','kx_follows_delete')) then
    raise exception 'Beklenmeyen follows policy bulundu. Önce inceleyin; değişiklik yapılmadı.';
  end if;
end $$;

create or replace function private.kx_follow_pair_lock(a uuid, b uuid)
returns void language sql volatile security definer set search_path = public as $$
  select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(a::text,b::text) || ':' || greatest(a::text,b::text), 0));
$$;
revoke all on function private.kx_follow_pair_lock(uuid,uuid) from public, anon, authenticated;

create or replace function private.kx_follow_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor uuid := (select auth.uid()); target_private boolean;
begin
  if actor is null then raise insufficient_privilege using message='follow_session_required'; end if;
  if tg_op = 'UPDATE' then
    if new.follower_id is distinct from old.follower_id
      or new.following_id is distinct from old.following_id
      or new.created_at is distinct from old.created_at then
      raise insufficient_privilege using message='follow_identity_immutable';
    end if;
    if actor <> old.following_id or old.status <> 'pending' or new.status <> 'accepted' then
      raise insufficient_privilege using message='follow_accept_owner_required';
    end if;
  elsif actor <> new.follower_id then
    raise insufficient_privilege using message='follow_owner_required';
  end if;
  if new.follower_id = new.following_id then
    raise check_violation using message='follow_self_forbidden';
  end if;
  perform private.kx_follow_pair_lock(new.follower_id,new.following_id);
  if private.is_blocked(new.follower_id,new.following_id) then
    raise insufficient_privilege using message='follow_unavailable';
  end if;
  if tg_op = 'INSERT' then
    select p.is_private into target_private from public.profiles p
      where p.user_id=new.following_id for share;
    if not found then raise foreign_key_violation using message='follow_unavailable'; end if;
    new.status := case when target_private then 'pending' else 'accepted' end;
    new.created_at := statement_timestamp();
  end if;
  return new;
end $$;
revoke all on function private.kx_follow_guard() from public, anon, authenticated;

-- İlk kurulumdaki policy/ACL durumunu aynı fonksiyonun metadata yorumunda tutar.
-- Tekrar çalıştırıldığında ilk snapshot korunur. Kullanıcı verisi içermez.
do $$
declare restore_sql text; original_policies text; grants_sql text; profile_revoke text;
begin
  if obj_description('private.kx_follow_guard()'::regprocedure,'pg_proc') is not null then return; end if;
  select string_agg(format('create policy %I on public.follows as %s for %s to %s%s%s;',
    p.policyname,p.permissive,p.cmd,
    (select string_agg(case when r='public' then 'public' else quote_ident(r) end,',') from unnest(p.roles) r),
    case when p.qual is null then '' else ' using ('||p.qual||')' end,
    case when p.with_check is null then '' else ' with check ('||p.with_check||')' end),E'\n' order by p.policyname)
    into original_policies from pg_catalog.pg_policies p where p.schemaname='public' and p.tablename='follows';
  select string_agg(s,E'\n') into grants_sql from (
    select format('grant %s on public.follows to %s%s;',x.privilege_type,
      case when x.grantee=0 then 'public' else quote_ident(pg_get_userbyid(x.grantee)) end,
      case when x.is_grantable then ' with grant option' else '' end) s
    from pg_catalog.pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
    where c.oid='public.follows'::regclass and (x.grantee=0 or pg_get_userbyid(x.grantee) in ('anon','authenticated'))
    union all
    select format('grant %s (%I) on public.follows to %s%s;',x.privilege_type,a.attname,
      case when x.grantee=0 then 'public' else quote_ident(pg_get_userbyid(x.grantee)) end,
      case when x.is_grantable then ' with grant option' else '' end)
    from pg_catalog.pg_attribute a cross join lateral aclexplode(a.attacl) x
    where a.attrelid='public.follows'::regclass and a.attnum>0 and not a.attisdropped
      and (x.grantee=0 or pg_get_userbyid(x.grantee) in ('anon','authenticated'))
  ) g;
  select string_agg(format('revoke select (%I) on public.profiles from authenticated;',a.attname),E'\n')
    into profile_revoke from pg_catalog.pg_attribute a
    where a.attrelid='public.profiles'::regclass and a.attname in
      ('user_id','username','full_name','avatar_url','banner_url','university','studying','bio','created_at','is_private')
      and not has_column_privilege('authenticated',a.attrelid,a.attnum,'SELECT');
  restore_sql := coalesce(grants_sql,'') || E'\n' || coalesce(profile_revoke,'') || E'\n' ||
    case when has_table_privilege('authenticated','realtime.messages','SELECT') then ''
      else 'revoke select on realtime.messages from authenticated;' end || E'\n' || coalesce(original_policies,'');
  execute format('comment on function private.kx_follow_guard() is %L',
    jsonb_build_object('migration','20261018190000','restore_sql',restore_sql)::text);
end $$;

drop trigger if exists kx_follow_guard on public.follows;
create trigger kx_follow_guard before insert or update on public.follows
  for each row execute function private.kx_follow_guard();

-- Birbirini bekleyen engelleme/takip yazımları aynı çift kilidini kullanır.
-- Adım 1'deki trg_on_block ve private.on_block gövdelerine dokunulmaz.
create or replace function private.kx_follow_block_lock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.kx_follow_pair_lock(new.blocker_id,new.blocked_id);
  return new;
end $$;
revoke all on function private.kx_follow_block_lock() from public, anon, authenticated;
drop trigger if exists kx_follow_block_lock on public.blocks;
create trigger kx_follow_block_lock before insert on public.blocks
  for each row execute function private.kx_follow_block_lock();

revoke all on public.follows from public, anon, authenticated;
revoke insert (follower_id,following_id,created_at,status),
  update (follower_id,following_id,created_at,status),
  select (follower_id,following_id,created_at,status),
  references (follower_id,following_id,created_at,status) on public.follows from public, anon, authenticated;
grant select, delete on public.follows to authenticated;
grant insert (follower_id,following_id) on public.follows to authenticated;
grant update (status) on public.follows to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_blocked(uuid,uuid) to authenticated;
grant select (user_id,username,full_name,avatar_url,banner_url,university,studying,bio,created_at,is_private)
  on public.profiles to authenticated;

drop policy if exists follows_accept on public.follows;
drop policy if exists follows_insert_not_blocked on public.follows;
drop policy if exists follows_remove_follower on public.follows;
drop policy if exists follows_select on public.follows;
drop policy if exists "kendi takibini ekler" on public.follows;
drop policy if exists "kendi takibini siler" on public.follows;
drop policy if exists kx_follows_select on public.follows;
drop policy if exists kx_follows_insert on public.follows;
drop policy if exists kx_follows_accept on public.follows;
drop policy if exists kx_follows_delete on public.follows;

create policy kx_follows_select on public.follows for select to authenticated using (
  not private.is_blocked((select auth.uid()),follower_id)
  and not private.is_blocked((select auth.uid()),following_id)
  and (follower_id=(select auth.uid()) or following_id=(select auth.uid()) or status='accepted')
);
create policy kx_follows_insert on public.follows for insert to authenticated with check (
  follower_id=(select auth.uid()) and follower_id<>following_id
  and not private.is_blocked(follower_id,following_id)
);
create policy kx_follows_accept on public.follows for update to authenticated
  using (following_id=(select auth.uid()) and status='pending'
    and not private.is_blocked(follower_id,following_id))
  with check (following_id=(select auth.uid()) and status='accepted'
    and not private.is_blocked(follower_id,following_id));
create policy kx_follows_delete on public.follows for delete to authenticated
  using (follower_id=(select auth.uid()) or following_id=(select auth.uid()));

create or replace function private.kx_follow_broadcast()
returns trigger language plpgsql security definer set search_path = public as $$
declare follower uuid; following uuid;
begin
  if tg_op='DELETE' then follower:=old.follower_id; following:=old.following_id;
  else follower:=new.follower_id; following:=new.following_id; end if;
  perform realtime.send('{}'::jsonb,'changed','kampusx:follows:'||follower::text,true);
  perform realtime.send('{}'::jsonb,'changed','kampusx:follows:'||following::text,true);
  return null;
end $$;
revoke all on function private.kx_follow_broadcast() from public, anon, authenticated;
drop trigger if exists kx_follow_broadcast on public.follows;
create trigger kx_follow_broadcast after insert or update or delete on public.follows
  for each row execute function private.kx_follow_broadcast();

grant select on realtime.messages to authenticated;
drop policy if exists kx_follow_receive on realtime.messages;
drop policy if exists kx_follow_channel_guard on realtime.messages;
drop policy if exists kx_follow_no_client_send on realtime.messages;
create policy kx_follow_receive on realtime.messages for select to authenticated using (
  extension='broadcast' and topic='kampusx:follows:'||(select auth.uid())::text
  and (select realtime.topic())=topic
);
create policy kx_follow_channel_guard on realtime.messages as restrictive for select to anon, authenticated using (
  (coalesce((select realtime.topic()),'') not like 'kampusx:follows:%' and topic not like 'kampusx:follows:%')
  or (extension='broadcast' and topic='kampusx:follows:'||(select auth.uid())::text and (select realtime.topic())=topic)
);
create policy kx_follow_no_client_send on realtime.messages as restrictive for insert to anon, authenticated
  with check (coalesce((select realtime.topic()),'') not like 'kampusx:follows:%' and topic not like 'kampusx:follows:%');

-- Frontend migration tamamlanmadan yeni takip yazımı yapamaz.
create or replace function private.kx_follow_requests_version()
returns text language sql stable security invoker set search_path = public as $$
  select '20261018190000'::text where (select auth.uid()) is not null;
$$;
revoke all on function private.kx_follow_requests_version() from public, anon, authenticated;
grant execute on function private.kx_follow_requests_version() to authenticated;
create or replace function public.kampusx_follow_requests_version()
returns text language sql stable security invoker set search_path = public as $$
  select private.kx_follow_requests_version();
$$;
revoke all on function public.kampusx_follow_requests_version() from public, anon, authenticated;
grant execute on function public.kampusx_follow_requests_version() to authenticated;

commit;
