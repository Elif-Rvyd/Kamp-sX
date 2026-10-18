-- Yalnızca 20261018190000_follow_requests migration'ını geri alır.
-- Kullanıcı satırlarını/status değerlerini silmez veya değiştirmez.
-- Sonraki bir yetki migration'ı uygulandıysa önce snapshot ile farkını inceleyin.
begin;
set local lock_timeout = '5s';
do $$
declare snapshot jsonb; p record;
begin
  if to_regprocedure('private.kx_follow_guard()') is null then return; end if;
  snapshot := obj_description('private.kx_follow_guard()'::regprocedure,'pg_proc')::jsonb;
  if snapshot->>'migration' is distinct from '20261018190000' then
    raise exception 'Güvenilir geri alma snapshot bulunamadı. Değişiklik yapılmadı.';
  end if;
  drop trigger if exists kx_follow_guard on public.follows;
  drop trigger if exists kx_follow_broadcast on public.follows;
  drop trigger if exists kx_follow_block_lock on public.blocks;
  drop policy if exists kx_follow_receive on realtime.messages;
  drop policy if exists kx_follow_channel_guard on realtime.messages;
  drop policy if exists kx_follow_no_client_send on realtime.messages;
  for p in select policyname from pg_catalog.pg_policies where schemaname='public' and tablename='follows' loop
    execute format('drop policy %I on public.follows',p.policyname);
  end loop;
  revoke all on public.follows from public, anon, authenticated;
  revoke insert (follower_id,following_id,created_at,status), update (follower_id,following_id,created_at,status),
    select (follower_id,following_id,created_at,status), references (follower_id,following_id,created_at,status)
    on public.follows from public, anon, authenticated;
  execute snapshot->>'restore_sql';
  drop function if exists public.kampusx_follow_requests_version();
  drop function if exists private.kx_follow_requests_version();
  drop function if exists private.kx_follow_broadcast();
  drop function if exists private.kx_follow_block_lock();
  drop function if exists private.kx_follow_pair_lock(uuid,uuid);
  drop function if exists private.kx_follow_guard();
end $$;
commit;
