# KampüsX güvenlik incelemesi — 14 Ekim 2026

## Sonuç ve kapsam

Mevcut Nx/Angular mimarisi ve `apps/shell`, `libs/shared/ui`, `libs/shared/design-tokens` dizinleri korunmuştur. Dosya veya klasör taşınmamıştır. Bu çalışma profil/kimlik doğrulama servislerini ve üretim yapılandırmasını güçlendirir; görünüm, tema token'ları, dil desteği ve gerçek auth bağlantısı korunur.

İncelenen kaynak kodda kritik bir açık tespit edilmedi. Görsel çözümleme ve oturum değişimiyle ilgili savunma eksikleri giderildi; üretime CSP ve HTTP güvenlik başlıkları eklendi. Buna karşılık önceki ürün kararı olan hesap varlığını açıklama davranışı devam eden bir gizlilik riskidir. Canlı Supabase RLS, Auth hook, rate-limit ve Storage ayarları bu yerel kod incelemesiyle doğrulanmış sayılmaz.

Kapsam: core servisleri, profil/düzenleme feature'ları, ilgili shared UI, auth/profile rotaları, browser storage, environment üretimi, production build, Vercel yapılandırması, depolanan yerel Git geçmişi ve bağımlılıklar. Yapı grafiğinin 10 Ekim tarihli kaydı güncel kaynakları kapsamıyordu; bulgular güncel dosyalar okunarak ve ilgili kaynaklarda arama yapılarak doğrulandı. Bu inceleme bir canlı sızma testi veya sınırsız güvenlik garantisi değildir.

## Giderilen bulgular

| Bulgu | Etki | Çözüm | Kanıt |
|---|---|---|---|
| JPG/WEBP çözünürlüğü ancak decoder çalıştıktan sonra kontrol ediliyordu | Küçük sıkıştırılmış dosya büyük piksel alanı talep ederek tarayıcı belleğini zorlayabilirdi | PNG IHDR, JPEG SOF ve WebP VP8/VP8L/VP8X boyutları decode öncesi okunuyor. 5 MiB dosya ve 32 MP boyut sınırları korunuyor. Tarayıcı decoder doğrulaması ve son boyut kontrolü de devam ediyor | Büyük başlıklar decoder'a ulaşmadan reddediliyor; bozuk/kesik başlık, gerçek PNG/JPG/WEBP testleri |
| Bekleyen yükleme sadece profil state'inin eski kullanıcı ID'sine bakıyordu | Auth state değişmişken Angular effect henüz çalışmamışsa eski işlemin önizleme üretmesi mümkündü | Başlangıçta, dosya okunduktan sonra ve decode sonunda güncel auth kullanıcısı ile state sahibi birlikte doğrulanıyor. Anonim güncelleme/yükleme reddediliyor | Logout ve hesap değişimi sırasında decoder bekletilerek test edildi; URL üretilmiyor, bitmap kapatılıyor |
| Bekleyen server doğrulaması teardown veya olay üretmeyen başarılı logout sonrası sonuç verebilirdi | Eski doğrulama sonucuyla frontend yönlendirmesine onay çıkabilirdi; veri yetkilendirmesi sunucuda kalır | `hasVerifiedSession` dönüşünde servis yaşamı ve mevcut oturum kullanıcısı tekrar kontrol ediliyor | Destroy/logout sırasında bekleyen doğrulama false dönüyor |
| Üretimde CSP ve ek HTTP güvenlik başlıkları yoktu | HTML/betik enjeksiyonuna karşı ek tarayıcı savunması eksikti | Angular `security.autoCsp` hash politikası etkinleştirildi. Build sonrasında ağ bağlantıları yalnızca uygulamanın kendi origin'i ve yapılandırılmış Supabase HTTP/WS origin'leriyle sınırlandı. Vercel'e nosniff, DENY, no-referrer, Permissions-Policy ve ek CSP direktifleri eklendi | Gerçek production HTML'ye yetkisiz script ekleme ve farklı origin'e fetch engellendi; normal profile/edit dört tema/dil kombinasyonunda çalıştı |

Profil güncellemesi ayrıca runtime'da isim/bio tiplerini ve uzunluklarını doğrular. Salt okunur ID/kullanıcı adı/akademik alanlar payload'dan uygulanmaz. Harici veya başka bir işleme ait görsel URL'leri kabul edilmez. Önizleme URL'leri iptal, değiştirme, hesap değişimi ve servis kapanışında serbest bırakılır. İsim/bio gönderimlerinde HTML string'leri Angular metin bağlaması olarak gösterilir; zararlı etiketler DOM'a dönüşmez.

## Üretim politikası

`apps/shell/project.json` production yapılandırması, Angular'ın statik hosting için hash tabanlı script politikasını üretir. Tema/dil ilk boyama betiği de build tarafından hash'lenir; kaynak tema mantığı değiştirilmez. `scripts/production-security.cjs`, bu politikanın varlığını doğrular; eksik veya unsafe-eval içeren çıktıda build başarısız olur. `connect-src` çalışma ortamının doğrulanmış Supabase URL'sinden türetilir; özel Supabase domain'i veya yerel origin sabit bir proje adına bağlanmaz.

Vercel header politikasında script-src/default-src tekrar tanımlanmaz; aksi halde Angular hash politikasını bozabilirdi. Inline **stil** izni Angular'ın dinamik component stilleri ve mevcut CSS bağlamaları içindir. Script politikası hash/strict-dynamic üzerinden modern tarayıcılarda uygulanır. Bu yaklaşım [Angular'ın resmi statik hosting güvenlik rehberine](https://angular.dev/best-practices/security#static-hosting-without-per-response-nonces) uyar.

HTTP başlıkları kodda hazırdır; canlı Vercel'de yeni deployment sonrasında uygulanır. Yerel security test sunucusu production dosyalarını bu aynı header değerleriyle 4400 portunda sunar. Normal geliştirme sunucusu 4200 ve standart E2E sunucusu 4300 ayrı kalır. Test yardımcıları Angular bundle'ına dahil değildir.

## Kontrol edilip korunmuş güvenlik davranışları

- Auth guard, yalnızca tarayıcıdan okunan JWT/user metadata'ya güvenmek yerine Supabase `getUser` sonucunu kontrol ediyor. Sign-out ve recovery akışları kendi kontrollerini koruyor. Frontend guard'ın veri yetkilendirmesi yerine geçmediği kodda belirtiliyor.
- Şifreler uygulama kodu tarafından depolanmıyor veya loglanmıyor. Remember kapalıyken SDK oturumu sekme storage'ında; açıkken seçilen persistent storage'da tutuluyor. Browser storage XSS'ye karşı HttpOnly değildir; CSP, escape ve güvenilir script sınırları burada önemlidir.
- Token/error callback parametreleri işlendikten sonra URL temizleniyor. No-referrer ek başlığı, auth URL'lerinin dış isteklere referrer olarak gitmesini önler.
- Supabase bağlantısında publishable/anon key kullanımı doğrulanıyor; secret/service_role anahtarları environment üretiminde reddediliyor. Publishable anahtar tarayıcıda bulunabilir; yetki sınırı RLS/server tarafıdır. [Supabase API anahtarı rehberi](https://supabase.com/docs/guides/getting-started/api-keys).
- Uygulama kaynaklarında `bypassSecurityTrust*`, kullanıcı verisinden oluşturulan HTML/template, eval veya new Function gibi riskli yürütme yollarına rastlanmadı. Test harness'larının TypeScript modül yükleme kodu production uygulama kaynaklarından ayrı incelendi.
- Mock profil işlemleri Supabase tablo veya Storage'a yazmıyor. User metadata yalnızca gösterim içindir; rol/yetki kararı için kullanılmıyor. Supabase, kullanıcı tarafından değiştirilebilir metadata'nın yetkilendirme verisi olarak kullanılmamasını belirtir. [RLS rehberi](https://supabase.com/docs/guides/database/postgres/row-level-security#authjwt).
- `.env.local`, üretilen environment.ts ve `.vercel` içeriği Git tarafından izlenmiyor. Secret pattern taraması bir test fixture'ını işaretledi; bu sabit, bilerek geçersiz test değeri kaynak ve test üzerinden incelenip sınıflandırıldı. İncelenen güncel kaynak ve yerel Git geçmişinde gerçek privileged key/private key/token saptanmadı. Kanıt: `security-secret-scan-2026-10-14.json`.
- `npm audit --json`, 14 Ekim kontrolünde **0 bilinen bağımlılık açığı** döndürdü. Bu sonuç uygulama mantığının hatasız olduğunu kanıtlamaz.

## Devam eden riskler ve canlı sunucu sınırı

**Hesap varlığı sorgulanabilir — orta risk / önceki ürün kararı.** Login, yanlış şifre sonucu `kampusx_login_email_exists` RPC'si üzerinden kullanıcı var mı ayrımını yapıyor. Migration bu fonksiyonu anon/authenticated rollerine açıyor. Şifre veya kullanıcı satırı döndürmese de e-posta listelerinin kontrol edilmesine olanak verir. SQL parametreli ve search_path sabit olduğundan burada SQL injection tespit edilmedi; gizlilik riski bunlardan bağımsızdır. Önceki açık isteğin değiştirilmedi. Risksizleştirmek için ayrımı kaldırıp RPC'nin public erişimini kapatmak gerekir; ayrım korunacaksa doğrulanan bot koruması ve server tarafında rate-limit gereklidir. Sadece frontend buton bekleme süresi veya Supabase Auth endpoint kotası ayrı RPC'yi güvenceye almaz. Migration'ın canlıda uygulanmış olması bu çalışmada doğrulanmadı.

**Gerçek veri yetkileri canlıda doğrulanmalı.** Veritabanı policy'leri veya Storage izinlerine yönetici erişimi sağlanmadığından RLS'nin doğru/aktif olduğu söylenemez. Canlıya çıkmadan tablo erişimleri `auth.uid()` ve server tarafından korunan rol/üyelik verileriyle sınırlandırılmalıdır. Akademik bilgilerin arayüzde readonly olması server tarafında değiştirilemez olduklarını kanıtlamaz.

**Üniversite e-postası koşulu yalnızca frontend ile güvenceye alınamaz.** Yerel form `.edu.tr` adresini doğrular; doğrudan Auth API kullanan istemci formu atlayabilir. Supabase tarafında bu koşulun bir [Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) veya uygun server kuralıyla uygulandığı ve e-posta sahipliğinin doğrulandığı ayrıca kontrol edilmelidir. Bu çalışmada canlı Auth ayarları değiştirilmedi.

Bu nedenle sonuç, “tüm sistemde hiçbir açık yok” değildir. Yerelde incelenen alan güçlendirildi, test edildi ve aşağıdaki sınırlarla raporlandı.

## Doğrulama

- `npm test`: **68/68** birim/regresyon testi.
- `npm run typecheck`: başarılı.
- `npm run format:check`: başarılı.
- `npm run check:i18n`: **345** eşleşen, boş olmayan TR/EN anahtarı.
- `npm run build`: başarılı; **15** production JavaScript dosyasında development/test runtime kontrolü geçti; HTML güvenlik politikası uygulandı.
- `npm run test:ui`: **64/64** standart tarayıcı testi; auth, recovery, dashboard, profile, welcome ve responsive/a11y kombinasyonları.
- `npm run test:security`: **7/7** üretim tarayıcı testi; literal zararlı isim/bio, anlık fotoğraf önizlemesi, gerçek JPG/WEBP, yetkisiz HTML script ve network isteğinin engellenmesi, anonim profile erişiminin reddi.

Testlerde canlı Supabase kullanıcı/veri değişikliği yapılmadı; Auth transport yalnızca izole test tarayıcılarında taklit edildi. Production testleri için önce `npm run build`, ardından `npm run test:security` çalıştırılır.

Profilin tam kaynak teslim dosyaları güvenlik değişiklikleriyle yenilenmiştir. Bu turda deploy veya Git push yapılmamıştır.
