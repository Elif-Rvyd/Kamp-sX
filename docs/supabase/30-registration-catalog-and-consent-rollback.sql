-- Disables only the new signup requirement. Keeps catalog data, receipts and locked academic IDs.
begin;
drop trigger if exists kx_registration_guard on auth.users;
drop trigger if exists kx_registration_receipt on auth.users;
revoke execute on function public.kx_registration_contract_version() from anon,authenticated;
notify pgrst,'reload schema';
commit;
