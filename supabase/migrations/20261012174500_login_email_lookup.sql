-- HISTORICAL: superseded by 20261015180000_disable_login_email_lookup.sql.
-- Do not run this migration on its own; the latest migration disables public access.
-- Product decision: login distinguishes an unknown email from incorrect credentials.
-- This intentionally reveals whether a supplied email has an active account.
-- No user rows, IDs, password hashes or roles are returned.
begin;

create or replace function public.kampusx_login_email_exists(email_address text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when email_address is null
      or length(btrim(email_address)) > 320
      or btrim(email_address) !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    then null::boolean
    else exists (
      select 1
      from auth.users as account
      where lower(account.email) = lower(btrim(email_address))
        and account.deleted_at is null
    )
  end;
$function$;

-- Limit grants to this function. Keep auth.users and every other function protected.
revoke all on function public.kampusx_login_email_exists(text) from public, anon, authenticated;
grant execute on function public.kampusx_login_email_exists(text) to anon, authenticated;

comment on function public.kampusx_login_email_exists(text) is
  'Login-only email existence lookup. Returns a boolean; account existence is intentionally disclosed.';

notify pgrst, 'reload schema';
commit;
