-- Salt okunur kurulum kontrolü; tüm sütunlar true olmalı.
begin read only;
select
  exists (select 1 from pg_trigger where tgrelid='public.follows'::regclass and tgname='kx_follow_guard' and tgenabled='O') as status_trigger_ready,
  exists (select 1 from pg_trigger where tgrelid='public.follows'::regclass and tgname='kx_follow_broadcast' and tgenabled='O') as broadcast_ready,
  exists (select 1 from pg_trigger where tgrelid='public.blocks'::regclass and tgname='kx_follow_block_lock' and tgenabled='O') as block_serialization_ready,
  (select count(*)=4 from pg_policies where schemaname='public' and tablename='follows' and policyname in ('kx_follows_select','kx_follows_insert','kx_follows_accept','kx_follows_delete')) as follows_policies_ready,
  (select count(*)=3 from pg_policies where schemaname='realtime' and tablename='messages' and policyname in ('kx_follow_receive','kx_follow_channel_guard','kx_follow_no_client_send')) as private_channel_policies_ready,
  not exists (select 1 from pg_publication_tables where schemaname='public' and tablename='follows') as no_public_delete_stream,
  not has_table_privilege('anon','public.follows','SELECT') as anonymous_read_denied,
  not has_table_privilege('authenticated','public.follows','TRUNCATE') as truncate_denied,
  not has_column_privilege('authenticated','public.follows','status','INSERT') as client_status_insert_denied,
  has_column_privilege('authenticated','public.follows','status','UPDATE') as status_update_available,
  to_regprocedure('public.kampusx_follow_requests_version()') is not null as deployment_gate_ready;
commit;
