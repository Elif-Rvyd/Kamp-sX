-- Yalnızca SQL 21'in aldığı, katalogda doğrulanan eski yetkileri geri verir.
-- Güvenlik sertleştirmesini de geri alır; normal uygulama işlemleri için gerekmez.
-- Veri veya tablo değiştirmez.
begin;
grant truncate, references, trigger, maintain
on public.blocks, public.bookmarks, public.likes, public.reports
to authenticated;
commit;
