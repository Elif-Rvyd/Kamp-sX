-- SQL 19/20 sonrası. Kullanıcı tercihi kaydedilene kadar mevcut gizlilik korunur.
-- Yeni tablo yok. profiles'a kampüs ve görünürlük tercihleri eklenir.
-- Mevcut gerçek metadata boş profil alanlarına aktarılır; uydurma okul/veri yok.
-- uploads PUBLIC kalır: bilinen dosya URL'leri bu satır politikalarıyla gizlenmez.
-- Geri alma: 23-academic-account-visibility-rollback.sql (eklenen verileri korur).
begin;
do $$ begin
  if not exists(select 1 from pg_class where oid='public.profiles'::regclass and relrowsecurity)
    or not exists(select 1 from pg_class where oid='public.posts'::regclass and relrowsecurity)
    or to_regprocedure('private.is_blocked(uuid,uuid)') is null
    or to_regprocedure('public.handle_new_user()') is null then
    raise exception 'Beklenen canlı şema bulunamadı; işlem durduruldu.';
  end if;
end $$;
alter table public.profiles add column if not exists campus text;
alter table public.profiles add column if not exists visible_department boolean not null default false;
alter table public.profiles add column if not exists visible_campus boolean not null default false;
alter table public.profiles add column if not exists visible_university boolean not null default false;
alter table public.profiles add column if not exists visible_explore boolean not null default false;
alter table public.profiles add column if not exists audience_configured boolean not null default false;

update public.profiles p set
  university=coalesce(nullif(btrim(p.university),''),nullif(btrim(u.raw_user_meta_data->>'university_name'),'')),
  studying=coalesce(nullif(btrim(p.studying),''),nullif(btrim(u.raw_user_meta_data->>'department_name'),'')),
  campus=coalesce(nullif(btrim(p.campus),''),nullif(btrim(u.raw_user_meta_data->>'campus_name'),''),
    nullif(btrim(u.raw_user_meta_data->>'faculty_name'),'')),
  full_name=coalesce(nullif(btrim(p.full_name),''),nullif(btrim(u.raw_user_meta_data->>'full_name'),'')),
  bio=coalesce(p.bio,u.raw_user_meta_data->>'bio')
from auth.users u where p.user_id=u.id;

create or replace function private.kx_academic_profile_guard()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if current_user in ('authenticated','anon') and
     row(new.university,new.campus,new.studying) is distinct from row(old.university,old.campus,old.studying) then
    raise exception using errcode='42501',message='academic_fields_locked';
  end if;
  if tg_op='UPDATE' and (new.visible_department,new.visible_campus,new.visible_university,new.visible_explore)
    is distinct from (old.visible_department,old.visible_campus,old.visible_university,old.visible_explore) then
    new.audience_configured:=true;
  end if;
  return new;
end $$;
drop trigger if exists kx_academic_profile_guard on public.profiles;
create trigger kx_academic_profile_guard before update on public.profiles
for each row execute function private.kx_academic_profile_guard();
-- İlk kez hepsi kapalı kaydetmek de açık bir tercih sayılır.
create or replace function private.kx_audience_activate()
returns trigger language plpgsql security invoker set search_path=public as $$
begin new.audience_configured:=true; return new; end $$;
drop trigger if exists kx_audience_activate on public.profiles;
create trigger kx_audience_activate before update of visible_department,visible_campus,visible_university,visible_explore
on public.profiles for each row execute function private.kx_audience_activate();

create or replace function private.kx_auth_academic_guard()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if current_user not in ('postgres','supabase_admin') and
     (new.raw_user_meta_data->'university_name',new.raw_user_meta_data->'campus_name',
      new.raw_user_meta_data->'faculty_name',new.raw_user_meta_data->'department_name') is distinct from
     (old.raw_user_meta_data->'university_name',old.raw_user_meta_data->'campus_name',
      old.raw_user_meta_data->'faculty_name',old.raw_user_meta_data->'department_name') then
    raise exception using errcode='42501',message='academic_fields_locked';
  end if;
  return new;
end $$;
drop trigger if exists kx_auth_academic_guard on auth.users;
create trigger kx_auth_academic_guard before update of raw_user_meta_data on auth.users
for each row execute function private.kx_auth_academic_guard();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare wanted text; campus_value text;
  fallback text:='user_'||substr(replace(new.id::text,'-',''),1,10);
begin
  campus_value:=nullif(btrim(new.raw_user_meta_data->>'campus_name'),'');
  if exists(select 1 from unnest(array[new.raw_user_meta_data->>'university_name',campus_value,
      new.raw_user_meta_data->>'department_name']) value
      where nullif(btrim(value),'') is null or char_length(value)>150) then
    raise exception using errcode='23514',message='academic_fields_required';
  end if;
  wanted:=nullif(lower(btrim(new.raw_user_meta_data->>'username')),'');
  if wanted is null or wanted like '%@%' or char_length(wanted)>30 then wanted:=fallback; end if;
  begin
    insert into public.profiles(user_id,username,full_name,bio,university,campus,studying)
    values(new.id,wanted,left(new.raw_user_meta_data->>'full_name',50),left(new.raw_user_meta_data->>'bio',160),
      btrim(new.raw_user_meta_data->>'university_name'),campus_value,btrim(new.raw_user_meta_data->>'department_name'));
  exception when unique_violation then
    insert into public.profiles(user_id,username,full_name,bio,university,campus,studying)
    values(new.id,fallback,left(new.raw_user_meta_data->>'full_name',50),left(new.raw_user_meta_data->>'bio',160),
      btrim(new.raw_user_meta_data->>'university_name'),campus_value,btrim(new.raw_user_meta_data->>'department_name'));
  end;
  return new;
end $$;
create or replace function private.kx_sync_display_profile()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.profiles set full_name=left(new.raw_user_meta_data->>'full_name',50),
    bio=left(new.raw_user_meta_data->>'bio',160) where user_id=new.id;
  return new;
end $$;
drop trigger if exists kx_sync_display_profile on auth.users;
create trigger kx_sync_display_profile after update of raw_user_meta_data on auth.users
for each row when (old.raw_user_meta_data->'full_name' is distinct from new.raw_user_meta_data->'full_name'
  or old.raw_user_meta_data->'bio' is distinct from new.raw_user_meta_data->'bio')
execute function private.kx_sync_display_profile();

create or replace function private.kx_profile_in_audience(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select viewer is not null and viewer=(select auth.uid()) and (viewer=owner or (
    not private.is_blocked(viewer,owner) and exists(
      select 1 from public.profiles o left join public.profiles v on v.user_id=viewer
      where o.user_id=owner and (not o.audience_configured or o.visible_explore or
        (nullif(lower(btrim(v.university)),'')=nullif(lower(btrim(o.university)),'') and
          (o.visible_university or
            (nullif(lower(btrim(v.campus)),'')=nullif(lower(btrim(o.campus)),'') and
              (o.visible_campus or (o.visible_department and
                nullif(lower(btrim(v.studying)),'')=nullif(lower(btrim(o.studying)),'')))))))
    )));
$$;
create or replace function private.can_view_user_content(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select viewer is not null and viewer=(select auth.uid()) and (viewer=owner or (
    not private.is_blocked(viewer,owner) and exists(select 1 from public.profiles p where p.user_id=owner and
      case when p.audience_configured then private.kx_profile_in_audience(viewer,owner)
      else not p.is_private or exists(select 1 from public.follows f where f.follower_id=viewer
        and f.following_id=owner and f.status='accepted') end)
  ));
$$;
drop policy if exists kx_profile_audience on public.profiles;
create policy kx_profile_audience on public.profiles as restrictive for select to authenticated
using (private.kx_profile_in_audience((select auth.uid()),user_id));
drop policy if exists kx_post_audience on public.posts;
create policy kx_post_audience on public.posts as restrictive for select to authenticated
using (private.kx_profile_in_audience((select auth.uid()),user_id));
drop policy if exists kx_follow_audience on public.follows;
create policy kx_follow_audience on public.follows as restrictive for insert to authenticated
with check (private.kx_profile_in_audience((select auth.uid()),following_id));
create or replace function private.kx_post_target_visible(target uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.posts t where t.id=target and t.deleted_at is null
    and private.kx_profile_in_audience((select auth.uid()),t.user_id)
    and (t.user_id=(select auth.uid()) or
      (t.archived_at is null and private.can_view_user_content((select auth.uid()),t.user_id))));
$$;
grant select(campus,visible_department,visible_campus,visible_university,visible_explore,audience_configured)
on public.profiles to authenticated;
grant update(visible_department,visible_campus,visible_university,visible_explore) on public.profiles to authenticated;
revoke all on function private.kx_profile_in_audience(uuid,uuid),private.can_view_user_content(uuid,uuid),
  private.kx_academic_profile_guard(),private.kx_audience_activate(),private.kx_auth_academic_guard(),
  private.kx_sync_display_profile(),public.handle_new_user() from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.kx_profile_in_audience(uuid,uuid),private.can_view_user_content(uuid,uuid),
  private.kx_academic_profile_guard(),private.kx_audience_activate() to authenticated;
create or replace function public.kampusx_account_contract_version()
returns text language sql stable security invoker set search_path=public as $$
  select '2026102201'::text;
$$;
revoke all on function public.kampusx_account_contract_version() from public,anon;
grant execute on function public.kampusx_account_contract_version() to authenticated;
notify pgrst,'reload schema';
commit;
select public.kampusx_account_contract_version() as account_contract_version;
