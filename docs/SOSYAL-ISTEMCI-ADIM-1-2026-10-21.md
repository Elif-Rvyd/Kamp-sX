# Sosyal istemci uyarlaması — adım 1

> Sonraki katalog çıktısında `posts` için yalnızca altı temel SELECT izni bulundu.
> Önceki istemci testleri canlı sütun yetkilerinin tamam olduğunu kanıtlamıyordu.
> Eksik sekiz okuma izni ve yanıt adımı [adım 2 raporunda](SOSYAL-ISTEMCI-ADIM-2-2026-10-21.md)
> ele alındı; SQL 19 canlıda uygulanmadan yeni sayaç okumaları çalışmaz.

Tarih: 21 Ekim 2026. Kaynak: kullanıcının son paylaştığı canlı veritabanı sözleşmesi.
Kullanıcı A ve B'nin kurulduğunu bildirdi. Canlı veritabanına bu çalışma sırasında SQL uygulanmadı;
gerçek kullanıcıya ait gönderi, beğeni, dosya veya takip kaydı oluşturulmadı/silinmedi. Commit/push yapılmadı.

## İlk incelemede bulunanlar

- Angular/Nx, atomic shared/ui, tema değişkenleri ve TR/EN yapısı korunuyor.
- Gerçek Auth, medya yükleme ve posts tablosuna temel gönderi ekleme mevcut.
- FollowsService takip isteklerini ve özel Broadcast ile yeniden okumayı destekliyor.
- Beğeni/kaydetme eski post_likes/post_bookmarks adlarını ve kampusx_set_reaction RPC'sini kullanıyordu.
- Yanıtlar, diğer gönderi menüsü işlemleri ve engelleme de eski sözleşmeden kalan yollar içeriyor.
  Bunların yeni şemaya uyumu bu ilk adımda tamamlandı sayılmaz.
- Profil metin alanları Auth metadata akışını kullanıyor; profiles senkronizasyonu ve gerçek katılım
  tarihi sonraki adım. Kullanıcı adı müsaitliği ve atanan adın düzenlenmesi de henüz eklenmedi.
- Üniversite/Kampüs/Bölüm sekmelerinde kapsam filtreleri henüz yok. Kullanıcı/gönderi araması yerelde mevcut.

## Tamamlanan ilk öncelik

Beğeni ve kaydetme artık public.likes/public.bookmarks kullanıyor. Sadece user_id/post_id yazılır.
Beğeniyi/kaydı kaldırma sorguları hem kullanıcıyı hem gönderiyi filtreler. İstemci hiçbir sayaç sütununa
yazmaz; posts.likes_count, replies_count ve reposts_count okunur. Sorgular mevcut CLI üretimi Database
tipiyle denetlenir; yeni tablo, policy, RPC veya yetki eklenmedi.

Başlangıçta ilişkiler ve sayaçlar toplu okunur. Bilinen duruma göre anlık arayüz güncellemesi yapılır;
gönderi başına kilit çift tıklamayı engeller. Yazma sonrası üyelik ve sayaç yeniden doğrulanır.
23505 tekrar kayıt hatası ikinci bir artış üretmez. Hata veya kaybolmuş yanıt durumunda geçici görünüm
geri alınır, işlem düğmeleri kapatılır ve tek hata/tekrar okuma eylemi gösterilir. Tekrar deneme yeni
INSERT/DELETE göndermez; sunucudaki durumu okur. Oturum değişiminden sonra eski yanıt uygulanamaz.

Kaydedilenler listesi bookmarks üzerinden görünür posts satırlarını inner ilişkiyle okur.
Görünürlük RLS'e bırakılır; bu yeni yola istemci gizlilik filtresi eklenmedi. Mevcut boş durum,
hata/tekrar dene ve sayfalama bileşenleri kullanılır.

## Değişen dosyalar

- apps/shell/src/app/core/post-actions.service.ts: gerçek tablolar, doğrulanan sayaçlar, güvenli tekrar okuma.
- apps/shell/src/app/features/posts/post-entry.component.ts: tek hata ve tekrar okuma geri bildirimi.
- scripts/post-actions.test.cjs: gerçek ilişki işlemleri ve hata/oturum/tekrar senaryoları.
- scripts/e2e/mock-social.cjs: yeni yollar için izin verilen payload/sütunları denetleyen HTTP fixture.
- scripts/e2e/post-actions.spec.cjs: gerçek tablo istekleri, beğeniyi geri alma, kaydedilenler ve axe kontrolleri.
- README.md, DESIGN.md, UX-CONTRACT.md ve durum raporu: güncel kaynak ve tamamlanan kapsam.
- docs/supabase/18-social-client-contract-diagnostics.sql: sonraki adımlar için salt okunur katalog sorgusu.

Önceden mevcut yerel kullanıcı araması değişiklikleri korundu; bu liste onları yeniden yapılmış saymaz.

## Doğrulama

Tarayıcı testleri gerçek Chromium
ve Supabase SDK'sını izole HTTP/Realtime fixture'larıyla çalıştırır; canlı RLS testi yerine geçmez.

- npm test: 154/154 geçti.
- npm run typecheck: geçti.
- npm run test:ui -- scripts/e2e/post-actions.spec.cjs scripts/e2e/search.spec.cjs: 24/24 geçti.
- npm run test:security: 12/12 geçti; CSP, oturum, güvenli medya URL'leri ve worker dahil.
- npm run check:i18n: 520 TR/EN anahtarı eşleşti; yeni sabit arayüz metni eklenmedi.
- npm run format:check ve git diff --check: geçti. Ayrı bir ESLint/lint hedefi projede tanımlı değil.
- npm run build: geçti; 30 JavaScript dosyası üretim denetiminden geçti. Başlangıç paketi 734,23 kB;
  mevcut 700 kB uyarısı sürüyor, 1 MB hata sınırı aşılmadı. Bütçe değiştirilmedi.
- Strict UI ham denetimi: Angular olay sözdizimini tanımayan 16 mevcut bulgu. Önceden bulunan Angular
  sözdizimi adaptörüyle strict sonuç: 0 bulgu. Ham sonuç gizlenmedi veya denetim kuralı gevşetilmedi.
- SQL 18 yerel PostgreSQL/PGlite üzerinde boş katalog ve mevcut tabloyla çalıştırıldı; fixture satırı korundu.

Son incelemede, RLS okumasında kaybolan bir satırın sonradan yeniden görünür olması durumunda geçici
gizleme önbelleğinin temizlenmesi de düzeltildi. Bu ek durumun dahil olduğu 14 servis testi geçti.
Son değişiklik sonrası `npm run test:ui -- scripts/e2e/post-actions.spec.cjs -g like` ile 5/5 tarayıcı
senaryosu (dört dil/tema axe kontrolü dahil) tekrar geçti. Üretim derlemesi de tekrar başarılı oldu;
30 dosya doğrulandı ve aynı paket uyarısı kaldı.

İlk tarayıcı başlangıcı yerel sunucu zaman aşımı verdi. Sonraki çalıştırmada tek hata için iki uyarı
gösterimi bulundu ve düzeltildi. O sırada kaynak güncellemesinin oluşturduğu yeniden yükleme bir arama
testini kesti; uygulama kaynaklarını değiştirmeden tekrarlanan ilgili 24 testin tamamı geçti.

## Sıradaki işler ve gerekli bilgiler

| Öncelik | İş                                                     | Durum                                            |
| ------- | ------------------------------------------------------ | ------------------------------------------------ |
| 1       | Beğeni, kaydetme, kaydedilenler                        | Kod tamamlandı; doğrulama sonuçları yukarıda     |
| 2       | posts.parent_id ile yanıt/thread                       | Henüz uyarlanmadı                                |
| 3       | Repost, geri alma, alıntı ve orijinal kart             | Henüz uyarlanmadı                                |
| 4       | Arşiv, soft delete + Storage, sabitleme                | Eski yollar mevcut; yeni sözleşmeye geçilmedi    |
| 5       | profiles alanları, gerçek tarih ve kullanıcı adı akışı | Yetki/kayıt davranışı doğrulanacak               |
| 6       | Takip ve gizli hesap anahtarı                          | Takip/istek mevcut; privacy anahtarı eksik       |
| 7       | blocks/reports uyarlaması                              | Henüz uyarlanmadı                                |
| 8       | Akademik akışlar                                       | Kampüs eşleştirmesi belirsiz                     |
| 9       | Kullanıcı/gönderi arama                                | Yerelde mevcut, regresyon paketinde denetleniyor |

Sıradaki adımlarda özel hata metnini veya yanıt derinliği kuralını tahmin etmemek için SQL 18'in
social_client_contract çıktısı istendi. Sorgu yalnızca katalog/izin/fonksiyon tanımlarını okur; geri
alma gerektiren bir değişiklik yapmaz. Doğru proje ref'i djhezivksrvcyqxzpiau.

profiles içinde kampüs/fakülte sütunu bulunmadığından Kampüs akışının eşleştirme kuralı ayrıca soruldu.
Bu bilgi olmadan bir okul/bölüm kombinasyonuna keyfi olarak kampüs anlamı verilmeyecek.

## İki hesapla kontrol

1. A hesabıyla görünür bir B gönderisini beğen, sayacı ve sayfayı yeniledikten sonraki durumu kontrol et.
2. Aynı beğeniyi kaldır; bir kez değişmeli. Yavaş ağda ikinci tıklama engellenmeli.
3. Gönderiyi kaydet, Ayarlar > Kaydedilenler'de gör; kaldırınca liste güncellenmeli.
4. B gönderisini gizlediğinde/engellediğinde A'nın yeni okumalarında RLS tarafından döndürülmeyen satır
   gösterilmemeli. Ayrı pencere değişiklikleri için yenile; bu adım beğenilere Realtime eklemez.
5. Ağ hatasında tek uyarı görülmeli; Tekrar dene sunucudan okumalı, yazmayı yinelememeli.
6. TR/EN, açık/koyu tema ve klavyede aynı kontrolleri dene.

API yaklaşımı Supabase'in [INSERT](https://supabase.com/docs/reference/javascript/insert),
[DELETE](https://supabase.com/docs/reference/javascript/delete) ve
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) belgeleriyle kontrol edildi.
İstemci sınamaları, canlı veritabanı politikalarının bağımsız güvenlik denetimi değildir.
