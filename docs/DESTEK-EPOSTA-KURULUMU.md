# Yardım Merkezi — sunucu kurulumu

Destek formu `/help` rotasında, mevcut oturum içi çerçevede açılır. Kullanıcı adı ve e-posta Supabase Auth / sahibi olan profil satırından doğrulanır; istemci yalnızca açıklama ve tekil başvuru kimliği gönderir. Alıcı ve gönderici tarayıcıdan belirlenemez.

## Canlı ayarlar

1. `33-support-email-guard.sql` kullanıcının doğruladığı `support_contract_version = 2026102201` sonucuyla uygulandı. Mevcut sosyal tablolara, gönderilere veya Storage'a dokunmaz.
2. [Resend](https://resend.com) hesabında gönderici alan adını doğrula ve yalnızca gerekli gönderim iznine sahip bir API anahtarı oluştur. Normal üretim göndericisi doğrulanmış alan adı kullanmalıdır. `onboarding@resend.dev` deneme göndericisinin alıcı kısıtları vardır; üretim kurulumu gibi sunulmaz.
3. Supabase → Edge Functions → Secrets bölümüne aşağıdaki ayarları ekle. API anahtarını sohbete, Git'e veya Angular `.env.local` dosyasına koyma.

| Sunucu ayarı              | Değer                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`          | Resend'in oluşturduğu gizli gönderim anahtarı                                                      |
| `SUPPORT_FROM`            | Doğruladığın gönderici adresi; yalnızca e-posta, görünen ad / köşeli ayraç olmadan                 |
| `SUPPORT_TO`              | İstediğin Gmail destek alıcısı                                                                     |
| `SUPPORT_ALLOWED_ORIGINS` | Yayımlanmış uygulamanın tam HTTPS origin'i; birden fazlaysa virgülle ayır, yol ve sonda `/` ekleme |

Yerel `http://127.0.0.1:4200` ve `http://localhost:4200` origin'leri geliştirme için tanımlıdır. Production ve preview adresleri ayrı ayrı açıkça tanımlanır; joker origin veya keyfi Vercel alt alanına izin verilmez. `SUPABASE_URL` ve Supabase API anahtarları Edge ortamının yerleşik sunucu ayarlarıdır; istemciye sunucu anahtarı aktarılmaz.

Fonksiyon, `SUPABASE_PUBLISHABLE_KEYS` ve `SUPABASE_SECRET_KEYS` sözlüklerindeki `default` anahtarlarını öncelikli kullanır; bulunmazsa eski `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` değişkenleriyle uyumludur. Yeni `sb_secret_` anahtarı yalnızca sunucu çağrısının `apikey` başlığına yazılır; kullanıcı JWT'siyle karıştırılmaz ve JWT gibi Authorization'a konulmaz. Bozuk anahtar sözlüğü gönderimi kapatır. Bu yerleşik anahtarları ayrıca kopyalayıp Secrets'a eklemek gerekmez.

## Yayın

Yerel testler tamamlandıktan sonra proje kökünden:

```powershell
npx supabase functions deploy support-email --project-ref djhezivksrvcyqxzpiau --use-api
```

`supabase/config.toml` içindeki `verify_jwt = true` korunur; JWT kontrolünü kapatan bayrak kullanılmaz. Handler ayrıca Auth sunucusundan güncel kullanıcıyı doğrular. Tarayıcı oturum JWT'sini Authorization başlığıyla yollar; sunucu anahtarları frontend derlemesine girmez.

GET isteği yalnızca doğrulanmış hesabın kimliğini ve gönderim hazırlığını döner. Hazırlık kontrolü hem sözleşme sürümünü hem sunucu kimliğinin salt okunur durum RPC'sine erişimini sınar; yalnızca sürüm işaretinin okunması yeterli değildir. Bu kontrol başvuru oluşturmaz veya e-posta göndermez. Anahtar, gönderici, alıcı veya veritabanı erişimi eksikse gönderim açılmaz. Kurulum eksikliği başarı mesajına çevrilmez. Resend'in e-postayı kabul etmesi, Gmail'in teslim ettiğinin garantisi değildir; kesin teslim/bounce takibi için ileride doğrulanmış webhook gerekir.

## Spam ve yinelenen gönderim

Kalıcı veritabanı koruması bir hesabı dakikada bir, saatte üç, 24 saatte beş yeni başvuruyla sınırlar. Uygulama genelinde 24 saatte 100 yeni başvuru güvenlik sınırı vardır. Başarısız denemeler de bütçeye dahildir. Bu sınırlar yeni fonksiyonun sunucu kurallarıdır; istemci ayarıyla değişmez.

PostgreSQL kilidi birden fazla Edge worker'da aynı başvurunun eşzamanlı gönderilmesini önler. Resend'e aynı hesap/başvuru için aynı idempotency anahtarı ve içerik özetiyle gidilir. Belirsiz sonuçlarda önce sadece durum okunur; kullanıcı kontrollü tekrar aynı kimlik ve aynı açıklamayı kullanır. 23 saatten sonra belirsiz başvuru tekrar gönderilemez; sağlayıcının 24 saatlik tekrar önleme penceresinin dışına taşılmaz.

Özel tabloda açıklama, e-posta veya kullanıcı adı bulunmaz. Yalnızca kullanıcı/başvuru kimliği, içerik özeti, zaman, deneme sayısı ve durum bulunur. Bu kayıtlar hesaba bağlıdır; hesap silinince FK üzerinden kaldırılır. E-postanın içeriği Resend ve yapılandırılmış destek posta kutusunda işlenir; istek veya anahtarlar uygulama loglarına yazılmaz.

## Güvenli geri dönüş

Önce yardım bağlantısı olmayan önceki istemci sürümüne dön. Ardından `33-support-email-guard-rollback.sql` dispatch RPC'lerini kapatır; sosyal verileri ve gönderim kayıtlarını silmez. SQL 33 tekrar çalıştırılarak koruma açılabilir. Sorunda e-posta sağlayıcısındaki gönderim anahtarı da devre dışı bırakılabilir.

Kaynaklar: [Supabase Edge kimlik doğrulama](https://supabase.com/docs/guides/functions/auth), [Resend gönderim API'si](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency penceresi](https://resend.com/docs/dashboard/emails/idempotency-keys).
