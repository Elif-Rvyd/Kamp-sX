-- SQL 19'dan sonra. Yeni tablo/sütun veya veri backfill'i yok.
-- posts_insert_target_visible içindeki kendi tablo taraması PostgreSQL'de 42P17
-- döngüsü üretebiliyor. Aynı SELECT görünürlük koşulları private yardımcıya taşınır.
-- Diğer RLS politikaları korunur; izin verilmeyen hedefler erişime açılmaz.
-- Gönderi > yanıt > yanıta yanıt: daha derini yeni INSERT'lerde reddedilir.
-- Mevcut derin satırlar değiştirilmez/silinmez. Sayaç trigger'larına dokunulmaz.
-- Geri alma: 20-reply-depth-guard-rollback.sql.
begin;

do $$
begin
  if not exists (select 1 from pg_catalog.pg_class where oid = 'public.posts'::regclass and relrowsecurity) then
    raise exception 'public.posts için RLS açık olmalı.';
  end if;
  if not has_column_privilege('authenticated', 'public.posts', 'parent_id', 'SELECT') then
    raise exception 'Önce 19-post-read-columns.sql çalıştırılmalı.';
  end if;
end $$;

do $$
begin
  if (select count(*) from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'posts' and cmd in ('SELECT', 'ALL')) <> 1
    or not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_select_visible' and cmd = 'SELECT'
        and permissive = 'PERMISSIVE' and roles = array['authenticated']::name[]
        and regexp_replace(qual, '[[:space:]]', '', 'g') = regexp_replace(
          $expected$((deleted_at IS NULL) AND ((user_id = ( SELECT auth.uid() AS uid)) OR ((archived_at IS NULL) AND private.can_view_user_content(( SELECT auth.uid() AS uid), user_id))))$expected$,
          '[[:space:]]', '', 'g'))
    or not exists (select 1 from pg_catalog.pg_policies
      where schemaname = 'public' and tablename = 'posts' and policyname = 'posts_insert_target_visible'
        and cmd = 'INSERT' and permissive = 'RESTRICTIVE') then
    raise exception 'Posts politikaları 21 Ekim katalog sözleşmesiyle uyuşmuyor; işlem geri alındı.';
  end if;
end $$;

create or replace function private.kx_post_target_visible(target uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  -- Kullanıcının verdiği posts_select_visible ile AYNI koşul. Kimlik parametre alınmaz.
  select exists (
    select 1 from public.posts t where t.id = target and t.deleted_at is null
      and (t.user_id = (select auth.uid()) or
        (t.archived_at is null and private.can_view_user_content((select auth.uid()), t.user_id)))
  );
$$;
revoke all on function private.kx_post_target_visible(uuid) from public, anon;
grant execute on function private.kx_post_target_visible(uuid) to authenticated;
drop policy if exists posts_insert_target_visible on public.posts;
create policy posts_insert_target_visible on public.posts as restrictive
for insert to authenticated with check (
  (parent_id is null or private.kx_post_target_visible(parent_id))
  and (repost_of_id is null or private.kx_post_target_visible(repost_of_id))
);

create or replace function private.kx_reply_depth_guard()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare
  parent_parent uuid;
  grandparent_parent uuid;
begin
  if new.parent_id is null then return new; end if;
  -- SECURITY INVOKER: hedef okumaları çağıranın RLS kurallarından geçer.
  select p.parent_id into parent_parent from public.posts p where p.id = new.parent_id;
  if not found then
    raise exception using errcode = '42501', message = 'reply_target_unavailable';
  end if;
  if parent_parent is not null then
    select p.parent_id into grandparent_parent from public.posts p where p.id = parent_parent;
    if not found then
      raise exception using errcode = '42501', message = 'reply_target_unavailable';
    end if;
    if grandparent_parent is not null then
      raise exception using errcode = '23514', message = 'reply_depth_limit';
    end if;
  end if;
  return new;
end $$;

revoke all on function private.kx_reply_depth_guard() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.kx_reply_depth_guard() to authenticated;

drop trigger if exists kx_reply_depth_guard on public.posts;
create trigger kx_reply_depth_guard before insert on public.posts
for each row execute function private.kx_reply_depth_guard();

-- İstemci yeni yanıtlara yalnızca bu koruma kurulduğunda izin verir.
-- Kullanıcı verisi okumaz; katalogdaki kendi trigger'ını kontrol eder.
create or replace function public.kampusx_reply_contract_version()
returns text language sql stable security invoker set search_path = public
as $$
  select case when exists (
    select 1 from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.posts'::regclass
      and t.tgname = 'kx_reply_depth_guard' and t.tgenabled in ('O', 'A')
      and t.tgfoid = 'private.kx_reply_depth_guard()'::regprocedure
  ) then '2026102102'::text else null::text end;
$$;
revoke all on function public.kampusx_reply_contract_version() from public, anon;
grant execute on function public.kampusx_reply_contract_version() to authenticated;
notify pgrst, 'reload schema';
commit;

select public.kampusx_reply_contract_version() as reply_contract_version;
