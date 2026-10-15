-- İNCELEME İÇİN ŞABLON: uygulama tarafından otomatik çalıştırılmaz.
-- Önce 00-readiness.sql ve STORAGE-ENTEGRASYONU.md okunmalı.
-- Mevcut başka policy'ler varsa işlem güvenli biçimde DURUR; silinmezler.
begin;
do $$
begin
  if exists (
    select 1 from pg_policies
    where ((schemaname = 'public' and tablename in ('profiles', 'posts'))
       or (schemaname = 'storage' and tablename = 'objects'))
      and policyname not in ('kampusx_profiles_read_own','kampusx_profiles_insert_own',
        'kampusx_profiles_update_own','kampusx_posts_read','kampusx_posts_insert_own',
        'kampusx_uploads_insert_own')
  ) then
    raise exception 'Mevcut policy var. 00-readiness.sql ile inceleyin; otomatik silinmedi.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'uploads' and public = true) then
    raise exception 'uploads public bucket bulunamadı.';
  end if;
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.profiles'::regclass and i.indisunique and i.indisvalid
      and i.indnkeyatts = 1 and i.indpred is null and a.attname = 'user_id'
  ) then
    raise exception 'profiles.user_id tekil (UNIQUE/PRIMARY KEY) olmalı; önce tablo yapısını inceleyin.';
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
grant usage on schema public to authenticated;
-- Profilde rol vb. başka kolonlar varsa bunları istemciye açma.
-- Bu şablon yalnızca aşağıdaki medya/yayın iş akışının yetkilerini tanımlar.
revoke all on public.profiles, public.posts from public, anon, authenticated;
grant select (user_id, avatar_url, banner_url), insert (user_id, avatar_url, banner_url),
  update (avatar_url, banner_url) on public.profiles to authenticated;
grant select (id, user_id, content, media_url, media_type),
  insert (user_id, content, media_url, media_type) on public.posts to authenticated;

drop policy if exists kampusx_profiles_read_own on public.profiles;
create policy kampusx_profiles_read_own on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists kampusx_profiles_insert_own on public.profiles;
create policy kampusx_profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists kampusx_profiles_update_own on public.profiles;
create policy kampusx_profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists kampusx_posts_read on public.posts;
create policy kampusx_posts_read on public.posts for select to authenticated using (true);
drop policy if exists kampusx_posts_insert_own on public.posts;
create policy kampusx_posts_insert_own on public.posts for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and content is not null and char_length(content) <= 2000
  and (char_length(btrim(content)) > 0 or media_url is not null)
  and ((media_url is null and media_type is null)
    or (media_url is not null and media_type in ('image','video')))
);

-- Public dosya okuması bucket üzerinden olur. Upsert/overwrite/delete izni verilmez.
drop policy if exists kampusx_uploads_insert_own on storage.objects;
create policy kampusx_uploads_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    ((storage.foldername(name))[2] in ('avatar','banner')
      and lower(storage.extension(name)) in ('jpg','png','webp'))
    or ((storage.foldername(name))[2] = 'post'
      and lower(storage.extension(name)) in ('jpg','png','webp','mp4','webm'))
  )
);

-- Bucket limiti sunucuda da uygulanır. Dosya içeriği taraması bunun dışındadır.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
where id = 'uploads';
commit;
