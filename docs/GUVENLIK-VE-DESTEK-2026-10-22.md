# KampüsX güvenlik ve Yardım Merkezi raporu

22 Ekim 2026 · Proje: `djhezivksrvcyqxzpiau`.

Yardım Merkezi gerçek sunucu gönderimi için hazırlandı. Menü `/help` formunu açar. Kullanıcı adı ve e-posta düzenlenemez; sunucu her gönderimde güncel Auth hesabını ve o hesaba ait `profiles.user_id` satırını doğrular. Kullanıcı yalnızca problem açıklamasını yazar. E-posta Resend üzerinden sunucuda tanımlanan destek alıcısına gider; Reply-To doğrulanmış kullanıcının e-postasıdır.

SQL 33 kullanıcı tarafından `support_contract_version = 2026102201` sonucuyla doğrulandı. Yeni `support-email` Edge Function bu projeye yayınlandı; mevcut bir fonksiyonun üzerine yazılmadı. JWT platform kontrolü açık bırakıldı. Gerçek gönderimin açılması için Resend anahtarı, doğrulanmış gönderici ve destek alıcısı sunucu ayarlarında bulunmalıdır. Bunlar tamamlanmadan başarı mesajı veya sahte gönderim yapılmaz. Ayrıntılar: [sunucu kurulumu](DESTEK-EPOSTA-KURULUMU.md).

## Kontrolün kapsamı

- Angular Auth/oturum, profil, gönderi/medya ve sosyal akışların mevcut testleri; yeni destek formu ve API sınırı.
- Supabase SQL 33'ün izinleri, tekrar çalıştırılabilmesi, kalıcı spam sınırları, idempotency ve geri dönüş davranışı; yerel PostgreSQL/PGlite üzerinde.
- Edge handler'ın gerçek Request/Response/stream davranışı ve Deno tip kontrolü; e-posta sağlayıcısı testlerde taklit edildi.
- Derlenmiş üretim uygulamasında CSP, metin olarak içerik gösterimi, yetkisiz ağ/script/resim istekleri, güvenli medya URL'leri ve oturumsuz erişim.
- Güncel npm duyuruları ve Git'e girebilecek kaynaklarda bilinen gizli anahtar biçimleri.
- Canlıda yalnızca anonim HEAD/GET/OPTIONS kontrolleri. Üretime test kullanıcısı, sosyal gönderi veya mesaj eklenmedi; yük testi, parola denemesi veya gerçek destek e-postası gönderilmedi.

Grafik indeksinin 10 Ekim sürümü güncel dosyaları kapsamıyordu. Kapsama kontrolünden sonra ilgili kaynaklar doğrudan okundu. Bu rapor belirtilen testlerin sonucudur; bütün sisteme ilişkin bağımsız pentest veya kusursuz güvenlik garantisi değildir.

## Doğrulanan mevcut durum

| Kontrol                                                                                        | Sonuç                                                |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Üretim bağımlılıkları için `npm audit --omit=dev`                                              | Bildirilen açık: 0                                   |
| Geliştirme araçları dahil `npm audit`                                                          | Bildirilen açık: 0                                   |
| Canlı profiles/posts/follows/likes/bookmarks/blocks/reports/conversations/messages anonim HEAD | Dokuzunun tamamı HTTP 401; kullanıcı satırı okunmadı |
| Canlı support-email oturumsuz GET                                                              | HTTP 401                                             |
| Canlı localhost destek preflight                                                               | HTTP 204, tam origin eşleşmesi                       |
| Canlı yabancı origin preflight                                                                 | HTTP 403, izin başlığı verilmedi                     |
| Sıkı UI statik denetimi                                                                        | 0 bulgu                                              |
| Gerçek Deno tip kontrolü                                                                       | Geçti                                                |

Bu başlıklarda doğrulanmış, mevcut bir kritik/yüksek açık bulunmadı. Anonim kontrol, oturum açmış bütün rol kombinasyonlarının canlıda test edildiği anlamına gelmez. İki hesap arasındaki yetki ve görünürlük sınırları mevcut yerel SQL/servis/tarayıcı senaryolarıyla ayrıca sınanır.

## Destek akışında kapatılan saldırı yolları

| Risk / negatif senaryo                                          | Uygulanan kontrol                                                                                                                                                                                            | Kanıt                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Başkası adına destek talebi veya sahte Reply-To                 | İstemci yalnızca başvuru kimliği ve açıklama yollar. Kimlik Auth sunucusundan, kullanıcı adı sahibinin RLS'li profilinden okunur; ek kimlik alanları reddedilir.                                             | Edge ve taşıma testleri                                |
| Açık e-posta aktarıcısı olarak kullanma                         | To/From yalnızca sunucu ayarlarından gelir. Tarayıcı alıcı/gönderici belirleyemez.                                                                                                                           | Ek `to/from/email/user_id` alanları 400 ile reddedildi |
| API anahtarı / service_role sızıntısı                           | Anahtarlar yalnızca Edge ortamında bulunur; Angular ortam üreticisi public anahtarla sınırlıdır. Cevaplar ve loglar ham sağlayıcı hatası içermez.                                                            | Kaynak taraması, üretim çıktı kontrolü, hata testleri  |
| Spam ve eşzamanlı worker'larla sınırı aşma                      | PostgreSQL kilidi ve kalıcı kayıt: dakikada 1, saatte 3, 24 saatte 5 yeni başvuru; uygulama genelinde 24 saatte 100. Başarısız denemeler de sayılır.                                                         | 12 SQL kontrolü                                        |
| Ağ hatasında e-postanın iki kez gitmesi                         | Hesap/başvuruya bağlı idempotency anahtarı, içerik özeti, 90 saniyelik işleme süresi, en fazla üç işleme denemesi. Belirsizlikte önce yalnızca durum okunur; açık tekrar aynı kimlik ve açıklamayı kullanır. | SQL, Edge ve tarayıcı testleri                         |
| Sağlayıcının tekrar önleme penceresinden sonra yeniden gönderim | Belirsiz başvuru 23 saatten sonra tekrar gönderilmez; Resend'in 24 saatlik penceresi dışına çıkılmaz. Başarılı başvuru kalıcı olarak tekrar gönderilmez.                                                     | SQL süre/başarı durumu testleri                        |
| Kimlik veya açıklama üzerinden HTML/header enjeksiyonu          | E-posta yalnızca düz metindir; konu başvuru kimliğinden oluşur. E-posta ve kullanıcı adında kontrol karakterleri reddedilir.                                                                                 | Edge enjeksiyon testleri ve üretim CSP testleri        |
| Büyük veya bitmeyen istek gövdesi                               | Gerçek stream boyutu 20.000 baytla ve okuma süresi 5 saniyeyle sınırlıdır; Content-Length'e tek başına güvenilmez.                                                                                           | Büyük/eksik/boş/yanlış JSON ve yavaş stream testleri   |
| İstenmeyen origin'den tarayıcı erişimi                          | Tam origin listesi, joker ve credentials izni yok. CORS kimlik doğrulamasının yerine kullanılmaz.                                                                                                            | Canlı OPTIONS ve yerel negatif testler                 |
| Hesap değişiminden sonra eski sonuçların görünmesi              | İstek başlatan oturuma bağlanır; epoch/destroy/abort kontrolleri geç cevapları yok sayar. Taslak kalıcı depolamaya yazılmaz.                                                                                 | Taşıma ve çıkış sırasında gönderim tarayıcı testi      |

Bu tablo yeni destek özelliğinin yayına çıkmadan sınanan güvenlik sınırlarını anlatır; bu saldırı yollarının daha önce üretimde bulunan bir destek formunda kullanıldığı iddia edilmez.

Özel tabloda açıklama, e-posta ve kullanıcı adı tutulmaz. Yalnızca kimlikler, içerik özeti, zaman, durum ve deneme sayısı bulunur; hesap silinince FK üzerinden kaldırılır. Bu metadata tablosu ve dispatch RPC'leri normal kullanıcıya/anonim role açılmaz. Resend/Gmail'de işlenen e-posta içeriği, formdaki ayrı veri kullanım açıklamasında belirtilir. Kayıtta daha önce kabul edilmiş yasal metinlerin sürümleri değiştirilmedi.

Gizli anahtar taramasında bir eski negatif test örneği biçim olarak anahtara benziyordu. Bunun gerçek bir anahtar değil, açıkça test amaçlı bir ifade olduğu doğrulandı ve `sb_secret_TEST` gibi kısa bir örneğe çevrildi. Bu durum bir üretim anahtarı sızıntısı olarak raporlanmadı; ilgili sekiz ortam testi yeniden geçti.

## Kalan sınırlamalar

1. **E-posta hesabı kurulumu:** Resend ayarlarının hazır olduğu ve gerçek Gmail teslimi henüz doğrulanmadı. Kurulum tamamlanmadan form gönderimi etkinleşmez. API kabul cevabı da tek başına Gmail teslim garantisi değildir; bounce/teslim takibi için doğrulanmış webhook gerekir.
2. **Public medya bağlantıları:** Kullanıcının önceki açık kararıyla `uploads` public kalır. RLS uygulama satırlarını korur; bağlantıyı önceden bilen kişi medya dosyasını açabilir. Genel güvenlik isteğiyle bucket gizliliği sessizce tersine çevrilmedi.
3. **Ölçüm sınırı:** Gerçek çok bağlantılı yük testi, bağımsız dış pentest ve her canlı rol kombinasyonuyla yazma testi yapılmadı. Hesap ele geçirmeye karşı MFA/oturum politikaları ve kayıt CAPTCHA ayarları bu işte değiştirilmedi.
4. **Paket boyutu:** Üretim derlemesi geçti; başlangıç 820,46 kB, tahmini aktarım 196,88 kB. Mevcut 700 kB uyarı sınırı aşılıyor, 1 MB hata sınırının altında. Sınırlar yükseltilmedi.

## Doğrulama kaydı

- `npm test`: 206/206 geçti; destek akışında 11 sunucu güvenlik testi ve 4 taşıma testi dahil.
- `node scripts/sql/verify-support.cjs`: 12/12 yerel SQL kontrolü geçti. Mevcut hesaplar ve metadata geri dönüşte korunur.
- `npx deno check --config supabase/functions/support-email/deno.json supabase/functions/support-email/index.ts`: geçti.
- `npm run typecheck`: geçti. `npm run check:i18n`: 685 TR/EN anahtarı eşleşti.
- `npm run test:ui`: 199/199 geçti; destek formu, belirsiz gönderim, hız sınırı, oturum değişimi ve mevcut sosyal/kayıt/mesajlaşma akışları dahil.
- `npm run test:security`: üretim derlemesi üzerinde 14/14 geçti. Bu koşuda ağ uçları taklit edildi; canlıya e-posta veya kullanıcı verisi yazılmadı.
- `npm run build`: geçti; 40 JavaScript dosyasında üretim çıktı kontrolü geçti.
- `scripts/security/secret-scan.cjs`: yayına girecek kaynaklarda eşleşen gerçek gizli anahtar bulunmadı; eşleşen değerler hiçbir zaman yazdırılmaz.
- `npm run format:check` ve `git diff --check`: geçti. TR/açık ve EN/koyu dar ekran destek görselleri ayrıca incelendi.

Yerel SQL testleri mevcut `.nx/sql-verification` PGlite çalışma alanını kullanır; bunlar canlı veritabanına bağlanmaz. HTTP negatif kontrolleri e-posta oluşturmaz. Test komutları, rollback dosyası ve sunucu ayarları commit'e dahildir; gerçek anahtarlar dahil değildir.

Arayüzde mevcut renk, tema ve tipografi token'ları korundu. Yardım Merkezi, kullanıcının isteğiyle devre dışı menü öğesinden gerçek rotaya dönüştürüldü; mevcut sayfa çerçevesi, form alanları ve onay pencereleri kullanıldı. Tanıtım ve giriş ekranları yeniden tasarlanmadı.

## Geri alma

Yardım bağlantısı olmayan önceki istemciye dön ve `docs/supabase/33-support-email-guard-rollback.sql` dosyasını çalıştır. Bu, yeni dispatch yetkilerini kapatır; kullanıcıları, gönderileri, mesajları veya metadata kayıtlarını silmez. SQL 33 tekrar çalıştırılarak koruma açılabilir. Sunucu fonksiyonu ayrı yayınlandığından frontend Git push'u tek başına fonksiyonu güncellemez.

Kaynaklar: [Supabase kimlik doğrulaması](https://supabase.com/docs/guides/functions/auth), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Resend e-posta API'si](https://resend.com/docs/api-reference/emails/send-email). Kullanılan teknik davranışlar sağlayıcıların birincil belgeleriyle kontrol edildi.
