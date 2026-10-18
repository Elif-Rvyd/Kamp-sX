-- Parça A öncesi SALT OKUNUR şema ve izin kontrolü.
-- Supabase > SQL Editor > New query: dosyanın tamamını çalıştırın.
-- Sonuçtaki follow_part_a_diagnostics hücresini metin/JSON olarak kopyalayın.
-- Tablo, policy, fonksiyon, veri, Storage veya Auth ayarı değiştirmez.
-- Kullanıcı kayıtlarını, e-postaları, oturumları veya anahtarları okumaz.
-- Ekran görüntüsünde kesilen koşulları pg_catalog üzerinden tam metin getirir.

begin read only;

with
  relations as (
    select c.oid, n.nspname as schema_name, c.relname as table_name,
      c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls,
      c.relreplident as replica_identity
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and (
        (n.nspname = 'public' and c.relname in ('profiles', 'follows', 'blocks', 'posts', 'likes'))
        or (n.nspname = 'realtime' and c.relname = 'messages')
      )
  ),
  relevant_functions as (
    select p.oid, n.nspname as schema_name, p.proname as function_name,
      pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef as security_definer, p.proconfig as settings,
      pg_catalog.pg_get_functiondef(p.oid) as definition
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where p.prokind = 'f'
      and (
        (n.nspname = 'private' and p.proname in ('is_blocked', 'can_view_user_content', 'on_block'))
        or exists (
          select 1 from pg_catalog.pg_trigger t
          join relations r on r.oid = t.tgrelid
          where t.tgfoid = p.oid and not t.tgisinternal
            and r.schema_name = 'public' and r.table_name in ('follows', 'blocks')
        )
      )
  )
select jsonb_build_object(
  'scope', 'KampusX Part A: metadata only; no user rows',
  'relations', (
    select coalesce(jsonb_agg(to_jsonb(r) - 'oid' order by r.schema_name, r.table_name), '[]'::jsonb)
    from relations r
  ),
  'columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', r.schema_name, 'table', r.table_name, 'name', a.attname,
      'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
      'nullable', not a.attnotnull,
      'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    ) order by r.schema_name, r.table_name, a.attnum), '[]'::jsonb)
    from relations r
    join pg_catalog.pg_attribute a on a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped
    left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where r.schema_name = 'public' and r.table_name in ('profiles', 'follows', 'blocks')
  ),
  'constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', c.conname, 'validated', c.convalidated,
      'definition', pg_catalog.pg_get_constraintdef(c.oid, true)
    ) order by r.table_name, c.conname), '[]'::jsonb)
    from relations r join pg_catalog.pg_constraint c on c.conrelid = r.oid
    where r.schema_name = 'public' and r.table_name in ('profiles', 'follows', 'blocks')
  ),
  'indexes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', c.relname, 'valid', i.indisvalid,
      'definition', pg_catalog.pg_get_indexdef(i.indexrelid)
    ) order by c.relname), '[]'::jsonb)
    from pg_catalog.pg_index i
    join relations r on r.oid = i.indrelid
    join pg_catalog.pg_class c on c.oid = i.indexrelid
    where r.schema_name = 'public' and r.table_name = 'follows'
  ),
  'policies', (
    select coalesce(jsonb_agg(to_jsonb(p) order by p.schemaname, p.tablename, p.policyname), '[]'::jsonb)
    from pg_catalog.pg_policies p
    where exists (
      select 1 from relations r where r.schema_name = p.schemaname and r.table_name = p.tablename
    )
  ),
  'table_grants', (
    select coalesce(jsonb_agg(to_jsonb(g) order by g.table_name, g.grantee, g.privilege_type), '[]'::jsonb)
    from information_schema.table_privileges g
    where g.table_schema = 'public' and g.table_name in ('profiles', 'follows', 'blocks')
      and g.grantee in ('PUBLIC', 'anon', 'authenticated')
  ),
  'column_grants', (
    select coalesce(jsonb_agg(to_jsonb(g) order by g.table_name, g.column_name, g.grantee, g.privilege_type), '[]'::jsonb)
    from information_schema.column_privileges g
    where g.table_schema = 'public' and g.table_name in ('profiles', 'follows', 'blocks')
      and g.grantee in ('PUBLIC', 'anon', 'authenticated')
      and g.privilege_type in ('INSERT', 'UPDATE')
  ),
  'functions', (
    select coalesce(jsonb_agg((to_jsonb(f) - 'oid') || jsonb_build_object(
      'authenticated_execute', pg_catalog.has_function_privilege('authenticated', f.oid, 'EXECUTE'),
      'anon_execute', pg_catalog.has_function_privilege('anon', f.oid, 'EXECUTE')
    ) order by f.schema_name, f.function_name, f.arguments), '[]'::jsonb)
    from relevant_functions f
  ),
  'schema_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', n.nspname,
      'authenticated_usage', pg_catalog.has_schema_privilege('authenticated', n.oid, 'USAGE'),
      'anon_usage', pg_catalog.has_schema_privilege('anon', n.oid, 'USAGE')
    ) order by n.nspname), '[]'::jsonb)
    from pg_catalog.pg_namespace n where n.nspname in ('private', 'realtime')
  ),
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', r.table_name, 'name', t.tgname, 'enabled', t.tgenabled,
      'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
    ) order by r.table_name, t.tgname), '[]'::jsonb)
    from relations r join pg_catalog.pg_trigger t on t.tgrelid = r.oid and not t.tgisinternal
    where r.schema_name = 'public' and r.table_name in ('follows', 'blocks')
  ),
  'publication_exists', exists (
    select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime'
  ),
  'follows_publications', (
    select coalesce(jsonb_agg(to_jsonb(p) order by p.pubname), '[]'::jsonb)
    from pg_catalog.pg_publication_tables p
    where p.schemaname = 'public' and p.tablename = 'follows'
  ),
  'publication_settings', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', p.pubname, 'all_tables', p.puballtables,
      'insert', p.pubinsert, 'update', p.pubupdate, 'delete', p.pubdelete, 'truncate', p.pubtruncate
    ) order by p.pubname), '[]'::jsonb)
    from pg_catalog.pg_publication p
    where p.pubname = 'supabase_realtime' or exists (
      select 1 from pg_catalog.pg_publication_tables t
      where t.pubname = p.pubname and t.schemaname = 'public' and t.tablename = 'follows'
    )
  )
) as follow_part_a_diagnostics;

commit;
