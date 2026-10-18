# Gönderi kaydı ve tüm ekranların genişliği

18 Ekim 2026. Kullanıcı bildirimi: gönderi paylaşırken genel kayıt hatası, gönderi oluşturucudaki iki açıklamanın kaldırılması ve tam genişlik düzeninin tüm uygulamaya uygulanması.

## Hatanın nedeni ve düzeltme

Gönderi INSERT isteğinin ardından `select(POST_COLUMNS)` ile tabloda olmayan `deletion_started_at`, `pin_slot` ve `comments_count` isteniyordu. Bu, şema kontrolü yapan testte PostgreSQL `42703` hatasıyla yeniden üretildi; uygulama bu hatayı genel “Gönderi kaydedilemedi” mesajına çeviriyordu. Önceki tarayıcı taklidi sütun adlarını doğrulamadığından bu uyumsuzluğu yakalamıyordu.

Supabase CLI ile canlı projenin yalnızca `public` tablo tipleri yeniden okundu. `posts` sütunları depodaki üretilmiş tiple eşleşiyor: `deleted_at`, `pinned_at`, `replies_count` ve `reposts_count` mevcut; eski üç sütun mevcut değil. Bu okuma kullanıcı satırı veya token çıktısı içermedi ve canlı veritabanını değiştirmedi.

- `PostsService`, CLI ile üretilen `Database` tipini kullanır. Tablo sorguları gerçek sütunları, silinmiş kayıt filtresi `deleted_at` alanını, profil sıralaması `pinned_at` alanını kullanır.
- Yayın INSERT'i yalnızca `user_id`, `content`, `media_url`, `media_type` gönderir. Başarı makbuzunda yalnızca önceden kullanılan altı temel alan geri istenir: `id,user_id,content,media_url,media_type,created_at`. Sayaç/sabitleme okuma yetkileri yayın sonucunun önkoşulu yapılmaz. Dönen sahip/metin/medya hâlâ doğrulanır; belirsiz sonuçta kör tekrar engeli korunur.
- Yanıt/yeniden paylaşım sayıları gerçek `replies_count` / `reposts_count` alanlarından gelir. Sabitlenmiş kart gösterimi gerçek `pinned_at` değerini tanır. Arama/arşiv gibi mevcut doğrudan posts okumaları da eski silme alanını istemez.
- Ayrı aşamada hazırlanmış eski gönderi işlem RPC'lerinin uyarlanması bu düzeltmenin kapsamı değildir. Eski RPC snapshot'larının geçici UI alanları, gerçek tablo sütunu gibi sorgulanmaz.
- Birim ve tarayıcı testleri artık seçilen/sıralanan/filtrelenen posts alanlarını üretilmiş şemayla denetler; olmayan sütunlar başarılı kabul edilmez. Canlı RLS veya Storage kuralı gevşetilmedi; yeni tablo veya migration eklenmedi.

Ana kaynaklar: [PostsService](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/posts.service.ts), [şema sınırı test fixture'ı](/C:/Users/elifr/source/project/web/KampüsX/scripts/fixtures/post-schema.cjs), [servis testleri](/C:/Users/elifr/source/project/web/KampüsX/scripts/social-services.test.cjs).

## Arayüz değişiklikleri

“Fotoğraflar otomatik küçültülür…” ve “Yüklediğin dosyalar herkese açık…” paragrafları gönderi oluşturucudan ve kullanılmayan TR/EN anahtarlarından kaldırıldı. Fotoğraf/video hazırlama, gerçek ilerleme durumu, hata mesajları ve dosya doğrulama çalışmaya devam eder. `uploads` bucket'ının public/private ayarı değişmedi.

Tam ekran burada tarayıcı içindeki kullanılabilir alanı doldurmak anlamındadır; işletim sistemi/tarayıcı Fullscreen API'si otomatik tetiklenmez.

- Ortak `--page-max` yerleşim token'ı `%100`: tanıtım, giriş, kayıt, şifre yenileme ve bulunamayan sayfa mevcut 40/24/16 px responsive kenar aralıklarıyla genişliği kullanır. Afiş/renk/font/ikon tasarımı korunur; bağımsız auth ekranları masaüstünde iki esnek, eşit sütun kullanır.
- Gönderi oluşturma, profil düzenleme ve ortak sosyal sayfa çerçevesindeki 760 px sınırı kaldırıldı. Profil, ayarlar, arşiv, kaydedilenler, engellenenler, arama, gönderi detayı ve takip listeleri sabit yan menüden kalan alanı doldurur.
- Dikey belge kaydırması korunur; uzun kayıt/profil formları sabit yüksekliğe sıkıştırılmaz. Açık/koyu palet ve tema değiştirme servisi değişmedi.
- Tam paket, ikon fontu yüklenirken `chevron_right` gibi açıklayıcı adların genişleyip ayarlar sayfasını geçici olarak taşırdığını yakaladı. Ortak ikon stilinde bir-em kare alan ayrılıp taşan fallback metni kırpıldı. Font yüklenmeden önce yapılan aynı ölçümde yatay taşma artık oluşmuyor; fontun hiç gelmemesini taklit eden ayrı bir test de eklendi.

Kalıcı kararlar [DESIGN.md](/C:/Users/elifr/source/project/web/KampüsX/DESIGN.md) ve [UX-CONTRACT.md](/C:/Users/elifr/source/project/web/KampüsX/UX-CONTRACT.md) içinde güncellendi.

## Doğrulama

- 142 birim testi başarılı. Yeni iki test eski kodda kayıt/akış hatasını üretti, düzeltmeden sonra geçti.
- TypeScript kontrolü ve 513 eşleşen, dolu TR/EN anahtarı kontrolü başarılı.
- Üretim derlemesi ve 30 JavaScript dosyasının çıktı doğrulaması başarılı. Son başlangıç paketi 732,62 kB; mevcut 700 kB uyarı eşiği aşılıyor, derleme hata eşiği aşılmıyor.
- Statik auditor Angular `(click)` bağlarını tanımadığı için 16 yanlış olumlu gösteriyor. Yalnızca olay/disabled sözdizimi tanımasını ekleyen mevcut adaptörle strict kontrol 0 bulgu; gerçek kontroller tarayıcı paketinde ayrıca çalıştırılıyor.

- Tam `npm run test:ui` koşumunda 116 senaryo geçti; dört yeni tam genişlik kontrolü ikon fontu yüklenmesindeki taşmayı yakaladı. Kaynak düzeltildikten sonra `npx playwright test scripts/e2e/social-layout.spec.cjs scripts/e2e/posts.spec.cjs` ile dört hata, yeni font yokluğu testi ve ilgili paylaşım/genişlik senaryoları tekrar doğrulandı: **18/18 başarılı**. Bekleme eklenerek veya taşma kontrolü kaldırılarak test zayıflatılmadı. 320/390/1440/1920 px, iki dil ve iki tema kapsandı.
- Son derlemede `npm run test:security`: **12/12 başarılı**. CSP, XSS, dış ağ/izleme engeli, oturumsuz erişim ve video hazırlama kontrolleri geçti.
- Prettier ve `git diff --check` başarılı. Yerel 4200 sunucusunun HTTP 200 yanıtı doğrulandı.

Tarayıcı testleri gerçek SDK'yı izole HTTP/Storage cevaplarıyla kullanır; canlı kullanıcıyla gönderi paylaşılmış sayılmaz. Canlı şema yalnızca metadata olarak doğrulandı. Bu değişiklik için Supabase'de yeni SQL çalıştırmak gerekmez. Canlı Supabase'e migration uygulanmadı; GitHub'a gönderim SQL dosyalarını otomatik çalıştırmaz.
