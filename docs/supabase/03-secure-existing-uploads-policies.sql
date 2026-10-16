-- 16 Ekim 2026: kullanıcının gönderdiği iki policy ekranına göre hazırlanmıştır.
-- OTOMATİK ÇALIŞTIRILMAZ. Bu bir güvenlik daraltmasıdır; yükleme hatasının nedeni doğrulanmış değildir.
-- Yeni tablo/bucket/policy oluşturmaz; mevcut iki Storage policy'sini düzenler.
-- İşlemden önce mevcut policy tanımlarını saklayın. Adlar farklıysa hiçbir değişiklik yapılmadan durur.
begin;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Insert Policy 1va6avm_0' and cmd = 'INSERT'
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Select Policy 1va6avm_0' and cmd = 'SELECT'
  ) then
    raise exception 'Ekran görüntüsündeki iki policy aynı ad ve işlemlerle bulunamadı. Değişiklik yapılmadı.';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('INSERT', 'SELECT', 'ALL')
      and policyname not in ('Insert Policy 1va6avm_0', 'Select Policy 1va6avm_0')
  ) then
    raise exception 'Başka Storage policy var; erişim kuralları birlikte incelenmeli. Değişiklik yapılmadı.';
  end if;
end $$;

alter policy "Insert Policy 1va6avm_0" on storage.objects
to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and cardinality(storage.foldername(name)) = 2
  and (
    ((storage.foldername(name))[2] in ('avatar', 'banner')
      and lower(storage.extension(name)) in ('jpg', 'png', 'webp'))
    or ((storage.foldername(name))[2] = 'post'
      and lower(storage.extension(name)) in ('jpg', 'png', 'webp', 'mp4', 'webm'))
  )
);

-- Listeleme / kimlik doğrulamalı okuma yalnızca kişinin kendi klasörüne açılır.
-- Public bucket'ın public URL üzerinden dosya sunması devam eder.
alter policy "Select Policy 1va6avm_0" on storage.objects
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
