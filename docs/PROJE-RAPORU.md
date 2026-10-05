# KampüsX — Frontend Geliştirme Raporu

**Tarih:** 4 Ekim 2026

**Proje:** KampüsX

**Çalışma alanı:** `C:\Users\elifr\source\project\web\KampüsX`
**Teslim kapsamı:** Welcome sayfası ve giriş, kayıt, şifre yenileme arayüzleri

## 1. Amaç ve mevcut durum

KampüsX, üniversite öğrencileri için X benzeri bir sosyal medya platformunun giriş kapısı olarak tasarlandı. Bu çalışma, platformun ne sunduğunu anlatan karşılama sayfasını ve kullanıcıların giriş/kayıt işlemlerini deneyimleyebileceği frontend tasarımını oluşturdu.

Ortaya çıkan uygulama, Nx workspace içinde çalışan bir Angular `shell` uygulamasıdır. Karşılama ekranı, ortak UI kütüphanesi, tema ve dil altyapısı, doğrulanan demo formlar ve tarayıcı testleri hazırdır. Gerçek sosyal akış, kullanıcı hesabı veya sunucu bağlantısı bu teslimin parçası değildir.

| Alan                          | Teslim durumu                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Nx workspace ve Angular shell | Kuruldu; serve ve production build hedefleri tanımlandı                       |
| Welcome sayfası               | Hero, tanıtım, keşfet akışları, topluluklar, akademik ağ, CTA ve footer hazır |
| Auth ekranları                | Giriş, kayıt ve iki adımlı şifre yenileme demo olarak çalışıyor               |
| Ortak UI                      | Atomic design ile 17 ortak parça oluşturuldu                                  |
| Tema                          | Açık/koyu tema ve kalıcı tercih hazır                                         |
| Dil                           | TR/EN, anlık değişim ve 220 eşleşen çeviri anahtarı hazır                     |
| Doğrulama                     | Derleme, tip kontrolü, birim ve tarayıcı kontrolleri tamamlandı               |
| Backend ve gerçek auth        | Kapsam dışında                                                                |

## 2. Brief’in değerlendirilmesi ve kapsam kararları

Geliştirme sırasında güncel kullanıcı isteği ve `KampusX-welcome-spec2.md` esas alındı. Aynı indirme klasöründeki eski `KampusX-welcome-spec.md`, statik HTML/CSS/JS yaklaşımını tarif ediyordu. Güncel istek Angular ve Nx gerektirdiği için eski dosyanın bu teknik yönlendirmesi uygulanmadı.

Brief’teki logo SVG’si değiştirilmeden kullanıldı ve bir logo atomu ile sarıldı. Ayrı bir HTML referansı bulunmadığı için görsel kompozisyon özgün olarak hazırlandı. Fotoğraf/video dosyaları verilmediğinden kampüs illüstrasyonu, avatarlar ve video görünümleri SVG/CSS ve emoji ile üretildi.

Bu aşamada aşağıdaki işler yapılmadı:

- Backend, API, veritabanı veya sunucu tarafı iş mantığı.
- Gerçek giriş, kayıt, oturum veya e-posta gönderimi.
- Google OAuth bağlantısı.
- Micro-frontend remote’ları ve Native Federation kurulumu.
- Docker, CI veya yayın ortamı kurulumu.

`services/` ve `infra/` dizinleri gelecek aşamalar için boş bırakıldı.

## 3. Teknik altyapı

| Teknoloji    | Projedeki sürüm/yaklaşım | Kullanım amacı                                                |
| ------------ | ------------------------ | ------------------------------------------------------------- |
| Nx           | 23.2.1                   | Uygulama ve shared kütüphanelerinin workspace içinde yönetimi |
| Angular      | 22.2.1                   | Standalone component’ler, router ve Reactive Forms            |
| TypeScript   | `~6.0.0`                 | Tip güvenliği ve strict derleme                               |
| Tailwind CSS | 3.4.19                   | Yerel CSS derlemesi ve token tabanlı Tailwind preset          |
| Transloco    | 8.4.0                    | Çalışma anında Türkçe/İngilizce dil değişimi                  |
| RxJS         | 7.8.2                    | Çeviri yükleyicisi ve yaşam döngüsüne bağlı abonelikler       |
| Playwright   | Projeye kuruldu          | Chromium üzerinde arayüz ve kullanıcı akışı testleri          |
| axe-core     | Playwright entegrasyonu  | Otomatik erişilebilirlik taraması                             |
| Prettier     | Projeye kuruldu          | Kaynak dosyalarında tutarlı biçimlendirme                     |

Angular component’lerinde `ChangeDetectionStrategy.OnPush` kullanıldı. Tema, dil ve auth görünümü gibi arayüz durumları signals ile yönetildi. Formlarda `ReactiveFormsModule` tercih edildi.

Tailwind CDN üzerinden alınmadı; npm bağımlılığı olarak kuruldu ve build sürecine dahil edildi. Özgün afiş, kart katmanları ve editorial yerleşimler için ayrıca özel CSS yazıldı.

## 4. Mimari ve dosya düzeni

```text
KampüsX/
├── apps/shell/
│   ├── project.json
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   ├── layout/header/
│       │   ├── layout/footer/
│       │   ├── features/welcome/
│       │   │   └── sections/
│       │   │       ├── hero-section/
│       │   │       ├── about-section/
│       │   │       ├── communities-section/
│       │   │       └── closing-cta-section/
│       │   ├── features/auth/
│       │   │   ├── auth-panel/
│       │   │   ├── login-form/
│       │   │   ├── register-form/
│       │   │   └── forgot-password/
│       │   └── features/not-found/
│       ├── assets/i18n/
│       ├── assets/logo.svg
│       └── styles.css
├── libs/shared/
│   ├── ui/atoms/
│   ├── ui/molecules/
│   ├── ui/organisms/
│   ├── ui/styles.css
│   ├── design-tokens/
│   └── util/
├── scripts/e2e/
├── docs/qa/
├── services/                         boş
├── infra/                            boş
├── DESIGN.md
└── README.md
```

### Sorumluluk dağılımı

| Konum                       | Sorumluluk                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `apps/shell/src/app/core`   | Tema, dil, çeviri yükleyicisi, auth panelinin görünüm durumu ve guard iskeleti          |
| `layout`                    | Header, footer ve ana gezinme parçaları                                                 |
| `features/welcome`          | Tanıtım sayfasını oluşturan bölümler ve sayfa kompozisyonu                              |
| `features/auth`             | Giriş, kayıt, şifre yenileme formları ve ortak auth paneli                              |
| `libs/shared/ui`            | Yeniden kullanılabilir UI parçaları ve ortak component stilleri                         |
| `libs/shared/design-tokens` | Renk, tipografi, radius, hareket ve tema değişkenleri                                   |
| `libs/shared/util`          | Validator’lar, form odak yardımcısı, sayı formatlama, reveal directive ve mock modeller |

Shared UI parçaları shell servislerini import etmez. Tema/dil gibi kontroller değerlerini input üzerinden alır ve değişiklik isteğini output ile iletir. Böylece uygulamaya özel durum yönetimi shell’de kalır.

Kütüphaneler Nx projeleri olarak tanımlandı ve TypeScript path alias’larıyla tüketildi. Bu aşamada bağımsız dağıtılabilir npm paketleri veya micro-frontend remote’ları hazırlanmadı.

### Route düzeni

| Adres                   | Görünüm                                 |
| ----------------------- | --------------------------------------- |
| `/`                     | Lazy loaded welcome sayfası             |
| `/auth`                 | `/auth/login` adresine yönlendirme      |
| `/auth/login`           | Bağımsız auth sayfasında giriş formu    |
| `/auth/register`        | Bağımsız auth sayfasında kayıt formu    |
| `/auth/forgot-password` | Bağımsız auth sayfasında şifre yenileme |
| Diğer adresler          | Uygulama içinde 404 görünümü            |

Welcome sayfasındaki auth paneli ile bağımsız auth route’ları aynı form component’lerini kullanır. Welcome ve auth route grupları normal Angular feature’larıdır.

## 5. Atomic design uygulaması

Component hiyerarşisi küçük parçalardan sayfaya doğru kuruldu:

```text
Atoms → Molecules → Organisms → Sections → Page
```

| Katman              | Hazırlanan parçalar                                                                  |
| ------------------- | ------------------------------------------------------------------------------------ |
| Atoms — 7 parça     | Button, input directive, badge, logo, icon, sticker, toggle                          |
| Molecules — 6 parça | Form-field, password-field, feature-card, stat-card, theme-toggle, language-switcher |
| Organisms — 4 parça | Post-card-preview, community-card, marquee-strip, legal-dialog                       |
| Sections            | Hero, about, communities ve closing CTA                                              |
| Page                | Welcome ve bağımsız auth sayfası                                                     |

Örneğin şifre alanı input atomunu, ikonları ve göster/gizle davranışını bir molecule içinde birleştirir. Giriş formu bu molecule’ü kullanır; auth paneli formlar arasında geçişi sağlar; hero bölümü panel ile afişi bir araya getirir.

Ortak component görünümü `libs/shared/ui/styles.css` içine ayrıldı. Shell’in `styles.css` dosyası sayfa yerleşimini, afiş kompozisyonunu ve uygulama genelindeki temel stilleri yönetir.

## 6. Görsel tasarım ve hazırlanan bölümler

Tasarımın ana fikri **“kampüsün dijital ilan panosu”** oldu. Üniversite dergisi hissi veren büyük başlıklar, bölüm numaraları ve ince çizgiler; eğik gönderi kartları, sticker’lar ve renkli illüstrasyonlarla birlikte kullanıldı. Görsel yoğunluk afişte toplandı; form alanları daha sakin düzenlendi.

### Header ve hero

Header’da marka, bölüm bağlantıları, dil/tema kontrolleri ve giriş kısa yolu bulunur. Mobilde bölüm bağlantıları ile dil/tema kontrolleri hamburger menüsünden erişilir.

Hero masaüstünde yaklaşık 7/12 afiş ve 5/12 auth paneli oranındadır. Afişte büyük bir kampüs gündemi başlığı, karşılama metni ve dört örnek gönderi türü yer alır: fotoğraf, anonim paylaşım, anket ve video önizlemesi. Dar ekranlarda afiş kompozisyonu sadeleştirilir; anket kartı gizlenir. Video görünümü statik bir tasarım önizlemesidir.

Doğrulanmış üyelik, trendler ve anonim mod mikro özellik kartlarıyla anlatılır. Trend şeridi duraklatılabilir; hover ve klavye odağı sırasında da durur.

### Hakkımızda ve keşfet

Fotoğraf, video ve yazı paylaşımı üç görsel blokla tanıtılır. Beğeni, yorum, yeniden paylaşım, alıntı ve mesajlaşma ürün özellikleri olarak açıklanır.

Üniversitem, Bölümüm ve Genel Keşfet için sekmeli örnek akış hazırlandı. Sekmeler örnek içerikleri değiştirir ve klavyeyle kullanılabilir. Bunlar gerçek feed uygulaması değildir.

İstatistik şeridindeki 24.500+ öğrenci, 81 üniversite ve 12.000+ günlük paylaşım değerleri örnek veridir. “Canlı” rozeti de tanıtım tasarımının parçasıdır; gerçek zamanlı veri bağlantısı bulunmaz.

### Topluluklar ve akademik ağ

Yazılım, robotik, fotoğraf, tiyatro, girişimcilik, müzik, spor ve gönüllülük için sekiz topluluk kartı oluşturuldu. Kartların model ve mock verileri TypeScript dosyasında tutulur; adlar ve üniversite metinleri çeviri anahtarlarından gelir.

“Katıl” düğmeleri kayıt panelini açar ve demo açıklaması gösterir. Akademik ağ alanı araştırma gruplarını, ders notlarını, proje arkadaşlarını ve etkinlik/seminerleri tanıtır.

### Kapanış ve footer

Kapanış CTA’sı kullanıcıyı kayıt paneline götürür. Footer’da marka, hakkında bağlantısı ve gizlilik/kullanım şartları/çerez bağlantıları bulunur. Yasal bağlantılar gerçek politika metni yerine önizlemenin sınırlarını açıklayan modalı açar.

## 7. Tema ve tasarım token’ları

Renk değerlerinin ana kaynağı `libs/shared/design-tokens/tokens.css` dosyasıdır. Tailwind preset bu CSS değişkenlerini referans alır; ikinci bir bağımsız renk paleti oluşturulmadı. Tasarım kararları ve token eşlemesi `DESIGN.md` içinde belgelendi.

| Rol             | Açık tema | Koyu tema |
| --------------- | --------- | --------- |
| Sayfa zemini    | `#F6F4ED` | `#0B0E14` |
| Yüzey           | `#FFFFFF` | `#151B28` |
| Ana metin       | `#15213A` | `#EDF2FF` |
| İkincil metin   | `#526078` | `#A6B3CA` |
| Birincil vurgu  | `#2155E8` | `#ADC6FF` |
| Camgöbeği vurgu | `#007E98` | `#4CD7F6` |

Açık tema sıcak kâğıt hissi, lacivert metin ve kobalt vurgu ile tasarlandı. Koyu tema ayrı yüzey tonları ve açık mavi vurgular kullanır. Sarı/mercan sticker’larda koyu mürekkep rengi korunur.

`ThemeService` signal tabanlıdır. Kullanıcı tercihi `kampusx-theme` anahtarıyla localStorage’a kaydedilir. İlk açılışta kayıt yoksa sistemin `prefers-color-scheme` tercihi kullanılır. `<html>` üzerindeki `dark` sınıfı sayfa yenilenmeden değiştirilir. Başlangıç tercihi ilk çizimden önce uygulanır.

Plus Jakarta Sans başlık ve gövdede, JetBrains Mono etiket/sayaç/hashtag’lerde, Material Symbols Outlined ikonlarda kullanıldı. Fontlar brief doğrultusunda Google Fonts’tan yüklenir; bu dış ağ bağımlılığı devam etmektedir.

## 8. Türkçe/İngilizce altyapısı

`tr.json` ve `en.json` dosyalarında 220 eşleşen anahtar bulunur. Anahtarlar `common`, `nav`, `hero`, `auth`, `validation`, `about`, `communities`, `academic`, `cta`, `footer` ve `legal` gruplarına ayrıldı.

Arayüz metinleri, form placeholder’ları, hata mesajları, erişilebilir adlar ve örnek sosyal içerikler bu sözlüklerden alınır. Marka ve kullanıcı adı biçimleri korunur. Sayılar aktif dile göre `Intl.NumberFormat` ile biçimlendirilir.

`LanguageService` seçimi `kampusx-language` anahtarıyla saklar, Transloco’nun aktif dilini ve `<html lang>` değerini günceller. Kayıt yoksa Türkçe tarayıcı dili TR, diğer tarayıcı dilleri EN olarak başlatılır.

İki sözlük uygulama paketine dahil edildi. Dil değiştirmek için çeviri sunucusuna veya API’ye istek yapılmaz. `check-i18n.cjs`, anahtar eşleşmesini, boş çevirileri ve literal şablon anahtarlarını kontrol eder.

## 9. Formlar ve etkileşim davranışları

| Akış           | Hazırlanan davranış                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Giriş          | E-posta/kullanıcı adı, şifre, göster/gizle, beni hatırla, sıfırlamaya geçiş, demo sonuç mesajı          |
| Kayıt          | Google demo açıklaması, üniversite e-postası, kullanıcı adı, şifre gücü, koşul onayı, demo sonuç mesajı |
| Şifre yenileme | E-posta doğrulaması, yüklenme görünümü, “E-postanı kontrol et” ekranı, geri dönüş ve başka adres deneme |

Ortak davranışlar şunlardır:

- Zorunlu alanlar ve ilgili validator’lar Reactive Forms ile kontrol edilir.
- Hatalar ilgili alanın yanında çevrilmiş metinle gösterilir.
- Geçersiz form gönderiminde ilk hatalı native input’a odaklanılır.
- Bekleme sırasında buton busy/disabled durumuna geçer ve tekrar gönderim engellenir.
- Şifreler başlangıçta maskelidir; göster/gizle düğmesinin erişilebilir adı değişir.
- Şifre yöneticileri, otomatik doldurma ve yapıştırma desteklenir.

Kayıtta `.edu.tr` adres biçimi, 3–20 karakterlik kullanıcı adı, en az 8 karakterli şifre ve koşul onayı kontrol edilir. `.edu.tr` validator’ı taklit son ekleri reddeder; e-postanın sahibini veya kişinin öğrenci olduğunu doğrulamaz. Şifre gücü göstergesi görsel geri bildirimdir.

Form sonuçları kısa bir yerel bekleme sonrası gösterilen demo durumlarıdır. Form bilgileri sunucuya gönderilmez veya kalıcı depolamaya yazılmaz. “Beni hatırla” alanı gerçek oturum kalıcılığı sağlamaz. `auth.guard.ts` yalnızca iskelettir ve güvenlik sınırı olarak kullanılmaz.

## 10. Responsive ve erişilebilirlik

Sayfa mobilde tek kolona iner; formlar doğal yüksekliğiyle büyür. Topluluklar masaüstünde dört, tablet/telefonda iki kolon olarak gösterilir. Mobil header kısa yolu sayesinde auth paneline ulaşılabilir.

Semantic `header`, `main`, `section`, `footer`, native link/button/input yapıları kullanıldı. Label bağlantıları, `aria-invalid`, açıklama bağlantıları, `aria-busy`, durum bölgeleri ve klavye odakları tanımlandı. Feed sekmeleri yön tuşları, Home ve End ile değiştirilebilir. Modal Escape ile kapanır ve odağı açan düğmeye geri verir.

`prefers-reduced-motion` ile animasyonlar ve smooth scroll devre dışı kalır. Bölüm görünme animasyonu IntersectionObserver ile uygulanır. Scrollbar renkleri uygulama genelinde token’larla tanımlanır.

Otomatik erişilebilirlik sonuçları kontrol edilen durumlarla sınırlıdır. Manuel ekran okuyucu, fiziksel cihaz ve kapsamlı 200% zoom testi bu teslimin doğrulama kaydında bulunmaz.

## 11. Doğrulama ve kalite sonuçları

Aşağıdaki sonuçlar geliştirme sırasında çalıştırılan kontrollerden ve `docs/qa/verification.md` kaydından alınmıştır. Rapor hazırlama işleminde uygulama testleri yeniden çalıştırılmadı.

| Kontrol                     | Kayıtlı sonuç                                                    |
| --------------------------- | ---------------------------------------------------------------- |
| `npx nx build shell`        | Production build başarılı                                        |
| `npm run typecheck`         | Başarılı                                                         |
| `npm test`                  | 3 validator testi başarılı                                       |
| `npm run check:i18n`        | 220 eşleşen, boş olmayan anahtar                                 |
| `npm run format:check`      | Başarılı                                                         |
| `npm run test:ui`           | 23 tarayıcı senaryosu başarılı                                   |
| Genişletilmiş auth kontrolü | Üç form × TR/EN × açık/koyu ayrıca kontrol edildi                |
| axe-core                    | Kontrol edilen durumlarda otomatik WCAG A/AA taramasında 0 ihlal |
| `designmd lint DESIGN.md`   | 0 hata, 0 uyarı                                                  |
| Strict statik UI audit      | 0 hata, 0 uyarı                                                  |

Welcome için 1440, 768, 390 ve 320 px genişliklerde TR/EN ve açık/koyu kombinasyonları kontrol edildi. Formlarda hatalı alanlar, label aktivasyonu, benzersiz DOM kimlikleri, ilk hataya odak ve hata açıklaması ilişkileri test edildi. Tema/dil değişimi ve yeniden yüklemede kalıcılık; CTA, modal, route ve 404 akışları da kapsandı.

İlk test turunda form molecule’ünün host’u ile native input arasında oluşan DOM kimliği çakışması giderildi. 320 px İngilizce görünümündeki istatistik taşması düzeltildi ve afişte anket kartının alt boşluğu artırıldı. Ortak UI stilleri kütüphaneye ayrıldıktan sonra tarayıcı senaryoları tekrar çalıştırıldı.

Chromium ekran görüntüleri ve statik audit raporu `docs/qa/` içinde saklanır. Mimari raporu hazırlanırken codebase-memory proje listesi kontrol edildi; KampüsX henüz indeksli olmadığından ilgili source/config dosyaları doğrudan okunarak doğrulandı.

## 12. Çalıştırma, teslim dosyaları ve sonraki aşama

### Çalıştırma

```powershell
cd 'C:\Users\elifr\source\project\web\KampüsX'
npm ci
npx nx serve shell
```

Uygulama [localhost:4200](http://localhost:4200) adresinde açılır. Bağımlılıklar zaten kuruluysa `npm ci` adımı gerekmez. Nx global kuruluysa `nx serve shell` komutu kullanılabilir.

UI testleri için ilk kurulumda `npx playwright install chromium` gerekir. Test sunucusu 4300 portunda açılır. Production çıktısı `dist/apps/shell` altında oluşur.

### Temel teslim dosyaları

| Dosya/konum                  | İçerik                                                  |
| ---------------------------- | ------------------------------------------------------- |
| `README.md`                  | Kurulum, komutlar ve kapsam                             |
| `DESIGN.md`                  | Görsel kararlar, token sahipliği ve component kuralları |
| `docs/PROJE-RAPORU.md`       | Bu sistematik geliştirme raporu                         |
| `docs/qa/verification.md`    | Doğrulama özeti ve test sınırları                       |
| `docs/qa/premium-audit.json` | Statik audit sonucu                                     |
| `docs/qa/*.png`              | Tema/dil/ekran ve auth durumlarının görsel kayıtları    |
| `scripts/e2e/`               | Tekrar çalıştırılabilir tarayıcı testleri               |

### Önerilen devam sırası

| Sıra | Gelecek çalışma                                  | Amaç                                                                         |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1    | Gerçek auth ve üniversite doğrulaması sözleşmesi | Oturum, üyelik ve e-posta sahipliği kurallarını belirlemek                   |
| 2    | `mfe-feed`                                       | Üniversitem/Bölümüm/Genel Keşfet için gerçek sosyal akış geliştirmek         |
| 3    | API ve veri entegrasyonu                         | Örnek gönderi, topluluk ve sayıları gerçek veriye bağlamak                   |
| 4    | Yasal içerik ve ileri erişilebilirlik kontrolü   | Ürün yayınına yönelik metinleri ve manuel kullanıcı kontrollerini tamamlamak |
| 5    | Yayın altyapısı                                  | İhtiyaç belirlendiğinde CI, hosting ve diğer operasyonel parçaları eklemek   |

Bu sonraki aşamalar mevcut teslimde uygulanmadı. Hazırlanan frontend, bu çalışmalara görsel ve yapısal başlangıç sağlayacak durumdadır.
