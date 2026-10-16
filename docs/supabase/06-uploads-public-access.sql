-- KampüsX'in istenen public profil/gönderi medyası için mevcut uploads bucket ayarı.
-- Public URL'ye sahip herkes bu bucket'taki dosyaları görüntüleyebilir.
-- Yeni tablo/bucket oluşturmaz; dosyaları, profil satırlarını ve yazma policy'lerini değiştirmez.
-- SQL Editor > New query > dosyanın tamamını yapıştır > Run.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'uploads') then
    raise exception 'Bu Supabase projesinde uploads bucket bulunamadı. Uygulamanın bağlı olduğu KampüsX projesini kontrol edin. Yeni bucket oluşturulmadı.';
  end if;
end $$;

with previous as materialized (
  select id, name, public as was_public from storage.buckets where id = 'uploads'
), changed as (
  update storage.buckets b set public = true
  from previous p where b.id = p.id
  returning b.id, b.name, p.was_public, b.public
)
select * from changed;
