# KampüsX güvenlik ve çakışma denetimi

Tarih: 22 Ekim 2026. Kapsam: mevcut yerel değişiklikler, oturum ve hesap geçişleri, medya yükleme/silme,
gönderi sahipliği, okul/kitle görünürlüğü, engelleme, arama, Realtime ve üretim derlemesi.
Önceki kullanıcı değişiklikleri korundu. Kontroller push öncesinde alındı; gönderilen commit kimliği
sohbette ayrıca bildirilir.

## Bulunanlar ve düzeltmeler

| Bulgu                                                                                     | Etki                                                                                                    | Düzeltme                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite 8.3.0 güvenlik bildirimlerinden etkileniyordu                                        | Geliştirme sunucusu/Windows editör açma yolunda açıklar; tarayıcıya gönderilen üretim bağımlılığı değil | `@angular/build` altında Vite 8.3.3 override'ı; Angular/Nx sürümleri korundu                                                                                                                                            |
| Nx altında follow-redirects 1.16.0 kalmıştı                                               | Araç zincirinde yönlendirmede hassas başlıkların karşı kökene aktarılması riski                         | Yalnızca Nx altında 1.16.1 override'ı; lockfile ve kurulum güncellendi                                                                                                                                                  |
| SQL 11'in RESTRICTIVE DELETE yasağı, SQL 22'nin PERMISSIVE medya temizliğiyle çakışıyordu | Gönderi soft delete olurken dosya Storage'da kalabiliyordu                                              | Yeni SQL 24: anonim/yabancı/yanlış klasör silmeleri engellenir; yalnızca sahibinin silinmiş kaydının medyası, canlı başka referans yoksa silinir                                                                        |
| Eski katalogdaki gereksiz TRUNCATE/REFERENCES/TRIGGER/MAINTAIN yetkileri                  | TRUNCATE satır RLS'ine tabi değildir; uygulama bu yetkileri kullanmaz                                   | SQL 21 mevcut dört tabloda yalnızca bu yetkileri alır; sonuca salt okunur izin kontrolü eklendi                                                                                                                         |
| Tarayıcı test videosu bazen kayda geç başlayıp ses üretemiyordu                           | Uygulama dosyayı almadan test `EncodingError` ile kesiliyordu                                           | Kamera/mikrofon kullanmadan WebCodecs ile üretilen 10,4 kB VP8/Opus örneği sabitlendi. Ses/video zaman damgaları tam 1 saniye; testler gerçek çözme, 50 MiB üstü girdiyi sıkıştırma, ses/süre/boyut kontrollerini korur |
| Hatalı form odağı touched aria-invalid çiziminin zamanlamasına bağlıydı                   | Boş kayıt formunda ilk hatalı alan bazen odaklanmıyordu                                                 | Ortak validateAndFocus, Angular geçersizlik sınıflarından ilk etkin alanı bulur. Tasarım ve doğrulama kuralları korundu; birim ve TR/EN tema sınamaları eklendi                                                         |

İlk `npm audit` toplam **9 bulgu** (8 high, 1 low; etkilenen üst paketler dahil), yamalar sonrası
**0 bulgu** bildirdi. Bu, kaynak kodun veya Supabase ayarlarının bütünüyle açık içermediği garantisi değildir.
[follow-redirects bildirimi](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) ve
[Vite/launch-editor bildirimi](https://github.com/advisories/GHSA-698v-4r3x-3vcv) ile yama sürümleri doğrulandı.

## Sunucu durumu ve geri alma

- SQL 22/23 için kullanıcı daha önce ayrı ayrı `2026102201` sonucunu doğruladı.
- SQL 24 için doğru proje (`djhezivksrvcyqxzpiau`) ekran görüntüsü alındı:
  `kampusx_uploads_guard_delete` RESTRICTIVE/public,
  `kx_uploads_delete_unreferenced` RESTRICTIVE/authenticated,
  `kx_uploads_delete_own_posts` PERMISSIVE/authenticated. Üçü de DELETE ve beklenen rol/tür ile görünüyor.
- SQL 21 için de doğru projeden ekran görüntüsü alındı: `blocks`, `bookmarks`, `likes`, `reports`
  tablolarında `can_truncate`, `can_reference`, `can_create_trigger`, `can_maintain` değerlerinin
  tamamı **false**. Bu dar sunucu yetki temizliği canlıda doğrulandı.
- Yeni tablo oluşturulmadı. SQL 24 kurulum/rollback hiçbir gönderi veya dosya silmez, bucket görünürlüğünü değiştirmez.
  İzinli silme daha sonra kullanıcının gönderi silme işlemiyle gerçekleşir.
- SQL 24 rollback'i uploads DELETE işlemlerini yeniden kapatır; kullanıcı verisini ve dosyaları korur.
  11/12 gibi eski Storage kurulumları sonradan gelişigüzel yeniden çalıştırılırsa politika değişebilir;
  yeni düzeltme bunlardan sonra uygulanmalıdır.

## Güvenlik kontrollerinin kapsamı

- Sahip kimlikleri oturumdan alınır; profil tercihlerinde yalnızca dört boolean sütun yazılır.
- Gönderi sahipliği sunucuda doğrulanır; silme dar, sahip denetimli RPC ile yapılır. Silinen satırlar
  SELECT için tekrar görünür kılınmadı. Sabitleme sınırı veritabanında korunur.
- Akademik bilgiler kayıt sonrası istemciden değiştirilemez; kitle ve engel kuralları yerel PostgreSQL
  RLS testlerinde birlikte sınandı. Fotoğraf/video URL'si güvenli köken ve dosya yolu dışında gösterilmez.
- Gönderi HTML'i/kimlik metinleri HTML olarak çalıştırılmaz; CSP dış ağ, görüntü ve inline script
  girişimlerini engeller. Arama filtreleri ham OR gramerine kullanıcı girdisi birleştirmez.
- Oturum değiştirilince eski sonuçların yeni hesaba uygulanmaması, recovery ve kayıt alanları,
  anonim rota/istek retleri mevcut regresyonlarda kontrol edildi.
- Takip olayları özel Broadcast üzerinden boş geçersizleştirme mesajları taşır; transport gerçek
  Supabase yerine test fixture'ıyla sınanır. Bildirim/mesaj sistemi eklendiği iddia edilmez.
- Git'e aday 300'den fazla metin dosyası ve yerel Git geçmişinin yaklaşık 4,47 MB yaması secret/private-key,
  service-role JWT ve token desenleriyle tarandı; doğrulanan bulgu yok, yerel `.env` dosyası izlenmiyor.
  Bu desen taraması olası her sır biçimini veya uzaktaki depo güvenliğini kapsamaz.
- Codebase-memory dizini 10 Ekim'den kaldığı ve yeni dosyalar eksik olduğu için yapısal bulgular
  güncel kaynak dosyaları/`rg` ile doğrulandı; graph'ın tam kapsam sağladığı iddia edilmedi.

## Test sonuçları

- `npm test`: **168/168** geçti. Yeni odak regresyonu, geçersiz alanın aria-invalid çizilmeden de
  bulunmasını ve geçerli formda odağın değiştirilmemesini denetler.
- `npm run typecheck`, `npm run format:check`, `git diff --check`: geçti.
- `npm run check:i18n`: **559** eşleşen, boş olmayan TR/EN anahtarı.
- Dokuz yerel PostgreSQL/PGlite paketi: **131 kontrol** geçti. Sırasıyla hesap/gönderi 11,
  yanıt/yetki 12, Storage güvenliği 15, yeni Storage bütünleşmesi 8, profil medyası 14,
  gönderi paylaşımı 20, eski gönderi/engel sözleşmesi 24, takip isteği 17, takip politikası 10.
  Eski paketler kendi tarihsel fixture'larını sınar; yeni 8 kontrol SQL 11 + 22 + 24'ü birlikte
  çalıştırarak gerçek çakışmayı önce üretir, sonra düzeltmeyi ve veri koruyan rollback'i doğrular.
- Tam `npm run test:ui`: ilk koşuda **150/152** geçti. Form odağı ve yeni sabit videonun süresiyle
  ilgili iki hata yukarıda açıklanan düzeltmelerle ele alındı. Auth erişilebilirlik matrisi aynı
  kontrolleri 12 bağımsız senaryoda raporlayacak şekilde ayrıldı; eşikler gevşetilmedi.
- Son hedefli tarayıcı koşusu: **17/17** geçti. Login/kayıt/şifre isteme TR/EN açık/koyu tema,
  recovery, profil alan doğrulaması ve gerçek sesli video sıkıştırma/iptal senaryolarını kapsar.
  Tek bir son koşuda 152/152 geçildiği iddia edilmez. Kayıtlar `.nx/security-ui-20261022.log`
  ve `.nx/security-ui-final-20261022.log` içinde; örnek ekran görüntüsü de görsel incelendi.
- Son üretim çıktısında `npm run test:security`: **12/12** geçti. Önceki canlı kayıt fixture'ındaki
  EncodingError tekrarına karşı sabit dosya kullanıldı; medya kontrolü atlanmadı.
- `npm run build`: başarılı; **33 JavaScript dosyası** çıktı güvenliği taramasından geçti.
  Vite yamasıyla yerel geliştirme sunucusu da yeniden başlatıldı.
- Strict UI audit: ham taramada Angular `(click)` bağlarını tanımayan 16 mevcut false positive;
  önceki Angular sözdizimi adaptörüyle **0 bulgu**. Denetim kuralları gevşetilmedi, iki çıktı da saklandı.
- Paket audit'i **0**; anahtar desen taraması bulgusuz. Gerçek kullanıcı hesabından gönderi/test
  paylaşımı yapılmadı. SQL 21/24'ü kullanıcı çalıştırdı; canlı kanıt ekran görüntüleriyle sınırlıdır.

## Kalan sınırlar

- `uploads` kullanıcının kararıyla public. Satır, arama ve etkileşim izinleri kısıtlanır; önceden bilinen
  public fotoğraf/video URL'si engelleme/kitle tercihleriyle gizlenmez.
- Storage ve PostgreSQL iki ayrı işlemdir. Silinmiş gönderi gizli kalır; ağ veya Storage hatasında dosya
  temizliği doğrulanamayabilir. SQL 24 canlı referansları korur; iki servis arasında atomik işlem sağlamaz.
- Üniversite/kampüs/bölüm kayıt sırasında beyan edilir; okul üyeliğinin harici doğrulaması eklenmedi.
- Tarayıcı testleri gerçek kullanıcı hesaplarına içerik göndermez; SQL testleri izole PGlite kullanır.
  Üretimde saldırı denemesi, gerçek iki hesapla işlem veya toplu veri/dosya temizliği yapılmadı.
- Üretim başlangıç paketi 742,20 kB; mevcut 700 kB uyarısı sürüyor, 1 MB hata sınırı aşılmadı.
  Bütçe yükseltilmedi. SMTP, hesap kotası, Vercel ortamı ve bütün canlı grant/policy kataloğu bu turda
  baştan denetlenmedi.
