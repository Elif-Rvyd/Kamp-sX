-- Additive registration guard. Run before 31-academic-catalog-seed.sql, then deploy the client.
-- Old accounts/profile IDs are preserved. No automatic consent backfill, no user data deletion.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $preflight$
begin
 if to_regclass('public.universities') is null or to_regclass('public.campuses') is null
   or to_regclass('public.departments') is null or to_regprocedure('public.handle_new_user()') is null then
   raise exception 'Expected academic schema missing; no changes applied';
 end if;
 if to_regclass('private.registration_acceptances') is not null
   and coalesce(obj_description(to_regclass('private.registration_acceptances'),'pg_class'),'') <> 'KampusX registration acceptance 2026102203' then
   raise exception 'Unrecognized acceptance table; inspect before installing';
 end if;
end $preflight$;
alter table public.universities add column if not exists catalog_verified boolean not null default false;
alter table public.universities add column if not exists catalog_source text;
alter table public.campuses add column if not exists catalog_verified boolean not null default false;
alter table public.campuses add column if not exists catalog_source text;
alter table public.departments add column if not exists catalog_verified boolean not null default false;
alter table public.departments add column if not exists catalog_source text;

do $acl$
declare relation text; col text;
begin
 foreach relation in array array['universities','campuses','departments'] loop
   execute format('alter table public.%I enable row level security',relation);
   execute format('revoke insert,update,delete,truncate,references,trigger on public.%I from public,anon,authenticated',relation);
   if current_setting('server_version_num')::int>=170000 then execute format('revoke maintain on public.%I from public,anon,authenticated',relation); end if;
   for col in select attname from pg_attribute where attrelid=to_regclass('public.'||relation) and attnum>0 and not attisdropped loop
     execute format('revoke insert(%I),update(%I),references(%I) on public.%I from public,anon,authenticated',col,col,col,relation);
   end loop;
   execute format('grant select(id,name) on public.%I to anon,authenticated',relation);
   execute format('drop policy if exists kx_catalog_verified_only on public.%I',relation);
   execute format('create policy kx_catalog_verified_only on public.%I as restrictive for select to anon,authenticated using(catalog_verified)',relation);
   execute format('drop policy if exists kx_catalog_read on public.%I',relation);
   execute format('create policy kx_catalog_read on public.%I for select to anon,authenticated using(true)',relation);
 end loop;
end $acl$;

create table if not exists private.registration_acceptances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 terms_version text not null,
 privacy_version text not null,
 accepted_at timestamptz not null default clock_timestamp()
);
comment on table private.registration_acceptances is 'KampusX registration acceptance 2026102203';
alter table private.registration_acceptances enable row level security;
revoke all on private.registration_acceptances from public,anon,authenticated;

create or replace function private.kx_registration_guard() returns trigger
language plpgsql security definer set search_path=public as $fn$
declare university uuid; metadata jsonb := new.raw_user_meta_data;
begin
 if metadata->'terms_accepted' is distinct from 'true'::jsonb
   or metadata->'privacy_acknowledged' is distinct from 'true'::jsonb
   or metadata->>'terms_version' is distinct from '2026-10-22'
   or metadata->>'privacy_version' is distinct from '2026-10-22' then
   raise exception using errcode='23514',message='legal_acceptance_required';
 end if;
 select u.id into university from public.universities u
   where u.catalog_verified and u.name=btrim(metadata->>'university_name') order by u.id limit 1;
 if university is null
   or not exists(select 1 from public.campuses c where c.university_id=university and c.catalog_verified and c.name=btrim(metadata->>'campus_name'))
   or not exists(select 1 from public.departments d where d.university_id=university and d.catalog_verified and d.name=btrim(metadata->>'department_name')) then
   raise exception using errcode='23514',message='academic_catalog_selection_required';
 end if;
 return new;
end $fn$;
create or replace function private.kx_registration_receipt() returns trigger
language plpgsql security definer set search_path=public as $fn$
begin
 insert into private.registration_acceptances(user_id,terms_version,privacy_version)
   values(new.id,new.raw_user_meta_data->>'terms_version',new.raw_user_meta_data->>'privacy_version') on conflict do nothing;
 return new;
end $fn$;
drop trigger if exists kx_registration_guard on auth.users;
create trigger kx_registration_guard before insert on auth.users for each row execute function private.kx_registration_guard();
drop trigger if exists kx_registration_receipt on auth.users;
create trigger kx_registration_receipt after insert on auth.users for each row execute function private.kx_registration_receipt();

-- Do not replace the existing academic resolver or handle_new_user function.
-- Protect IDs too: changing a related foreign key must not bypass the locked display fields.
create or replace function private.kx_registration_profile_lock() returns trigger
language plpgsql security invoker set search_path=public as $fn$
begin
 if current_user in('anon','authenticated') then
   if (to_jsonb(new)->'university',to_jsonb(new)->'campus',to_jsonb(new)->'studying',to_jsonb(new)->'university_id',to_jsonb(new)->'campus_id',to_jsonb(new)->'department_id',to_jsonb(new)->'faculty_id')
     is distinct from (to_jsonb(old)->'university',to_jsonb(old)->'campus',to_jsonb(old)->'studying',to_jsonb(old)->'university_id',to_jsonb(old)->'campus_id',to_jsonb(old)->'department_id',to_jsonb(old)->'faculty_id') then
     raise exception using errcode='42501',message='academic_fields_locked';
   end if;
 end if;
 return new;
end $fn$;
drop trigger if exists zz_kx_registration_profile_lock on public.profiles;
create trigger zz_kx_registration_profile_lock before update on public.profiles for each row execute function private.kx_registration_profile_lock();
revoke all on function private.kx_registration_guard(),private.kx_registration_receipt(),private.kx_registration_profile_lock() from public,anon,authenticated;
create or replace function public.kx_registration_contract_version() returns text language sql stable set search_path=public as $fn$ select '2026102203'::text; $fn$;
revoke all on function public.kx_registration_contract_version() from public;
grant execute on function public.kx_registration_contract_version() to anon,authenticated;
notify pgrst,'reload schema';
commit;
select public.kx_registration_contract_version() as registration_contract_version;
