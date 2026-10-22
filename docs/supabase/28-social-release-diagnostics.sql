-- READ ONLY. Run the whole file in djhezivksrvcyqxzpiau; no user/message rows are read.
begin read only;
select jsonb_build_object(
  'scope','KampusX release: catalog, repost, messaging, legal consent, views metadata only',
  'functions',(select coalesce(jsonb_agg(pg_get_functiondef(p.oid)),'[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where p.prokind='f' and n.nspname in('private','public') and
      (p.proname ~ '(academic|catalog|consent|views|repost|counter|kx_dm_)' or p.proname='handle_new_user')),
  'triggers',(select coalesce(jsonb_agg(jsonb_build_object('table',n.nspname||'.'||c.relname,'definition',pg_get_triggerdef(t.oid))),'[]'::jsonb)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where not t.tgisinternal and ((n.nspname='auth' and c.relname='users')
      or(n.nspname='public' and c.relname in('universities','campuses','departments','profiles','posts','messages')))),
  'policies',(select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from pg_policies p
    where schemaname='public' and tablename in('universities','campuses','departments','posts','messages')),
  'indexes',(select coalesce(jsonb_agg(to_jsonb(i)),'[]'::jsonb) from pg_indexes i
    where schemaname='public' and tablename in('universities','campuses','departments','posts','messages')),
  'columns',(select coalesce(jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type)),'[]'::jsonb)
    from information_schema.columns where table_schema='public' and table_name in('universities','campuses','departments','messages')),
  'constraints',(select coalesce(jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'definition',pg_get_constraintdef(oid))),'[]'::jsonb)
    from pg_constraint where conrelid in('public.posts'::regclass,'public.messages'::regclass))
) as social_release_contract;
commit;
