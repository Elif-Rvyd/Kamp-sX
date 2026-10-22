-- Disable migration 29 without deleting posts, messages, shared pointers or view records.
begin;
do $rollback$
declare f record;
begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where(n.nspname='private' and p.proname in('kx_post_readable','kx_view_totals','kx_dm_share','kx_dm_inbox_v2'))
 or(n.nspname='public' and p.proname in('kx_record_post_views','kx_get_post_views','kx_share_post','kx_inbox_v2','kx_social_release_version')) loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $rollback$;
notify pgrst,'reload schema';
commit;
