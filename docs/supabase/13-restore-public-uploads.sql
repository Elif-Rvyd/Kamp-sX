-- 18 Ekim 2026: yalnızca private Storage geçişini geri alır.
-- Yeni tablo/bucket oluşturmaz, dosya veya profil/gönderi satırı silmez.
-- Önceki private 12 uygulanmışsa kullanılabilir; tekrar çalıştırılabilir.
-- Yükleme sahipliği ve gönderi silme izinlerine dokunmaz.
begin;
do $$ begin
  if not exists(select 1 from storage.buckets where id='uploads') then
    raise exception 'uploads bucket bulunamadı; değişiklik yapılmadı.';
  end if;
end $$;
update storage.buckets set public=true where id='uploads';
drop policy if exists kampusx_private_media_read on storage.objects;
drop policy if exists kampusx_uploads_guard_select on storage.objects;
create policy kampusx_uploads_guard_select on storage.objects as restrictive for select to public
using(bucket_id <> 'uploads' or ((select auth.uid()) is not null
  and split_part(name,'/',1)=(select auth.uid())::text));
drop policy if exists kampusx_uploads_select_own on storage.objects;
create policy kampusx_uploads_select_own on storage.objects for select to authenticated
using(bucket_id='uploads' and split_part(name,'/',1)=(select auth.uid())::text);
drop function if exists kampusx_security.read_media(text);
commit;
select id as bucket, public as is_public from storage.buckets where id='uploads';
