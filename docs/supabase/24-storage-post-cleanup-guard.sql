-- 22 Ekim 2026: SQL 11'in DELETE yasağı ile SQL 22'nin sahip temizliğini uzlaştırır.
-- Yeni tablo/sütun yok. Hiçbir gönderi/dosya silinmez; uploads public/private ayarı değişmez.
-- Yalnızca sahibi tarafından soft delete edilmiş, canlı başka gönderide kullanılmayan post medyası.
-- Geri alma: 24-storage-post-cleanup-guard-rollback.sql (uploads silmelerini tekrar kapatır).
begin;
do $$ begin
  if not exists(select 1 from pg_class where oid='storage.objects'::regclass and relrowsecurity)
    or not exists(select 1 from pg_class where oid='public.posts'::regclass and relrowsecurity)
    or not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and policyname='kx_uploads_delete_own_posts' and cmd='DELETE') then
    raise exception 'SQL 22 veya beklenen RLS eksik; değişiklik yapılmadı.';
  end if;
end $$;

create or replace function private.kx_can_delete_post_media(object_name text)
returns boolean language sql stable security definer set search_path=public as $$
  select (select auth.uid()) is not null
    and object_name ~ ('^'||(select auth.uid())::text||'/post/'
      ||'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp|mp4|webm)$')
    and exists(select 1 from public.posts p
      where p.user_id=(select auth.uid()) and p.deleted_at is not null
        and p.media_url='https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/'||object_name)
    and not exists(select 1 from public.posts p where p.deleted_at is null
      and p.media_url='https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/'||object_name);
$$;
revoke all on function private.kx_can_delete_post_media(text) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.kx_can_delete_post_media(text) to authenticated;

-- Public guard anonim/yabancı klasör silmesini geniş bir eski policy olsa da engeller.
drop policy if exists kampusx_uploads_guard_delete on storage.objects;
create policy kampusx_uploads_guard_delete on storage.objects as restrictive for delete to public
using (bucket_id<>'uploads' or ((select auth.uid()) is not null
  and name ~ ('^'||(select auth.uid())::text||'/post/'
    ||'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp|mp4|webm)$')));

-- Bu helper silinen satırları RLS dışında yalnızca boolean sahiplik kontrolü için okur.
-- İstemciye silinmiş gönderileri SELECT etme izni verilmez.
drop policy if exists kx_uploads_delete_unreferenced on storage.objects;
create policy kx_uploads_delete_unreferenced on storage.objects as restrictive for delete to authenticated
using (bucket_id<>'uploads' or private.kx_can_delete_post_media(name));
notify pgrst,'reload schema';
commit;

select policyname,permissive,roles,cmd from pg_policies
where schemaname='storage' and tablename='objects'
  and policyname in ('kampusx_uploads_guard_delete','kx_uploads_delete_unreferenced','kx_uploads_delete_own_posts')
order by policyname;
