-- SADECE OKUMA: public.posts yapısını ve mevcut izinlerini gösterir.
-- Tablo/policy oluşturmaz; izinleri ve kullanıcı verilerini değiştirmez.
-- Gönderileri, kullanıcı kayıtlarını, şifreleri veya API anahtarlarını okumaz.
-- Supabase > SQL Editor > New query: tamamını yapıştırıp Run seçin.
-- post_save_diagnostics hücresindeki JSON sonucunu kopyalayın.
select jsonb_pretty(jsonb_build_object(
  'table_exists', to_regclass('public.posts') is not null,
  'rls_enabled', (
    select c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'posts'
  ),
  'authenticated_schema_usage', has_schema_privilege('authenticated', 'public', 'USAGE'),
  'columns', (
    select jsonb_agg(jsonb_build_object(
      'name', column_name,
      'type', data_type,
      'database_type', udt_schema || '.' || udt_name,
      'nullable', is_nullable,
      'default', column_default,
      'identity', is_identity,
      'generated', is_generated,
      'authenticated_select', has_column_privilege(
        'authenticated', to_regclass('public.posts'), column_name, 'SELECT'
      ),
      'authenticated_insert', has_column_privilege(
        'authenticated', to_regclass('public.posts'), column_name, 'INSERT'
      )
    ) order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'posts'
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object(
      'name', policyname,
      'type', permissive,
      'roles', roles,
      'operation', cmd,
      'using', qual,
      'with_check', with_check
    ) order by policyname)
    from pg_policies where schemaname = 'public' and tablename = 'posts'
  ),
  'table_grants', (
    select jsonb_agg(jsonb_build_object(
      'role', grantee, 'permission', privilege_type
    ) order by grantee, privilege_type)
    from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'posts'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
  ),
  'column_grants', (
    select jsonb_agg(jsonb_build_object(
      'role', grantee, 'column', column_name, 'permission', privilege_type
    ) order by grantee, column_name, privilege_type)
    from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'posts'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_object(
      'name', conname, 'definition', pg_get_constraintdef(oid)
    ) order by conname)
    from pg_constraint where conrelid = to_regclass('public.posts')
  ),
  'enum_values', (
    select jsonb_agg(jsonb_build_object(
      'column', a.attname, 'value', e.enumlabel
    ) order by a.attnum, e.enumsortorder)
    from pg_attribute a join pg_enum e on e.enumtypid = a.atttypid
    where a.attrelid = to_regclass('public.posts') and a.attnum > 0 and not a.attisdropped
  ),
  'triggers', (
    select jsonb_agg(jsonb_build_object(
      'name', tgname, 'definition', pg_get_triggerdef(oid)
    ) order by tgname)
    from pg_trigger where tgrelid = to_regclass('public.posts') and not tgisinternal
  )
)) as post_save_diagnostics;
