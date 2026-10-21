-- 18 numaralı katalog çıktısındaki sabitleme kuralını geri getirir. Veri silmez.
begin;
drop policy if exists kx_uploads_delete_own_posts on storage.objects;
drop function if exists public.kampusx_owner_actions_version();
drop function if exists public.kampusx_soft_delete_post(uuid);
drop trigger if exists trg_pin_limit on public.posts;
create or replace function private.enforce_pin_limit()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.pinned_at is not null and old.pinned_at is null then
    if new.parent_id is not null then raise exception 'Yorumlar sabitlenemez'; end if;
    if (select count(*) from public.posts where user_id=new.user_id and pinned_at is not null
      and deleted_at is null and id<>new.id)>=3 then
      raise exception 'En fazla 3 gönderi sabitleyebilirsin';
    end if;
  end if;
  return new;
end $$;
create trigger trg_pin_limit before update of pinned_at on public.posts
for each row execute function private.enforce_pin_limit();
notify pgrst, 'reload schema';
commit;
