-- 17 Ekim 2026: paylaşılan public.posts teşhis çıktısına göre hazırlanmıştır.
-- Mevcut posts tablosunun erişim kurallarını düzeltir. Yeni tablo/sütun oluşturmaz.
-- Gönderi eklemez/silmez; profiles, Storage ve Auth ayarlarını değiştirmez.
-- RLS açık kalır. Giriş yapanlar akışı okur, yalnızca kendi adlarına gönderi ekler.
-- Supabase > SQL Editor > New query: dosyanın TAMAMINI yapıştırıp Run seçin.
begin;

do $$
declare
  expected_column_count integer;
  extra_required_column text;
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts' and c.relkind = 'r' and c.relrowsecurity
  ) then
    raise exception 'RLS açık public.posts tablosu bulunamadı. Değişiklik yapılmadı.';
  end if;
  select count(*) into expected_column_count from information_schema.columns
  where table_schema = 'public' and table_name = 'posts'
    and ((column_name in ('id', 'user_id') and data_type = 'uuid')
      or (column_name in ('content', 'media_url', 'media_type') and data_type = 'text')
      or (column_name = 'created_at' and data_type = 'timestamp with time zone'));
  if expected_column_count <> 6 then
    raise exception 'posts sütunları paylaşılan teşhis çıktısıyla uyuşmuyor. Değişiklik yapılmadı.';
  end if;
  select a.attname into extra_required_column
  from pg_attribute a
  where a.attrelid = 'public.posts'::regclass and a.attnum > 0 and not a.attisdropped
    and a.attnotnull and not a.atthasdef and a.attidentity = '' and a.attgenerated = ''
    and a.attname not in ('user_id', 'content', 'media_url', 'media_type')
  limit 1;
  if extra_required_column is not null then
    raise exception 'Varsayılan değeri olmayan ek zorunlu sütun var: %. Değişiklik yapılmadı.', extra_required_column;
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts'
      and policyname not in ('kampusx_posts_read', 'kampusx_posts_insert_own')
  ) then
    raise exception 'Başka posts policy mevcut. Birlikte incelenmeden değiştirilmedi.';
  end if;
end $$;

-- Teşhis çıktısındaki geniş istemci yetkilerini yalnızca bu tabloda daraltır.
-- Özellikle TRUNCATE, RLS satır denetimine tabi değildir; istemciye verilmez.
-- service_role ve veritabanı sahibinin doğrudan yetkileri korunur.
revoke all privileges on table public.posts from public, anon, authenticated;
do $$
declare
  column_list text;
begin
  select string_agg(format('%I', attname), ', ' order by attnum) into column_list
  from pg_attribute
  where attrelid = 'public.posts'::regclass and attnum > 0 and not attisdropped;
  execute format(
    'revoke all privileges (%s) on table public.posts from public, anon, authenticated', column_list
  );
end $$;

grant usage on schema public to authenticated;
grant select (id, user_id, content, media_url, media_type, created_at),
  insert (user_id, content, media_url, media_type) on table public.posts to authenticated;

-- Sosyal ana akış, yalnızca oturum açmış kullanıcılara görünür.
drop policy if exists kampusx_posts_read on public.posts;
create policy kampusx_posts_read on public.posts
for select to authenticated using (true);

-- Kimlik, metin sınırı ve URL/tür eşleşmesi doğrudan veritabanında denetlenir.
-- URL deseni uygulamanın mevcut Supabase projesi ve uploads/<user_id>/post/ yolu içindir.
drop policy if exists kampusx_posts_insert_own on public.posts;
create policy kampusx_posts_insert_own on public.posts
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and content is not null and char_length(content) <= 2000
  and (content ~ '[^[:space:]]' or media_url is not null)
  and (
    (media_url is null and media_type is null)
    or (
      media_type = 'image'
      and media_url ~ (
        '^https://djhezivksrvcyqxzpiau[.]supabase[.]co/storage/v1/object/public/uploads/'
        || user_id::text || '/post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
      )
    )
    or (
      media_type = 'video'
      and media_url ~ (
        '^https://djhezivksrvcyqxzpiau[.]supabase[.]co/storage/v1/object/public/uploads/'
        || user_id::text || '/post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](mp4|webm)$'
      )
    )
  )
);

commit;

-- Beklenen: authenticated rolünde SELECT ve INSERT için iki policy.
select policyname, roles, cmd from pg_policies
where schemaname = 'public' and tablename = 'posts'
order by cmd;
