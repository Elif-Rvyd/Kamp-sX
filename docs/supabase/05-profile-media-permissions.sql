-- 16 Ekim 2026: paylaşılan public.profiles teşhis çıktısına göre hazırlanmıştır.
-- Yeni tablo/sütun oluşturmaz, satır eklemez/silmez, Storage veya posts izinlerini değiştirmez.
-- Mevcut RLS açık kalır. Giriş yapan kullanıcı yalnızca kendi medya alanlarını okuyup yazabilir.
-- Supabase SQL Editor > New query içine dosyanın tamamını yapıştırıp Run seçin.
begin;

do $$
declare
  media_column_count integer;
  extra_required_column text;
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles' and c.relkind = 'r' and c.relrowsecurity
  ) then
    raise exception 'RLS açık public.profiles tablosu bulunamadı. Değişiklik yapılmadı.';
  end if;
  select count(*) into media_column_count from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and ((column_name = 'user_id' and data_type = 'uuid')
      or (column_name in ('avatar_url', 'banner_url') and data_type = 'text'));
  if media_column_count <> 3 then
    raise exception 'user_id uuid, avatar_url text ve banner_url text sütunları bekleniyor. Değişiklik yapılmadı.';
  end if;
  select a.attname into extra_required_column
  from pg_attribute a
  where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
    and a.attnotnull and not a.atthasdef and a.attidentity = '' and a.attgenerated = ''
    and a.attname <> 'user_id'
  limit 1;
  if extra_required_column is not null then
    raise exception 'Varsayılan değeri olmayan ek zorunlu sütun var: %. Önce tablo sözleşmesini inceleyin.', extra_required_column;
  end if;
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
      and policyname not in ('kampusx_profiles_read_own', 'kampusx_profiles_insert_own', 'kampusx_profiles_update_own')
  ) then
    raise exception 'Başka profiles policy mevcut. Birlikte incelenmeden değiştirilmedi.';
  end if;
end $$;

-- Eski geniş istemci izinlerini tablo VE sütun seviyesinde daraltır.
-- service_role/DB sahibi izinleri etkilenmez.
revoke all privileges on table public.profiles from public, anon, authenticated;
do $$
declare
  column_list text;
begin
  select string_agg(format('%I', attname), ', ' order by attnum) into column_list
  from pg_attribute
  where attrelid = 'public.profiles'::regclass and attnum > 0 and not attisdropped;
  execute format(
    'revoke all privileges (%s) on table public.profiles from public, anon, authenticated', column_list
  );
end $$;

grant usage on schema public to authenticated;
grant select (user_id, avatar_url, banner_url), insert (user_id, avatar_url, banner_url),
  update (avatar_url, banner_url) on table public.profiles to authenticated;

-- Tekrar çalıştırılabilir; yalnızca bu dosyanın üç kuralı yenilenir.
drop policy if exists kampusx_profiles_read_own on public.profiles;
create policy kampusx_profiles_read_own on public.profiles
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists kampusx_profiles_insert_own on public.profiles;
create policy kampusx_profiles_insert_own on public.profiles
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists kampusx_profiles_update_own on public.profiles;
create policy kampusx_profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;

-- Beklenen sonuç: authenticated rolünde SELECT, INSERT ve UPDATE için 3 policy.
select policyname, roles, cmd from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by cmd;
