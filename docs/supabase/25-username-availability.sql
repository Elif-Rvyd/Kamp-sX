-- Yalnızca kayıt ekranının herkese açık kullanıcı adı kontrolü. Kullanıcı satırı/e-posta döndürmez.
-- Mevcut tablo, veri ve RLS politikalarını değiştirmez. SQL Editor'da tamamını çalıştırın.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
create or replace function public.kampusx_username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $kx$
  select case
    when p_username is null or p_username !~ '^@?[A-Za-z0-9_]{3,20}$' then false
    else not exists (
      select 1 from public.profiles p
      where lower(p.username) = lower(ltrim(p_username, '@'))
    )
  end;
$kx$;
revoke all on function public.kampusx_username_available(text) from public;
grant execute on function public.kampusx_username_available(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
select has_function_privilege('anon','public.kampusx_username_available(text)','EXECUTE') as availability_ready;
