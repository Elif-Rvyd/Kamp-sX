-- 21 Ekim katalog çıktısında authenticated rolüne gereksiz verilen tablo yetkileri.
-- TRUNCATE satır RLS'inden geçmez. Burada TRUNCATE İŞLEMİ YAPILMAZ; yalnızca yetkisi alınır.
-- INSERT/DELETE/SELECT, sütun izinleri, RLS, trigger'lar ve veriler korunur.
-- PostgreSQL 17+ (katalogdaki MAINTAIN yetkisiyle uyumlu).
-- Geri alma: 21-social-unused-privileges-rollback.sql.
begin;
revoke truncate, references, trigger, maintain
on public.blocks, public.bookmarks, public.likes, public.reports
from authenticated;
commit;

-- Salt okunur son kontrol: dört sütunun da false olması beklenir.
select t.table_name,
  has_table_privilege('authenticated',format('public.%I',t.table_name),'TRUNCATE') as can_truncate,
  has_table_privilege('authenticated',format('public.%I',t.table_name),'REFERENCES') as can_reference,
  has_table_privilege('authenticated',format('public.%I',t.table_name),'TRIGGER') as can_create_trigger,
  has_table_privilege('authenticated',format('public.%I',t.table_name),'MAINTAIN') as can_maintain
from information_schema.tables t
where t.table_schema='public' and t.table_name in ('blocks','bookmarks','likes','reports')
order by t.table_name;
