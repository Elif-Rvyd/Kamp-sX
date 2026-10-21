-- Yalnızca SQL 19'u geri alır; başlangıçtaki altı SELECT izni korunur.
-- Veri veya tablo silmez. Bu alanları okuyan yeni istemci akışları tekrar kapanır.
-- Sonradan başka bir kurulum da aynı izinleri kullanıyorsa geri almadan değerlendirin.
begin;
revoke select (
  parent_id, repost_of_id, archived_at, deleted_at, pinned_at,
  likes_count, replies_count, reposts_count
) on public.posts from authenticated;
commit;
