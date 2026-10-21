-- SALT OKUNUR: kalan istemci adımlarında canlı davranışı tahmin etmemek için.
-- Kullanıcı/gönderi satırı okumaz; tablo, izin, politika veya veri değiştirmez.
-- Uygulamanın bağlı olduğu projede SQL Editor > New query > tamamını çalıştırın.
-- Sonuçtaki social_client_contract hücresinin TAM metnini paylaşın.
begin read only;

with relations as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('profiles', 'posts', 'likes', 'bookmarks', 'blocks', 'reports')
    and c.relkind in ('r', 'p')
), functions as (
  select p.oid, n.nspname, p.proname,
    pg_catalog.pg_get_functiondef(p.oid) as definition
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.prokind = 'f' and (
    exists (
      select 1 from pg_catalog.pg_trigger t join relations r on r.oid = t.tgrelid
      where t.tgfoid = p.oid and not t.tgisinternal
    )
    or (n.nspname = 'private' and p.proname in ('enforce_pin_limit', 'can_view_user_content', 'is_blocked'))
    or (n.nspname in ('public', 'private') and p.proname = 'handle_new_user')
  )
)
select jsonb_build_object(
  'scope', 'KampusX social client contract: metadata only; no user rows',
  'database', current_database(),
  'relations', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname, 'rls', r.relrowsecurity
  ) order by r.relname), '[]'::jsonb) from relations r),
  'constraints', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname, 'name', c.conname,
    'definition', pg_catalog.pg_get_constraintdef(c.oid, true)
  ) order by r.relname, c.conname), '[]'::jsonb)
    from relations r join pg_catalog.pg_constraint c on c.conrelid = r.oid),
  'indexes', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname, 'definition', pg_catalog.pg_get_indexdef(i.indexrelid)
  ) order by r.relname, i.indexrelid), '[]'::jsonb)
    from relations r join pg_catalog.pg_index i on i.indrelid = r.oid),
  'policies', (select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
    from pg_catalog.pg_policies p where p.schemaname = 'public'
    and p.tablename in (select relname from relations)),
  'triggers', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname, 'name', t.tgname, 'enabled', t.tgenabled,
    'definition', pg_catalog.pg_get_triggerdef(t.oid, true)
  ) order by r.relname, t.tgname), '[]'::jsonb)
    from relations r join pg_catalog.pg_trigger t on t.tgrelid = r.oid where not t.tgisinternal),
  'functions', (select coalesce(jsonb_agg(jsonb_build_object(
    'schema', f.nspname, 'name', f.proname, 'definition', f.definition
  ) order by f.nspname, f.proname, f.oid), '[]'::jsonb) from functions f),
  'table_grants', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname,
    'role', case when a.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end,
    'privilege', a.privilege_type
  ) order by r.relname, a.grantee, a.privilege_type), '[]'::jsonb)
    from relations r join pg_catalog.pg_class c on c.oid = r.oid
    cross join lateral pg_catalog.aclexplode(coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))) a),
  'column_grants', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', r.relname, 'column', c.attname,
    'role', case when a.grantee = 0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end,
    'privilege', a.privilege_type
  ) order by r.relname, c.attnum, a.grantee, a.privilege_type), '[]'::jsonb)
    from relations r join pg_catalog.pg_attribute c on c.attrelid = r.oid
    cross join lateral pg_catalog.aclexplode(c.attacl) a
    where c.attnum > 0 and not c.attisdropped)
) as social_client_contract;

commit;
