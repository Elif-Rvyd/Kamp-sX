-- SADECE OKUMA. Tablo/policy oluşturmaz, silmez veya değiştirmez.
-- Kullanıcı satırlarını, fotoğrafları, şifreleri veya API anahtarlarını okumaz.
-- Supabase SQL Editor > New query > Run. Tek hücredeki JSON sonucu kopyalanabilir.
select jsonb_pretty(jsonb_build_object(
  'table_exists', to_regclass('public.profiles') is not null,
  'rls_enabled', (
    select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles'
  ),
  'columns', (
    select jsonb_agg(jsonb_build_object(
      'name', column_name, 'type', data_type, 'nullable', is_nullable, 'default', column_default
    ) order by ordinal_position)
    from information_schema.columns where table_schema = 'public' and table_name = 'profiles'
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object(
      'name', policyname, 'type', permissive, 'roles', roles,
      'operation', cmd, 'using', qual, 'with_check', with_check
    ) order by policyname)
    from pg_policies where schemaname = 'public' and tablename = 'profiles'
  ),
  'column_grants', (
    select jsonb_agg(jsonb_build_object(
      'role', grantee, 'column', column_name, 'permission', privilege_type
    ) order by grantee, column_name, privilege_type)
    from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'profiles'
      and grantee in ('PUBLIC', 'anon', 'authenticated')
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_object('name', conname, 'definition', pg_get_constraintdef(oid)))
    from pg_constraint where conrelid = to_regclass('public.profiles')
  )
)) as profile_save_diagnostics;
