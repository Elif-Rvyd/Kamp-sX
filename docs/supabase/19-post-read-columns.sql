-- 21 Ekim 2026 katalog çıktısında eksik olduğu doğrulanan SELECT izinleri.
-- Yeni tablo/sütun oluşturmaz, veri değiştirmez, RLS politikalarına dokunmaz.
-- Yalnızca authenticated rolü; sayaçlara INSERT/UPDATE yetkisi VERİLMEZ.
-- Tamamını SQL Editor'da çalıştırın. Geri alma: 19-post-read-columns-rollback.sql.
begin;
do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts' and c.relrowsecurity
  ) then
    raise exception 'RLS açık public.posts bulunamadı; değişiklik yapılmadı.';
  end if;
end $$;

grant select (
  parent_id, repost_of_id, archived_at, deleted_at, pinned_at,
  likes_count, replies_count, reposts_count
) on public.posts to authenticated;

commit;

select column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'posts'
  and grantee = 'authenticated' and privilege_type = 'SELECT'
order by column_name;
