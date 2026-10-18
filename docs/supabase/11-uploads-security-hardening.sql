-- 17 Ekim 2026 güvenlik denetimi: yalnızca mevcut uploads bucket'ını daraltır.
-- Yeni tablo/sütun/bucket oluşturmaz; hiçbir dosya veya profil/gönderi satırı silmez.
-- Public URL ile görüntüleme ve public/private bucket tercihi değişmez.
-- Mevcut policy'leri silmez. RESTRICTIVE kurallar, başka geniş PERMISSIVE
-- kurallar bulunsa bile uploads için anonim/yabancı klasöre erişimi engeller.
-- uploads içinde istemci UPDATE/DELETE ve upsert kapanır; uygulama upsert:false kullanır.
-- Başka bucket'ların policy ve ayarlarına dokunmaz. service_role bu kuralları bypass eder.
-- Önce 10-storage-security-diagnostics.sql sonucunu saklayın. Ardından bu dosyanın
-- TAMAMINI Supabase SQL Editor > New query içinde çalıştırın. Uygulama otomatik çalıştırmaz.
begin;

do $$
begin
  if not exists (
    select 1 from pg_class where oid = 'storage.objects'::regclass and relrowsecurity
  ) then
    raise exception 'storage.objects RLS açık değil. Değişiklik yapılmadı.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'uploads') then
    raise exception 'Mevcut uploads bucket bulunamadı. Değişiklik yapılmadı.';
  end if;
end $$;

-- Storage API dosya boyutunu ve izin verilen MIME listesini sunucuda uygular.
-- Önceden daha küçük bir boyut sınırı varsa korunur. Public tercihi değiştirilmez.
update storage.buckets
set file_size_limit = least(coalesce(file_size_limit, 52428800), 52428800),
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
where id = 'uploads';

-- Yalnızca bu dosyanın yönettiği altı policy yenilenir; tekrar çalıştırılabilir.
drop policy if exists kampusx_uploads_guard_insert on storage.objects;
drop policy if exists kampusx_uploads_guard_select on storage.objects;
drop policy if exists kampusx_uploads_guard_update on storage.objects;
drop policy if exists kampusx_uploads_guard_delete on storage.objects;
drop policy if exists kampusx_uploads_insert_own on storage.objects;
drop policy if exists kampusx_uploads_select_own on storage.objects;

create policy kampusx_uploads_guard_insert on storage.objects
as restrictive for insert to public
with check (
  bucket_id <> 'uploads' or (
    (select auth.uid()) is not null
    and name ~ (
      '^' || (select auth.uid())::text || '/'
      || '(avatar/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)'
      || '|banner/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)'
      || '|post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4|webm))$'
    )
  )
);

create policy kampusx_uploads_insert_own on storage.objects
for insert to authenticated
with check (bucket_id = 'uploads' and split_part(name, '/', 1) = (select auth.uid())::text);

-- Public dosya URL'siyle görüntüleme devam eder; Storage API listelemesi kişinin klasörüne sınırlıdır.
create policy kampusx_uploads_guard_select on storage.objects
as restrictive for select to public
using (
  bucket_id <> 'uploads' or (
    (select auth.uid()) is not null and split_part(name, '/', 1) = (select auth.uid())::text
  )
);
create policy kampusx_uploads_select_own on storage.objects
for select to authenticated
using (bucket_id = 'uploads' and split_part(name, '/', 1) = (select auth.uid())::text);

create policy kampusx_uploads_guard_update on storage.objects
as restrictive for update to public
using (bucket_id <> 'uploads') with check (bucket_id <> 'uploads');
create policy kampusx_uploads_guard_delete on storage.objects
as restrictive for delete to public
using (bucket_id <> 'uploads');

commit;

select policyname, permissive, roles, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'kampusx_uploads_%'
order by policyname;
