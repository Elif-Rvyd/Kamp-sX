# KampüsX — kayıt, paylaşım ve görüntülenme güncellemesi

22 Ekim 2026. Bu rapor son yedi maddelik isteği kapsar. Mevcut tema, renkler ve sayfa düzeni korunmuştur. Kod değişiklikleri yerel çalışma alanındadır; commit/push veya Vercel yayını yapılmamıştır.

## Kullanıcıya yansıyan değişiklikler

| İstek                          | Uygulanan davranış                                                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Üniversite / kampüs / bölüm    | Yazı alanı yerine bağlı seçim listeleri. Üniversite değişince iki alt seçim temizlenir; yalnızca o üniversitenin seçenekleri yüklenir. Serbest metin kabul edilmez.                                        |
| Geçmiş                         | Yan menüde bulunmaz. Mesajların önceki sayfalarını yükleme işlevi sohbetin parçası olarak korunur.                                                                                                         |
| Repost / alıntı                | Repost simgesi animasyonlu alt panel açar. Repost mevcut gönderiyi yeniden paylaşır; alıntı 1–2000 karakterlik metinle paylaşır. Ayrı repost tablosu oluşturulmaz; mevcut `posts.repost_of_id` kullanılır. |
| Mesajlaşma / gönderi paylaşımı | Mesajlar gelen kutusunu açar. Uygun kişinin profilinden sohbet başlatılır. Gönderide Paylaş, mevcut sohbetlerden birini seçtirerek gönderi kimliğini mesajla yollar.                                       |
| Kayıt onayı                    | Kullanım şartlarını kabul etmeden ve gizlilik bildirimini okuduğunu onaylamadan kayıt yapılamaz. İstemciyi atlamak da sunucu kontrolünü geçmez. Belge sürümleri ve sunucu zamanı kayıt altına alınır.      |
| Görüntülenme                   | Görünür sekmede kartın en az yarısı bir saniye görünürse kayıt yapılır. Gönderi sahibi hariç, oturum açmış her hesap gönderi başına bir kez sayılır. Sayfayı yenilemek sayıyı şişirmez.                    |
| Yasal metinler                 | Tanıtım ve kayıt ekranında ayrı Kullanım Şartları, Gizlilik Politikası ve Çerez Politikası; Türkçe / İngilizce metinler ve erişilebilir açılır pencere.                                                    |

Bir gönderiyi tekrar sayfada göstermek veya sayaç açıklamasını açmak ikinci bir görüntülenme oluşturmaz. Sayaç servisi okunamazsa `—` gösterilir; başarısız okuma gerçek bir sıfır gibi sunulmaz. Hesap değişince önceki hesaba ait bekleyen okumalar, sayaç önbelleği ve paylaşım işlemleri yeni oturuma taşınmaz.

## Canlı veritabanı durumu

Proje: `djhezivksrvcyqxzpiau`. Aşağıdaki dosyaları kullanıcı SQL Editor'da çalıştırmış ve sonuçlarını paylaşmıştır. Ajan üretim ortamına test hesabı, gönderi veya mesaj eklememiştir.

| Dosya                                     | Doğrulanan sonuç / işlev                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `27-direct-messaging.sql`                 | Önceki adım: `messaging_contract_version = 2026102201`; conversations/messages, RPC, RLS ve Realtime.       |
| `29-post-sharing-and-views.sql`           | İlk sonuç `2026102202`; mesajda gönderi kimliği, tekil hesap görüntülenmesi ve yeni gelen kutusu RPC'si.    |
| `32-sharing-audience-guard.sql`           | Son paylaşım sürümü `2026102204`; kaynak gönderi hem mevcut görünürlük hem ek kitle koşulundan geçer.       |
| `30-registration-catalog-and-consent.sql` | `registration_contract_version = 2026102203`; onaylı akademik seçim ve sürümlü kayıt onayı.                 |
| `31-academic-catalog-seed.sql`            | `catalog_version = 2026102203`; 208 üniversite, 14.405 program, 292 kampüs, kampüsü bulunan 112 üniversite. |

SQL 31'in ilk biçimi geçici tabloya erişemediği için hata verdi. Üretilen dosya geçici tablo kullanmayan tek bir atomik `DO` bloğuna dönüştürüldü. Kullanıcı güncellenmiş dosyayı başarıyla çalıştırdı. Mevcut kayıt adları/kimlikleri değiştirilmeden katalog onayları eklenir; dosya yeniden çalıştırılabilir. Mevcut kullanıcı kayıtları silinmez. Deneme amaçlı serbest metin kayıtları silinmeden yeni kayıt listesinin dışında kalır.

Supabase CLI ile gerçek `public` TypeScript tipleri yeniden üretildi. Ayrıca anonim, salt okunur API üzerinden üç katalog tablosunun sayıları ve Kırşehir Ahi Evran Üniversitesinin altı kampüsü doğrulandı. Bu kontrol kullanıcı verilerini okumadı, oturum açmadı ve veri yazmadı.

## Katalog kaynağı ve kapsam

- Program kaynağı: [YVZO/yks2026 veri anlık görüntüsü](https://github.com/YVZO/yks2026/blob/main/data.json). Bu, resmî öğrenci doğrulama hizmeti veya sürekli güncellenen resmî API değildir.
- Kaynak SHA-256: `92a773116f7a57a6c1bfde3111f059c1f68387f7f6b8b0651920a3735740c8a6`.
- Kampüs adları üniversitelerin yayımladığı kaynaklardan derlendi; her üniversitenin kaynak bağlantısı `data/academic/campuses.tr.json` içinde tutulur. Üretilen tam liste ve kaynak özeti `data/academic/catalog.tr.json` içindedir.
- Yeniden üretme: sabit kaynak dosyası `.nx/yks2026.json` konumundayken `node scripts/catalog/build-academic-catalog.cjs`. Üretici kaynak özetini kontrol eder; farklı veriyle sessizce SQL üretmez.
- Kırşehir Ahi Evran için Bağbaşı, Cacabey, Aşıkpaşa, Kaman, Mucur ve Çiçekdağı yerleşkeleri bulunur.
- **Kampüs kapsamı kısmi:** 208 üniversitenin 112'sinde kampüs kaydı vardır. Kalan 96 üniversitede doğrulanmış kampüs eklenene kadar yeni kayıt tamamlanamaz; ekran bunu boş durumla bildirir. Varsayımsal “Merkez Kampüs” eklenmedi.
- Seçim yapmak kişinin gerçekten o üniversitede öğrenci olduğunu kanıtlamaz. Mevcut eski hesapların akademik bilgileri veya geçmiş sözleşme onayları geriye dönük uydurulmaz.
- Eski serbest metin adları resmî katalog adından farklıysa kayıtlar otomatik birleştirilmez. Böyle bir eski hesabın akademik gruplarla eşleşmesi yönetici tarafından doğrulanıp düzeltilmeyi gerektirebilir; tahmine dayalı profil kimliği değişikliği yapılmadı.

## Yetki sınırları ve hata davranışı

Gönderi paylaşımı `kx_share_post({conv,target})` üzerinden yapılır. İki kişinin de kaynak gönderiye erişimi ve mevcut mesajlaşma koşulları sunucuda kontrol edilir. Mesajda yalnızca gönderi kimliği tutulur; gönderinin metni, fotoğrafı veya videosu mesaj içine kopyalanmaz. Kaynak silinir, arşivlenir veya görünmez olursa paylaşılan kart kullanılabilir içerik göstermez. Mesaj okuma ve doğrudan metin gönderme izinleri genişletilmez; istemci `sender_id` / zaman alanı yazmaz.

Görüntülenme satırları `private.post_views` içindedir; istemci bu tabloyu okuyamaz/yazamaz. Benzersizlik `(post_id,viewer_id)` üzerinden sunucuda sağlanır. İstemci `posts.views_count` yazamaz; API en fazla 50 gönderiyi bir çağrıda işler. Bu sayı benzersiz hesap sayısıdır, fiziksel kişi sayısı veya bağımsız ölçülmüş erişim değildir.

Repostlar mevcut tekil indeksle yinelenemez; geri alma mevcut sahibine ait soft-delete işlemini kullanır. Alıntı, mesaj veya paylaşımın sonucu belirsiz kalırsa aynı yazma otomatik tekrarlanmaz. Taslak / hata durumu korunur ve önce sonucu kontrol etme yolu sunulur.

Katalog tabloları kayıt ekranına salt okunur açılır; yeni satır ekleme/değiştirme izni verilmez. Üniversiteye ait olmayan kampüs/bölüm, onaysız katalog satırı, yanlış belge sürümü veya metin biçimindeki `"true"` sunucuda reddedilir. Akademik kimlik alanları kayıt sonrası istemciye kilitli kalır.

Public `uploads` bucket'ı kullanıcının önceki kararı doğrultusunda korunmuştur. Uygulama satırlarına ait RLS ve engelleme kuralları geçerlidir; önceden bilinen public medya bağlantısı bu kurallarla kapatılamaz.

## Yasal metinlerin dayanağı

İşletmeci, kullanıcının verdiği **Elif Rüveyda Ulama (elify.dev)**; iletişim ve başvuru kanalı **elifrvyd@protonmail.com** olarak yazıldı. Şirket unvanı, posta adresi veya 18 yaş koşulu uydurulmadı. Üniversite öğrencileriyle sınırlılık, hesap güvenliği, içerik kuralları, başvuru yolu, public medya bağlantıları, mesajların uçtan uca şifrelenmemesi ve mevcut hizmet sağlayıcılar açıklanır.

Kullanım şartlarının kabulü ile gizlilik bildiriminin okunduğuna ilişkin onay birbirinden ayrılır; gizlilik bildirimi her veri işlemi için genel açık rıza gibi sunulmaz. KVKK'nın [aydınlatma yükümlülüğü açıklaması](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-) ve [aydınlatma / açık rıza ayrımı duyurusu](https://www.kvkk.gov.tr/Icerik/6765/AYDINLATMA-YUKUMLULUGUNUN-YERINE-GETIRILMESI-HAKKINDA-KAMUOYU-DUYURUSU) esas alındı. Metin hazırlanması hukuki uygunluk belgelendirmesi değildir; işletmecinin gerçek saklama süreleri ve yurt dışı aktarım düzenlemeleri ayrıca doğrulanmalıdır.

## Yayına alma ve geri dönüş

Veritabanı adımları tamamlandı. SQL 30 yeni kayıtların güncel seçim ve onay alanlarını göndermesini gerektirdiğinden **yayımlanan frontend de bu çalışma alanındaki istemciyle güncellenmelidir**. Eski yayımlanmış kayıt formu yeni kayıt kontrolünü geçemez; mevcut hesaba giriş bu nedenle kapanmaz. Bu görevde commit/push/yayın yapılmadı.

Sorunda önce uygun önceki istemciye dönülür, ardından ilgili rollback uygulanır. `29-post-sharing-and-views-rollback.sql` yeni paylaşım/görüntülenme uçlarını kapatırken mevcut mesajları, sayaç satırlarını ve sütunları korur. `30-registration-catalog-and-consent-rollback.sql` yeni kayıt kapısını kapatırken hesapları, onay makbuzlarını ve katalog verilerini korur; eski metin alanlı istemciye dönülecekse bu geri dönüş birlikte planlanır. SQL 31 mevcut satırlarla birleştiği için satır silen otomatik rollback verilmedi; SQL 30 rollback'i seçim filtresini geri alır. SQL 32'deki kitle korumasını kaldırmak önerilen geri dönüş değildir; gerekirse yeni paylaşım uçları 29 rollback ile kapatılır.

## İki hesapla canlı kabul senaryoları

1. A ve B için uygun kabul edilmiş takip kur. A'nın profilindeki Mesaj üzerinden B ile aynı sohbetin açıldığını, iki tarayıcıda yeni mesaj / silindi / okunmamış durumlarını dene.
2. Her iki hesabın görebildiği bir gönderiyi A'dan B'ye paylaş. Kartı aç; kaynak arşivlenince/silinince içerik yerine kullanılamıyor durumunu kontrol et. Sadece A'nın erişebildiği kaynağın B'ye paylaşılamadığını dene.
3. A'nın gönderisini B hesabında bir saniye görünür tut. B'nin yenilemeleri sayıyı artırmamalı; A'nın kendi görüntülemesi eklenmemeli. Başka hesap ayrı sayılmalı.
4. Repost menüsünü klavye/Escape ve mobil dokunmayla dene. Repostu geri al, alıntı oluştur; sayaçları yenileyip doğrula. Çift tıklama ikinci düz repost oluşturmamalı.
5. Kayıtta üniversite değiştir; önceki kampüs/bölüm temizlenmeli. Onay kutusu olmadan Auth çağrısı yapılmamalı. Şartlar ve gizlilik bağlantıları ayrı metinleri açmalı; kapatınca odak geri dönmeli.
6. İki hesap arasında engel kur; sohbet ve kaynak kartlar sunucu okumalarında görünmemeli. Çıkış/hesap değişimi eski taslakları ve sonuçları yeni hesaba taşımamalı.

Bu canlı yazma senaryoları ajan tarafından üretimde çalıştırılmadı. Yerel PostgreSQL ve sahte API tarayıcı testleri aşağıdaki doğrulama kaydında ayrıca belirtilir.

## Doğrulama kaydı

- Kayıt / katalog / onay: 12 bağımsız PostgreSQL/PGlite kontrolü geçti; tam seed iki kez çalıştırıldı, kimlikler ve mevcut kayıtlar korundu.
- Mesajlaşma / paylaşım / sayaç yetkileri: 19 PostgreSQL/PGlite kontrolü geçti; iki görünürlük koşulu, yetkisiz sütunlar, benzersizlik ve veri koruyan geri dönüş dahil.
- Birim testleri: 191/191 geçti. Görüntülenme ek kontrolleri hesap değişiminde geç yanıtı, başlatan oturuma bağlanmayı, hata halinde bilinmeyen sayıyı ve 50'lik paket sınırını doğrular.
- TR/EN: 659 eşleşen, boş olmayan anahtar doğrulandı.
- Üretim güvenliği: 12/12 yerel tarayıcı kontrolü geçti; CSP, yetkisiz ağ/script/resim isteği, içeriklerin metin olarak gösterimi, anonim erişim ve video worker dahil.
- Typecheck ve format kontrolü geçti. Angular sözdizimini tanıyan uyarlamayla sıkı UI statik denetimi 0 bulgu verdi.
- Son üretim derlemesi ve 39 JavaScript dosyasının çıktı güvenliği kontrolü geçti. Başlangıç paketi 813,78 kB (tahmini aktarım 195,17 kB); mevcut 700 kB uyarı eşiğinin üzerinde, 1 MB hata eşiğinin altında. Paket sınırı yükseltilmedi.
- 193 farklı tarayıcı senaryosu doğrulandı: tam koşuda 189 geçti; dört profil senaryosundaki eski “sayfa okuması hiç POST yapmaz” beklentisi yeni görüntülenme kaydı için daraltıldı ve ayrı tekrarında 4/4 geçti. Yeni test sadece geçerli gönderi kimlikleriyle yapılan görüntülenme RPC'sine izin verir ve profil/gönderi/etkileşim değişikliğini reddeder.
- Görsel incelemede mesaj rotalarının tanıtım üst/alt çubuğunu da gösterdiği saptandı. Rota çerçevesi diğer oturum içi sayfalarla eşitlendi; ardından mesajlaşma ve paylaşım/görüntülenme senaryolarının 16/16'sı ayrı izole sunucuda yeniden geçti. Son değişiklikten sonra typecheck ve üretim derlemesi tekrar geçti.
- Mobil TR/koyu ve EN/açık kayıt ekranları ile EN/koyu sohbet ve paylaşılan gönderi ekranları incelendi; mevcut tasarım dili korunuyor. İlgili Axe kontrolleri bulgusuz geçti.
