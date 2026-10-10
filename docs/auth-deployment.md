# Supabase Auth ve Vercel kurulumu

Bu proje Angular tarayıcı uygulamasıdır. Supabase bağlantısı derleme sırasında ortam değişkenlerinden üretilir; Vercel'de sadece bir değişken tanımlamak, mevcut dağıtımın JavaScript dosyalarını değiştirmez. Değişiklikten sonra yeniden dağıtım gerekir.

## 1. Yerel bağlantı

Kök dizindeki `.env.example` dosyasını `.env.local` adıyla kopyala ve Supabase Dashboard'un Connect / API Keys bölümündeki iki değeri ekle:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

`.env.local` ve üretilen `apps/shell/src/environments/environment.ts` Git tarafından dışlanır. Mevcut yerel bağlantı bu incelemede `.env.local` içine taşındı. Dosyayı paylaşma veya Git'e zorla ekleme.

```bash
npm ci
npm start
```

Doğrudan `nx serve shell` / `nx build shell` çağrılarında da `configure-environment` hedefi çalışır. `npm run typecheck` aynı dosyayı üretir. Yerel ayarlar tamamen eksikse karşılama ekranı açılır ve auth işlemleri yapılandırma hatası verir; tek bir değişken eksikse veya değerler geçersizse hazırlık durur. `.env.local` değiştiğinde sunucuyu yeniden başlat.

Üretim dağıtımında kullanılan `npm run build`, ortam değişkenleri yoksa her ortamda durur; yerelde de bu komut için `.env.local` dosyasını doldurmak gerekir. Bu zorunluluk Vercel'in otomatik sistem değişkeni ayarından bağımsızdır.

Yayın paketini `npm run build` ile üret. Bu komut production/CI ayarlarını yalnızca derleme sürecine aktarır ve sonunda çıktıda debug eklentisi runtime'ı veya E2E test bağlantısı olmadığını denetler. Yerel debug eklentisinin ayarlarını değiştirmen gerekmez. Eksik JavaScript çıktısı da başarılı doğrulama sayılmaz.

Generator yalnızca `sb_publishable_` ve eski `anon` JWT biçimini kabul eder. `sb_secret_` ve `service_role` anahtarlarını reddeder. Bu kontrol JWT imzasını doğrulamaz; bağlantı bilgisinin doğruluğunu Supabase doğrular. URL ve anahtarın aynı projeye ait olması gerekir.

**Publishable anahtar tarayıcı paketinde görünür.** `.env.local` kullanılması anahtarı kullanıcıdan saklamaz; doğru ortamı seçmeyi sağlar. Verileri koruyan mekanizma Supabase izinleri ve RLS'dir. Secret, service-role, veritabanı şifresi, SMTP şifresi veya JWT signing secret hiçbir frontend değişkenine konulmamalıdır. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## 2. Vercel ayarları

Vercel projesinin Settings → Environment Variables bölümünde şu değişkenleri ekle:

| Ad                         | Değer                    | Kapsam                                       |
| -------------------------- | ------------------------ | -------------------------------------------- |
| `SUPABASE_URL`             | Supabase Project URL     | Production, Preview; gerekiyorsa Development |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Production, Preview; gerekiyorsa Development |

Preview için ayrı Supabase projesi kullanmak, deneme hesaplarını üretimden ayırır. Ortam değişkenleri yoksa Vercel derlemesi durur. Kod `VERCEL=1` veya `VERCEL_ENV` ortamını algılar ve yerel dosyayı kullanmaz. Vercel'in **Enable access to System Environment Variables** ayarını açık tut. `npm run build` zaten strict doğrulamayı çalıştırır; özel CI'da farklı bir build komutu kullanıyorsan `node scripts/generate-environment.cjs --strict` ile aynı kontrolü zorunlu kılabilirsin. Hata mesajları değerleri yazdırmaz. [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)

Mevcut `vercel.json` değerleri uygundur:

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/apps/shell/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Root Directory, `package.json`, `nx.json` ve `vercel.json` dosyalarının bulunduğu workspace kökü olmalıdır. Node sürümü `package.json` içindeki `^24.15.0` şartını karşılamalıdır. Ortamın değiştiği bir derlemenin eski Supabase ayarlarını kullanmaması için shell build ve environment hedeflerinin Nx önbelleği kapatıldı. Üretim derlemesinin çıktısı ayrıca debug/E2E taramasından geçirilir.

## 3. Supabase URL ve e-posta ayarları

Authentication → URL Configuration:

- **Site URL:** gerçek üretim adresin, örneğin `https://kampusx.example`.
- **Redirect URLs:** aşağıdaki yolların gerçek domain üzerindeki karşılıkları.

```text
https://kampusx.example/auth/login
https://kampusx.example/auth/update-password
http://127.0.0.1:4200/auth/login
http://127.0.0.1:4200/auth/update-password
http://localhost:4200/auth/login
http://localhost:4200/auth/update-password
```

Preview dağıtımları için yalnızca kendi Vercel projenin adreslerini ekle. Üretim yönlendirmelerinde tam adresleri tercih et. E-posta şablonlarını özelleştirdiysen `redirectTo` değerini taşıyan doğrulama bağlantısını koru; aksi durumda parola yenileme linki yanlış sayfaya dönebilir. [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

E-posta doğrulamasını açık tut. Üniversite e-postalarına gerçek gönderim için kendi SMTP sağlayıcını yapılandır; Supabase'in varsayılan sağlayıcısı üretim e-postaları için tasarlanmamıştır ve alıcı/gönderim sınırları vardır. SMTP şifresi Supabase ayarlarında tutulur, frontend'e eklenmez. Auth rate limit, parola politikası ve gerekirse CAPTCHA ayarlarını Supabase tarafında uygula. [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)

## 4. Yetkilendirme sınırı

Angular form doğrulaması `.edu.tr` şartını göstermeye yardımcı olur; saldırgan Supabase API'sini doğrudan çağırabileceği için bu kontrol kayıt kuralını sunucuda uygulamaz. Üniversite domain allowlist'i gerekiyorsa **Before User Created hook** veya doğrulanmış sunucu tarafındaki kayıt akışı üzerinden uygula. Profildeki üniversite ve bölüm seçimleri de sunucuda doğrulanmalıdır. [Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook)

Kayıt sırasında gönderilen `user_metadata` kullanıcı tarafından değiştirilebilir. `university`, `department` ve `username` gibi bilgiler profil girdisi sayılır; admin/topluluk başkanı yetkisi olarak kabul edilmez. Yetkiyi kullanıcı tarafından düzenlenemeyen server-side rol kayıtları veya güvenilir `app_metadata` üzerinden yönet. RLS politikalarında kullanıcı kimliği için `auth.uid()` ve uygun `authenticated` rolü kullan; `user_metadata` içinden role güvenme. Route guard kullanıcı deneyimini yönetir, veritabanı erişiminin güvenlik sınırı değildir. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

Tarayıcıya açtığın her tabloda RLS ve en az yetkili grants/policies gerekli. Auth servisini eklemek, mevcut SQL tablolarının izinlerini otomatik güvenli hâle getirmez. Bu inceleme uzak Supabase projesine bağlanmadığı için aktif politikalar, SMTP, redirect listesi ve üretim ayarları doğrulanmadı veya değiştirilmedi.

## 5. Kontroller

```bash
npm test
npm run typecheck
npm run build
```

Yeni config testleri Vercel değişkenlerinin Angular çıktısına ulaşmasını, eksik ayarlarda deployment'ın durmasını ve secret/service-role değerlerinin reddedilmesini kontrol eder. Gerçek doğrulama için kendi test hesabınla kayıt → e-posta onayı → giriş → çıkış ve parola yenileme → yeni şifreyle giriş adımlarını dene. Gerçek kullanıcı/veri değişikliği gerektiren bu işlemler otomatik olarak çalıştırılmadı.

`npm run test:ui`, 4300 portunda ayrı bir `e2e` serve/build yapılandırması kullanır. Bu derleme `environment.e2e.ts` dosyasını Angular file replacement ile alır; testlerde Supabase çağrıları sahte endpoint üzerinden yakalanır. Gerçek `.env.local` veya normal derlemenin `environment.ts` dosyasına sahte test bağlantısı yazılmaz; 4200 portundaki yerel önizlemenin auth bağlantısı korunur. Testler mevcut bir sunucuya bağlanmaz.
