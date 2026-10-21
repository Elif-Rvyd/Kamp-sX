-- Hiçbir dosya/veri silmez. Önceki SQL 11 davranışını (uploads DELETE kapalı) geri getirir.
begin;
drop policy if exists kx_uploads_delete_unreferenced on storage.objects;
drop policy if exists kampusx_uploads_guard_delete on storage.objects;
create policy kampusx_uploads_guard_delete on storage.objects as restrictive for delete to public
using (bucket_id<>'uploads');
drop function if exists private.kx_can_delete_post_media(text);
notify pgrst,'reload schema';
commit;
