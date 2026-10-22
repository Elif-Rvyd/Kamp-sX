-- Disable the new support dispatcher only. Metadata and existing application data are retained.
begin;
revoke all on function public.kx_support_reserve(uuid,uuid,text),public.kx_support_finish(uuid,uuid,text,text),public.kx_support_status(uuid,uuid)
 from public,anon,authenticated,service_role;
revoke all on function public.kx_support_contract_version() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
