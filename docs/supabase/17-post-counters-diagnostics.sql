-- Parça B / SALT OKUNUR katalog kontrolü.
-- Supabase > SQL Editor > New query: dosyanın TAMAMINI çalıştırın.
-- post_counters_diagnostics hücresindeki TAM JSON metnini paylaşın.
-- Kullanıcı, gönderi veya beğeni satırlarını okumaz; veri/izin/şema değiştirmez.
-- Mevcut sayaç trigger'larının ikinci kez sayım yapmasını önlemek için gereklidir.
begin read only;

with relations as (
  select c.oid, n.nspname as schema_name, c.relname as table_name,
    c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls,
    pg_catalog.pg_get_userbyid(c.relowner) as owner
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('posts', 'likes')
    and c.relkind in ('r', 'p')
), trigger_functions as (
  select distinct p.oid, n.nspname as schema_name, p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer, p.proconfig as settings,
    pg_catalog.pg_get_userbyid(p.proowner) as owner,
    pg_catalog.pg_get_functiondef(p.oid) as definition
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.prokind = 'f' and (
    exists (
      select 1 from pg_catalog.pg_trigger t join relations r on r.oid = t.tgrelid
      where t.tgfoid = p.oid and not t.tgisinternal
    ) or (
      n.nspname = 'private'
      and p.prosrc ~* '(likes_count|replies_count|reposts_count|comments_count)'
    )
  )
)
select jsonb_build_object(
  'scope', 'KampusX Part B: metadata only; no user rows',
  'database', current_database(),
  'requested_relations', jsonb_build_object(
    'public.posts', pg_catalog.to_regclass('public.posts')::text,
    'public.likes', pg_catalog.to_regclass('public.likes')::text
  ),
  'matching_tables_any_schema', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', n.nspname, 'table', c.relname
    ) order by n.nspname, c.relname), '[]'::jsonb)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where lower(c.relname) in ('posts', 'likes') and c.relkind in ('r', 'p')
  ),
  'relations', (
    select coalesce(jsonb_agg(to_jsonb(r) - 'oid' order by r.table_name), '[]'::jsonb)
    from relations r
  ),
  'columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', a.attname,
      'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
      'nullable', not a.attnotnull,
      'generated', a.attgenerated,
      'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    ) order by r.table_name, a.attnum), '[]'::jsonb)
    from relations r
    join pg_catalog.pg_attribute a on a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped
    left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  ),
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', t.tgname,
      'enabled', t.tgenabled, 'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
    ) order by r.table_name, t.tgname), '[]'::jsonb)
    from relations r join pg_catalog.pg_trigger t on t.tgrelid = r.oid
    where not t.tgisinternal
  ),
  'functions', (
    select coalesce(jsonb_agg(to_jsonb(f) - 'oid' order by f.schema_name, f.function_name, f.arguments), '[]'::jsonb)
    from trigger_functions f
  ),
  'constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', c.conname, 'validated', c.convalidated,
      'definition', pg_catalog.pg_get_constraintdef(c.oid, true)
    ) order by r.table_name, c.conname), '[]'::jsonb)
    from relations r join pg_catalog.pg_constraint c on c.conrelid = r.oid
  ),
  'indexes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', c.relname, 'valid', i.indisvalid,
      'definition', pg_catalog.pg_get_indexdef(i.indexrelid)
    ) order by r.table_name, c.relname), '[]'::jsonb)
    from relations r join pg_catalog.pg_index i on i.indrelid = r.oid
    join pg_catalog.pg_class c on c.oid = i.indexrelid
  ),
  'policies', (
    select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
    from pg_catalog.pg_policies p
    where p.schemaname = 'public' and p.tablename in ('posts', 'likes')
  ),
  'table_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name,
      'grantee', case when x.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(x.grantee) end,
      'privilege', x.privilege_type, 'grantable', x.is_grantable
    ) order by r.table_name, x.grantee, x.privilege_type), '[]'::jsonb)
    from relations r join pg_catalog.pg_class c on c.oid = r.oid
    cross join lateral pg_catalog.aclexplode(coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))) x
  ),
  'column_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'column', a.attname,
      'grantee', case when x.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(x.grantee) end,
      'privilege', x.privilege_type, 'grantable', x.is_grantable
    ) order by r.table_name, a.attnum, x.grantee, x.privilege_type), '[]'::jsonb)
    from relations r join pg_catalog.pg_attribute a on a.attrelid = r.oid
    cross join lateral pg_catalog.aclexplode(a.attacl) x
    where a.attnum > 0 and not a.attisdropped
  )
) as post_counters_diagnostics;

commit;
