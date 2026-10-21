-- Mevcut posts tablosu kullanılır. Satır silmez; sayaçları, posts RLS'ini ve bucket görünürlüğünü değiştirmez.
-- Storage'a yalnızca oturum sahibinin post klasörü için DELETE politikası ekler.
-- Önce 19 ve 20 uygulanmış olmalı. Geri alma: 22-owner-post-actions-rollback.sql.
begin;
do $$
begin
  if not exists (select 1 from pg_class where oid='public.posts'::regclass and relrowsecurity)
    or not has_column_privilege('authenticated','public.posts','deleted_at','UPDATE')
    or not has_column_privilege('authenticated','public.posts','archived_at','UPDATE')
    or not has_column_privilege('authenticated','public.posts','pinned_at','UPDATE') then
    raise exception 'Mevcut RLS ve sahip UPDATE izinleri eksik; değişiklik yapılmadı.';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.posts'::regclass
    and tgname='trg_pin_limit' and tgfoid='private.enforce_pin_limit()'::regprocedure) then
    raise exception 'Beklenen sabitleme triggerı bulunamadı; değişiklik yapılmadı.';
  end if;
end $$;

create or replace function private.enforce_pin_limit()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  -- Aynı hesabın eşzamanlı sabitlemeleri de aynı kilitten geçer.
  perform pg_advisory_xact_lock(hashtextextended('kampusx:pin:' || new.user_id::text, 0));
  if new.archived_at is not null or new.deleted_at is not null then
    new.pinned_at := null;
  elsif new.pinned_at is not null then
    if new.parent_id is not null then
      raise exception using errcode='23514', message='pin_reply_forbidden';
    end if;
    if tg_op='INSERT' or old.pinned_at is null then
      if (select count(*) from public.posts p where p.user_id=new.user_id
          and p.pinned_at is not null and p.deleted_at is null
          and p.archived_at is null and p.id<>new.id) >= 3 then
        raise exception using errcode='23514', message='pin_limit';
      end if;
      new.pinned_at := now();
    end if;
  end if;
  return new;
end $$;
revoke all on function private.enforce_pin_limit() from public, anon;
grant execute on function private.enforce_pin_limit() to authenticated;
drop trigger if exists trg_pin_limit on public.posts;
create trigger trg_pin_limit before insert or update of pinned_at, archived_at, deleted_at
on public.posts for each row execute function private.enforce_pin_limit();

-- Silinen satır SELECT'ten tamamen gizli kalır. Dar RPC yalnızca auth.uid() sahibini siler.
create or replace function public.kampusx_soft_delete_post(p_post_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare actor uuid:=(select auth.uid());
begin
  if actor is null then raise exception using errcode='42501',message='post_unavailable'; end if;
  perform 1 from public.posts where id=p_post_id and user_id=actor for update;
  if not found then raise exception using errcode='42501',message='post_unavailable'; end if;
  update public.posts set deleted_at=coalesce(deleted_at,now()),pinned_at=null
    where id=p_post_id and user_id=actor;
  return true;
end $$;
revoke all on function public.kampusx_soft_delete_post(uuid) from public,anon;
grant execute on function public.kampusx_soft_delete_post(uuid) to authenticated;

create or replace function public.kampusx_owner_actions_version()
returns text language sql stable security invoker set search_path=public
as $$ select case when exists (select 1 from pg_trigger where tgrelid='public.posts'::regclass
  and tgname='trg_pin_limit' and tgenabled in ('O','A')
  and tgfoid='private.enforce_pin_limit()'::regprocedure)
  and to_regprocedure('public.kampusx_soft_delete_post(uuid)') is not null
  then '2026102201'::text else null::text end $$;
revoke all on function public.kampusx_owner_actions_version() from public, anon;
grant execute on function public.kampusx_owner_actions_version() to authenticated;
-- Yalnızca kendi post klasöründeki dosyaları silebilir; bucket görünürlüğü değişmez.
drop policy if exists kx_uploads_delete_own_posts on storage.objects;
create policy kx_uploads_delete_own_posts on storage.objects for delete to authenticated
using (bucket_id='uploads' and (storage.foldername(name))[1]=(select auth.uid())::text
  and (storage.foldername(name))[2]='post');
notify pgrst, 'reload schema';
commit;
select public.kampusx_owner_actions_version() as owner_actions_version;
