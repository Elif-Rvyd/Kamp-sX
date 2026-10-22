-- Yalnızca SQL 25'in eklediği müsaitlik kontrolünü kaldırır; veri/RLS değişmez.
begin;
drop function if exists public.kampusx_username_available(text);
notify pgrst, 'reload schema';
commit;
