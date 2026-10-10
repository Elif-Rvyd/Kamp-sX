# KampüsX auth güvenlik ve entegrasyon incelemesi

İnceleme tarihi: **10 Ekim 2026**.

Bu incelemede Angular uygulamasındaki Supabase bağlantısı, auth servisleri, giriş/kayıt/parola yenileme ekranları ve Vercel derleme yapılandırması kontrol edildi. Tespit edilen yerel kod hataları düzeltildi ve regresyon kontrolleri eklendi. Uzak Supabase veya Vercel hesabına erişilmedi; gerçek kullanıcı hesabı oluşturulmadı, gerçek e-posta gönderilmedi ve üretim dağıtımı yapılmadı.

Kurulum adımları ve Dashboard'da tamamlanacak ayarlar [auth-deployment.md](auth-deployment.md), paket güvenlik bulguları [dependency-audit.md](dependency-audit.md) içinde açıklanıyor.

## 1. Bulgular ve yapılan değişiklikler

| Bulgu                              | Önce                                                                                                                                 | Şimdi                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Giriş formunda eksik import        | `AuthService` kullanılıyor fakat import edilmiyordu; derleme başarısız olabiliyordu.                                                 | Eksik import eklendi ve TypeScript kontrolü geçti.                                                                                          |
| Başlangıç oturumu ve hata yönetimi | `getSession()` sonucunun hatası ve reddedilen promise ele alınmıyordu; başlangıç snapshot'ı daha yeni auth olayını ezebiliyordu.     | `ready`, `initialized` ve `initializationError` eklendi; olay revizyonu ile eski snapshot'ın güncel oturumu ezmesi önlendi.                 |
| Auth yaşam döngüsü                 | `onAuthStateChange()` aboneliği saklanmıyordu.                                                                                       | Abonelik `DestroyRef` ile kaldırılıyor; Supabase istemcisinin arka plan işleri ve realtime kanalları uygulama kapanırken temizleniyor.      |
| Beni hatırla                       | Checkbox değeri servise gönderilmiyordu; SDK'nın varsayılan kalıcı oturumu kullanılıyordu.                                           | Tercih servise aktarılıyor; seçiliyse localStorage, seçili değilse sessionStorage kullanılıyor.                                             |
| Eksik parola yenileme akışı        | E-posta linki ana sayfaya dönüyordu; yeni parola belirleme ekranı yoktu.                                                             | `/auth/update-password` lazy route'u ve parola tekrarı içeren ekran eklendi; geçerli recovery oturumu gerektiği kontrol ediliyor.           |
| Yetersiz hata sunumu               | Bütün hatalar tek mesajla gösteriliyordu; ekranlarda hâlâ “demo, hesap/e-posta oluşturulmaz” yazıyordu.                              | Güvenli hata kodları TR/EN anahtarlarına eşleniyor; auth ve yasal açıklamalar gerçek bağlantıya uygun güncellendi.                          |
| Ortam yapılandırması               | Supabase URL ve publishable anahtar doğrudan servisteydi; Vercel ortam değişkenlerinin Angular paketine aktarılması tanımlı değildi. | Yerel `.env.local` ve Vercel değişkenlerinden üretilen environment dosyası kullanılıyor; üretim build eksik/geçersiz ayarlarda duruyor.     |
| Üretim çıktısında debug kodu       | Yerel Console Ninja eklentisinin enjekte ettiği `_console_ninja` ve `eval` runtime'ı üretim JavaScript paketinde bulundu.            | Üretim derlemesi ayrı süreçte production/CI ayarlarıyla çalışır; son çıktı debug runtime'ı veya sahte E2E bağlantısı taşıyorsa build durur. |
| Route guard                        | `authGuard` her zaman `true` dönüyordu.                                                                                              | Başlangıç hazır olduktan sonra Supabase `getUser()` ile kullanıcı doğrulanıyor; başarısızsa giriş sayfasına yönlendiriliyor.                |

**Guard bulgusunun sınırı:** Eski guard mevcut route'larda kullanılmıyordu; bu nedenle inceleme mevcut bir korumalı sayfanın yetkisiz açıldığını göstermiyor. Mevcut welcome ve auth sayfaları herkese açık. Guard gelecekte korumalı route'lara bağlanabilir; veritabanı yetkilerini RLS/sunucu denetler.

## 2. Oturum başlangıcı, yarış durumu ve temizlik

[AuthService](../apps/shell/src/app/core/auth.service.ts) artık önce SDK başlangıcının sonucunu kontrol ediyor, ardından oturum snapshot'ını okuyor. `ready` tamamlanmadan oturuma bağlı karar verilmemesi sağlanıyor.

Olay geldiğinde revizyon artıyor. Başlangıç okuması başladığından beri bir olay geldiyse eski okuma sonucu oturuma uygulanmıyor:

```ts
const revision = this.revision;
// SDK başlangıcı ve hata kontrollerinden sonra:
const { data, error } = await this.supabase!.auth.getSession();
if (this.destroyRef.destroyed) return;
if (error) {
  this.initializationError.set(error);
  if (revision === this.revision) this.currentSession.set(null);
} else if (revision === this.revision) {
  this.currentSession.set(data.session);
}
```

SDK `initialize()` hatası ayrıca kontrol ediliyor. Bu ayrım önemli: süresi dolmuş veya yeniden kullanılmış doğrulama bağlantısının hatası, yalnızca mevcut oturumu okumakla güvenilir biçimde tespit edilemez.

Abonelik için yapılan düzeltme:

```ts
this.destroyRef.onDestroy(() => subscription.unsubscribe());
```

[SupabaseService](../apps/shell/src/app/core/supabase.service.ts), sahip olduğu istemcinin `auth.dispose()` ve `removeAllChannels()` işlemlerini de teardown sırasında çağırıyor. Buradaki eksik temizlik, tek kök servis kullanılan normal sayfa geçişlerinde sürekli yeni abonelik oluşturulduğu anlamına gelmiyordu; uygulama yok edilmesi, HMR ve test yaşam döngülerinde önem taşıyordu.

Formlarda ve parola yenileme sayfasında işlem tamamlandığında `DestroyRef.destroyed` kontrol ediliyor. Sayfa kapandıktan sonra signal/focus güncellemesi yapılmıyor. Async auth callback içinde yeni SDK çağrıları başlatılmıyor.

## 3. Beni hatırla ve tarayıcı depolaması

[Giriş formu](../apps/shell/src/app/features/auth/login-form/login-form.component.ts) tercihi gerçekten gönderiyor:

```ts
const { data, error } = await this.api.signIn(v.identity.trim(), v.password, v.remember);
```

[BrowserAuthStorage](../apps/shell/src/app/core/browser-auth-storage.ts) tek Supabase istemcisi için depolama seçimini yönetiyor:

- **Seçili değil:** token kaydı sessionStorage içinde tutuluyor; aynı sekmede yenilemede okunabilir.
- **Seçili:** token kaydı localStorage içine taşınıyor ve tarayıcı yeniden açıldığında okunabilir.
- **Depolama engellenmiş/dolu:** sayfa belleğine düşülüyor; kalıcılık garanti edilmiyor.
- **Çıkış:** auth'a ait kayıt her iki depodan ve bellekten kaldırılıyor; tema/dil gibi ilgisiz kayıtlar taşınmıyor veya silinmiyor.

Önceden SDK tarafından localStorage'a yazılmış ve hatırlama tercihi bulunmayan oturum, mevcut sekmeye taşınıyor. “Beni hatırla” oturumun sunucudaki süresini uzatmaz; Supabase'in süre, iptal ve token yenileme kuralları geçerlidir. sessionStorage tarayıcı tarafından yeniden açılmış/çoğaltılmış sekmelerde geri yüklenebilir; kesin bir “tarayıcı kapanınca sunucuda çıkış” garantisi değildir.

Bu tarayıcı depolaması HttpOnly cookie güvenliği sağlamaz. Aktif token'lar uygulamanın JavaScript ortamında erişilebilir; XSS ve veritabanı yetkilendirmesi ayrıca korunmalıdır. İncelenen auth kodunda token veya şifreyi loglayan bir işlem eklenmedi.

## 4. Parola yenileme ve callback güvenliği

[Yeni parola sayfası](../apps/shell/src/app/features/auth/update-password/update-password.page.ts) şu durumları gösteriyor: bağlantı kontrolü, geçersiz bağlantı, parola/parola tekrarı, işlem hatası, başarılı güncelleme ve parola kaydedildiği hâlde çıkışın başarısız olması.

Sadece route'a gitmek veya sıradan giriş oturumu sahibi olmak, bu formun recovery durumunu açmıyor. Recovery durumu SDK'nın `PASSWORD_RECOVERY` olayından geliyor; oturumun bulunması ve başlangıç hatasının olmaması da gerekli:

```ts
if (!this.recovery() || !this.session() || this.initializationError()) {
  return { error: this.failure('recovery_required'), passwordUpdated: false };
}
```

Parola değişikliği `updateUser({ password })` ile yapılıyor. Başarılı değişiklikten sonra `signOut({ scope: 'local' })` çağrılıyor. Çıkış başarısız olsa bile parola kaydedilmiş olabilir; sonuç bunu ayrı bildiriyor:

```ts
return {
  error: signedOut.error ? this.failure('password_updated_signout_failed') : null,
  passwordUpdated: true,
};
```

Ekran bu durumda parola değişikliğini yeniden göndermek yerine çıkışı tekrar deneme seçeneği veriyor. Başarılı giriş/kayıt ve parola güncellemesinden sonra parola form alanları temizleniyor.

SDK, sunucunun logout isteği başarısız olsa da yerel oturumu silebilir. Tekrar deneme bu durumda yerel olarak idempotent tamamlanır; ikinci bir ağ çağrısı veya sunucudaki token iptalinin doğrulandığı iddia edilmez. Başarı ekranı mevcut tarayıcı oturumunun kapandığını ifade eder; diğer cihazların oturumları bu işlemle kapatılmaz.

Callback algılama `/auth/login` ve `/auth/update-password` yollarıyla sınırlandırıldı. SDK bağlantıyı işledikten sonra auth kodu/token'ları ve callback hata bilgileri query/hash alanlarından temizleniyor; ilgisiz URL parametreleri korunuyor. Bu işlem ilk bağlantının başka sistemlerde hiç kaydedilmediğini garanti etmez.

Parola sıfırlama isteğinin başarı metni hesabın varlığını doğrulamıyor: adres kayıtlıysa bağlantının gönderileceğini söylüyor. Genel API hataları ham sunucu mesajı olarak ekrana taşınmıyor.

## 5. Publishable anahtar ve Vercel yapılandırması

Yerel bir üretim derlemesinde Console Ninja debug runtime'ı saptandı. Kod uygulama kaynaklarında yoktu; eklenti yerel Angular/Vite araç dosyalarını yamalayarak derlemeye ekliyordu. Bu bulgu, auth bilgilerinin dışarıya sızdığını kanıtlamaz. Eklentinin global ayarları veya dosyaları değiştirilmedi.

`npm run build` artık [build-production.cjs](../scripts/build-production.cjs) üzerinden üretim derlemesini başlatır. Yalnızca alt sürece `CI=true` ve `NODE_ENV=production` aktarılır; böylece debug enjeksiyonu ve Angular'ın yerel derleme önbelleğinin kullanımı engellenir. Nx daemon/TUI/plugin isolation ayarları da bu süreçte kapalıdır. Derleme sonrasında [verify-production-output.cjs](../scripts/verify-production-output.cjs), en az bir JavaScript çıktısı bulunduğunu ve çıktılarda Console Ninja runtime'ı veya E2E endpoint/anahtarı olmadığını doğrular. Hata çıktısı dosya adıyla sınırlıdır; bundle veya anahtar içeriği yazdırılmaz.

Temiz derlemede ana JavaScript paketi yaklaşık 641,45 kB'den 595,53 kB'ye indi. Son dosyalarda debug runtime'ı bulunmadı. Bu çıktı kontrolü belirli riskleri denetler; genel bir zararlı kod taraması olarak sunulmaz.

İlk servisteki `sb_publishable_` biçimli anahtar **tarayıcıda kullanılabilen genel anahtardı**; bu değer tek başına secret/service-role anahtar sızıntısı sayılmaz. Anahtarı environment dosyasına taşımak JavaScript paketindeki görünürlüğünü ortadan kaldırmaz. Ayrı ortam seçimi ve yanlışlıkla ayrıcalıklı anahtar kullanmayı engelleme amaçlanıyor.

Gereken iki değişken:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

[Environment generator](../scripts/generate-environment.cjs) URL/anahtar biçimini doğruluyor; `sb_secret_` ve eski `service_role` JWT değerlerini reddediyor. Eski `anon` JWT anahtarları da destekleniyor. Bu biçim denetimi JWT imzasını doğrulamaz veya anahtarın URL'deki projeye ait olduğunu kanıtlamaz; gerçek bağlantıyı Supabase doğrular.

`.env.local` ve üretilen `apps/shell/src/environments/environment.ts` Git dışında tutuluyor. Üretim `npm run build` strict hazırlık yapıyor. Nx `serve`/`build` hedeflerinde de environment hazırlığı tanımlandı; farklı ortamlarda eski bağlantı çıktısı kullanılmaması için ilgili Nx build cache kapatıldı. Vercel ortam değişkenleri değiştiğinde yeni build/deployment gerekir.

[vercel.json](../vercel.json) içindeki `npm ci`, `npm run build`, `dist/apps/shell/browser` ve SPA rewrite ayarları Angular/Nx çıktısıyla uyumlu. Gerçek Vercel projesindeki Root Directory, Node sürümü ve Environment Variables ekranları bu incelemede görülmedi. Adım adım kurulumu [auth-deployment.md](auth-deployment.md) üzerinden tamamla.

## 6. Veritabanında tamamlanması gereken yetkilendirme

Auth servisi eklenmesi, veritabanı tablolarını kendiliğinden güvenli hâle getirmez. Şu noktalar yerel frontend koduyla doğrulanamaz:

1. Tarayıcıya açılan tabloların RLS/grants/policies kuralları.
2. Üniversite e-posta domain allowlist'inin sunucuda uygulanması.
3. `auth.users` kaydından doğru bir profil üreten trigger/hook.
4. Kullanıcı, admin ve topluluk yöneticisi rollerinin güvenilir kaynaktan atanması.
5. Profilde üniversite/bölüm eşleşmesinin sunucuda doğrulanması.

`user_metadata` kullanıcı tarafından değiştirilebilir. Kayıtta gönderilen `username` bir profil girdisidir; yetki değildir. İstemciden gönderilen `role: 'admin'` gibi bir değere güvenilmemelidir. Yetki, kullanıcı tarafından yazılamayan rol kayıtları/güvenilir `app_metadata` ve RLS üzerinden kontrol edilmelidir. [Supabase RLS açıklaması](https://supabase.com/docs/guides/database/postgres/row-level-security)

Önceki kodun “trigger profiles'a yazar” yorumunu kaldırdık: yorum, gerçek trigger'ın varlığını kanıtlamıyordu. **Canlı veritabanındaki `auth.users` → profil oluşturma trigger'ı ve mevcut şema yapısı doğrulanmadı.**

Mevcut kayıt formu üniversite ve bölüm kimliklerini göndermiyor. Bu alanlar zorunlu olacaksa kayıt/onboarding ve ilgili sunucu kuralları ayrıca tasarlanmalı. Frontend'deki `.edu.tr` regex'i doğrudan Supabase API çağrısıyla aşılabilir; uygulama genelindeki kayıt şartı için sunucuda hook veya kontrollü kayıt akışı gerekir. [Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)

## 7. Doğrulama kanıtı ve kapsam sınırları

Bu rapor yazılırken auth değişiklikleri için alınan yerel sonuçlar:

| Kontrol                     | Sonuç / kapsam                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                  | 44 kontrol geçti; validator, environment üretimi, auth servis/guard, depolama ve üretim çıktısı testleri.                          |
| Auth servis/guard alt grubu | 24 kontrol geçti; gerçek TypeScript kodu derlenerek Angular DI ve SDK sınırı mock'landı.                                           |
| TypeScript kontrolü         | Geçti.                                                                                                                             |
| Yerel üretim build          | `npm run build` geçti; 7 JavaScript dosyası debug/E2E taramasından geçti. Canlı Supabase bağlantısı bu kontrolün kapsamında değil. |
| i18n eşleşmesi              | TR/EN 242 anahtar doğrulandı.                                                                                                      |
| Tarayıcı testleri           | 36 farklı senaryo doğrulandı: 23 welcome/erişilebilirlik senaryosu ve son hedefli koşuda 13/13 auth/recovery testi geçti.          |

Son tam tarayıcı koşusunda 34/36 senaryo geçti. Kalan iki kontrol, mock yanıtlarında eksik CORS header exposure nedeniyle SDK'nın hata kodunu okuyamıyordu. Gerçek API sürüm header'ını tarayıcıya açan test fixture düzeltildi; ilgili auth/recovery grubu yeniden çalıştırıldı ve 13/13 geçti. SDK'nın isteğe eklediği boş PKCE alanları ve hata sonrası yerel oturum temizliği de testlerde dikkate alındı. Gerçek Supabase projesine ağ isteği gönderilmedi.

Masaüstü açık/TR ve 320px mobil koyu/EN parola yenileme ekranlarının son görüntüleri görsel olarak incelendi. Otomatik erişilebilirlik kontrollerinde ihlal bildirilmedi. Test screenshot'ları `test-results` altında üretilir; eski `docs/qa` kayıtları değiştirilmez. İzole `e2e` environment file replacement, testlerin normal 4200 önizlemesinin bağlantı ayarlarını değiştirmesini önler.

Servis testleri başlangıç snapshot yarışını, dönen/fırlatılan hataları, teardown'u, hatırlama tercihini, recovery sınırını, parola kaydedildikten sonraki çıkış hatasını, URL temizliğini ve doğrulama sürerken çıkış yapılmasını kapsıyor. Mock'lar canlı Supabase politikalarını veya SMTP'yi test etmez.

**Uzak tarafta kontrol edilmedi:** RLS/grants, exposed schemas, e-posta doğrulaması, kayıt hook'u, rol atama kuralları, gerçek profile trigger'ı, Site URL/Redirect URLs, e-posta şablonları, SMTP, auth rate limit/CAPTCHA, Vercel proje ayarları ve gerçek domain. Bu alanlarda “üretim güvenliği tamamlandı” sonucu çıkarılamaz.

Paket güvenlik değerlendirmesi ayrı tutuldu; geliştirme/derleme araçlarının audit bulguları uygulama token'larının sızdığı anlamına gelmez. Bağımlılık güncellemesi sonrası kontroller ve kalan paket riskleri için [dependency-audit.md](dependency-audit.md) referanstır.
