-- Salt okunur teşhis: dosya, kullanıcı, anahtar veya token içeriklerini döndürmez.
-- Supabase > SQL Editor > New query > tamamını yapıştır > Run.
select jsonb_build_object(
  'objects_rls_enabled', (
    select relrowsecurity from pg_class where oid = 'storage.objects'::regclass
  ),
  'uploads_bucket', (
    select jsonb_build_object(
      'id', id, 'public', public, 'file_size_limit', file_size_limit,
      'allowed_mime_types', allowed_mime_types
    ) from storage.buckets where id = 'uploads'
  ),
  'object_policies', (
    select jsonb_agg(jsonb_build_object(
      'name', policyname, 'kind', permissive, 'roles', roles,
      'operation', cmd, 'using', qual, 'with_check', with_check
    ) order by policyname)
    from pg_policies where schemaname = 'storage' and tablename = 'objects'
  )
) as storage_security_diagnostics;
