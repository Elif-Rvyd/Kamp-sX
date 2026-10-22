-- Disables only migration 27. Keeps ALL conversations/messages for recovery/reinstallation.
-- Deploy the previous client before rollback. Do not drop tables to roll back a populated installation.
begin;
set local lock_timeout='5s';
do $rollback$
declare f record;
begin
  if to_regclass('public.messages') is not null then
    revoke all on public.messages from public,anon,authenticated;
    if exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
      alter publication supabase_realtime drop table public.messages;
    end if;
  end if;
  if to_regclass('public.conversations') is not null then revoke all on public.conversations from public,anon,authenticated; end if;
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where(n.nspname='private' and p.proname like 'kx_dm_%')
      or(n.nspname='public' and p.proname in('kx_can_message','kx_start_conversation','kx_inbox','kx_mark_read','kx_messaging_version'))
  loop execute format('revoke all on function %s from public,anon,authenticated',f.signature); end loop;
end
$rollback$;
notify pgrst,'reload schema';
commit;
select 'Messaging disabled; all DM rows preserved' as rollback_result;
