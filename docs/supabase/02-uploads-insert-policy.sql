-- Yalnızca Storage INSERT izni için isteğe bağlı düzeltme. Otomatik çalıştırılmaz.
-- Yeni tablo/bucket oluşturmaz; profiles, posts ve auth tablolarını değiştirmez.
-- Hata uploadDenied/AccessDenied/RLS ise ve uploads bucket mevcutsa kullanılır.
-- Önce mevcut kuralları inceleyin. Bir INSERT/ALL kuralı varsa güvenle durur:
-- mevcut kuralları değiştirmek veya onları aşan ikinci bir kural eklemek doğru değildir.
begin;
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'uploads' and public = true) then
    raise exception 'Public uploads bucket bulunamadı. Storage > Files bölümünde bucket adını ve public ayarını kontrol edin.';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd in ('INSERT','ALL')) then
    raise exception 'Storage INSERT/ALL policy zaten var. Değişiklik yapılmadı; mevcut policy ifadesini inceleyin.';
  end if;
  execute $policy$
    create policy kampusx_uploads_insert_own on storage.objects
    for insert to authenticated with check (
      bucket_id = 'uploads'
      and (storage.foldername(name))[1] = (select auth.uid())::text
      and cardinality(storage.foldername(name)) = 2
      and (
        ((storage.foldername(name))[2] in ('avatar','banner')
          and lower(storage.extension(name)) in ('jpg','png','webp'))
        or ((storage.foldername(name))[2] = 'post'
          and lower(storage.extension(name)) in ('jpg','png','webp','mp4','webm'))
      )
    )
  $policy$;
end $$;
commit;
