-- READ ONLY: Supabase SQL Editor'da tablo/policy sözleşmesini görmek için.
-- Kullanıcı kayıtlarını, şifreleri veya API anahtarlarını okumaz.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('profiles', 'posts')
order by table_name, ordinal_position;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('profiles', 'posts'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in ('profiles', 'posts'))
   or (n.nspname = 'storage' and c.relname = 'objects');

select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('profiles', 'posts');

select grantee, table_name, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('profiles', 'posts')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, column_name, privilege_type;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'uploads';
