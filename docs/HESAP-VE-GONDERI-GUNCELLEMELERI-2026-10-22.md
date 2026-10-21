# Hesap, okul bilgileri ve gönderi işlemleri

> Aynı günün sonraki güvenlik incelemesinde Storage DELETE politika çakışması düzeltildi,
> SQL 24 kuruldu ve bağımlılıklar yamalandı. Son doğrulama ve push kapsamı için
> [güvenlik ve çakışma raporu](GUVENLIK-VE-CAKISMA-DENETIMI-2026-10-22.md) geçerlidir.

Tarih: 22 Ekim 2026. Bu rapor bu istekteki değişiklikleri kapsar; önceki yerel arama/yanıt
değişiklikleri korundu. Commit veya push yapılmadı.

## Kullanıcı kararları

- Fakülte yerine tek bir **Kampüs** alanı kullanılır. Kayıtta üniversite, kampüs ve bölüm zorunludur.
- Hesap durumu hem arama/keşif hem profil ve gönderi görünürlüğünü belirler.
- Kullanıcı açıkça “Seçilen kitle gönderileri de doğrudan görsün” seçeneğini seçti. Tercih
  kaydedildikten sonra kabul edilmiş takipçi olma şartı seçilen kitle için aranmaz.
- Açık kitlelerin birleşimi kullanılır: Keşfet bütün üniversiteleri, Üniversite aynı üniversiteyi,
  Kampüs aynı üniversite/kampüsü, Bölüm aynı üniversite/kampüs/bölümü kapsar. Hepsi kapalıysa sahibi görür.
- Eski hesapların kuralı kendiliğinden değiştirilmez. İlk görünürlük kaydına kadar eski
  `is_private` ve kabul edilmiş takipçi kuralı geçerlidir. Engelleme her durumda önceliklidir.

## Yapılanlar

1. Gönderi tarihi kullanıcı adının yanından alınıp içerik/medyanın altına taşındı. Kullanıcı adıyla
   birleşmez. Tarih, metin, ad ve avatar klavyeyle de açılabilen gerçek bağlantılardır.
2. Arama/follow listelerinden `/people/:id` açılır. Başka kullanıcının profili mevcut ProfileHeader
   ve ProfilePostList ile salt okunur gösterilir; gerçek izinli gönderiler ve mevcut takip işlemleri
   kullanılır. Arama gönderileri `/posts/:id` thread ekranına açılır. Her iki yeni rota da sosyal
   layout içinde tam genişlik kullanır; welcome header/footer eklenmez.
3. Profil düzenleme üniversite/kampüs/bölüm değişikliği göndermez. Form alanları readonly'dir.
   Auth servisindeki eski akademik güncelleme yolu kapatıldı. Profil servisinin çalışma zamanı
   kontrolleri değiştirilmiş akademik payload'ları reddeder; isim/bio/fotoğraf düzenleme devam eder.
4. SQL 23, public profil akademik alanlarını ve Auth metadata karşılıklarını istemci değişikliklerine
   karşı korur. Kayıtta akademik alanlar boşsa profil oluşturma reddedilir. Mevcut gerçek metadata
   yalnızca eksik profil bilgilerine aktarılır; `faculty_name` eski kayıtlarda kampüse eşlenir.
   İsim/bio Auth üzerinden kaydedilince public profil de trigger ile güncellenir. Kayıt tarihi gerçektir.
5. Dashboard'da Keşfet/Üniversite/Kampüs/Bölüm gerçek gönderi sorgularını kullanır. Üç akademik akışın
   eski sabit skeleton içeriği kaldırıldı. Filtreler public.profiles ilişkisini kullanır ve RLS'i
   korur; eksik eski okul bilgisi için uydurma sonuç yerine açıklanan hata gösterilir. Yüklemede
   dokunma yüzeyinin kaybolmaması için kaydırma alanının asgari geometrisi korunur.
6. Gönderi sabitleme/arşivleme eski, mevcut olmayan RPC'lerden çıkarıldı. Sahip ve gönderi kimliğiyle
   filtrelenen gerçek `pinned_at`/`archived_at` UPDATE'leri kullanılır; sayaç veya içerik yazılmaz.
   Sonuç doğrulanmadan başarı gösterilmez. Veritabanındaki kullanıcı kilidi aynı hesabın sabitlemelerini
   sıraya alır, aktif sınır üçtür; yanıt sabitlenemez. Arşivleme/silme sabitlemeyi kaldırır.
7. Silme onay ister. Yerel PostgreSQL testinde doğrudan deleted_at UPDATE'inin, SELECT'ten gizlenme
   kuralıyla çakıştığı görüldü. SQL 22'deki dar `kampusx_soft_delete_post(uuid)` yalnızca oturum sahibini
   denetleyerek soft delete yapar. Silinmiş satırları okunabilir yapan bir RLS istisnası eklenmedi.
   Ardından gerçek sunucu kaydındaki güvenli, sahibine ait medya yolu temizlenir. Başka canlı kendi
   gönderisinde kullanılan dosya tutulur. Temizlik başarısızsa satır gizli kalır, hassas bilgi
   içermeyen tanı yazılır; ikinci silme veya sahte bir arşivden silme tekrarı sunulmaz.
8. Arşivim yalnızca sahibinin archived_at dolu, deleted_at boş gönderilerini okur; geri alma gerçektir.
   Raporlama ve engelleme eski tablo/RPC isimlerinden gerçek `reports` ve `blocks` tablolarına bağlandı.
   Tekrar rapor, mevcut unique constraint'in 23505 yanıtıyla güvenli biçimde karşılanır.
9. Hesap durumu mevcut SocialPageFrame/Button/ConfirmDialog sahiplerini ve yeni paylaşılan
   `button[kxSwitch]` atomunu kullanır. Dört anahtar TR/EN açıklamalıdır, role=switch/aria-checked,
   klavye, 44px hedef, mevcut tema değişkenleri ve reduced-motion desteği vardır. Kaydet gerçek
   sunucu durumunu doğrular. Belirsiz sonuçta taslak korunur ve yeniden yazmadan önce okuma gerekir.
   Kaydedilmemiş tercihlerle ayrılma onaylanır; okumalar oturum değişiminde/ekran kapanınca iptal edilir.

## Ayarlardaki işlevlerin durumu

| Bölüm           | Bağlantı ve davranış                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| Hesap durumu    | Gerçek public.profiles tercihleri ve SQL 23 RLS/helper kontrolleri.                         |
| Takip istekleri | Önceki Parça A servisi; kabul/ret, gerçek sayılar ve özel Broadcast.                        |
| Arşivim         | Gerçek sahip gönderilerini okur; geri alma/silme/sabitleme SQL 22 ile bağlıdır.             |
| Kaydedilenler   | public.bookmarks ve RLS'ten geçen posts ilişkisi; ekleme/kaldırma gerçektir.                |
| Engellenenler   | public.blocks; gerçek liste ve engeli kaldırma. RLS adı gizliyorsa genel etiket gösterilir. |

Buradaki “bağlı” değerlendirmesi kaynak incelemesi, izole tarayıcı testleri ve yerel PostgreSQL
sınamalarına dayanır. Gerçek iki kullanıcı hesabıyla canlı uygulamada etkileşim oluşturulmadı.
Bildirimler, mesajlar, topluluklar ve hesap kapatma bu istekte eklenmedi.

## Canlı kurulum ve geri alma

- Kullanıcı SQL 19/20 kurulumunu daha önce doğruladı.
- Kullanıcı bu turda SQL 22 ve SQL 23 için ayrı ayrı `2026102201` sonucunu paylaştı.
- Ardından `supabase gen types typescript --project-id djhezivksrvcyqxzpiau --schema public` ile
  gerçek public şeması okundu. database.generated.ts CLI çıktısından güncellendi; geçici şema
  uzantıları kaldırıldı. Anahtar/token çıktıya yazılmadı ve kullanıcı satırı sorgulanmadı.
- SQL 22 yeni tablo/sütun oluşturmaz; sahip RPC'si, sabitleme trigger'ı ve kendi post klasöründe
  Storage DELETE politikası kurar. posts RLS'i ve public bucket görünürlüğü korunur.
- SQL 23 yalnızca mevcut profiles tablosuna campus ve görünürlük alanlarını ekler; yeni tablo yoktur.
  Mevcut satırlar silinmez. Akademik/grup değerleri kendiliğinden bir doğrulama belgesi sayılmaz.
- `22-owner-post-actions-rollback.sql` önceki sabitleme kuralını getirir.
  `23-academic-account-visibility-rollback.sql` yeni davranış/yetkileri kapatır; eklenen sütunları,
  kullanıcı tercihlerini ve aktarılmış gerçek profil bilgilerini silmez. Geri alma sırası 23, sonra 22.
- 20'nin katı katalog önkoşulu eski SELECT tanımını bekler; yeni görünürlük katmanı sonrası eski
  migration dosyaları gelişigüzel yeniden çalıştırılmamalıdır. 22/23 kendi içinde idempotent sınandı.

## Doğrulama

- Yerel PostgreSQL/PGlite: `node scripts/sql/verify-account-actions.cjs` — 11/11 geçti. İdempotent
  kurulum, sahip kontrolü, üç sabitleme sınırı, soft delete, Storage sahipliği, tüm kitleler/engel,
  kayıt zorunluluğu, Auth/profil akademik kilidi, isim senkronizasyonu ve veriyi koruyan rollback dahil.
- Önceki yanıt sözleşmesi regresyonu: `node scripts/sql/verify-replies.cjs` — 12/12 geçti.
  Bu iki SQL paketi yalnızca yerel PostgreSQL'de çalıştı; canlıya veri yazılmadı.
- `npm test`: 167/167 geçti. Akademik alan kilidi, zorunlu kayıt alanları, sahip kontrolü,
  dört görünürlük alanının allowlist'i, belirsiz sonuç/oturum değişimi ve medya temizliği dahil.
- `npm run typecheck`, `npm run format:check`, `git diff --check`: geçti.
- `npm run check:i18n`: TR/EN arasında 559 eşleşen, boş olmayan anahtar doğrulandı.
- Tam tarayıcı regresyonunun ilk çalışması 152 senaryoda 148 başarılı, 4 hatalı sonuçlandı.
  İki giriş testindeki kanonik profil fixture'ı eşleştirildi; mobil kaydırma alanının yükleme sırasında
  daralması düzeltildi. Dördüncü hata uygulamaya dosya verilmeden önce test videosunu üreten
  `AudioContext.decodeAudioData` çağrısının geçici `EncodingError` hatasıydı.
- Bu dört senaryo ve yeni hesap/arama/kayıt akışları birlikte tekrar çalıştırıldı: **13/13 geçti**.
  Büyük video kontrolü ses enerjisini, süreyi ve sıkıştırılmış boyutu doğrulamaya devam eder;
  uygulama medya kodu değiştirilmedi, test atlanmadı. Bu sonuç tek seferde 152/152 geçildiği
  anlamına gelmez. Kayıtlar `.nx/account-browser-all.log` ve `.nx/account-browser-final.log` içinde.
- TR/EN, açık/koyu tema, 320px ekran, klavye, axe, kayıt sonrası yenileme, eksik SQL ve kaydetmeden
  ayrılma sınandı. Ekran görüntüleri de incelendi; yeni sosyal rotalarda welcome header/footer
  görünmesi düzeltildi. Gerçek Supabase yerine izole HTTP/Realtime fixture'ları kullanıldı.
- `npm run build`: başarılı; 33 JavaScript dosyası üretim çıktı denetiminden geçti. Başlangıç paketi
  742,12 kB; mevcut 700 kB uyarı bütçesini aşıyor, 1 MB hata sınırı aşılmadı. Bütçe değiştirilmedi.
- Son üretim çıktısıyla `npm run test:security`: **12/12 geçti**. CSP'nin inline script, dış ağ ve
  görüntü engelleri; oturumsuz rota koruması; kullanıcı HTML'inin metin kalması; güvenli fotoğraf
  önizlemesi ve yerel video worker'ı sınandı. Önceki çalışmadaki iki eski profil adı beklentisi
  kanonik profil fixture'ı ile düzeltildi. Bir sonraki çalışmada test videosunun ses çözücüsü yine
  uygulamaya dosya verilmeden hata verdi; aynı test değiştirilmeden temiz tarayıcıda tüm paket geçti.
  Test fixture'ındaki bu aralıklı ses üretme sorunu kalıcı olarak çözüldü diye raporlanmıyor.
  Kayıtlar `.nx/account-security-final.log` ve `.nx/account-security-audio-fixture-failure.log` içinde.
- UI audit: ham tarayıcı Angular `(click)` söz dizimini tanımayan 16 mevcut false positive üretir.
  Önceden kullanılan Angular söz dizimi adaptörüyle strict bulgu sayısı sıfırdır; kurallar gevşetilmedi.

## Canlı uygulamada kontrol sırası

1. Yeni kayıtta üniversite, kampüs veya bölümü boş bırak: kayıt ilerlememeli. Mevcut hesabında
   Profil Düzenle'de bu üç alan salt okunur, isim/bio/fotoğraf düzenlenebilir olmalı.
2. Gönderi tarihini içerik/medyanın altında gör. Aramadan kişinin adını veya gönderinin metnini aç;
   ilgili profil veya gönderi ekranına gitmeli.
3. Kendi dört gönderinden üçünü sabitle; dördüncü reddedilmeli. Birini arşivle, Arşivim'den geri al.
   Silme onayını iptal edip satırın kaldığını, onaylayınca yenilemede kaybolduğunu kontrol et.
4. A hesabında Hesap Durumu'nu kaydet. Aynı üniversite/kampüs/bölümdeki B hesabıyla seçilen kitleyi
   kontrol et. Kabul edilmiş takipçi olmadan da seçilen kitle gönderileri görmeli.
5. Keşfet açıkken diğer üniversiteden B görmeli; tüm anahtarlar kapalıyken yalnızca A görmeli.
   B engellenince açık anahtarlar erişim sağlamamalı. Önceden bilinen public medya URL'si sınırı
   aşağıda ayrıca belirtilmiştir.
6. Anahtarları değiştirip kaydetmeden ayrıl: onay çıkmalı. Kaydettikten sonra yenile: sunucudaki
   tercihler korunmalı. Diğer kullanıcının gönderisinde sahip menüsü görünmemeli.

## Pratik sınırlar

- `uploads` public bırakıldı. Profil/gönderi satırları ve arama sonuçları RLS ile kısıtlanır;
  önceden bilinen public fotoğraf/video URL'si bu ayarlarla gizlenmez.
- Dosya ve satır işlemleri tek transaction değildir. Temizlenemeyen dosya için operatör düzeyinde
  artık dosya temizliği gerekebilir; başarı gösterilmiş ikinci bir gönderi silme işi uydurulmaz.
- Akademik gruplama kayıt sırasında verilen metinlere dayanır. Okul doğrulaması eklenmedi; eski
  hesapta gerçek okul bilgisi yoksa veritabanına tahminî değer yazılmaz.
- Bu iş, önceki rapordaki SQL 21 veya diğer backend sertleştirmelerinin uygulandığı anlamına gelmez.

Kaynak: [PostgreSQL CREATE POLICY ve UPDATE/SELECT kuralları](https://www.postgresql.org/docs/17/sql-createpolicy.html),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
