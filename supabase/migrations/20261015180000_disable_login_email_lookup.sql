-- 15 October 2026: generic credential errors replace public account discovery.
-- Run in Supabase SQL Editor as the project database owner.
-- Idempotent, including projects that never installed the legacy RPC.
-- No tables, users, files or rows are created, changed or deleted.
begin;
do $migration$
begin
  if to_regprocedure('public.kampusx_login_email_exists(text)') is not null then
    revoke execute on function public.kampusx_login_email_exists(text)
      from public, anon, authenticated;
  end if;
end
$migration$;
notify pgrst, 'reload schema';
commit;
