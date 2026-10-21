-- SQL 20'yi geri alır. Veri ve sayaç trigger'ları korunur.
-- Önceki INSERT hedef politikasını aynen geri yükler; 42P17 sorunu da geri dönebilir.
-- İstemci sürüm kontrolü yeni yanıt yazımını güvenli biçimde kapatır.
begin;
drop trigger if exists kx_reply_depth_guard on public.posts;
drop function if exists public.kampusx_reply_contract_version();
drop function if exists private.kx_reply_depth_guard();
drop policy if exists posts_insert_target_visible on public.posts;
create policy posts_insert_target_visible on public.posts as restrictive
for insert to authenticated with check (
  (parent_id is null or exists (select 1 from public.posts t where t.id = posts.parent_id))
  and (repost_of_id is null or exists (select 1 from public.posts t where t.id = posts.repost_of_id))
);
drop function if exists private.kx_post_target_visible(uuid);
-- private USAGE Parça A tarafından da kullanılır; kaldırılmaz.
notify pgrst, 'reload schema';
commit;
