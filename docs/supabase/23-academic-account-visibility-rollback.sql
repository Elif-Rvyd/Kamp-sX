-- Yeni sütunlar, kullanıcı tercihleri ve gerçek metadata'dan aktarılan bilgiler SİLİNMEZ.
-- Bu alanların davranışı kapanır; 23 yeniden çalıştırılınca tercihler yeniden kullanılır.
begin;
drop policy if exists kx_profile_audience on public.profiles;
drop policy if exists kx_post_audience on public.posts;
drop policy if exists kx_follow_audience on public.follows;
drop trigger if exists kx_academic_profile_guard on public.profiles;
drop trigger if exists kx_audience_activate on public.profiles;
drop trigger if exists kx_auth_academic_guard on auth.users;
drop trigger if exists kx_sync_display_profile on auth.users;
create or replace function private.can_view_user_content(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select viewer is not null and (viewer=owner or (
    not private.is_blocked(viewer,owner) and (
      not coalesce((select p.is_private from public.profiles p where p.user_id=owner),true)
      or exists(select 1 from public.follows f where f.follower_id=viewer and f.following_id=owner and f.status='accepted'))));
$$;
create or replace function private.kx_post_target_visible(target uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.posts t where t.id=target and t.deleted_at is null
    and (t.user_id=(select auth.uid()) or (t.archived_at is null and private.can_view_user_content((select auth.uid()),t.user_id))));
$$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare wanted text; fallback text:='user_'||substr(replace(new.id::text,'-',''),1,10);
begin
  wanted:=nullif(lower(btrim(coalesce(new.raw_user_meta_data->>'username',''))),'');
  if wanted is null or wanted like '%@%' or char_length(wanted)>30 then wanted:=fallback; end if;
  begin insert into public.profiles(user_id,username) values(new.id,wanted);
  exception when unique_violation then insert into public.profiles(user_id,username) values(new.id,fallback); end;
  return new;
end $$;
revoke update(visible_department,visible_campus,visible_university,visible_explore) on public.profiles from authenticated;
revoke select(campus,visible_department,visible_campus,visible_university,visible_explore,audience_configured) on public.profiles from authenticated;
drop function if exists public.kampusx_account_contract_version();
drop function if exists private.kx_academic_profile_guard();
drop function if exists private.kx_audience_activate();
drop function if exists private.kx_auth_academic_guard();
drop function if exists private.kx_sync_display_profile();
drop function if exists private.kx_profile_in_audience(uuid,uuid);
notify pgrst,'reload schema';
commit;
