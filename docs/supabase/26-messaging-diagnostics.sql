-- Salt okunur katalog kontrolü. Kullanıcı/mesaj satırı okumaz, veri veya izin değiştirmez.
select jsonb_build_object(
  'scope','KampusX messaging contract: metadata only; no user rows',
  'database',current_database(),
  'relations',jsonb_build_object('conversations',to_regclass('public.conversations'),'messages',to_regclass('public.messages')),
  'columns',coalesce((select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type,'nullable',is_nullable,'default',column_default) order by table_name,ordinal_position)
    from information_schema.columns where table_schema='public' and table_name in ('conversations','messages')),'[]'::jsonb),
  'functions',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_arguments(p.oid),'returns',pg_get_function_result(p.oid),'definition',pg_get_functiondef(p.oid)) order by n.nspname,p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and (p.proname in ('kx_start_conversation','kx_inbox','kx_mark_read') or p.proname ~ '(dm_|_dm|conversation|message)')),'[]'::jsonb),
  'policies',coalesce((select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public' and tablename in ('conversations','messages')),'[]'::jsonb),
  'table_grants',coalesce((select jsonb_agg(to_jsonb(g)) from information_schema.role_table_grants g where table_schema='public' and table_name in ('conversations','messages') and grantee in ('anon','authenticated')),'[]'::jsonb),
  'column_grants',coalesce((select jsonb_agg(to_jsonb(g)) from information_schema.column_privileges g where table_schema='public' and table_name in ('conversations','messages') and grantee in ('anon','authenticated')),'[]'::jsonb),
  'publications',coalesce((select jsonb_agg(to_jsonb(p)) from pg_publication_tables p where schemaname='public' and tablename in ('conversations','messages')),'[]'::jsonb)
) as messaging_contract;
