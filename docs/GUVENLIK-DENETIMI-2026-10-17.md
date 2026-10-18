# KampüsX — medya ve son güncellemeler için güvenlik denetimi

Bu rapor, engelleme özelliklerinden önceki medya denetiminin tarihsel kaydıdır. Kullanıcının
sonraki private Storage geçişi 18 Ekim 2026 isteğiyle geri alınmıştır; mevcut public URL akışı korunur.
Güncel kurallar ve canlıda uygulanacak adım: [Gönderi işlemleri ve gizlilik](GONDERI-ISLEMLERI-VE-GIZLILIK.md).

Tarih: 17 Ekim 2026. İncelenen temel commit: `effd99139c134025b87cead53e7234e983c7f92e` ve çalışma dizinindeki medya/video/sabit menü değişiklikleri.

## Sonuç

Fotoğraf ve videoların kaynak açıklama bilgilerinin public dosyaya taşınabildiği doğrulandı ve uygulamanın hazırlama akışında düzeltildi. Worker hata yönetimi güçlendirildi. Testte yakalanan tek kareli WebM uyumluluk sorunu giderildi.

Supabase tarafında **canlıda doğrulama ve uygulama bekleyen önemli bir erişim riski** var: daha önce paylaşılan Storage INSERT kuralı yalnızca `bucket_id = 'uploads'` kontrol ediyordu ve rolü `PUBLIC` idi. Bu tanım yerel PostgreSQL'de anonim yüklemeye ve başka kullanıcı klasörüne dosya eklemeye izin verdi. Canlıda hâlâ aynı tanımın bulunup bulunmadığına yönetici erişimi olmadan karar verilemez. Hazırlanan SQL yerelde doğrulandı; canlıda çalıştırılmadı.

Welcome/giriş/kayıt tasarımı, tema token'ları ve shared UI bileşenleri değiştirilmedi. Proje klasörleri taşınmadı. Yeni tablo/sütun/bucket oluşturulmadı; gerçek kullanıcı dosyası veya gönderisi eklenmedi/silinmedi. Bu denetim Git push veya deployment yapmadı.

## Kapsam ve yöntem

`MediaService`, `PostsService`, `ProfileRepository`, `ProfileService`, `FollowsService`, `AuthService`, Supabase istemcisi, oturum depolaması, route guard'ları, compose/profil akışları, görüntü/video yardımcıları, worker, üretim CSP'si, Vercel başlıkları ve ilgili SQL izinleri incelendi. Yapı grafiği 10 Ekim tarihli ve yeni medya dosyalarında kapsamı eksik olduğundan sonuçlar güncel kaynak okumalarına ve testlere dayandırıldı.

Tarayıcı testleri gerçek Angular bileşenlerini, Supabase SDK isteğini, canvas çıktısını ve video dönüşümünü çalıştırdı. Auth/Storage/REST/WebSocket sınırlarında yerel yanıtlar kullanıldı. SQL testleri PGlite içindeki gerçek PostgreSQL RLS motorunda, sentetik hesaplarla yürütüldü. Bu sonuçlar canlı Supabase ayarlarının veya canlı Vercel dağıtımının doğrulandığı anlamına gelmez.

## Bulgular ve nasıl giderildikleri

| Bulgu                                                           | Önem                              | Durum ve çözüm                                                                                                                                                                                                                          | Kanıt                                                                                                                                                                                                           |
| --------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Küçük fotoğraflar kaynak metadata ile yüklenebiliyordu          | Orta, gizlilik                    | Küçük dosyayı doğrudan döndüren yol kaldırıldı. Avatar, kapak ve gönderi fotoğrafı decode edilen piksellerden WebP olarak yeniden oluşturuluyor. EXIF/XMP/konum metni kaynak dosyadan kopyalanmıyor. Piksel ve boyut sınırları korundu. | Geçerli küçük PNG'ye sahte GPS metni eklendi. Düzeltme öncesinde yüklenen baytlarda bulundu; sonrasında üç alanda da bulunmadı. Yenileme sonrasında fotoğraflar çözümlenebildi.                                 |
| Videolar açıklama etiketlerini ve iz isimlerini koruyabiliyordu | Orta, gizlilik                    | Küçük MP4/WebM dosyaları ses/görüntü paketleri yeniden kodlanmadan temiz kapsayıcıya aktarılıyor. Büyük dosya sıkıştırmasında da `tags: {}` kullanılıyor. Kaynak video/ses iz adları yazılmıyor; ana izler korunuyor.                   | Gerçek sesli videoya sahte özel bilgi içeren başlık, yorum ve iki iz adı eklendi. Küçük ve 50 MiB üstü girdilerin yüklenen çıktısında işaret bulunmadı; başlık/yorum/iz adı boş, ses/video izleri mevcut kaldı. |
| Bozuk worker mesajları hazırlamayı beklemede bırakabiliyordu    | Düşük, dayanıklılık               | Mesaj türü, sonuç File'ı ve ilerleme sayısı çalışma anında doğrulanıyor. Beklenmeyen mesaj ve `messageerror` güvenli hata ile worker'ı kapatıyor. Mevcut iptal ve on dakikalık son tarih korundu.                                       | Null/bilinmeyen/eksik mesaj, NaN ilerleme, çözümleme hatası, crash, iptal, geç yanıt ve süre aşımı testleri geçti. Bu, dışarıdan sömürü kanıtlanmış bir yetki açığı olarak sınıflandırılmadı.                   |
| Önceki Storage kuralında sahiplik/oturum sınırı yoktu           | Yüksek, canlı durumu doğrulanmalı | `11-uploads-security-hardening.sql` hazırlandı. `uploads` için RESTRICTIVE kurallar anonim/yabancı klasöre INSERT'i; metadata listeleme, UPDATE/DELETE ve bucket'a taşıma yoluyla bypass'ı sınırlar. Mevcut diğer policy'ler korunur.   | Eski iki kural yerelde yeniden kuruldu; anonim/yabancı yol yüklemesi önce başarılı, düzeltmeden sonra reddedildi. Sonradan eklenen geniş `ALL` policy de kısıtı aşamadı. Canlıda kapatıldı diye raporlanmadı.   |

İlgili uygulama değişiklikleri:

- [Fotoğraf hazırlama](C:/Users/elifr/source/project/web/KampüsX/libs/shared/util/profile-image.ts:10)
- [Video işleyicisi ve hata yönetimi](C:/Users/elifr/source/project/web/KampüsX/libs/shared/util/post-video.ts:18)
- [Video kapsayıcı/iz temizliği](C:/Users/elifr/source/project/web/KampüsX/libs/shared/util/post-video.worker.ts:31)
- [Gerçek baytlarla metadata regresyonları](C:/Users/elifr/source/project/web/KampüsX/scripts/e2e/media-privacy.spec.cjs)

Video çıktısındaki temizleme kararının özü:

```ts
const conversion = await Conversion.init({
  input,
  output,
  tracks: 'primary',
  copy: { mode: 'forced', shiftTolerance: Infinity },
  tags: {},
  showWarnings: false,
});
```

Çıktı sınıfı ayrıca `addVideoTrack` ve `addAudioTrack` içinde `name: undefined` uygular. Kapsayıcı açıklamaları, ek dosyalar ve iz isimleri temizlenirken oynatma için gereken codec, yön, zamanlama ve standart dil bilgileri korunur. Kare/ses içeriği ve codec paketlerindeki tüm üretici alanları için anonimleştirme iddiası yoktur. Önceden yüklenmiş dosyalar geriye dönük değiştirilmedi. Fotoğraflar yeniden WebP kodlandığından küçük bir kalite farkı oluşabilir; küçük videoların ana ses/görüntü paketleri yeniden kodlanmaz.

## Kontrol edilip korunan güvenlik davranışları

| Alan                | Doğrulanan davranış                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kullanıcı sahipliği | Sunucuda `getUser()` doğrulaması ve her await sonrasında kullanıcı/oturum nesli kontrolü; logout, hesap değişimi ve aynı hesaba yeniden giriş eski işlemleri geçersiz kılıyor.                     |
| Dosya sözleşmesi    | MIME allowlist'i, başlık/decoder doğrulaması, fotoğrafta kaynak 20 MiB ve 32 MP sınırı; final fotoğrafta 5 MiB, videoda 50 MiB sınırı. HTML/SVG ve yol manipülasyonu reddediliyor.                 |
| Storage anahtarı    | Kullanıcı/amaç/rastgele UUID yolu; `upsert: false`. Dosya seçimi tek başına ağda yazma oluşturmuyor.                                                                                               |
| DB kaydı            | Mevcut `public` tabloları ve `user_id` kullanılıyor. Dosya baytları/base64/blob URL yerine yalnızca public URL kaydediliyor. Beklenmeyen sahip/URL/tür/metin dönerse başarı gösterilmiyor.         |
| Hata ve tekrar      | Reddedilen DB kaydında doğrulanmış upload tekrar kullanılabiliyor. Sonucu belirsiz gönderim körlemesine tekrarlanmıyor. İlk profil okuması başarısızsa mevcut bilinmeyen fotoğraf silinmiyor.      |
| XSS                 | Kullanıcı metni Angular tarafından metin olarak gösteriliyor. `<img onerror>` ve `<svg onload>` içerikleri çalışmıyor; uygunsuz medya URL'sine istek gönderilmiyor.                                |
| Üretim              | Angular hash/strict-dynamic CSP korunuyor. Bağlantı ve medya kaynağı allowlist'i, yalnız aynı origin worker, nosniff/frame/referrer başlıkları test edildi.                                        |
| Auth                | Giriş hataları hesap varlığını ayırmıyor. Recovery oturumu olmadan parola değiştirme akışı açılamıyor. Akademik bilgiler yalnızca allowlist edilmiş gösterim alanları; rol/yetki kaynağı değiller. |
| Takip ve menü       | Gerçek sayılar, izin hatasında bilinmeyen durum, private bildirim, sahiplik kuralları ve kalıcı menü navigasyonu test edildi.                                                                      |
| Anahtarlar          | İstemci build'i secret/service-role anahtarını reddediyor; `.env.local` ve üretilen ortam dosyası Git tarafından ignore ediliyor.                                                                  |

## Test sonuçları

| Kontrol                              | Sonuç                                                                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                           | **123/123 geçti**                                                                                                                                                                       |
| Hedef arayüz testleri                | **40 farklı senaryo**, düzeltme ve tekrar koşumlarıyla tamamı geçti                                                                                                                     |
| `npm run test:security`              | Son üretim derlemesi üzerinde **10/10 geçti**                                                                                                                                           |
| Storage SQL                          | **15/15 kontrol geçti**                                                                                                                                                                 |
| Mevcut posts SQL                     | **20/20 kontrol geçti**                                                                                                                                                                 |
| Mevcut profiles SQL                  | **14/14 kontrol geçti**                                                                                                                                                                 |
| Mevcut takip SQL                     | **10/10 kontrol geçti**; broadcast taşıması stub, gerçek sunucu teslimatı ayrıca doğrulanmalı                                                                                           |
| `npm run typecheck`                  | Uygulama ve worker geçti                                                                                                                                                                |
| `npm run check:i18n`                 | 414 TR/EN anahtarı eşleşti                                                                                                                                                              |
| `npm run format:check`               | Geçti                                                                                                                                                                                   |
| `npm run build`                      | Başarılı; 20 JavaScript çıktısı üretim doğrulamasından geçti                                                                                                                            |
| `npm audit --json`                   | Bilinen advisory sayısı **0**                                                                                                                                                           |
| Çalışma ağacı gizli anahtar taraması | Gerçek secret/service-role/private-key/token bulunmadı. Tek `sb_secret_` eşleşmesi, reddetme testindeki açıkça sahte fixture idi. Tüm geçmiş ve uzak servisler için tarama iddiası yok. |

Arayüz kapsamı: avatar/kapak/gönderi fotoğrafı kaydı, yalnız medya içeren gönderi, gerçek WebM/MP4, 50 MiB üstü sesli video sıkıştırma, süre/ses koruma, metadata temizliği, upload/DB hata durumları, iptal/taslak koruma, profil alanları, gerçek takip sayıları, dört TR/EN–açık/koyu kombinasyonu, mobil/masaüstü menü ve erişilebilirlik.

İlk 40 senaryoluk koşumda 37 geçti. Bir tek kareli WebM dosyasının sıfır süre nedeniyle reddi düzeltildi. İki test beklentisi düzeltildi: kalıcı menüdeki aktif Paylaş düğmesi disabled öğelerden ayrı sayıldı; 50 MB üzeri Playwright fixture'ı dosya yoluyla verildi. Sonraki 10 regresyon testinden 8'i geçti; iki video gizlilik fixture'ının kayıt/baseline süre hesabı düzeltildi ve beş gizlilik testinin tamamı son koşumda geçti. Başarısızlıklar atlanmadı veya skip edilmedi.

Üretim başlangıç paketi 711,00 kB; mevcut 700 kB uyarı eşiğini 11,00 kB aşıyor. Worker ayrı yüklenir (459,83 kB). Bu, derlemeyi durduran hata veya güvenlik açığı olarak değerlendirilmedi.

## Supabase'de kalan somut adım

1. SQL Editor → New query içinde [10-storage-security-diagnostics.sql](C:/Users/elifr/source/project/web/KampüsX/docs/supabase/10-storage-security-diagnostics.sql) dosyasını çalıştırıp sonucu sakla. Bu sorgu salt okunur; dosya veya kullanıcı içeriği döndürmez.
2. [11-uploads-security-hardening.sql](C:/Users/elifr/source/project/web/KampüsX/docs/supabase/11-uploads-security-hardening.sql) dosyasının tamamını yeni sorguya yapıştırıp **Run** seç. **Yeni tablo oluşturmaz.** Mevcut `uploads` için altı erişim kuralı kurar/yeniler; başka bucket kurallarını ve dosyaları değiştirmez. Beklenen sonuç bu altı `kampusx_uploads_...` kuralıdır.
3. Bucket MIME listesi JPEG/PNG/WebP/MP4/WebM olacak şekilde ayarlanır. Bu liste, daha önce farklı bir MIME listesi tanımlıysa onun yerini alır. Boyut tavanı 52.428.800 bayttır (50 MiB); önceden daha küçük sınır varsa korunur. Bucket'ın public/private tercihi değişmez. Public dosya görüntüleme devam eder; Storage API metadata listelemesi kişinin klasörüyle sınırlanır.
4. `uploads` içinde istemci UPDATE/DELETE/upsert kapanır. Mevcut uygulama rastgele yeni ad ve `upsert: false` kullandığından normal fotoğraf/gönderi kaydı INSERT ile devam eder. İleride dosya temizleme özelliği yapılırsa sunucuda yetkili bir akış veya ayrıca incelenmiş silme kuralı gerekir.
5. Teşhis sorgusunu yeniden çalıştırıp kuralları/bucket sınırlarını doğrula. Giriş yapmış kullanıcıyla fotoğraf kaydını kontrol et. Canlı anonim/yabancı kullanıcı ret testleri ve gerçek Realtime teslimatı, ayrı test hesaplarıyla ayrıca doğrulanmalı.

SQL davranışı `node scripts/sql/verify-storage-security.cjs` ile doğrulandı. MIME/boyut ayarlarının SQL'de doğru yazıldığı test edildi; Storage HTTP API'sinin canlı uygulaması taklit edilerek başarılı sayılmadı. Anonim ve sahte sahiplik RLS denemeleri doğrudan gerçek PostgreSQL motorunda reddedildi. SQL RLS kapalıysa veya mevcut bucket bulunamazsa değişiklik yapmadan durur; transaction tekrar uygulanabilir.

## Açık kalan sınırlar

Frontend hazırlaması doğrudan API çağrısıyla atlanabilir. Public bucket'taki dosyalar URL'yi bilen kişilerce okunabilir; bu ürünün seçilen davranışıdır. MIME allowlist'i dosya baytlarının zararsız olduğunu kanıtlamaz. Sunucuda içerik tarama/yeniden kodlama, kullanıcı bazlı depolama kotası ve yükleme hız sınırı bu depoda doğrulanmış bir güvenlik katmanı değildir. Sınırsız sayıda izinli dosya yükleyerek kota tüketimini önlemek için sunucu tarafı kota/hız kontrolü ayrıca gerekir.

Profil fotoğrafını arayüzden kaldırmak/değiştirmek mevcut tablo bağlantısını günceller; önceki Storage dosyasını fiziksel olarak silmez. Eski public URL biliniyorsa eski dosya okunabilir ve önceki yüklemelerdeki metadata bu düzeltmeyle geriye dönük temizlenmez. Fiziksel silme ve saklama süresi için, başka kayıtların referanslarını kontrol eden yetkili bir sunucu temizleme akışı gerekir. Bu denetim mevcut dosyalar üzerinde silme işlemi yapmadı.

Canlı RLS/grant/hook/trigger ayarları, Supabase genel dosya boyutu sınırı ve Auth e-posta domain doğrulaması yönetici erişimi olmadan doğrulanmadı. Akademik `user_metadata` alanları kullanıcı tarafından değiştirilebilir; ileride üniversite/bölüm akışına erişim bu alanlara dayanacaksa sunucu tarafından doğrulanmış üyelik gereklidir. Eski e-posta arama RPC'sinin sunucu yetkileri bu turda doğrulanmadı; uygulamanın onu çağırmadığı ve üretim paketine girmediği test edildi.

## Teknik dayanaklar

- Supabase, upload yetkilerini Storage RLS ile denetler; sıradan yeni yükleme için INSERT gerekir, upsert ek izin ister: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
- Bucket seviyesinde izinli MIME ve dosya boyutu sınırı bulunur: [Creating buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets).
- RESTRICTIVE kurallar diğer geçerli kurallara AND ile eklenir: [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).
- Dosya yüklemede tek bir uzantı/MIME kontrolü yeterli bir güvenlik katmanı değildir: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
