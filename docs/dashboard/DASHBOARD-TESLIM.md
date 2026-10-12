# KampüsX dashboard — gerçek Auth bağlantısı ve tam kaynak kodları

Güncelleme: 12 Ekim 2026. Dashboard mevcut gerçek Supabase Auth servisine bağlıdır. Local giriş: `http://127.0.0.1:4200/auth/login`.

## Güncel kapsam

- Başarılı e-posta/şifre girişi `/dashboard` rotasına yönlenir.
- Dashboard auth guard ile korunur; kullanıcı Supabase getUser ile doğrulanır. Oturumu açık kullanıcı login/register adreslerinden dashboard'a geçer.
- Kayıtta oturum dönerse dashboard açılır; yalnızca kullanıcı dönerse e-posta doğrulama bildirimi korunur.
- Recovery oturumları şifre yenileme ekranında kalır.
- Profilin kullanıcı adı ve avatar baş harfi gerçek session.user üzerinden türetilir. Okul/bölüm adları metadata içinde varsa gösterilir; yoksa bilgi eklenmediği açıkça belirtilir. User metadata yetki olarak kullanılmaz.
- Çıkış yap düğmesi Supabase signOut çağrısını yapar; oturum kaybolduğunda dashboard giriş sayfasına döner.
- Düz login URL'sinin yanlışlıkla callback sanılması hatası düzeltildi; gerçek implicit callback parametreleri algılanır, PKCE SDK'nın ayrı algılamasına bırakılır.
- E-posta gönderim kotası hatası genel istek sınırından ayrılır; TR/EN mesajları gerçek hata kodunu yansıtır. Uygulamada yeni bekleme süresi eklenmez, Supabase kota ayarları değiştirilmez.
- Üniversite/kampüs/bölüm feed içerikleri hâlâ mock/boş durumdur; sosyal veri backend'i veya profil tablosu API'si eklenmedi.

Varsayım: mevcut Tailwind 3.4.19 ve CSS variables/tema sistemi korunur; v4 geçişi yapılmadı. Login/register mantığı yeni istekle dashboard'a bağlandı; form tasarımı, welcome ekranı, tema servisleri ve token dosyası korunur.

## Girişte hesap kontrolü

Kullanıcının açık isteğiyle girişte olmayan hesap ile yanlış bilgiler ayrımı eklendi. Veritabanı kesin `false` döndürürse kullanıcı yok mesajı; `true` döndürürse yanlış bilgiler mesajı gösterilir. Fonksiyon `supabase/migrations/20261012174500_login_email_lookup.sql` içindedir. Uzak Supabase kontrolü HTTP 404/PGRST202 döndü; fonksiyonun SQL Editor üzerinden eklenmesi gerekir. Bu adım tamamlanmadan gerçek hesap yok ayrımı aktif değildir; sorgu hatası ayrı gösterilir. Bu davranış hesap varlığını açıklayabilir. Ayrıntılar `docs/login-email-lookup.md` içindedir.

## Local ve gerçek servis kontrolü

4200 development sunucusu gerçek `.env.local` bağlantısını kullanır. Local giriş ekranının render edilmesi ve oturumsuz dashboard isteğinin login'e dönmesi gerçek tarayıcıda doğrulandı. Gerçek Supabase `/auth/v1/settings` HTTP 200 döndü; e-posta/şifre sağlayıcısı etkin. Kişisel hesapla oturum açılmadı; gerçek hesap/e-posta oluşturulmadı.

## Doğrulama

Güncel test sayıları `verification.json` içindedir. Typecheck, üretim build ve i18n eşleşmesi geçti; 274 toplam ve 29 dashboard anahtarı var. Otomatik auth testleri 4300 üzerindeki izole E2E ortamında ağ yanıtlarını mock'lar; normal 4200 uygulaması gerçek Supabase bağlantısını kullanır.

## Dosya yapısı

```text
├── DESIGN.md
├── README.md
├── apps
│   └── shell
│       └── src
│           ├── app
│           │   ├── app.component.ts
│           │   ├── app.routes.ts
│           │   ├── core
│           │   │   ├── auth.guard.ts
│           │   │   ├── auth.service.ts
│           │   │   ├── supabase-callback.ts
│           │   │   └── supabase.service.ts
│           │   └── features
│           │       ├── auth
│           │       │   ├── auth.routes.ts
│           │       │   ├── login-form
│           │       │   │   └── login-form.component.ts
│           │       │   └── register-form
│           │       │       └── register-form.component.ts
│           │       └── dashboard
│           │           ├── bottom-nav
│           │           │   ├── bottom-nav.component.css
│           │           │   └── bottom-nav.component.ts
│           │           ├── dashboard-profile.ts
│           │           ├── dashboard.page.css
│           │           ├── dashboard.page.html
│           │           ├── dashboard.page.ts
│           │           ├── discover-tabs
│           │           │   └── discover-tabs.component.ts
│           │           ├── mock-data.ts
│           │           ├── profile-drawer
│           │           │   ├── profile-drawer.component.css
│           │           │   └── profile-drawer.component.ts
│           │           └── top-bar
│           │               ├── top-bar.component.css
│           │               └── top-bar.component.ts
│           └── assets
│               └── i18n
│                   ├── en.json
│                   └── tr.json
├── docs
│   ├── auth-security-review.md
│   ├── login-email-lookup-sql-verification.json
│   └── login-email-lookup.md
├── libs
│   └── shared
│       ├── ui
│       │   ├── atoms
│       │   │   └── avatar
│       │   │       ├── avatar.component.css
│       │   │       └── avatar.component.ts
│       │   ├── index.ts
│       │   ├── molecules
│       │   │   ├── feed-skeleton
│       │   │   │   ├── feed-skeleton.component.css
│       │   │   │   └── feed-skeleton.component.ts
│       │   │   └── tab-strip
│       │   │       ├── tab-strip.component.css
│       │   │       └── tab-strip.component.ts
│       │   └── organisms
│       │       └── modal-drawer
│       │           ├── modal-drawer.component.css
│       │           └── modal-drawer.component.ts
│       └── util
│           ├── horizontal-swipe.ts
│           └── index.ts
├── scripts
│   ├── auth-services.test.cjs
│   ├── e2e
│   │   ├── auth-integration.spec.cjs
│   │   ├── dashboard.spec.cjs
│   │   ├── password-recovery.spec.cjs
│   │   └── welcome.spec.cjs
│   └── verify-login-email-lookup.cjs
└── supabase
    └── migrations
        └── 20261012174500_login_email_lookup.sql
```

## Dosya listesi

- `DESIGN.md` — değiştirildi
- `README.md` — değiştirildi
- `apps/shell/src/app/app.component.ts` — değiştirildi
- `apps/shell/src/app/app.routes.ts` — değiştirildi
- `apps/shell/src/app/core/auth.guard.ts` — değiştirildi
- `apps/shell/src/app/core/auth.service.ts` — değiştirildi
- `apps/shell/src/app/core/supabase-callback.ts` — eklendi
- `apps/shell/src/app/core/supabase.service.ts` — değiştirildi
- `apps/shell/src/app/features/auth/auth.routes.ts` — değiştirildi
- `apps/shell/src/app/features/auth/login-form/login-form.component.ts` — değiştirildi
- `apps/shell/src/app/features/auth/register-form/register-form.component.ts` — değiştirildi
- `apps/shell/src/app/features/dashboard/bottom-nav/bottom-nav.component.css` — eklendi
- `apps/shell/src/app/features/dashboard/bottom-nav/bottom-nav.component.ts` — eklendi
- `apps/shell/src/app/features/dashboard/dashboard-profile.ts` — eklendi
- `apps/shell/src/app/features/dashboard/dashboard.page.css` — eklendi
- `apps/shell/src/app/features/dashboard/dashboard.page.html` — eklendi
- `apps/shell/src/app/features/dashboard/dashboard.page.ts` — eklendi
- `apps/shell/src/app/features/dashboard/discover-tabs/discover-tabs.component.ts` — eklendi
- `apps/shell/src/app/features/dashboard/mock-data.ts` — eklendi
- `apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.css` — eklendi
- `apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.ts` — eklendi
- `apps/shell/src/app/features/dashboard/top-bar/top-bar.component.css` — eklendi
- `apps/shell/src/app/features/dashboard/top-bar/top-bar.component.ts` — eklendi
- `apps/shell/src/assets/i18n/en.json` — değiştirildi
- `apps/shell/src/assets/i18n/tr.json` — değiştirildi
- `docs/auth-security-review.md` — değiştirildi
- `docs/login-email-lookup-sql-verification.json` — eklendi
- `docs/login-email-lookup.md` — eklendi
- `libs/shared/ui/atoms/avatar/avatar.component.css` — eklendi
- `libs/shared/ui/atoms/avatar/avatar.component.ts` — eklendi
- `libs/shared/ui/index.ts` — değiştirildi
- `libs/shared/ui/molecules/feed-skeleton/feed-skeleton.component.css` — eklendi
- `libs/shared/ui/molecules/feed-skeleton/feed-skeleton.component.ts` — eklendi
- `libs/shared/ui/molecules/tab-strip/tab-strip.component.css` — eklendi
- `libs/shared/ui/molecules/tab-strip/tab-strip.component.ts` — eklendi
- `libs/shared/ui/organisms/modal-drawer/modal-drawer.component.css` — eklendi
- `libs/shared/ui/organisms/modal-drawer/modal-drawer.component.ts` — eklendi
- `libs/shared/util/horizontal-swipe.ts` — eklendi
- `libs/shared/util/index.ts` — değiştirildi
- `scripts/auth-services.test.cjs` — değiştirildi
- `scripts/e2e/auth-integration.spec.cjs` — değiştirildi
- `scripts/e2e/dashboard.spec.cjs` — eklendi
- `scripts/e2e/password-recovery.spec.cjs` — değiştirildi
- `scripts/e2e/welcome.spec.cjs` — değiştirildi
- `scripts/verify-login-email-lookup.cjs` — eklendi
- `supabase/migrations/20261012174500_login_email_lookup.sql` — eklendi

ZIP aynı dosyaları kendi klasör yapısıyla içerir. `.env.local` ve üretilen gerçek environment dosyası teslim paketinde yoktur.

## Yeni i18n anahtarları

```text
dashboard.title
dashboard.openProfile
dashboard.closeProfile
dashboard.profileMenu
dashboard.discoverLabel
dashboard.navigationLabel
dashboard.visualOnly
dashboard.mock.school
dashboard.mock.campus
dashboard.mock.department
dashboard.menu.settings
dashboard.menu.account
dashboard.menu.community
dashboard.tabs.university
dashboard.tabs.campus
dashboard.tabs.department
dashboard.nav.home
dashboard.nav.messages
dashboard.nav.search
dashboard.feeds.university.title
dashboard.feeds.university.description
dashboard.feeds.campus.title
dashboard.feeds.campus.description
dashboard.feeds.department.title
dashboard.feeds.department.description
dashboard.logout
dashboard.profile.unnamed
dashboard.profile.schoolMissing
dashboard.profile.departmentMissing
auth.errors.emailRateLimit
auth.errors.userNotFound
auth.errors.accountLookup
```

Güncellenen mevcut anahtar: `auth.errors.rateLimit`. Çeviriler `i18n.tr.json` ve `i18n.en.json` içindedir.

Ek uzak servis doğrulama dosyası: `docs/login-email-lookup-availability.json`.

## Tam kaynak kodları

### `DESIGN.md`

````markdown
---
version: alpha
name: KampüsX
description: An editorial campus noticeboard with layered social previews and quiet authentication.
colors:
  background: '#F6F4ED'
  surface: '#FFFFFF'
  text: '#15213A'
  muted: '#526078'
  primary: '#2155E8'
  accent: '#007E98'
  yellow: '#F3DA70'
  coral: '#FFAD97'
  danger: '#B32743'
  success: '#167047'
typography:
  sans:
    fontFamily: 'Plus Jakarta Sans, Arial, sans-serif'
  mono:
    fontFamily: 'JetBrains Mono, Consolas, monospace'
rounded:
  control: '10px'
  panel: '24px'
spacing:
  unit: '4px'
  page-max: '1320px'
components:
  button:
    rounded: '{rounded.control}'
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
  auth-panel:
    rounded: '{rounded.panel}'
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
  label:
    textColor: '{colors.muted}'
  focus:
    textColor: '{colors.accent}'
  sticker:
    backgroundColor: '{colors.yellow}'
    textColor: '{colors.text}'
  sticker-coral:
    backgroundColor: '{colors.coral}'
    textColor: '{colors.text}'
  error:
    textColor: '{colors.danger}'
  success:
    textColor: '{colors.success}'
---

# KampüsX Design System

## Overview

The reference is a university festival noticeboard meeting a student magazine cover.
Turkish university students should see a real social world before choosing how to join it.
The blue campaign poster is the memorable signature: overlapping posts, original campus
illustration, small handwritten-feeling stickers, and a strong three-line headline.
Forms stay familiar and quiet. Authentication feedback describes actual outcomes,
without preview labels in the campaign header or footer.

This is a hybrid surface: the welcome route is marketing; the auth panel and `/auth/*`
routes use shared product form controls. Email/password authentication now uses Supabase;
social features remain previews and Google OAuth is not connected. A remembered session uses
persistent browser storage; an unremembered session uses session storage.
Audience evidence: the supplied KampusX-welcome-spec2.md and the user's Angular/Nx request.
Turkish and English are equally supported. Browser language sets the initial locale;
the explicit language choice overrides it and survives reloads.

Avoid a generic dashboard card grid as the page's overall composition. The community
directory is deliberately a consistent card grid because its items are comparable.
Do not add invented legal policy: the legal dialog states that the legal documents are not yet
published and describes the authentication data flow without presenting a placeholder as a policy.

## Colors

Canonical runtime ownership is **Model B**: `libs/shared/design-tokens/tokens.css` owns values.
This document mirrors the accepted light values and explains intent. The CSS defines both
themes; Tailwind's preset references the variables, never independent copies of raw values.

Light uses warm paper, navy text, saturated cobalt, and a deeper accessible cyan.
Dark uses `#0B0E14` background, `#151B28` surface, `#EDF2FF` text, `#A6B3CA` muted,
`#ADC6FF` primary, `#102451` on-primary and `#4CD7F6` accent.
Poster colors are a separate expressive role; they remain rich blue in both themes.
Yellow and coral stickers always use dark ink. Semantic errors and successes retain text and icons.
Forced colors restores system colors and borders. Contrast is checked at runtime in both themes.

## Typography

Plus Jakarta Sans is the body, control, and heavy display family. JetBrains Mono carries
numbers, hashtags, small editorial metadata, and translation-neutral language selectors.
Turkish diacritics use the full Google Fonts subset; Arial/Consolas are reliable fallbacks.
Headlines are tightly spaced and balanced; small metadata is not used for essential form instructions.
English copy is independently written. Long text wraps instead of truncating important content.

## Layout

The document owns vertical scrolling. The maximum width is 1320px with 40px desktop gutters,
24px tablet gutters, and 16px phone gutters. Header height decreases from 82px to 66px.
The hero uses roughly 7/12 poster and 5/12 auth with matching top and bottom edges.
The shared grid row stretches both surfaces; the poster's scene grows with the form's
natural height. The student trust note sits inside the auth panel. At 640px the hero
becomes a single column with independent natural heights.
Community cards use four columns, two at tablet/phone, and contain all eight sample communities.
Form fields and buttons have stable height; messages have reserved space. Images use explicit geometry.
Auth form switching expands the desktop row when needed and never clips registration fields.
Header actions contain language, theme and mobile navigation. About, privacy, terms
and cookies navigation belongs in the footer; registration keeps its consent links.

## Elevation & Depth

Depth is intentional on the layered poster and auth panel. Chapter boundaries use thin rules.
Community hover movement is restrained and does not hide actions. The sticky header uses blur.
The dark theme uses distinct tonal surfaces rather than merely inverting light colors.

## Shapes

Controls use 10px radius, auth panels 24px, post previews 13px, and community cards 14px.
The poster and CTA have alternating sharp/rounded corners, recalling cut paper.
Stickers use outlined corners or a circle with a small offset ink shadow.

## Components

| Owner                                               | Runtime mapping                                 | Consumers                             |
| --------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `tokens.css` primary, on-primary                    | Tailwind preset `colors.primary`, CSS variables | Button, focus, links, selected tabs   |
| `tokens.css` bg/surface/text/muted                  | Tailwind color aliases and semantic CSS         | All shared UI and sections            |
| `tokens.css` font-sans/font-mono                    | Tailwind font aliases and native CSS            | Headings, copy, metadata              |
| `tokens.css` radius-control/panel                   | Tailwind radius aliases and native CSS          | Fields, buttons, auth panel           |
| `tokens.css` scroll tokens                          | Global scrollbar rules in `styles.css`          | Every owned scroll surface            |
| `tokens.css` surface-alt/text/border/primary/accent | Shared marquee CSS                              | Campus agenda strip and pause control |

Shared atoms: native button, native input directive, badge, logo, icon, sticker, toggle.
Molecules own form-field association, password reveal/strength, feature/stat cards, theme/language controls.
Organisms own post/community previews, marquee, and legal preview dialog.
Shell features own auth business state and landing sections; shared UI never imports shell services.
`libs/shared/ui/styles.css` owns atomic component appearance and responsive variants.
Every consuming app imports it once after `tokens.css`; shell CSS owns campaign/layout composition.

Buttons have solid, outline, and ghost emphasis. Loading hides the stable label geometry under
an app-owned spinner, exposes aria-busy, and disables duplicate submits. Disabled controls are honest.
Fields associate labels, help and error text, use reactive validators, and focus the first invalid field.
Password form values are never stored by application code. Supabase owns session credentials.
By the user's explicit product decision, login distinguishes an unknown email from incorrect
credentials. After `invalid_credentials`, a database RPC returns only an account-existence boolean.
A confirmed false displays "Böyle bir kullanıcı yok."; true retains the incorrect-credentials
message. Lookup failures remain a separate retryable error. This deliberately makes account
existence discoverable and adds no password handling or login bypass to the database function.
Passwords support password managers, paste and accessible reveal controls. New-password and
confirmation fields reuse the password molecule with distinct translated labels.
The `/auth/update-password` page waits for auth initialization and accepts only a session established
by a password-recovery callback. Missing or expired links offer a fresh reset request. Successful
password updates end the current session and offer sign-in with the new password; a sign-out failure
keeps a truthful saved-password notice and retry action instead of reporting completion.

The legal dialog uses native modal dialog behavior: focus isolation, Escape dismissal and focus return.
The authenticated `/dashboard` route uses a centered campus feed shell, with existing logo,
language and theme controls. It consumes the canonical tokens without changing them or the
theme services. Shared Avatar, TabStrip, FeedSkeleton and ModalDrawer own its reusable UI.
The left profile drawer follows the native-dialog modal contract: background isolation,
scroll lock, focus trap/return, Escape, backdrop click and left-swipe dismissal. Its header
contains only the signed-in user's handle, university and department. Profile metadata is
display content only; missing university/department values use honest localized placeholders.
The drawer's sign-out control closes the real Supabase session. Discovery uses a single selected index
for tab clicks, Arrow/Home/End keys and horizontal touch swipes. Vertical document scrolling
remains native; the bottom navigation reserves safe-area space. Motion is transform/opacity
only and honors reduced motion. Skeletons are static decoration for an empty mock feed,
not an indefinite loading claim. Profile menu and bottom navigation are explicitly unavailable
visual items with no navigation or network effects. Email/password sign-in redirects to dashboard
only after Supabase returns a session; registration with no session keeps email-verification guidance.
The dashboard guard verifies the session with Supabase getUser; valid signed-in users skip login/register,
and password recovery keeps its own route. Session loss returns to login. The existing auth forms keep
their visual design and welcome keeps its public chrome. Plain login URLs are not treated as callback
links; callback detection requires actual auth parameters. Feed content remains mock; no fake session
or new social backend is created by dashboard.
Feed tabs use standard keyboard behavior. Auth mode selectors are native pressed buttons.
Icon-only controls use translated accessible names. Decorative symbols are hidden from assistive technology.
Material Symbols Outlined is the icon family. Brand/usernames do not translate; UI text does.

Color changes use 180ms, offscreen chapter reveals use 550ms and disconnect their observers.
The trend ticker uses the theme's surface-alt background, text, border, primary label
and accent separators so it stays light in light mode and dark in dark mode. It has
a persistent pause button and stops on hover/focus. Reduced motion disables
animations, reveal movement and smooth scrolling. No real video asset was supplied; the video is a static preview.

## Do's and Don'ts

- Do put campus-specific expression in the poster and editorial chapter artwork.
- Do keep the same form validation, loading and actual-result feedback in every auth screen.
- Do source all owned copy, aria labels, placeholders and mock content from both dictionaries.
- Don't invent an authenticated session, OAuth result, sent email, real member count or legal policy.
- Don't reveal whether a particular email address already has an account in reset or sign-up feedback.
- Don't allow decorations to obscure fields or remove actions on narrow screens.
````

### `README.md`

````markdown
# KampüsX

[Türkçe](#türkçe) | [English](#english)

## Türkçe

KampüsX, üniversite öğrencilerinin kampüs hayatını, akademik çevrelerini ve günlük paylaşımlarını bir araya getiren bir sosyal medya platformudur. Öğrencilerin kendi üniversiteleri ve bölümleriyle bağ kurmasını, yeni topluluklar keşfetmesini ve kampüsteki gelişmeleri takip etmesini amaçlar.

### Kimlik doğrulama

E-posta ve şifreyle kayıt, giriş, oturum yönetimi ve şifre yenileme Supabase Auth ile entegredir. Giriş ekranında “Beni hatırla” seçeneği bulunur. Şifre yenileme, e-postayla gönderilen bağlantı üzerinden yeni şifre belirleme akışını içerir.

Başarılı girişten sonra oturum korumalı ana ekran açılır. Profil çekmecesi giriş yapan hesabın kullanıcı adını gösterir ve çıkış yapmayı sağlar.

### Kullanıcı deneyimi

- Kampüs gündemi, paylaşım örnekleri ve üniversite topluluklarını tanıtan karşılama ekranı.
- Ayrı giriş, kayıt ve şifre yenileme ekranları.
- Giriş sonrası dashboard, profil çekmecesi ve üniversite/kampüs/bölüm keşfet sekmeleri.
- Anlık Türkçe ve İngilizce dil değişimi.
- Açık ve koyu tema.
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım.
- Klavyeyle kullanım, görünür odak durumları ve anlaşılır form geri bildirimleri.

Tasarım dili, üniversite hayatının enerjisini editoryal tipografi, güçlü renkler ve afiş kompozisyonlarıyla birleştirir.

### Ürün vizyonu

Platformun geliştirme hedefleri; bölüm, üniversite ve genel keşfet akışları, yazı/fotoğraf/video paylaşımı, beğeni, yorum, yeniden paylaşım ve alıntılama özellikleridir. Birebir mesajlaşma ve yöneticilerin üyelik isteklerini onayladığı uygulama içi topluluklar da bu kapsamda yer alır.

### Teknoloji

Frontend Angular ve Nx üzerine kuruludur. Ortak arayüz bileşenleri atomic design yaklaşımıyla düzenlenir; renk ve tipografi tasarım token'larıyla yönetilir. Tailwind CSS arayüz stillerini, Transloco dil desteğini, Supabase Auth ise kimlik doğrulamayı sağlar.

## English

KampüsX is a social platform that brings together university students' campus life, academic networks and everyday conversations. It helps students connect with their universities and departments, discover communities and follow campus news.

### Authentication

Email and password registration, sign-in, session management and password recovery are integrated with Supabase Auth. The sign-in screen includes a “Remember me” option. Password recovery provides an email link that opens the new-password flow.

Successful sign-in opens the session-protected home screen. The profile drawer displays the signed-in account's username and provides sign-out.

### User experience

- A welcome screen introducing campus news, example posts and university communities.
- Dedicated sign-in, registration and password recovery screens.
- A dashboard after sign-in, a profile drawer and university/campus/department discovery tabs.
- Instant Turkish and English language switching.
- Light and dark themes.
- Responsive layouts for desktop, tablet and mobile.
- Keyboard support, visible focus states and clear form feedback.

The visual language combines the energy of campus life with editorial typography, bold colors and poster compositions.

### Product vision

Development goals include department, university and general discovery feeds; text, photo and video posts; likes, comments, reposts and quote posts. Direct messaging and in-app communities with administrator-approved membership requests are also part of the product vision.

### Technology

The frontend is built with Angular and Nx. Shared UI components follow atomic design, with colors and typography managed through design tokens. Tailwind CSS provides interface styling, Transloco provides localization, and Supabase Auth handles authentication.
````

### `apps/shell/src/app/app.component.ts`

```typescript
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LanguageService } from './core/language.service';
@Component({
  selector: 'kx-root',
  standalone: true,
  imports: [RouterOutlet, TranslocoDirective, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t"
    ><a class="skip-link" href="#main">{{ t('common.skip') }}</a>
    @if (!dashboardLayout()) {
      <kx-header />
    }
    <main id="main" tabindex="-1"><router-outlet /></main>
    @if (!dashboardLayout()) {
      <kx-footer />
    }
  </ng-container>`,
})
export class AppComponent {
  readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly path = signal(this.document.location.pathname);
  readonly dashboardLayout = computed(() => this.path().replace(/\/$/, '') === '/dashboard');
  constructor() {
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    inject(Router)
      .events.pipe(takeUntilDestroyed(destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.path.set(event.urlAfterRedirects.split(/[?#]/)[0]);
        }
      });
    i18n
      .selectTranslate('common.title')
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((title) => {
        if (!this.dashboardLayout()) this.document.title = title;
      });
  }
}
```

### `apps/shell/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
```

### `apps/shell/src/app/core/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
/** Navigation convenience; data authorization belongs in RLS/the server. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.recovery()) return router.createUrlTree(['/auth/update-password']);
  return (await auth.hasVerifiedSession()) ? true : router.createUrlTree(['/auth/login']);
};

/** Confirmed sessions skip sign-in/sign-up, while recovery links keep their own flow. */
export const signedInGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.recovery()) return router.createUrlTree(['/auth/update-password']);
  return (await auth.hasVerifiedSession()) ? router.createUrlTree(['/dashboard']) : true;
};
```

### `apps/shell/src/app/core/auth.service.ts`

```typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { AuthError, isAuthError, type Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly connection = inject(SupabaseService);
  private readonly supabase = this.connection.client;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentSession = signal<Session | null>(null);
  readonly session = this.currentSession.asReadonly();
  readonly initialized = signal(false);
  readonly recovery = signal(false);
  readonly initializationError = signal<AuthError | null>(null);
  readonly ready: Promise<void>;
  private revision = 0;

  constructor() {
    if (!this.supabase) {
      this.initializationError.set(this.failure('auth_not_configured'));
      this.initialized.set(true);
      this.ready = Promise.resolve();
      return;
    }
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (this.destroyRef.destroyed) return;
      this.revision++;
      this.currentSession.set(session);
      if (event === 'PASSWORD_RECOVERY') this.recovery.set(!!session);
      else if (event === 'SIGNED_OUT' || !session) this.recovery.set(false);
      else if (event === 'SIGNED_IN') this.recovery.set(false);
      // Synchronous callback: nested SDK auth calls can deadlock.
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
    this.ready = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const revision = this.revision;
    try {
      const initialized = await this.supabase!.auth.initialize();
      if (this.destroyRef.destroyed) return;
      if (initialized.error) {
        this.initializationError.set(initialized.error);
        this.currentSession.set(null);
        this.recovery.set(false);
        return;
      }
      const { data, error } = await this.supabase!.auth.getSession();
      if (this.destroyRef.destroyed) return;
      if (error) {
        this.initializationError.set(error);
        if (revision === this.revision) this.currentSession.set(null);
      } else if (revision === this.revision) this.currentSession.set(data.session);
    } catch (error) {
      if (!this.destroyRef.destroyed) {
        this.initializationError.set(this.normalizeError(error));
        if (revision === this.revision) this.currentSession.set(null);
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.initialized.set(true);
        this.scrubCallbackUrl();
      }
    }
  }

  async signUp(email: string, password: string, username: string) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim().replace(/^@/, '') },
          emailRedirectTo: this.callbackUrl('/auth/login'),
        },
      });
      // Metadata is user-editable; profile/role creation belongs in DB/server rules.
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  async signIn(email: string, password: string, remember = false) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    await this.ready;
    this.connection.setRemember(remember);
    try {
      const result = await this.supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error?.code === 'invalid_credentials') {
        return { ...result, error: await this.classifyFailedLogin(email, result.error) };
      }
      if (!result.error) this.initializationError.set(null);
      return result;
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  private async classifyFailedLogin(email: string, originalError: AuthError): Promise<AuthError> {
    try {
      // Only a confirmed database false means missing. No passwords reach this RPC.
      const { data, error } = await this.supabase!.rpc('kampusx_login_email_exists', {
        email_address: email.trim(),
      }).abortSignal(AbortSignal.timeout(5000));
      if (error || typeof data !== 'boolean') return this.failure('login_account_check_failed');
      return data ? originalError : this.failure('login_user_not_found');
    } catch {
      return this.failure('login_account_check_failed');
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    if (!this.supabase) return { error: this.failure('auth_not_configured') };
    try {
      const result = await this.supabase.auth.signOut({ scope: 'local' });
      if (!result.error) {
        this.currentSession.set(null);
        this.recovery.set(false);
      }
      return result;
    } catch (error) {
      return { error: this.normalizeError(error) };
    }
  }

  async resetPassword(email: string): Promise<{ data: unknown; error: AuthError | null }> {
    if (!this.supabase) return { data: null, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: this.callbackUrl('/auth/update-password'),
      });
    } catch (error) {
      return { data: null, error: this.normalizeError(error) };
    }
  }

  async updatePassword(password: string): Promise<{ error: AuthError | null; passwordUpdated: boolean }> {
    await this.ready;
    if (!this.supabase) return { error: this.failure('auth_not_configured'), passwordUpdated: false };
    if (!this.recovery() || !this.session() || this.initializationError()) {
      return { error: this.failure('recovery_required'), passwordUpdated: false };
    }
    if (password.length < 8) return { error: this.failure('weak_password'), passwordUpdated: false };
    try {
      const { error } = await this.supabase.auth.updateUser({ password });
      if (error) return { error, passwordUpdated: false };
      this.recovery.set(false);
      const signedOut = await this.signOut();
      return {
        error: signedOut.error ? this.failure('password_updated_signout_failed') : null,
        passwordUpdated: true,
      };
    } catch (error) {
      return { error: this.normalizeError(error), passwordUpdated: false };
    }
  }

  /** Navigation only: data authorization remains in RLS/the server. */
  async hasVerifiedSession(): Promise<boolean> {
    await this.ready;
    if (!this.supabase || !this.session() || this.initializationError()) return false;
    const revision = this.revision;
    const userId = this.session()!.user.id;
    try {
      const { data, error } = await this.supabase.auth.getUser();
      return !error && data.user?.id === userId && revision === this.revision;
    } catch {
      return false;
    }
  }

  errorKey(error: unknown): string {
    const value = error as { code?: string; status?: number; name?: string } | null;
    if (value?.code === 'auth_not_configured') return 'auth.errors.config';
    if (value?.code === 'recovery_required' || value?.code === 'otp_expired')
      return 'auth.errors.recoveryInvalid';
    if (value?.code === 'password_updated_signout_failed') return 'auth.errors.signOut';
    if (value?.code === 'login_user_not_found') return 'auth.errors.userNotFound';
    if (value?.code === 'login_account_check_failed') return 'auth.errors.accountLookup';
    if (value?.code === 'invalid_credentials') return 'auth.errors.credentials';
    if (value?.code === 'email_not_confirmed') return 'auth.errors.unconfirmed';
    if (value?.code === 'weak_password') return 'auth.errors.weakPassword';
    if (value?.code === 'over_email_send_rate_limit') return 'auth.errors.emailRateLimit';
    if (value?.status === 429 || value?.code === 'over_request_rate_limit') return 'auth.errors.rateLimit';
    if (value?.code === 'network_error' || value?.name === 'AuthRetryableFetchError')
      return 'auth.errors.network';
    return 'auth.errors.generic';
  }

  private failure(code: string): AuthError {
    return new AuthError('Authentication could not be completed.', undefined, code);
  }
  private normalizeError(error: unknown): AuthError {
    return isAuthError(error)
      ? error
      : this.failure(error instanceof TypeError ? 'network_error' : 'unexpected_failure');
  }
  private callbackUrl(path: string): string {
    return new URL(path, this.document.location.origin).href;
  }

  private scrubCallbackUrl(): void {
    const window = this.document.defaultView;
    if (
      !window ||
      !['/auth/login', '/auth/update-password'].includes(window.location.pathname.replace(/\/$/, ''))
    )
      return;
    const url = new URL(window.location.href);
    const keys = [
      'code',
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
      'expires_at',
      'type',
      'error',
      'error_code',
      'error_description',
    ];
    const hash = new URLSearchParams(url.hash.slice(1));
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
      if (hash.has(key)) {
        hash.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    url.hash = hash.toString();
    try {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* History can be restricted by the host. */
    }
  }
}
```

### `apps/shell/src/app/core/supabase-callback.ts`

```typescript
/** Plain login URLs are not callbacks; PKCE codes use the SDK's separate detection. */
export function isSupabaseImplicitCallback(url: URL, params: Record<string, string>): boolean {
  return (
    ['/auth/login', '/auth/update-password'].includes(url.pathname.replace(/\/$/, '')) &&
    Boolean(params['access_token'] || params['error'] || params['error_description'] || params['error_code'])
  );
}
```

### `apps/shell/src/app/core/supabase.service.ts`

```typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BrowserAuthStorage } from './browser-auth-storage';
import { isSupabaseImplicitCallback } from './supabase-callback';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly client: SupabaseClient | null;
  private readonly storage: BrowserAuthStorage | null;

  constructor() {
    if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
      this.client = null;
      this.storage = null;
      return;
    }
    const window = this.document.defaultView;
    const storageKey = `sb-${new URL(environment.supabaseUrl).hostname.split('.')[0]}-auth-token`;
    const safeStorage = (kind: 'localStorage' | 'sessionStorage'): Storage | null => {
      try {
        return window?.[kind] ?? null;
      } catch {
        return null;
      }
    };
    this.storage = new BrowserAuthStorage(
      storageKey,
      safeStorage('localStorage'),
      safeStorage('sessionStorage'),
    );
    this.client = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        storageKey,
        storage: this.storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: isSupabaseImplicitCallback,
      },
    });
    this.destroyRef.onDestroy(() => {
      void Promise.all([this.client!.auth.dispose(), this.client!.removeAllChannels()]).catch(() => {
        // Teardown must not log sessions or cause unhandled rejections.
      });
    });
  }

  setRemember(remember: boolean): void {
    this.storage?.setRemember(remember);
  }
}
```

### `apps/shell/src/app/features/auth/auth.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { signedInGuard } from '../../core/auth.guard';
export const authRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [signedInGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'register',
    canActivate: [signedInGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'forgot-password',
    data: { mode: 'reset' },
    loadComponent: () => import('./auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'update-password',
    loadComponent: () => import('./update-password/update-password.page').then((m) => m.UpdatePasswordPage),
  },
];
```

### `apps/shell/src/app/features/auth/login-form/login-form.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  FormFieldComponent,
  PasswordFieldComponent,
  IconComponent,
} from '@kampusx/shared/ui';
import { validateAndFocus } from '@kampusx/shared/util';
import { AuthUiService } from '../../../core/auth-ui.service';
import { AuthService } from '../../../core/auth.service';
@Component({
  selector: 'kx-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    FormFieldComponent,
    PasswordFieldComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form
    *transloco="let t"
    [formGroup]="form"
    (ngSubmit)="submit()"
    novalidate
    [attr.aria-busy]="busy()"
  >
    <kx-form-field
      fieldId="login-identity"
      labelKey="auth.login.identity"
      placeholderKey="auth.login.placeholder"
      autocomplete="username"
      [control]="form.controls.identity"
    /><kx-password-field fieldId="login-password" [control]="form.controls.password" />
    <div class="form-options">
      <label class="checkbox-label"
        ><input type="checkbox" formControlName="remember" />{{ t('auth.login.remember') }}</label
      ><button type="button" class="text-button" (click)="auth.mode.set('reset')">
        {{ t('auth.login.forgot') }}
      </button>
    </div>
    <button kxButton type="submit" class="full-width" [busy]="busy()">
      {{ t('auth.login.submit') }}<kx-icon name="arrow_forward" />
    </button>
    <div class="form-status" role="status">
      @if (done()) {
        <p class="success-message"><kx-icon name="check_circle" />{{ t('auth.login.success') }}</p>
      }
      @if (errorKey()) {
        <p class="field-message error-text" role="alert">{{ t(errorKey()) }}</p>
      }
    </div>
    <p class="auth-bottom">
      {{ t('auth.login.new') }}
      <button type="button" class="text-button" (click)="auth.mode.set('register')">
        {{ t('auth.login.join') }}
      </button>
    </p>
  </form>`,
})
export class LoginFormComponent {
  readonly auth = inject(AuthUiService);
  private readonly api = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly errorKey = signal('');
  readonly form = new FormGroup({
    identity: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(false, { nonNullable: true }),
  });

  async submit() {
    if (this.busy() || !validateAndFocus(this.form, this.host)) return;
    this.done.set(false);
    this.errorKey.set('');
    this.busy.set(true);
    const v = this.form.getRawValue();
    try {
      const { data, error } = await this.api.signIn(v.identity.trim(), v.password, v.remember);
      if (this.destroyRef.destroyed) return;
      if (error || !data.session) this.errorKey.set(this.api.errorKey(error));
      else {
        this.form.controls.password.reset();
        this.done.set(true);
        const navigated = await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        if (!navigated && !this.destroyRef.destroyed) this.errorKey.set('auth.errors.generic');
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }
}
```

### `apps/shell/src/app/features/auth/register-form/register-form.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  FormFieldComponent,
  PasswordFieldComponent,
  IconComponent,
  LegalDialogComponent,
} from '@kampusx/shared/ui';
import { universityEmail, username, validateAndFocus } from '@kampusx/shared/util';
@Component({
  selector: 'kx-register-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    FormFieldComponent,
    PasswordFieldComponent,
    IconComponent,
    LegalDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t"
    ><button
      kxButton
      emphasis="outline"
      type="button"
      class="full-width google-button"
      (click)="googleNotice.set(true)"
    >
      <span class="google-g" aria-hidden="true">G</span>{{ t('auth.google') }}
    </button>
    @if (googleNotice()) {
      <p class="info-message" role="status">{{ t('auth.googleDemo') }}</p>
    }
    <div class="form-divider">
      <span>{{ t('auth.divider') }}</span>
    </div>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
      <kx-form-field
        fieldId="register-email"
        type="email"
        autocomplete="email"
        labelKey="auth.register.email"
        placeholderKey="auth.register.emailPlaceholder"
        hintKey="auth.register.emailHint"
        [control]="form.controls.email"
      /><kx-form-field
        fieldId="register-username"
        icon="person"
        autocomplete="username"
        labelKey="auth.register.username"
        placeholderKey="auth.register.usernamePlaceholder"
        hintKey="auth.register.usernameHint"
        [control]="form.controls.username"
      /><kx-password-field
        fieldId="register-password"
        [control]="form.controls.password"
        [newPassword]="true"
      /><label class="checkbox-label consent-label"
        ><input
          id="register-consent"
          type="checkbox"
          formControlName="consent"
          [attr.aria-invalid]="form.controls.consent.touched && form.controls.consent.invalid"
          aria-describedby="consent-message"
        />{{ t('auth.termsPrefix') }}</label
      >
      <p id="consent-message" class="field-message error-text" aria-live="polite">
        {{ form.controls.consent.touched && form.controls.consent.invalid ? t('validation.required') : '' }}
      </p>
      <div class="legal-links">
        <button type="button" class="text-button" (click)="legal.open('legal.text')">
          {{ t('auth.termsLink') }}</button
        ><span aria-hidden="true">·</span
        ><button type="button" class="text-button" (click)="legal.open('legal.text')">
          {{ t('auth.privacyLink') }}
        </button>
      </div>
      <button kxButton type="submit" class="full-width" [busy]="busy()">
        {{ t('auth.register.submit') }}<kx-icon name="arrow_forward" />
      </button>
      <div class="form-status" role="status">
        @if (done()) {
          <p class="success-message"><kx-icon name="check_circle" />{{ t('auth.register.success') }}</p>
        }
        @if (errorKey()) {
          <p class="field-message error-text" role="alert">{{ t(errorKey()) }}</p>
        }
      </div>
    </form>
    <kx-legal-dialog #legal
  /></ng-container>`,
})
export class RegisterFormComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly googleNotice = signal(false);
  private readonly api = inject(AuthService);
  private readonly router = inject(Router);
  readonly errorKey = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, universityEmail],
    }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, username] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    consent: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  async submit() {
    if (this.busy() || !validateAndFocus(this.form, this.host)) return;
    this.done.set(false);
    this.errorKey.set('');
    this.busy.set(true);
    const v = this.form.getRawValue();
    try {
      const { data, error } = await this.api.signUp(v.email.trim(), v.password, v.username.trim());
      if (this.destroyRef.destroyed) return;
      if (error) this.errorKey.set(this.api.errorKey(error));
      else {
        this.form.controls.password.reset();
        this.done.set(true);
        if (data.session) await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }
}
```

### `apps/shell/src/app/features/dashboard/bottom-nav/bottom-nav.component.css`

```css
:host {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 760px);
  z-index: 40;
}
.bottom-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
  min-height: calc(76px + env(safe-area-inset-bottom));
  border: 1px solid var(--color-border);
  border-bottom: 0;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  backdrop-filter: blur(18px);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 58px;
  padding: 6px 12px;
  margin-inline: 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-muted);
  cursor: default;
}
.nav-item:hover {
  background: var(--color-surface-alt);
}
.nav-item.active {
  color: var(--color-primary);
  background: var(--color-soft-primary);
}
.nav-item:focus-visible {
  outline-offset: -3px;
}
.nav-icon {
  display: inline-grid;
  place-items: center;
  height: 26px;
  width: 26px;
}
.nav-icon img {
  border-radius: var(--radius-control);
}
.nav-label {
  font-size: 10px;
  line-height: 1.4;
  font-weight: 700;
}
```

### `apps/shell/src/app/features/dashboard/bottom-nav/bottom-nav.component.ts`

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
import { BOTTOM_NAV } from '../mock-data';

@Component({
  selector: 'kx-dashboard-bottom-nav',
  standalone: true,
  imports: [TranslocoDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav class="bottom-nav" *transloco="let t" [attr.aria-label]="t('dashboard.navigationLabel')">
    @for (item of items; track item.id) {
      <button
        type="button"
        class="nav-item"
        [class.active]="item.id === 'home'"
        [attr.aria-current]="item.id === 'home' ? 'page' : null"
        aria-disabled="true"
        [attr.aria-label]="t(item.key)"
        aria-describedby="dashboard-nav-note"
      >
        <span class="nav-icon">
          @if (item.icon) {
            <kx-icon [name]="item.icon" />
          } @else {
            <img src="assets/logo.svg" width="24" height="24" alt="" />
          }
        </span>
        <span class="nav-label">{{ t(item.key) }}</span>
      </button>
    }
    <p class="sr-only" id="dashboard-nav-note">{{ t('dashboard.visualOnly') }}</p>
  </nav>`,
  styleUrl: './bottom-nav.component.css',
})
export class DashboardBottomNavComponent {
  readonly items = BOTTOM_NAV;
}
```

### `apps/shell/src/app/features/dashboard/dashboard-profile.ts`

```typescript
import type { User } from '@supabase/supabase-js';

export interface DashboardProfile {
  handle: string;
  initials: string;
  school: string | null;
  department: string | null;
}

/** Metadata is display content only; it never grants permissions. */
export function dashboardProfile(user: User | undefined, locale: string): DashboardProfile {
  const metadata = user?.user_metadata ?? {};
  const text = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  const username = (text(metadata['username']) ?? user?.email?.split('@')[0] ?? '').replace(/^@+/, '');
  return {
    handle: username ? `@${username}` : '',
    initials: Array.from(username)[0]?.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US') ?? '',
    school: text(metadata['university_name']) ?? text(metadata['school']),
    department: text(metadata['department_name']) ?? text(metadata['department']),
  };
}
```

### `apps/shell/src/app/features/dashboard/dashboard.page.css`

```css
:host {
  display: block;
}
.dashboard-page {
  min-height: 100dvh;
  background: var(--color-bg);
}
.dashboard-shell {
  width: min(100%, 760px);
  margin-inline: auto;
  min-height: 100dvh;
  border-inline: 1px solid var(--color-border);
  background: var(--color-surface);
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
.dashboard-sticky {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  backdrop-filter: blur(18px);
}
.discover-viewport {
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
}
.discover-track {
  display: flex;
  transition: transform var(--motion-fast) ease-out;
}
.discover-panel {
  flex: 0 0 100%;
  min-width: 0;
  padding: 36px 28px 28px;
  outline-offset: -5px;
}
.feed-heading {
  min-height: 204px;
  padding-bottom: 32px;
}
.feed-emblem {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  background: var(--color-soft-primary);
  color: var(--color-primary);
  margin-bottom: 16px;
}
.feed-scope {
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.feed-heading h1 {
  font-size: clamp(24px, 4vw, 30px);
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}
.feed-description {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.8;
  max-width: 54ch;
}
.feed-placeholder-list {
  display: grid;
  gap: 16px;
}
@media (max-width: 640px) {
  .discover-panel {
    padding: 28px 16px 20px;
  }
  .feed-heading {
    min-height: 220px;
    padding-bottom: 28px;
  }
  .feed-scope {
    font-size: 10px;
  }
  .feed-description {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .discover-track {
    transition: none;
  }
}
```

### `apps/shell/src/app/features/dashboard/dashboard.page.html`

```html
<div class="dashboard-page" *transloco="let t">
  <div class="dashboard-shell">
    <div class="dashboard-sticky">
      <kx-dashboard-top-bar
        [initials]="profile().initials"
        [drawerOpen]="drawerOpen()"
        [dark]="theme.dark()"
        [language]="language.language()"
        (profileOpened)="profileDrawer().open()"
        (themeChanged)="theme.toggle()"
        (languageChanged)="language.set($event)"
      />
      <kx-dashboard-discover-tabs [active]="active()" (selected)="select($event)" />
    </div>
    <div
      #viewport
      class="discover-viewport"
      (pointerdown)="onPointerDown($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="cancelSwipe()"
    >
      <div class="discover-track" [style.transform]="'translateX(-' + active() * 100 + '%)'">
        @for (feed of feeds; track feed.id; let index = $index) {
        <section
          class="discover-panel"
          role="tabpanel"
          [id]="'dashboard-discover-panel-' + feed.id"
          [attr.aria-labelledby]="'dashboard-discover-tab-' + feed.id"
          [attr.aria-hidden]="active() !== index"
          [inert]="active() !== index"
          [tabIndex]="active() === index ? 0 : -1"
        >
          <div class="feed-heading">
            <span class="feed-emblem" aria-hidden="true"><kx-icon [name]="feed.icon" /></span>
            <p class="feed-scope">{{ t(feed.scopeKey) }}</p>
            <h1>{{ t(feed.headingKey) }}</h1>
            <p class="feed-description">{{ t(feed.descriptionKey) }}</p>
          </div>
          <div class="feed-placeholder-list" aria-hidden="true">
            @for (card of skeletons; track card) { <kx-feed-skeleton /> }
          </div>
        </section>
        }
      </div>
    </div>
    <kx-dashboard-bottom-nav />
  </div>
  <kx-dashboard-profile-drawer
    #profileDrawerView
    [profile]="profile()"
    [logoutBusy]="logoutBusy()"
    [logoutErrorKey]="logoutErrorKey()"
    (logoutRequested)="logout()"
    (changed)="drawerOpen.set($event)"
  />
</div>
```

### `apps/shell/src/app/features/dashboard/dashboard.page.ts`

```typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  computed,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { FeedSkeletonComponent, IconComponent } from '@kampusx/shared/ui';
import { horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';
import { ThemeService } from '../../core/theme.service';
import { LanguageService } from '../../core/language.service';
import { AuthService } from '../../core/auth.service';
import { dashboardProfile } from './dashboard-profile';
import { DashboardTopBarComponent } from './top-bar/top-bar.component';
import { DashboardProfileDrawerComponent } from './profile-drawer/profile-drawer.component';
import { DashboardDiscoverTabsComponent } from './discover-tabs/discover-tabs.component';
import { DashboardBottomNavComponent } from './bottom-nav/bottom-nav.component';
import { DISCOVER_FEEDS, SKELETON_CARDS } from './mock-data';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    FeedSkeletonComponent,
    IconComponent,
    DashboardTopBarComponent,
    DashboardProfileDrawerComponent,
    DashboardDiscoverTabsComponent,
    DashboardBottomNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly profile = computed(() => dashboardProfile(this.auth.session()?.user, this.language.language()));
  readonly logoutBusy = signal(false);
  readonly logoutErrorKey = signal('');
  readonly feeds = DISCOVER_FEEDS;
  readonly skeletons = SKELETON_CARDS;
  readonly active = signal(0);
  readonly drawerOpen = signal(false);
  readonly profileDrawer = viewChild.required<DashboardProfileDrawerComponent>('profileDrawerView');
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private swipe: SwipePoint | null = null;

  constructor() {
    effect(() => {
      if (this.auth.initialized() && !this.auth.session()) {
        void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      }
    });
    const document = inject(DOCUMENT);
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      document.title = i18n.translate('common.title');
    });
    i18n
      .selectTranslate('dashboard.title')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((title) => {
        document.title = title;
      });
  }

  async logout(): Promise<void> {
    if (this.logoutBusy()) return;
    this.logoutBusy.set(true);
    this.logoutErrorKey.set('');
    try {
      const { error } = await this.auth.signOut();
      if (this.destroyRef.destroyed) return;
      if (error && this.auth.session()) this.logoutErrorKey.set(this.auth.errorKey(error));
      else await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    } finally {
      if (!this.destroyRef.destroyed) this.logoutBusy.set(false);
    }
  }

  select(index: number): void {
    this.active.set(Math.max(0, Math.min(this.feeds.length - 1, index)));
  }
  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) {
      this.swipe = null;
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.swipe = swipePoint(event);
    this.viewport().nativeElement.setPointerCapture(event.pointerId);
  }
  onPointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction) this.select(this.active() + direction);
  }
  cancelSwipe(): void {
    this.swipe = null;
  }
}
```

### `apps/shell/src/app/features/dashboard/discover-tabs/discover-tabs.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TabStripComponent } from '@kampusx/shared/ui';
import { DISCOVER_FEEDS } from '../mock-data';

@Component({
  selector: 'kx-dashboard-discover-tabs',
  standalone: true,
  imports: [TabStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-tab-strip
    [items]="feeds"
    [active]="active()"
    baseId="dashboard-discover"
    labelKey="dashboard.discoverLabel"
    (selected)="selected.emit($event)"
  />`,
})
export class DashboardDiscoverTabsComponent {
  readonly feeds = DISCOVER_FEEDS;
  readonly active = input(0);
  readonly selected = output<number>();
}
```

### `apps/shell/src/app/features/dashboard/mock-data.ts`

```typescript
import type { TabStripItem } from '@kampusx/shared/ui';

export interface DiscoverFeed extends TabStripItem {
  headingKey: string;
  descriptionKey: string;
  scopeKey: string;
  icon: string;
}

export const DISCOVER_FEEDS: readonly DiscoverFeed[] = [
  {
    id: 'university',
    labelKey: 'dashboard.tabs.university',
    headingKey: 'dashboard.feeds.university.title',
    descriptionKey: 'dashboard.feeds.university.description',
    scopeKey: 'dashboard.mock.school',
    icon: 'school',
  },
  {
    id: 'campus',
    labelKey: 'dashboard.tabs.campus',
    headingKey: 'dashboard.feeds.campus.title',
    descriptionKey: 'dashboard.feeds.campus.description',
    scopeKey: 'dashboard.mock.campus',
    icon: 'apartment',
  },
  {
    id: 'department',
    labelKey: 'dashboard.tabs.department',
    headingKey: 'dashboard.feeds.department.title',
    descriptionKey: 'dashboard.feeds.department.description',
    scopeKey: 'dashboard.mock.department',
    icon: 'code',
  },
];

export const PROFILE_MENU = [
  { id: 'settings', key: 'dashboard.menu.settings', icon: 'settings' },
  { id: 'account', key: 'dashboard.menu.account', icon: 'person' },
  { id: 'community', key: 'dashboard.menu.community', icon: 'groups' },
] as const;

export const BOTTOM_NAV = [
  { id: 'home', key: 'dashboard.nav.home', icon: null },
  { id: 'messages', key: 'dashboard.nav.messages', icon: 'chat_bubble' },
  { id: 'search', key: 'dashboard.nav.search', icon: 'search' },
] as const;

export const SKELETON_CARDS = ['first', 'second', 'third'] as const;
```

### `apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.css`

```css
:host {
  display: contents;
}
.profile-content {
  padding: max(28px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
}
.drawer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.close-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  transition: transform var(--motion-fast) ease-out;
  cursor: pointer;
}
.close-button:hover {
  background: var(--color-surface-alt);
}
.close-button:active {
  transform: scale(0.94);
}
.profile-details {
  padding-block: 20px 28px;
}
.profile-details h2 {
  overflow-wrap: anywhere;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}
.logout-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.logout-button {
  transition: transform var(--motion-fast) ease-out;
}
.profile-details p {
  color: var(--color-muted);
  line-height: 1.65;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.profile-details p + p {
  margin-top: 6px;
}
.profile-menu {
  display: grid;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 52px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  font-weight: 700;
  font-size: 14px;
  cursor: default;
}
.profile-menu-item:hover {
  background: var(--color-surface-alt);
}
.profile-menu-item:focus-visible {
  outline-offset: -3px;
}
.profile-menu-item kx-icon:last-child {
  margin-left: auto;
  color: var(--color-muted);
}
@media (prefers-reduced-motion: reduce) {
  .close-button {
    transition: none;
  }
}
```

### `apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent, ButtonComponent, IconComponent, ModalDrawerComponent } from '@kampusx/shared/ui';
import { PROFILE_MENU } from '../mock-data';
import type { DashboardProfile } from '../dashboard-profile';

@Component({
  selector: 'kx-dashboard-profile-drawer',
  standalone: true,
  imports: [TranslocoDirective, AvatarComponent, ButtonComponent, IconComponent, ModalDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-modal-drawer
    #drawer
    drawerId="dashboard-profile-drawer"
    labelledBy="dashboard-profile-name"
    describedBy="dashboard-profile-school dashboard-profile-department"
    (changed)="changed.emit($event)"
  >
    <div class="profile-content" *transloco="let t">
      <div class="drawer-top">
        <kx-avatar [initials]="profile().initials" size="large" />
        <button
          type="button"
          data-drawer-close
          class="close-button"
          [attr.aria-label]="t('dashboard.closeProfile')"
          (click)="drawer.close()"
        >
          <kx-icon name="close" />
        </button>
      </div>
      <div class="profile-details">
        <h2 id="dashboard-profile-name">{{ profile().handle || t('dashboard.profile.unnamed') }}</h2>
        <p id="dashboard-profile-school">{{ profile().school || t('dashboard.profile.schoolMissing') }}</p>
        <p id="dashboard-profile-department">
          {{ profile().department || t('dashboard.profile.departmentMissing') }}
        </p>
      </div>
      <nav class="profile-menu" [attr.aria-label]="t('dashboard.profileMenu')">
        @for (item of menu; track item.id) {
          <button
            type="button"
            class="profile-menu-item"
            aria-disabled="true"
            aria-describedby="dashboard-menu-note"
          >
            <kx-icon [name]="item.icon" /><span>{{ t(item.key) }}</span
            ><kx-icon name="chevron_right" />
          </button>
        }
      </nav>
      <p class="sr-only" id="dashboard-menu-note">{{ t('dashboard.visualOnly') }}</p>
      <div class="logout-section">
        <button
          kxButton
          type="button"
          emphasis="outline"
          class="full-width logout-button"
          [busy]="logoutBusy()"
          (click)="logoutRequested.emit()"
        >
          <kx-icon name="logout" />{{ t('dashboard.logout') }}
        </button>
        @if (logoutErrorKey()) {
          <p class="field-message error-text" role="alert">{{ t(logoutErrorKey()) }}</p>
        }
      </div>
    </div>
  </kx-modal-drawer>`,
  styleUrl: './profile-drawer.component.css',
})
export class DashboardProfileDrawerComponent {
  readonly profile = input.required<DashboardProfile>();
  readonly logoutBusy = input(false);
  readonly logoutErrorKey = input('');
  readonly logoutRequested = output<void>();
  readonly menu = PROFILE_MENU;
  readonly changed = output<boolean>();
  private readonly drawer = viewChild.required<ModalDrawerComponent>('drawer');
  open(): void {
    this.drawer().open();
  }
  close(): void {
    this.drawer().close();
  }
}
```

### `apps/shell/src/app/features/dashboard/top-bar/top-bar.component.css`

```css
:host {
  display: block;
}
.top-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 82px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
}
.profile-trigger {
  justify-self: start;
}
.avatar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform var(--motion-fast) ease-out;
}
.avatar-button:hover {
  background: var(--color-surface-alt);
}
.avatar-button:active {
  transform: scale(0.94);
}
.top-bar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
}
.logomark {
  display: none;
  border-radius: var(--radius-control);
}
.top-bar-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
}
@media (max-width: 640px) {
  .top-bar {
    min-height: 66px;
    padding: 8px 12px;
    gap: 4px;
  }
  .wordmark {
    display: none;
  }
  .logomark {
    display: block;
  }
  .top-bar-settings {
    gap: 4px;
  }
}
```

### `apps/shell/src/app/features/dashboard/top-bar/top-bar.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  LogoComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';

@Component({
  selector: 'kx-dashboard-top-bar',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    LogoComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="top-bar" *transloco="let t">
    <div class="profile-trigger">
      <button
        type="button"
        class="avatar-button"
        aria-controls="dashboard-profile-drawer"
        [attr.aria-label]="t('dashboard.openProfile')"
        [attr.aria-expanded]="drawerOpen()"
        (click)="profileOpened.emit()"
      >
        <kx-avatar [initials]="initials()" />
      </button>
    </div>
    <div class="top-bar-brand" role="img" [attr.aria-label]="t('common.brand')">
      <kx-logo class="wordmark" />
      <img class="logomark" src="assets/logo.svg" width="38" height="38" alt="" />
    </div>
    <div class="top-bar-settings">
      <kx-language-switcher [active]="language()" (changed)="languageChanged.emit($event)" />
      <kx-theme-toggle [dark]="dark()" (changed)="themeChanged.emit()" />
    </div>
  </header>`,
  styleUrl: './top-bar.component.css',
})
export class DashboardTopBarComponent {
  readonly initials = input.required<string>();
  readonly drawerOpen = input(false);
  readonly language = input('tr');
  readonly dark = input(false);
  readonly profileOpened = output<void>();
  readonly languageChanged = output<string>();
  readonly themeChanged = output<void>();
}
```

### `apps/shell/src/assets/i18n/en.json`

```json
{
  "common": {
    "skip": "Skip to content",
    "lightTheme": "Switch to light theme",
    "darkTheme": "Switch to dark theme",
    "language": {
      "label": "Choose language",
      "tr": "Türkçe",
      "en": "English"
    },
    "languageCode": {
      "tr": "TR",
      "en": "EN"
    },
    "menu": "Open menu",
    "closeMenu": "Close menu",
    "close": "Close",
    "back": "Back to sign in",
    "demo": "Design preview",
    "sample": "Sample data",
    "plus": "+",
    "brand": "KampüsX",
    "title": "KampüsX — Your campus is talking",
    "notFound": "We couldn't find this page on campus.",
    "home": "Back to home"
  },
  "nav": {
    "explore": "Explore",
    "communities": "Communities",
    "academic": "Academic network",
    "about": "About",
    "login": "Sign in",
    "join": "Join your campus"
  },
  "hero": {
    "edition": "The unofficial voice of campus.",
    "live": "Campus pulse is live",
    "active": "students active",
    "universities": "universities connected",
    "titleTop": "What’s your",
    "titleMiddle": "campus talking",
    "titleBottom": "about right now?",
    "welcome": "Welcome to KampüsX.",
    "description": "From between-class chats to your next big project. Your campus, your people, and the communities you belong to, all in one place.",
    "sticker": "See you\nbetween classes!",
    "roundSticker": "Students\nonly.",
    "posterLabel": "A slice of campus life",
    "sample": "Sample posts",
    "scroll": "Explore campus life",
    "verified": {
      "title": "Real students",
      "text": "Verified with .edu.tr"
    },
    "trending": {
      "title": "Stay in the loop",
      "text": "On your campus frequency"
    },
    "anonymous": {
      "title": "Go anonymous",
      "text": "Your voice, your choice"
    },
    "trends": {
      "label": "Trending on campus",
      "one": "#ITU_ExamSeason",
      "two": "#METU_SpringFest",
      "three": "#Cafeteria_Menu",
      "four": "#ADayOnCampus",
      "five": "#ProjectPartners",
      "pause": "Pause trending ticker",
      "resume": "Resume trending ticker"
    }
  },
  "auth": {
    "kicker": "You belong here.",
    "title": "Connect with campus.",
    "description": "One account. Your whole campus.",
    "loginTab": "Sign in",
    "registerTab": "Sign up",
    "tabs": "Account actions",
    "password": "Password",
    "passwordPlaceholder": "Enter your password",
    "showPassword": "Show password",
    "hidePassword": "Hide password",
    "passwordHint": "At least 8 characters. Longer passwords are safer.",
    "demoHint": "Sign in with your account or sign up with your university email.",
    "secure": "A network verified with student emails",
    "google": "Start with your Google student account",
    "googleDemo": "Google sign-in is not enabled yet. You can sign up with your email.",
    "divider": "or use your email",
    "termsPrefix": "I have read and accept the terms of use and privacy policy.",
    "termsLink": "Terms of use",
    "privacyLink": "Privacy policy",
    "serverError": "We could not complete this request. Please try again.",
    "strength": {
      "0": "Password strength",
      "1": "Getting started",
      "2": "Fair",
      "3": "Good",
      "4": "Strong"
    },
    "login": {
      "identity": "University email",
      "placeholder": "student@itu.edu.tr",
      "remember": "Keep me signed in on this device",
      "forgot": "Forgot password?",
      "submit": "Sign in",
      "new": "New to KampüsX?",
      "join": "Join us",
      "success": "You are signed in. Your session is active."
    },
    "register": {
      "title": "Your next campus story.",
      "description": "Join us with your student email.",
      "email": "University email",
      "emailPlaceholder": "student@itu.edu.tr",
      "emailHint": "Only addresses ending in .edu.tr.",
      "username": "Username",
      "usernamePlaceholder": "@campuslife",
      "usernameHint": "3–20 letters, numbers, or underscores.",
      "submit": "Join KampüsX",
      "success": "Check your email to continue. If this address is eligible for sign-up, a confirmation link will be sent."
    },
    "reset": {
      "title": "Let’s reconnect.",
      "description": "Enter your university email to request a password reset link.",
      "email": "University email",
      "placeholder": "student@itu.edu.tr",
      "submit": "Send reset link",
      "successTitle": "Check your email",
      "success": "If an account exists for this address, a password reset link will be sent. Check your inbox and spam folder.",
      "retry": "Try another email"
    },
    "update": {
      "title": "Choose a new password.",
      "description": "Enter your new password in both fields. You will sign in again after saving it.",
      "checking": "Checking your password reset link…",
      "password": "New password",
      "confirmPassword": "Confirm new password",
      "submit": "Update password",
      "successTitle": "Password updated",
      "success": "This session has ended. You can now sign in with your new password.",
      "requestLink": "Request a new reset link",
      "retrySignOut": "Try signing out again"
    },
    "errors": {
      "config": "Sign-in is not configured yet. Please try again later.",
      "credentials": "The email or password is incorrect. Check your details.",
      "userNotFound": "No such user exists.",
      "accountLookup": "The account check could not be completed. Please try again.",
      "unconfirmed": "Confirm your email address before signing in. Check your inbox and spam folder.",
      "network": "We could not connect. Check your internet connection and try again.",
      "rateLimit": "The request limit was reached. Wait a moment and try again.",
      "emailRateLimit": "The email sending limit was reached. Try again when the sending quota resets.",
      "generic": "We could not complete this request. Please try again.",
      "recoveryInvalid": "This password reset link is missing, invalid, or expired. Request a new link.",
      "weakPassword": "This password was not accepted. Choose a stronger password with at least 8 characters.",
      "signupFailed": "We could not complete sign-up. Check your details and try again.",
      "signOut": "Your password was updated. There was a problem during sign-out. Try again to continue."
    }
  },
  "validation": {
    "required": "Please fill in this field.",
    "email": "Enter a valid email address.",
    "universityEmail": "Use your university email ending in .edu.tr.",
    "username": "Use 3–20 letters, numbers, or underscores.",
    "passwordLength": "Your password needs at least 8 characters.",
    "passwordMismatch": "The passwords must match."
  },
  "posts": {
    "photo": {
      "name": "Deniz Aydın",
      "text": "One plan after the last class. 🌿",
      "caption": "Campus, sunset, and us.",
      "alt": "Original sunset illustration with trees and a campus building"
    },
    "anonymous": {
      "name": "Someone on campus",
      "text": "We always sit at the same library table. Today I’m asking them for coffee. Probably. 👀"
    },
    "poll": {
      "name": "Ece Yılmaz",
      "text": "What keeps you going through exam week?",
      "one": "Coffee, obviously ☕",
      "two": "My friends 🫶",
      "votes": "votes · sample poll",
      "firstPercent": "68%",
      "secondPercent": "32%"
    },
    "video": {
      "name": "Mert Kaya",
      "text": "Rehearsal done. Next stop: spring festival. 🎸",
      "caption": "Spring festival rehearsal",
      "duration": "0:24",
      "preview": "Video preview · sample content"
    },
    "time": "just now",
    "verified": "Verified student",
    "like": "Like this post",
    "unlike": "Unlike this post",
    "comments": "comments",
    "share": "reposts",
    "anonymousTag": "Anonymous",
    "sample": "Sample post"
  },
  "universities": {
    "itu": "Istanbul Technical University",
    "metu": "Middle East Technical University",
    "bogazici": "Boğaziçi University",
    "ankara": "Ankara University",
    "koc": "Koç University",
    "hacettepe": "Hacettepe University",
    "ege": "Ege University",
    "istanbul": "Istanbul University"
  },
  "about": {
    "number": "01",
    "kicker": "All of campus life",
    "title": "One campus.\nA thousand stories.",
    "description": "More than a noticeboard. Closer than a feed. KampüsX brings university life together with the people living it.",
    "quote": "The best ideas sometimes happen between classes.",
    "photo": "Share a moment.",
    "photoText": "Your campus, through your eyes.",
    "video": "Put life in motion.",
    "videoText": "Rehearsals, games, little discoveries.",
    "text": "Say something.",
    "textText": "Your ideas, questions, little confessions.",
    "interactions": "Like, comment, repost, quote, or send a message.",
    "feeds": {
      "title": "Your world. Your feed.",
      "university": "My university",
      "department": "My department",
      "explore": "Explore all",
      "universityText": "What’s happening with the people in your hallways.",
      "departmentText": "Same classes. Same questions. New connections.",
      "exploreText": "Ideas and people beyond your campus gates.",
      "universityPost": "Outdoor cinema at Taşkışla. Meet us tonight!",
      "departmentPost": "Looking for final-year project partners. Design + code?",
      "explorePost": "Which campus has a festival this week? Let’s plan a trip.",
      "tabs": "Explore feed previews",
      "context": "Sample feed"
    },
    "stats": {
      "students": "students",
      "universities": "universities",
      "posts": "daily posts"
    },
    "trust": "Real students. Ideas shared freely.",
    "trustText": "Meet verified students, or speak your mind in anonymous mode."
  },
  "communities": {
    "number": "02",
    "kicker": "Better together",
    "title": "Find your people.",
    "description": "Meet people who share your passion. Join a club, set the stage, or build an idea together.",
    "join": "Join",
    "members": "members",
    "all": "8 communities · sample selection",
    "joinDemo": "Sign up to join this community. No membership is created in this preview.",
    "tags": {
      "tech": "Technology",
      "art": "Arts & culture",
      "business": "Entrepreneurship",
      "life": "Campus life"
    },
    "items": {
      "code": "Coding Club",
      "robotics": "Robotics Society",
      "photo": "Photography Club",
      "theatre": "Theatre Society",
      "startup": "Entrepreneurship Club",
      "music": "Music Society",
      "sport": "Sports Society",
      "volunteer": "Volunteering Club"
    },
    "sticker": "Better\ntogether!"
  },
  "academic": {
    "kicker": "Academic network",
    "title": "One idea.\nThe right team.",
    "description": "Share your notes, find your research group, and take the first step towards your next project.",
    "research": "Research groups",
    "researchText": "Work with people who share your curiosity.",
    "notes": "Lecture notes",
    "notesText": "Knowledge grows when you share it.",
    "projects": "Project partners",
    "projectsText": "Your missing piece might be one campus away.",
    "events": "Events & seminars",
    "eventsText": "Find your next spark of inspiration.",
    "cta": "Explore the academic network"
  },
  "cta": {
    "kicker": "New semester. New connections.",
    "title": "Your campus\nis waiting.",
    "text": "Your conversations, ideas, and people. There’s a place for all of them.",
    "button": "Join KampüsX",
    "note": "Students only. Always curious.",
    "sticker": "See you there!"
  },
  "footer": {
    "tagline": "The unofficial voice of campus.",
    "privacy": "Privacy",
    "terms": "Terms of use",
    "cookies": "Cookies",
    "copyright": "© {{year}} KampüsX Inc.",
    "made": "Made with campus spirit.",
    "demo": "Frontend design preview"
  },
  "legal": {
    "title": "Legal documents are being prepared.",
    "text": "The terms of use and privacy policy have not been published yet. Your email and password are sent to the authentication service when you sign in or sign up. Consider this before submitting the form.",
    "cookies": "Theme and language preferences are saved in this browser. Your sign-in preference determines whether session credentials last for the browser session or remain on this device. Detailed cookie and privacy documents have not been published yet."
  },
  "dashboard": {
    "title": "Home — KampüsX",
    "openProfile": "Open profile menu",
    "closeProfile": "Close profile menu",
    "profileMenu": "Profile menu",
    "discoverLabel": "Discovery feeds",
    "navigationLabel": "Main navigation",
    "visualOnly": "These items are not available yet.",
    "mock": {
      "school": "Kırşehir Ahi Evran University",
      "campus": "Vocational School of Technical Sciences",
      "department": "Computer Technologies"
    },
    "menu": {
      "settings": "Settings",
      "account": "Account",
      "community": "Community"
    },
    "tabs": {
      "university": "University",
      "campus": "Campus",
      "department": "Department"
    },
    "nav": {
      "home": "Home",
      "messages": "Messages",
      "search": "Search"
    },
    "feeds": {
      "university": {
        "title": "Around your university",
        "description": "No posts yet. Conversations, events and updates from your university will come together here."
      },
      "campus": {
        "title": "Life on your campus",
        "description": "No posts yet. Everyday moments, announcements and meetups from your campus will appear here."
      },
      "department": {
        "title": "Inside your department",
        "description": "No posts yet. Discover classes, projects and ideas shared within your department."
      }
    },
    "logout": "Sign out",
    "profile": {
      "unnamed": "Student",
      "schoolMissing": "University not added",
      "departmentMissing": "Department not added"
    }
  }
}
```

### `apps/shell/src/assets/i18n/tr.json`

```json
{
  "common": {
    "skip": "İçeriğe geç",
    "lightTheme": "Açık temaya geç",
    "darkTheme": "Koyu temaya geç",
    "language": {
      "label": "Dil seçimi",
      "tr": "Türkçe",
      "en": "English"
    },
    "languageCode": {
      "tr": "TR",
      "en": "EN"
    },
    "menu": "Menüyü aç",
    "closeMenu": "Menüyü kapat",
    "close": "Kapat",
    "back": "Girişe dön",
    "demo": "Tasarım önizlemesi",
    "sample": "Örnek veriler",
    "plus": "+",
    "brand": "KampüsX",
    "title": "KampüsX — Kampüsün burada konuşuyor",
    "notFound": "Bu sayfa kampüste bulunamadı.",
    "home": "Ana sayfaya dön"
  },
  "nav": {
    "explore": "Keşfet",
    "communities": "Topluluklar",
    "academic": "Akademik Ağ",
    "about": "Hakkında",
    "login": "Giriş yap",
    "join": "Kampüse katıl"
  },
  "hero": {
    "edition": "Kampüsün resmi olmayan sesi.",
    "live": "Kampüs nabzı canlı",
    "active": "öğrenci aktif",
    "universities": "üniversite ağda",
    "titleTop": "Şu anda",
    "titleMiddle": "kampüsünde",
    "titleBottom": "ne konuşuluyor?",
    "welcome": "KampüsX’e hoş geldin.",
    "description": "Ders arası muhabbetten hayatının projesine. Kampüsünde olan biten, tanışacağın insanlar ve ait olduğun topluluklar burada.",
    "sticker": "Ders arası\nburadayız!",
    "roundSticker": "Sadece\nöğrenciler.",
    "posterLabel": "Kampüsten bir kesit",
    "sample": "Örnek gönderiler",
    "scroll": "Kampüsü keşfet",
    "verified": {
      "title": "Gerçek öğrenciler",
      "text": ".edu.tr ile doğrulanır"
    },
    "trending": {
      "title": "Gündem burada",
      "text": "Kampüsünle aynı frekans"
    },
    "anonymous": {
      "title": "İstersen anonim",
      "text": "Söz senin, seçim senin"
    },
    "trends": {
      "label": "Kampüste gündem",
      "one": "#İTÜ_VizeTakvimi",
      "two": "#ODTÜ_BaharŞenliği",
      "three": "#Tabldot_Menüsü",
      "four": "#KampüsteBirGün",
      "five": "#ProjeArkadaşı",
      "pause": "Trend şeridini duraklat",
      "resume": "Trend şeridini başlat"
    }
  },
  "auth": {
    "serverError": "İşlem tamamlanamadı. Lütfen tekrar dene.",
    "kicker": "Senin yerin burada.",
    "title": "Kampüsüne bağlan.",
    "description": "Bir hesap, bütün kampüs.",
    "loginTab": "Giriş yap",
    "registerTab": "Kayıt ol",
    "tabs": "Hesap işlemleri",
    "password": "Şifre",
    "passwordPlaceholder": "Şifreni gir",
    "showPassword": "Şifreyi göster",
    "hidePassword": "Şifreyi gizle",
    "passwordHint": "En az 8 karakter. Daha uzun bir şifre daha güvenlidir.",
    "demoHint": "Hesabınla giriş yapabilir veya üniversite e-postanla kayıt olabilirsin.",
    "secure": "Öğrenci e-postasıyla doğrulanmış bir ağ",
    "google": "Google öğrenci hesabıyla başla",
    "googleDemo": "Google ile giriş henüz etkin değil. E-posta ile kayıt olabilirsin.",
    "divider": "veya e-postanla",
    "termsPrefix": "Kullanım şartlarını ve gizlilik politikasını okudum, kabul ediyorum.",
    "termsLink": "Kullanım şartları",
    "privacyLink": "Gizlilik politikası",
    "strength": {
      "0": "Şifre gücü",
      "1": "Başlangıç",
      "2": "Orta",
      "3": "İyi",
      "4": "Güçlü"
    },
    "login": {
      "identity": "Üniversite e-postası",
      "placeholder": "ogrenci@itu.edu.tr",
      "remember": "Bu cihazda oturumumu açık tut",
      "forgot": "Şifremi unuttum",
      "submit": "Giriş yap",
      "new": "KampüsX’te yeni misin?",
      "join": "Aramıza katıl",
      "success": "Giriş yaptın. Oturumun açık."
    },
    "register": {
      "title": "Yeni bir kampüs hikâyesi.",
      "description": "Öğrenci e-postanla aramıza katıl.",
      "email": "Üniversite e-postası",
      "emailPlaceholder": "ogrenci@itu.edu.tr",
      "emailHint": "Yalnızca .edu.tr uzantılı adresler.",
      "username": "Kullanıcı adı",
      "usernamePlaceholder": "@kampuslu",
      "usernameHint": "3–20 harf, rakam veya alt çizgi.",
      "submit": "KampüsX’e katıl",
      "success": "Devam etmek için e-postanı kontrol et. Bu adresle kayıt işlemi uygunsa doğrulama bağlantısı gönderilir."
    },
    "reset": {
      "title": "Yeniden bağlanalım.",
      "description": "Şifre yenileme bağlantısını almak için üniversite e-postanı yaz.",
      "email": "Üniversite e-postası",
      "placeholder": "ogrenci@itu.edu.tr",
      "submit": "Sıfırlama bağlantısı gönder",
      "successTitle": "E-postanı kontrol et",
      "success": "Bu adresle kayıtlı bir hesap varsa şifre yenileme bağlantısı gönderilir. Gelen kutunu ve spam klasörünü kontrol et.",
      "retry": "Başka bir e-posta dene"
    },
    "update": {
      "title": "Yeni şifreni belirle.",
      "description": "Yeni şifreni iki alana da yaz. Kaydettikten sonra tekrar giriş yapacaksın.",
      "checking": "Şifre yenileme bağlantısı kontrol ediliyor…",
      "password": "Yeni şifre",
      "confirmPassword": "Yeni şifreyi tekrar yaz",
      "submit": "Şifreyi güncelle",
      "successTitle": "Şifren güncellendi",
      "success": "Bu oturum kapatıldı. Yeni şifrenle tekrar giriş yapabilirsin.",
      "requestLink": "Yeni sıfırlama bağlantısı iste",
      "retrySignOut": "Oturumu kapatmayı tekrar dene"
    },
    "errors": {
      "config": "Giriş hizmeti henüz yapılandırılmamış. Lütfen daha sonra tekrar dene.",
      "credentials": "E-posta veya şifre yanlış. Bilgilerini kontrol et.",
      "userNotFound": "Böyle bir kullanıcı yok.",
      "accountLookup": "Hesap kontrolü tamamlanamadı. Lütfen tekrar dene.",
      "unconfirmed": "Giriş yapmadan önce e-posta adresini doğrula. Gelen kutunu ve spam klasörünü kontrol et.",
      "network": "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.",
      "rateLimit": "İstek sınırına ulaşıldı. Biraz bekleyip tekrar dene.",
      "emailRateLimit": "E-posta gönderim sınırına ulaşıldı. Gönderim kotası yenilendiğinde tekrar dene.",
      "generic": "İşlem tamamlanamadı. Lütfen tekrar dene.",
      "recoveryInvalid": "Bu şifre yenileme bağlantısı eksik, geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.",
      "weakPassword": "Bu şifre kabul edilmedi. En az 8 karakter içeren daha güçlü bir şifre seç.",
      "signupFailed": "Kayıt işlemi tamamlanamadı. Bilgilerini kontrol edip tekrar dene.",
      "signOut": "Şifren güncellendi. Çıkış işlemi sırasında bir sorun oldu. Devam etmek için yeniden dene."
    }
  },
  "validation": {
    "required": "Bu alanı doldur.",
    "email": "Geçerli bir e-posta adresi yaz.",
    "universityEmail": ".edu.tr uzantılı üniversite e-postanı kullan.",
    "username": "3–20 harf, rakam veya alt çizgi kullan.",
    "passwordLength": "Şifren en az 8 karakter olmalı.",
    "passwordMismatch": "Yazdığın şifreler aynı olmalı."
  },
  "posts": {
    "photo": {
      "name": "Deniz Aydın",
      "text": "Son dersten sonra tek bir planımız var. 🌿",
      "caption": "Kampüs, gün batımı ve biz.",
      "alt": "Ağaçlar ve kampüs binasıyla özgün gün batımı illüstrasyonu"
    },
    "anonymous": {
      "name": "Kampüsten biri",
      "text": "Kütüphanede aynı masaya oturuyoruz. Bugün kahve teklif edeceğim. Galiba. 👀"
    },
    "poll": {
      "name": "Ece Yılmaz",
      "text": "Vize haftasında seni hangisi ayakta tutuyor?",
      "one": "Kahve, tabii ki ☕",
      "two": "Arkadaş grubum 🫶",
      "votes": "oy · örnek anket",
      "firstPercent": "%68",
      "secondPercent": "%32"
    },
    "video": {
      "name": "Mert Kaya",
      "text": "Prova bitti. Şimdi sıra bahar şenliğinde. 🎸",
      "caption": "Bahar şenliği provası",
      "duration": "0:24",
      "preview": "Video önizlemesi · örnek içerik"
    },
    "time": "az önce",
    "verified": "Doğrulanmış öğrenci",
    "like": "Gönderiyi beğen",
    "unlike": "Beğeniyi kaldır",
    "comments": "yorum",
    "share": "yeniden paylaşım",
    "anonymousTag": "Anonim",
    "sample": "Örnek gönderi"
  },
  "universities": {
    "itu": "İstanbul Teknik Üniversitesi",
    "metu": "Orta Doğu Teknik Üniversitesi",
    "bogazici": "Boğaziçi Üniversitesi",
    "ankara": "Ankara Üniversitesi",
    "koc": "Koç Üniversitesi",
    "hacettepe": "Hacettepe Üniversitesi",
    "ege": "Ege Üniversitesi",
    "istanbul": "İstanbul Üniversitesi"
  },
  "about": {
    "number": "01",
    "kicker": "Kampüs hayatının tamamı",
    "title": "Aynı kampüs.\nBinlerce hikâye.",
    "description": "Bir duyurudan fazlası. Bir akıştan daha yakını. KampüsX, üniversite hayatını onu yaşayanlarla bir araya getirir.",
    "quote": "En iyi fikirler bazen ders arasında doğar.",
    "photo": "Bir kare paylaş.",
    "photoText": "Kampüsün, senin gözünden.",
    "video": "Anı hareketlendir.",
    "videoText": "Provalar, maçlar, küçük keşifler.",
    "text": "Bir şey söyle.",
    "textText": "Fikrini, sorunu, o küçük itirafı.",
    "interactions": "Beğen, yorum yap, yeniden paylaş, alıntıla veya mesajlaş.",
    "feeds": {
      "title": "Senin gündemin. Senin akışın.",
      "university": "Üniversitem",
      "department": "Bölümüm",
      "explore": "Genel Keşfet",
      "universityText": "Aynı koridorlardan geçen insanların gündemi.",
      "departmentText": "Aynı dersi alanlar, aynı soruya kafa yoranlar.",
      "exploreText": "Kampüsün sınırlarını aşan fikirler ve insanlar.",
      "universityPost": "Taşkışla’da açık hava sineması. Bu akşam buluşuyoruz!",
      "departmentPost": "Bitirme projesi için ekip arkadaşı arıyoruz. Tasarım + kod?",
      "explorePost": "Bu hafta hangi kampüste festival var? Rotamızı çizelim.",
      "tabs": "Keşfet akışı önizlemeleri",
      "context": "Örnek akış"
    },
    "stats": {
      "students": "öğrenci",
      "universities": "üniversite",
      "posts": "günlük paylaşım"
    },
    "trust": "Gerçek öğrenciler. Özgürce paylaşılan fikirler.",
    "trustText": "Doğrulanmış üyelikle tanış, istersen anonim modda konuş."
  },
  "communities": {
    "number": "02",
    "kicker": "Birlikte daha çok",
    "title": "Kendi insanlarını bul.",
    "description": "Aynı tutkuyu paylaşanlarla tanış. Bir kulübe katıl, bir sahne kur, bir fikri birlikte büyüt.",
    "join": "Katıl",
    "members": "üye",
    "all": "8 topluluk · örnek seçki",
    "joinDemo": "Bu topluluğa katılmak için kayıt ol. Bu önizlemede üyelik oluşturulmaz.",
    "tags": {
      "tech": "Teknoloji",
      "art": "Kültür & sanat",
      "business": "Girişimcilik",
      "life": "Kampüs hayatı"
    },
    "items": {
      "code": "Yazılım Kulübü",
      "robotics": "Robotik Topluluğu",
      "photo": "Fotoğraf Kulübü",
      "theatre": "Tiyatro Topluluğu",
      "startup": "Girişimcilik Kulübü",
      "music": "Müzik Topluluğu",
      "sport": "Spor Topluluğu",
      "volunteer": "Gönüllülük Kulübü"
    },
    "sticker": "Birlikte\ndaha iyi!"
  },
  "academic": {
    "kicker": "Akademik ağ",
    "title": "Bir fikir.\nDoğru ekip.",
    "description": "Notlarını paylaş, araştırma grubunu bul, bir sonraki projenin ilk adımını at.",
    "research": "Araştırma grupları",
    "researchText": "Merakını paylaşanlarla çalış.",
    "notes": "Ders notu paylaşımı",
    "notesText": "Bilgi paylaştıkça çoğalır.",
    "projects": "Proje arkadaşı",
    "projectsText": "Eksik parçan belki bir kampüs ötede.",
    "events": "Etkinlik & seminer",
    "eventsText": "Bir sonraki ilhamını kaçırma.",
    "cta": "Akademik ağı keşfet"
  },
  "cta": {
    "kicker": "Yeni dönem, yeni bağlantılar.",
    "title": "Kampüsün\nseni bekliyor.",
    "text": "Muhabbetin, fikrin, topluluğun. Hepsi için bir yer var.",
    "button": "KampüsX’e katıl",
    "note": "Öğrencilere özel. Her zaman meraklı.",
    "sticker": "Görüşürüz!"
  },
  "footer": {
    "tagline": "Amfinin resmi olmayan sesi.",
    "privacy": "Gizlilik",
    "terms": "Kullanım şartları",
    "cookies": "Çerezler",
    "copyright": "© {{year}} KampüsX Inc.",
    "made": "Kampüs ruhuyla tasarlandı.",
    "demo": "Frontend tasarım önizlemesi"
  },
  "legal": {
    "title": "Yasal metinler hazırlanıyor.",
    "text": "Kullanım şartları ve gizlilik politikası henüz yayımlanmadı. E-posta ve şifren giriş veya kayıt işlemi için kimlik doğrulama hizmetine gönderilir. Formu göndermeden önce bu durumu dikkate al.",
    "cookies": "Tema ve dil tercihleri bu tarayıcıda tutulur. Oturum tercihin, giriş bilgilerinin oturum boyunca veya bu cihazda kalıcı saklanmasını belirler. Ayrıntılı çerez ve gizlilik metinleri henüz yayımlanmadı."
  },
  "dashboard": {
    "title": "Ana sayfa — KampüsX",
    "openProfile": "Profil menüsünü aç",
    "closeProfile": "Profil menüsünü kapat",
    "profileMenu": "Profil menüsü",
    "discoverLabel": "Keşfet akışları",
    "navigationLabel": "Ana gezinme",
    "visualOnly": "Bu öğeler henüz etkin değil.",
    "mock": {
      "school": "Kırşehir Ahi Evran Üniversitesi",
      "campus": "Teknik Bilimler MYO",
      "department": "Bilgisayar Teknolojileri"
    },
    "menu": {
      "settings": "Ayarlar",
      "account": "Hesap",
      "community": "Topluluk"
    },
    "tabs": {
      "university": "Üniversite",
      "campus": "Kampüs",
      "department": "Bölüm"
    },
    "nav": {
      "home": "Ana sayfa",
      "messages": "Mesajlar",
      "search": "Ara"
    },
    "feeds": {
      "university": {
        "title": "Üniversitende neler oluyor?",
        "description": "Henüz paylaşım yok. Üniversitendeki konuşmalar, etkinlikler ve paylaşımlar burada bir araya gelecek."
      },
      "campus": {
        "title": "Kampüsünün gündemi",
        "description": "Henüz paylaşım yok. Kampüsündeki günlük hayat, duyurular ve buluşmalar burada yer alacak."
      },
      "department": {
        "title": "Bölümündeki konuşmalar",
        "description": "Henüz paylaşım yok. Bölümündeki dersler, projeler ve fikirler için burası senin keşfet alanın."
      }
    },
    "logout": "Çıkış yap",
    "profile": {
      "unnamed": "Öğrenci",
      "schoolMissing": "Okul bilgisi eklenmemiş",
      "departmentMissing": "Bölüm bilgisi eklenmemiş"
    }
  }
}
```

### `docs/auth-security-review.md`

````markdown
# KampüsX auth güvenlik ve entegrasyon incelemesi

İnceleme tarihi: **10 Ekim 2026**.

**12 Ekim giriş mesajı kararı:** Kullanıcının açık isteğiyle, başarısız girişten sonra `kampusx_login_email_exists` RPC'si hesap varlığını kontrol eder. Kesin `false` sonucunda kullanıcı yok, `true` sonucunda yanlış bilgiler mesajı gösterilir; sorgu hatası ayrı değerlendirilir. Bu tercih hesap varlığını anonim çağırana açıklayabilir. SQL yalnızca boolean döndürür ve tablo okuma izni vermez; Supabase'de uygulanması gereken dosya ve veri sınırları `docs/login-email-lookup.md` içindedir.

**E-posta kota mesajı:** `over_email_send_rate_limit` artık genel HTTP 429/istek sınırından önce değerlendirilir ve ayrı TR/EN mesajı gösterir. Uygulamada ek bir bekleme süresi tanımlanmadı; kalan süre Supabase hata yanıtında verilmediği için bir süre uydurulmaz. Üretim Supabase kota ayarları değiştirilmedi.

**12 Ekim güncellemesi:** Dashboard artık mevcut Supabase Auth'a bağlıdır. Başarılı giriş dashboard'a yönlenir; auth guard bu route'ta kullanılır. Oturumu açık kullanıcı login/register sayfalarından dashboard'a geçer; profil kullanıcı adını oturumdan okur ve gerçek çıkış kontrolü vardır. Düz login URL'sinin callback sanılması hatası, gerçek callback parametreleri kontrol edilerek düzeltildi. Aşağıdaki ilk inceleme bulguları ve test sayıları kendi tarihine aittir; güncel dashboard kodları ve sonuçları `docs/dashboard/DASHBOARD-TESLIM.md` içindedir.

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
````

### `docs/login-email-lookup-sql-verification.json`

```json
{
  "engine": "PGlite PostgreSQL (isolated in-memory fixtures)",
  "passed": 10,
  "failed": 0,
  "checks": [
    {
      "name": "migration applies and can be reapplied",
      "passed": true
    },
    {
      "name": "known active email returns true",
      "passed": true
    },
    {
      "name": "email comparison trims and ignores case",
      "passed": true
    },
    {
      "name": "missing email returns false",
      "passed": true
    },
    {
      "name": "soft-deleted account returns false",
      "passed": true
    },
    {
      "name": "invalid or oversized input is not classified as missing",
      "passed": true
    },
    {
      "name": "public-schema decoy cannot alter the auth lookup",
      "passed": true
    },
    {
      "name": "the unrelated role has no function access",
      "passed": true
    },
    {
      "name": "anon can receive only the existence boolean",
      "passed": true
    },
    {
      "name": "authenticated can receive only the existence boolean",
      "passed": true
    }
  ]
}
```

### `docs/login-email-lookup.md`

````markdown
# Girişte kullanıcı yok / yanlış bilgiler ayrımı

12 Ekim 2026. Kullanıcının açık isteğiyle giriş ekranı kayıtlı olmayan e-posta ile yanlış bilgileri ayırır.

## Davranış

- Supabase giriş başarılıysa mevcut gerçek oturum/dashboard akışı devam eder; ek sorgu yapılmaz.
- Yalnızca `invalid_credentials` hatasında `public.kampusx_login_email_exists` çağrılır.
- Veritabanı `false` döndürürse **Böyle bir kullanıcı yok.** gösterilir.
- Veritabanı `true` döndürürse **E-posta veya şifre yanlış. Bilgilerini kontrol et.** gösterilir.
- Fonksiyon eksikse, istek başarısızsa veya yanıt boolean değilse **Hesap kontrolü tamamlanamadı. Lütfen tekrar dene.** gösterilir. Bağlantı hatası, kullanıcı yok olarak değerlendirilmez.
- E-posta doğrulama ve hız sınırı hataları kendi mesajlarını korur. Sorgu 5 saniyede zaman aşımına uğrar; uygulamaya yeni deneme bekleme süresi eklenmez.
- Mesajların Türkçe ve İngilizce karşılıkları sözlüklere eklenmiştir; form görünümü ve temalar korunur.

## Supabase'de uygulanması gereken SQL

Projede şu dosya hazırlanmıştır:

`supabase/migrations/20261012174500_login_email_lookup.sql`

KampüsX Supabase projesinde **SQL Editor → New query** açıp dosyanın tamamını yapıştırarak **Run** ile çalıştır. Dosya yeni bir fonksiyon ekler; tablo veya kullanıcı silmez. Ardından local giriş ekranında ayrım gerçek veritabanı sonucuna göre çalışır. Vercel için uygulama kodunun da yeni sürümü dağıtılmalıdır.

SQL'in uzak projeye uygulanmış olduğu otomatik olarak varsayılmaz. Normal uygulama gerçek Supabase bağlantısını kullanır; otomatik tarayıcı testleri izole E2E bağlantısında mock yanıtlarla çalışır.

## Yetki ve veri sınırı

Fonksiyon yalnızca tek bir e-postanın aktif hesapla eşleşip eşleşmediğini boolean olarak döndürür. User ID, profil, hash, şifre veya rol döndürmez; `auth.users` için tablo okuma izni verilmez. Sabit ve boş `search_path` ile `auth.users` tam şema adıyla kullanılır. Fonksiyon yürütme izni yalnızca `anon` ve `authenticated` rollerine verilir; diğer fonksiyonların izinleri değiştirilmez. Silinmiş hesaplar eşleşmez.

Bu ürün tercihi, dışarıdan verilen bir e-postanın kayıtlı olup olmadığının anlaşılmasına izin verir. Anonim RPC doğrudan da çağrılabilir; normal girişin hız sınırı bu RPC için bağımsız bir kötüye kullanım sınırı oluşturmaz. Daha önceki genel hata mesajının gizlilik özelliği bu ayrımda korunmaz. Bu değişiklik, kullanıcının özellikle istediği davranışı uygular.

Tarayıcıya yeni gizli anahtar eklenmez. Parola yalnızca mevcut Supabase Auth giriş isteğine gönderilir; hesap varlığı sorgusuna gönderilmez.

## Yerel SQL doğrulaması

İzole PostgreSQL motoru için `npm install --prefix .nx/login-sql-verification --no-save --package-lock=false @electric-sql/pglite` ardından `node scripts/verify-login-email-lookup.cjs` çalıştırılır. Paket yalnızca Git'in yok saydığı test dizinine kurulur; proje bağımlılıkları değişmez. Sonuç `docs/login-email-lookup-sql-verification.json` dosyasına yazılır.
````

### `libs/shared/ui/atoms/avatar/avatar.component.css`

```css
:host {
  display: inline-flex;
  flex-shrink: 0;
}
.avatar {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-soft-primary);
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: 17px;
  line-height: 1;
}
.avatar-large {
  width: 72px;
  height: 72px;
  font-size: 30px;
}
```

### `libs/shared/ui/atoms/avatar/avatar.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kx-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar" [class.avatar-large]="size() === 'large'" aria-hidden="true">{{
    initials()
  }}</span>`,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<'small' | 'large'>('small');
}
```

### `libs/shared/ui/index.ts`

```typescript
export * from './atoms/icon/icon.component';
export * from './atoms/logo/logo.component';
export * from './atoms/button/button.component';
export * from './atoms/input/input.directive';
export * from './atoms/badge/badge.component';
export * from './atoms/sticker/sticker.component';
export * from './atoms/toggle/toggle.component';
export * from './molecules/form-field/form-field.component';
export * from './molecules/password-field/password-field.component';
export * from './molecules/feature-card/feature-card.component';
export * from './molecules/stat-card/stat-card.component';
export * from './molecules/theme-toggle/theme-toggle.component';
export * from './molecules/language-switcher/language-switcher.component';
export * from './organisms/post-card-preview/post-card-preview.component';
export * from './organisms/community-card/community-card.component';
export * from './organisms/marquee-strip/marquee-strip.component';
export * from './organisms/legal-dialog/legal-dialog.component';
export * from './atoms/avatar/avatar.component';
export * from './molecules/tab-strip/tab-strip.component';
export * from './molecules/feed-skeleton/feed-skeleton.component';
export * from './organisms/modal-drawer/modal-drawer.component';
```

### `libs/shared/ui/molecules/feed-skeleton/feed-skeleton.component.css`

```css
:host {
  display: block;
}
.skeleton-card {
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
}
.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.skeleton-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-surface-alt);
}
.skeleton-identity {
  display: grid;
  gap: 8px;
  width: 60%;
}
.skeleton-line {
  display: block;
  height: 9px;
  background: var(--color-surface-alt);
  border-radius: var(--radius-control);
}
.identity {
  width: 45%;
  height: 11px;
}
.meta {
  width: 65%;
  height: 7px;
}
.skeleton-copy {
  display: grid;
  gap: 10px;
  margin-block: 20px;
}
.short {
  width: 72%;
}
.skeleton-media {
  height: 108px;
  border-radius: var(--radius-control);
  background: var(--color-surface-alt);
}
.skeleton-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
.skeleton-actions span {
  width: 26px;
  height: 7px;
  border-radius: var(--radius-control);
  background: var(--color-surface-alt);
}
@media (max-width: 640px) {
  .skeleton-card {
    padding: 16px;
  }
}
```

### `libs/shared/ui/molecules/feed-skeleton/feed-skeleton.component.ts`

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'kx-feed-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<div class="skeleton-card">
    <div class="skeleton-header">
      <span class="skeleton-avatar"></span>
      <div class="skeleton-identity">
        <span class="skeleton-line identity"></span><span class="skeleton-line meta"></span>
      </div>
    </div>
    <div class="skeleton-copy">
      <span class="skeleton-line"></span><span class="skeleton-line short"></span>
    </div>
    <div class="skeleton-media"></div>
    <div class="skeleton-actions">
      @for (item of [0, 1, 2, 3]; track item) {
        <span></span>
      }
    </div>
  </div>`,
  styleUrl: './feed-skeleton.component.css',
})
export class FeedSkeletonComponent {}
```

### `libs/shared/ui/molecules/tab-strip/tab-strip.component.css`

```css
:host {
  display: block;
}
.tab-strip {
  position: relative;
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.tab {
  flex: 1 1 0;
  min-width: 0;
  min-height: 60px;
  padding: 16px 8px;
  border: 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.tab:hover {
  background: var(--color-surface-alt);
}
.tab:active {
  background: var(--color-soft-primary);
}
.tab[aria-selected='true'] {
  color: var(--color-primary);
}
.tab:focus-visible {
  outline-offset: -5px;
}
.indicator {
  position: absolute;
  pointer-events: none;
  left: 0;
  bottom: -1px;
  height: 3px;
  background: var(--color-primary);
  transition: transform var(--motion-fast) ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .indicator {
    transition: none;
  }
}
```

### `libs/shared/ui/molecules/tab-strip/tab-strip.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

export interface TabStripItem {
  id: string;
  labelKey: string;
}

@Component({
  selector: 'kx-tab-strip',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tab-strip" *transloco="let t" role="tablist" [attr.aria-label]="t(labelKey())">
    @for (item of items(); track item.id; let index = $index) {
      <button
        #tab
        type="button"
        role="tab"
        class="tab"
        [id]="baseId() + '-tab-' + item.id"
        [attr.aria-controls]="baseId() + '-panel-' + item.id"
        [attr.aria-selected]="active() === index"
        [tabIndex]="active() === index ? 0 : -1"
        (click)="selected.emit(index)"
        (keydown)="onKeydown($event, index)"
      >
        {{ t(item.labelKey) }}
      </button>
    }
    <span
      class="indicator"
      aria-hidden="true"
      [style.width.%]="100 / items().length"
      [style.transform]="'translateX(' + active() * 100 + '%)'"
    ></span>
  </div>`,
  styleUrl: './tab-strip.component.css',
})
export class TabStripComponent {
  readonly items = input.required<readonly TabStripItem[]>();
  readonly active = input(0);
  readonly baseId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly selected = output<number>();
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');

  onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.items().length;
    if (!count || event.altKey || event.ctrlKey || event.metaKey) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selected.emit(next);
    this.tabs()[next]?.nativeElement.focus({ preventScroll: true });
  }
}
```

### `libs/shared/ui/organisms/modal-drawer/modal-drawer.component.css`

```css
:host {
  display: contents;
}
.modal-drawer {
  position: fixed;
  inset: 0 auto 0 0;
  margin: 0;
  padding: 0;
  width: min(360px, calc(100vw - 32px));
  height: 100dvh;
  max-width: none;
  max-height: none;
  border: 0;
  border-right: 1px solid var(--color-border);
  border-radius: 0 var(--radius-panel) var(--radius-panel) 0;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-panel);
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y pinch-zoom;
  transform: translateX(-100%);
  opacity: 0;
  transition:
    transform calc(var(--motion-fast) * 1.5) ease-out,
    opacity calc(var(--motion-fast) * 1.5) ease-out;
}
.modal-drawer[open] {
  transform: translateX(0);
  opacity: 1;
}
.modal-drawer[open].closing {
  transform: translateX(-100%);
  opacity: 0;
}
.modal-drawer::backdrop {
  background: color-mix(in srgb, var(--color-ink) 48%, transparent);
  opacity: 1;
  transition: opacity calc(var(--motion-fast) * 1.5) ease-out;
}
.modal-drawer.closing::backdrop {
  opacity: 0;
}
.drawer-body {
  min-height: 100%;
}
@starting-style {
  .modal-drawer[open] {
    transform: translateX(-100%);
    opacity: 0;
  }
  .modal-drawer[open]::backdrop {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .modal-drawer,
  .modal-drawer::backdrop {
    transition: none;
  }
}
```

### `libs/shared/ui/organisms/modal-drawer/modal-drawer.component.ts`

```typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';

@Component({
  selector: 'kx-modal-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog
    #dialog
    class="modal-drawer"
    [class.closing]="closing()"
    [id]="drawerId()"
    [attr.aria-labelledby]="labelledBy()"
    [attr.aria-describedby]="describedBy()"
    (cancel)="onCancel($event)"
    (click)="onBackdrop($event)"
    (keydown)="onKeydown($event)"
    (transitionend)="onTransitionEnd($event)"
    (pointerdown)="onPointerDown($event)"
    (pointerup)="onPointerUp($event)"
    (pointercancel)="cancelSwipe()"
  >
    <div class="drawer-body"><ng-content /></div>
  </dialog>`,
  styleUrl: './modal-drawer.component.css',
})
export class ModalDrawerComponent {
  readonly drawerId = input.required<string>();
  readonly labelledBy = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly changed = output<boolean>();
  readonly closing = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private opener: HTMLElement | null = null;
  private savedOverflow: { html: string; body: string } | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private swipe: SwipePoint | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearTimer();
      this.restoreScroll();
      if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
      this.opener?.isConnected && this.opener.focus({ preventScroll: true });
    });
  }

  open(): void {
    const element = this.dialog().nativeElement;
    if (element.open && !this.closing()) return;
    this.clearTimer();
    this.closing.set(false);
    if (!element.open) {
      this.opener = this.document.activeElement as HTMLElement | null;
      this.savedOverflow = {
        html: this.document.documentElement.style.overflow,
        body: this.document.body.style.overflow,
      };
      element.showModal();
      this.document.documentElement.style.overflow = 'hidden';
      this.document.body.style.overflow = 'hidden';
      element.querySelector<HTMLElement>('[data-drawer-close]')?.focus({ preventScroll: true });
    }
    this.changed.emit(true);
  }

  close(): void {
    if (!this.dialog().nativeElement.open || this.closing()) return;
    this.swipe = null;
    if (this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.finishClose();
      return;
    }
    this.closing.set(true);
    // Fallback also handles a transition interrupted by viewport or theme changes.
    this.closeTimer = setTimeout(() => this.finishClose(), 300);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const bounds = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.close();
  }

  onTransitionEnd(event: TransitionEvent): void {
    if (event.target === this.dialog().nativeElement && event.propertyName === 'transform' && this.closing())
      this.finishClose();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = [
      ...this.dialog().nativeElement.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) {
      this.swipe = null;
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.swipe = swipePoint(event);
    this.dialog().nativeElement.setPointerCapture(event.pointerId);
  }
  onPointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction === 1) this.close();
  }
  cancelSwipe(): void {
    this.swipe = null;
  }

  private finishClose(): void {
    this.clearTimer();
    this.dialog().nativeElement.close();
    this.closing.set(false);
    this.restoreScroll();
    this.changed.emit(false);
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    this.opener = null;
  }
  private clearTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
  private restoreScroll(): void {
    if (!this.savedOverflow) return;
    this.document.documentElement.style.overflow = this.savedOverflow.html;
    this.document.body.style.overflow = this.savedOverflow.body;
    this.savedOverflow = null;
  }
}
```

### `libs/shared/util/horizontal-swipe.ts`

```typescript
export interface SwipePoint {
  x: number;
  y: number;
  time: number;
  pointerId: number;
}

/** A deliberate horizontal touch gesture; vertical scrolling and taps stay native. */
export function horizontalSwipe(start: SwipePoint | null, end: SwipePoint): -1 | 0 | 1 {
  if (!start || start.pointerId !== end.pointerId) return 0;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const elapsed = end.time - start.time;
  if (elapsed < 0 || elapsed > 900 || Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy) * 1.35) return 0;
  return dx < 0 ? 1 : -1;
}

export function swipePoint(event: PointerEvent): SwipePoint {
  return { x: event.clientX, y: event.clientY, time: event.timeStamp, pointerId: event.pointerId };
}
```

### `libs/shared/util/index.ts`

```typescript
export * from './validators';
export * from './form-helpers';
export * from './localized-number.pipe';
export * from './reveal.directive';
export * from './mock-data';
export * from './horizontal-swipe';
```

### `scripts/auth-services.test.cjs`

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { AuthError } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');
const anonymousResult = () => ({ data: { session: null, user: null }, error: null });
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'student@itu.edu.tr' };
const session = { access_token: 'test-access-token', refresh_token: 'test-refresh-token', user };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (update) => (value = update(value));
  read.asReadonly = () => () => value;
  return read;
}

// Exercise the real service/guard logic, replacing only Angular DI and the SDK boundary.
// No Supabase client is created and no network requests are made in these tests.
function harness(overrides = {}, configured = true, browser = null) {
  class SupabaseService {}
  class DestroyRef {}
  class Router {}
  const DOCUMENT = Symbol('DOCUMENT');
  const destroyCallbacks = [];
  const calls = { remember: [], signIn: [], signUp: [], signOut: [], updateUser: [], lookup: [] };
  let authCallback;
  let unsubscribeCount = 0;
  const auth = {
    initialize: async () => ({ error: null }),
    getSession: async () => anonymousResult(),
    getUser: async () => ({ data: { user }, error: null }),
    onAuthStateChange(callback) {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: () => unsubscribeCount++ } } };
    },
    signInWithPassword: async (credentials) => {
      calls.signIn.push(credentials);
      return { data: { session, user }, error: null };
    },
    signUp: async (credentials) => {
      calls.signUp.push(credentials);
      return { data: { session: null, user }, error: null };
    },
    signOut: async (options) => {
      calls.signOut.push(options);
      return { error: null };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async (attributes) => {
      calls.updateUser.push(attributes);
      return { data: { user }, error: null };
    },
    ...overrides,
  };
  const supabase = {
    client: configured
      ? {
          auth,
          rpc(name, params) {
            calls.lookup.push({ name, params });
            return {
              abortSignal(signal) {
                assert.ok(signal instanceof AbortSignal);
                return overrides.lookup ? overrides.lookup() : Promise.resolve({ data: true, error: null });
              },
            };
          },
        }
      : null,
    setRemember(value) {
      calls.remember.push(value);
    },
    redirectTo(route) {
      return new URL(route, 'http://localhost:4300').href;
    },
  };
  const router = { createUrlTree: (commands) => ({ redirect: commands }) };
  const destroyRef = { destroyed: false, onDestroy: (callback) => destroyCallbacks.push(callback) };
  const dependencies = new Map([
    [SupabaseService, supabase],
    [DestroyRef, destroyRef],
    [Router, router],
    [DOCUMENT, { location: browser?.location || { origin: 'http://localhost:4300' }, defaultView: browser }],
  ]);
  const angular = {
    Injectable: () => (target) => target,
    DestroyRef,
    inject(token) {
      assert.ok(dependencies.has(token), `Unmocked injection: ${token?.name || String(token)}`);
      return dependencies.get(token);
    },
    signal,
    computed: (calculate) => calculate,
  };
  const modules = new Map();
  function load(relativePath) {
    const filename = path.resolve(root, relativePath);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    const boundaryRequire = (specifier) => {
      if (specifier === '@angular/core') return angular;
      if (specifier === '@angular/common') return { DOCUMENT };
      if (specifier === '@angular/router') return { Router };
      if (specifier === './supabase.service') return { SupabaseService };
      if (specifier.startsWith('.'))
        return load(path.relative(root, path.resolve(path.dirname(filename), `${specifier}.ts`)));
      return require(specifier);
    };
    new Function('exports', 'require', 'window', js)(exports, boundaryRequire, {
      location: { origin: 'http://localhost:4300' },
    });
    return exports;
  }
  const { AuthService } = load('apps/shell/src/app/core/auth.service.ts');
  const service = new AuthService();
  dependencies.set(AuthService, service);
  return {
    service,
    auth,
    calls,
    emit: (event, nextSession) => authCallback(event, nextSession),
    destroy: () => {
      destroyRef.destroyed = true;
      destroyCallbacks.forEach((callback) => callback());
    },
    unsubscribeCount: () => unsubscribeCount,
    guard: (...args) => load('apps/shell/src/app/core/auth.guard.ts').authGuard(...args),
    signedInGuard: (...args) => load('apps/shell/src/app/core/auth.guard.ts').signedInGuard(...args),
    matchesCallback: (...args) =>
      load('apps/shell/src/app/core/supabase-callback.ts').isSupabaseImplicitCallback(...args),
  };
}

test('auth initialization restores a session and exposes readonly state', async () => {
  const { service } = harness({ getSession: async () => ({ data: { session }, error: null }) });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.session(), session);
  assert.equal(typeof service.session.set, 'undefined');
});

test('a newer auth event wins over a stale initialization snapshot', async () => {
  const snapshot = deferred();
  const started = deferred();
  const { service, emit } = harness({
    getSession: () => {
      started.resolve();
      return snapshot.promise;
    },
  });
  await started.promise;
  emit('SIGNED_IN', session);
  snapshot.resolve({ data: { session: null }, error: null });
  await service.ready;
  assert.equal(service.session(), session);
});

test('returned callback initialization errors remain visible', async () => {
  const error = new AuthError('Expired callback', 403, 'otp_expired');
  const { service } = harness({ initialize: async () => ({ error }) });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.initializationError()?.code, 'otp_expired');
  assert.equal(service.recovery(), false);
});

test('thrown initialization failures settle ready instead of leaking rejection', async () => {
  const { service } = harness({
    initialize: async () => {
      throw new TypeError('Failed to fetch');
    },
  });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.ok(service.initializationError());
  assert.equal(service.session(), null);
});

test('session lookup errors do not initialize an authenticated session', async () => {
  const error = new AuthError('Refresh failed', 401, 'refresh_token_not_found');
  const { service } = harness({ getSession: async () => ({ data: { session: null }, error }) });
  await service.ready;
  assert.equal(service.session(), null);
  assert.equal(service.initializationError()?.code, error.code);
});

test('unconfigured auth settles readiness and denies verified access', async () => {
  const { service } = harness({}, false);
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(await service.hasVerifiedSession(), false);
  const result = await service.signIn('student@itu.edu.tr', 'password');
  assert.ok(result.error);
});

test('app destruction unsubscribes the auth event handler', async () => {
  const context = harness();
  await context.service.ready;
  context.destroy();
  assert.equal(context.unsubscribeCount(), 1);
});

test('sign-in applies the requested persistence before the SDK request', async () => {
  const { service, calls } = harness();
  await service.ready;
  await service.signIn('student@itu.edu.tr', 'password', false);
  await service.signIn('student@itu.edu.tr', 'password', true);
  assert.deepEqual(calls.remember, [false, true]);
  assert.deepEqual(calls.signIn, [
    { email: 'student@itu.edu.tr', password: 'password' },
    { email: 'student@itu.edu.tr', password: 'password' },
  ]);
});

test('sign-out targets the current session', async () => {
  const { service, calls } = harness();
  await service.ready;
  await service.signOut();
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('only a confirmed missing account produces the user-not-found error after failed login', async () => {
  const { service, calls } = harness({
    signInWithPassword: async () => ({
      ...anonymousResult(),
      error: new AuthError('Invalid', 400, 'invalid_credentials'),
    }),
    lookup: async () => ({ data: false, error: null }),
  });
  const result = await service.signIn(' Student@itu.edu.tr ', 'PrivatePassword');
  assert.equal(service.errorKey(result.error), 'auth.errors.userNotFound');
  assert.deepEqual(calls.lookup, [
    { name: 'kampusx_login_email_exists', params: { email_address: 'Student@itu.edu.tr' } },
  ]);
  assert.equal(result.data.session, null);
});

test('an existing account preserves the original incorrect-credentials error', async () => {
  const error = new AuthError('Invalid', 400, 'invalid_credentials');
  const { service } = harness({
    signInWithPassword: async () => ({ ...anonymousResult(), error }),
    lookup: async () => ({ data: true, error: null }),
  });
  const result = await service.signIn('student@itu.edu.tr', 'WrongPassword');
  assert.equal(result.error, error);
  assert.equal(service.errorKey(result.error), 'auth.errors.credentials');
});

test('missing RPC, malformed data and database errors never claim the account is absent', async () => {
  for (const response of [
    { data: null, error: null },
    { data: 'false', error: null },
    { data: [], error: null },
    { data: false, error: { code: 'PGRST202' } },
    { data: true, error: { code: '42501' } },
  ]) {
    const { service } = harness({
      signInWithPassword: async () => ({
        ...anonymousResult(),
        error: new AuthError('Invalid', 400, 'invalid_credentials'),
      }),
      lookup: async () => response,
    });
    const result = await service.signIn('student@itu.edu.tr', 'WrongPassword');
    assert.equal(service.errorKey(result.error), 'auth.errors.accountLookup');
  }
});

test('a thrown or aborted lookup becomes a retryable account-check failure', async () => {
  for (const reason of [
    new TypeError('PRIVATE_NETWORK_FAILURE'),
    new DOMException('Timeout', 'TimeoutError'),
  ]) {
    const { service } = harness({
      signInWithPassword: async () => ({
        ...anonymousResult(),
        error: new AuthError('Invalid', 400, 'invalid_credentials'),
      }),
      lookup: async () => {
        throw reason;
      },
    });
    const result = await service.signIn('student@itu.edu.tr', 'WrongPassword');
    assert.equal(service.errorKey(result.error), 'auth.errors.accountLookup');
    assert.notEqual(result.error.message, reason.message);
  }
});

test('successful login, unconfirmed email, rate limits and network failures skip account lookup', async () => {
  for (const error of [
    null,
    new AuthError('Confirm', 400, 'email_not_confirmed'),
    new AuthError('Wait', 429, 'over_request_rate_limit'),
    new AuthError('Offline', 0, 'network_error'),
  ]) {
    const { service, calls } = harness({
      signInWithPassword: async () => ({
        data: { user: error ? null : user, session: error ? null : session },
        error,
      }),
    });
    const result = await service.signIn('student@itu.edu.tr', 'Password');
    assert.equal(result.error, error);
    assert.equal(calls.lookup.length, 0);
  }
});

test('normal sign-in cannot authorize the password recovery form', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('SIGNED_IN', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.ok(result.error);
  assert.equal(result.passwordUpdated, false);
  assert.deepEqual(calls.updateUser, []);
});

test('recovery events require an actual session before changing a password', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('PASSWORD_RECOVERY', null);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.ok(result.error);
  assert.deepEqual(calls.updateUser, []);
});

test('a recovery password update is followed by current-session sign-out', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('PASSWORD_RECOVERY', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.equal(result.passwordUpdated, true);
  assert.equal(result.error, null);
  assert.deepEqual(calls.updateUser, [{ password: 'NewStrongPassword123!' }]);
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('logout failure after a password update does not claim the password change failed', async () => {
  const error = new AuthError('Logout unavailable', 503, 'unexpected_failure');
  const { service, emit } = harness({ signOut: async () => ({ error }) });
  await service.ready;
  emit('PASSWORD_RECOVERY', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.equal(result.passwordUpdated, true);
  assert.equal(result.error?.code, 'password_updated_signout_failed');
  assert.equal(service.errorKey(result.error), 'auth.errors.signOut');
});

test('destroyed services ignore a pending initialization snapshot', async () => {
  const snapshot = deferred();
  const started = deferred();
  const context = harness({
    getSession: () => {
      started.resolve();
      return snapshot.promise;
    },
  });
  await started.promise;
  context.destroy();
  snapshot.resolve({ data: { session }, error: null });
  await context.service.ready;
  assert.equal(context.service.session(), null);
  assert.equal(context.unsubscribeCount(), 1);
});

test('registration normalizes display metadata without accepting roles', async () => {
  const { service, calls } = harness();
  await service.signUp(' student@itu.edu.tr ', 'password', ' @student ');
  assert.deepEqual(calls.signUp, [
    {
      email: 'student@itu.edu.tr',
      password: 'password',
      options: {
        data: { username: 'student' },
        emailRedirectTo: 'http://localhost:4300/auth/login',
      },
    },
  ]);
});

test('network exceptions become safe translated auth errors', async () => {
  const { service } = harness({
    signInWithPassword: async () => {
      throw new TypeError('PRIVATE_BACKEND_ERROR');
    },
  });
  const result = await service.signIn('student@itu.edu.tr', 'password');
  assert.equal(service.errorKey(result.error), 'auth.errors.network');
  assert.notEqual(result.error.message, 'PRIVATE_BACKEND_ERROR');
});

test('safe auth mappings distinguish useful failures without exposing arbitrary messages', async () => {
  const { service } = harness();
  const cases = [
    ['invalid_credentials', 'auth.errors.credentials'],
    ['email_not_confirmed', 'auth.errors.unconfirmed'],
    ['weak_password', 'auth.errors.weakPassword'],
    ['over_request_rate_limit', 'auth.errors.rateLimit'],
    ['otp_expired', 'auth.errors.recoveryInvalid'],
    ['UNEXPECTED_BACKEND_VALUE', 'auth.errors.generic'],
  ];
  for (const [code, key] of cases) {
    assert.equal(service.errorKey(new AuthError('PRIVATE_BACKEND_ERROR', 400, code)), key);
  }
  assert.equal(service.errorKey(new AuthError('Retry later', 429)), 'auth.errors.rateLimit');
});

test('the email quota error takes precedence over the generic HTTP 429 error', async () => {
  const { service } = harness();
  assert.equal(
    service.errorKey(new AuthError('PRIVATE_EMAIL_PROVIDER_ERROR', 429, 'over_email_send_rate_limit')),
    'auth.errors.emailRateLimit',
  );
  assert.equal(
    service.errorKey(new AuthError('PRIVATE_IP_LIMIT_ERROR', 429, 'over_request_rate_limit')),
    'auth.errors.rateLimit',
  );
});

test('callback cleanup removes credentials and errors while preserving unrelated URL state', async () => {
  let replacement;
  const browser = {
    location: {
      origin: 'http://localhost:4300',
      pathname: '/auth/update-password',
      href: 'http://localhost:4300/auth/update-password?code=private-code&intent=keep&error_description=private-error#access_token=private-access&refresh_token=private-refresh&type=recovery&section=keep',
    },
    history: {
      state: { navigationId: 2 },
      replaceState: (state, title, url) => (replacement = { state, title, url }),
    },
  };
  const { service } = harness({}, true, browser);
  await service.ready;
  assert.deepEqual(replacement, {
    state: { navigationId: 2 },
    title: '',
    url: '/auth/update-password?intent=keep#section=keep',
  });
});

test('restricted history does not turn callback cleanup into an unhandled auth failure', async () => {
  const browser = {
    location: {
      origin: 'http://localhost:4300',
      pathname: '/auth/login',
      href: 'http://localhost:4300/auth/login?code=private-code',
    },
    history: {
      state: null,
      replaceState: () => {
        throw new DOMException('History access denied', 'SecurityError');
      },
    },
  };
  const { service } = harness({}, true, browser);
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.initializationError(), null);
});

test('server verification rejects a token identifying another user', async () => {
  const { service, emit } = harness({
    getUser: async () => ({ data: { user: { ...user, id: 'another-user' } }, error: null }),
  });
  await service.ready;
  emit('SIGNED_IN', session);
  assert.equal(await service.hasVerifiedSession(), false);
});

test('server verification denies a stored session rejected by Supabase', async () => {
  const { service, emit } = harness({
    getUser: async () => ({ data: { user: null }, error: new AuthError('Invalid token', 401) }),
  });
  await service.ready;
  emit('SIGNED_IN', session);
  assert.equal(await service.hasVerifiedSession(), false);
});

test('the guard waits for restored-session readiness and requires server verification', async () => {
  const snapshot = deferred();
  const context = harness({ getSession: () => snapshot.promise });
  let settled = false;
  const guarded = context.guard({}, {}).then((result) => {
    settled = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(settled, false);
  snapshot.resolve({ data: { session }, error: null });
  assert.equal(await guarded, true);
});

test('the guard redirects anonymous users to local login', async () => {
  const context = harness({ getUser: async () => ({ data: { user: null }, error: null }) });
  await context.service.ready;
  assert.deepEqual(await context.guard({}, {}), { redirect: ['/auth/login'] });
});

test('sign-out during server verification prevents a stale guard approval', async () => {
  const verified = deferred();
  const started = deferred();
  const context = harness({
    getSession: async () => ({ data: { session }, error: null }),
    getUser: () => {
      started.resolve();
      return verified.promise;
    },
  });
  await context.service.ready;
  const guarded = context.guard({}, {});
  await started.promise;
  context.emit('SIGNED_OUT', null);
  verified.resolve({ data: { user }, error: null });
  assert.deepEqual(await guarded, { redirect: ['/auth/login'] });
});

test('recovery sessions keep the password reset flow instead of opening dashboard', async () => {
  const context = harness();
  await context.service.ready;
  context.emit('PASSWORD_RECOVERY', session);
  assert.deepEqual(await context.guard({}, {}), { redirect: ['/auth/update-password'] });
  assert.deepEqual(await context.signedInGuard({}, {}), { redirect: ['/auth/update-password'] });
});

test('verified sessions skip sign-in, anonymous sessions can still sign in', async () => {
  const anonymous = harness();
  await anonymous.service.ready;
  assert.equal(await anonymous.signedInGuard({}, {}), true);
  const signedIn = harness({ getSession: async () => ({ data: { session }, error: null }) });
  await signedIn.service.ready;
  assert.deepEqual(await signedIn.signedInGuard({}, {}), { redirect: ['/dashboard'] });
});

test('plain login URLs retain stored sessions and only actual implicit callback parameters are detected', () => {
  const { matchesCallback } = harness();
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), {}), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/update-password'), {}), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), { access_token: 'token' }), true);
  assert.equal(
    matchesCallback(new URL('http://localhost:4200/auth/update-password/'), { error_description: 'expired' }),
    true,
  );
  assert.equal(matchesCallback(new URL('http://localhost:4200/dashboard'), { access_token: 'token' }), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), { code: 'pkce-code' }), false);
});
```

### `scripts/e2e/auth-integration.spec.cjs`

```javascript
const { test, expect } = require('@playwright/test');

const email = 'student@itu.edu.tr';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  identities: [],
};

function sessionResponse() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: expiresAt,
  })}.fake_signature_for_local_test`;
  return {
    access_token: accessToken,
    refresh_token: 'fake_refresh_token_for_local_test',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
}

async function mockAuth(page, handlers = {}) {
  const requests = [];
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const operation = url.pathname.split('/auth/v1/')[1];
    const body = request.postDataJSON();
    requests.push({ operation, method: request.method(), body, url });
    const handler = handlers[operation];
    const response = handler
      ? await handler({ request, body, url })
      : operation === 'user'
        ? { status: 200, body: user }
        : operation === 'logout'
          ? { status: 204 }
          : { status: 400, body: { code: 'unexpected_failure', msg: 'UNEXPECTED_TEST_REQUEST' } };
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'x-supabase-api-version',
        'x-supabase-api-version': '2024-01-01',
      },
      body: response.body === undefined ? '' : JSON.stringify(response.body),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem('kampusx-language', 'tr');
    localStorage.setItem('kampusx-theme', 'light');
  });
  return requests;
}

async function mockLoginLookup(page, handler = () => ({ status: 200, body: true })) {
  const requests = [];
  await page.route('**/rest/v1/rpc/kampusx_login_email_exists', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const body = route.request().postDataJSON();
    requests.push(body);
    const response = await handler(body);
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(response.body),
    });
  });
  return requests;
}

for (const remember of [false, true]) {
  test(`login uses ${remember ? 'persistent' : 'tab-scoped'} session storage`, async ({ page }) => {
    const response = sessionResponse();
    const requests = await mockAuth(page, { token: () => ({ body: response }) });
    await page.goto('/auth/login');
    await page.locator('#login-identity').fill(email);
    await page.locator('#login-password').fill('LocalTestPassword123!');
    const rememberControl = page.locator('input[formcontrolname=remember]');
    await rememberControl.setChecked(remember);
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.dashboard-page')).toBeVisible();
    const submitted = requests.find(({ operation }) => operation === 'token');
    expect(submitted.body.email).toBe(email);
    expect(submitted.body.password).toBe('LocalTestPassword123!');
    const persisted = await page.evaluate((accessToken) => {
      const containsToken = (storage) =>
        Object.keys(storage).some((key) => (storage.getItem(key) || '').includes(accessToken));
      return { local: containsToken(localStorage), session: containsToken(sessionStorage) };
    }, response.access_token);
    expect(persisted).toEqual({ local: remember, session: !remember });
    await page.reload();
    await expect(page.locator('.dashboard-page')).toBeVisible();
    await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '@student' })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Okul bilgisi eklenmemiş')).toBeVisible();
    expect(requests.some(({ operation }) => operation === 'user')).toBe(true);
  });
}

test('invalid credentials display a safe localized error and allow retry', async ({ page }) => {
  const lookups = await mockLoginLookup(page);
  let failed = true;
  const requests = await mockAuth(page, {
    token: () =>
      failed
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.click();
  await expect(page.locator('#auth-panel [role=alert]')).toBeVisible();
  await expect(page.locator('#auth-panel [role=alert]')).toContainText('E-posta veya şifre yanlış');
  await expect(page.locator('#auth-panel')).not.toContainText('PRIVATE_BACKEND_ERROR');
  await expect(submit).toBeEnabled();
  failed = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requests.filter(({ operation }) => operation === 'token')).toHaveLength(2);
  expect(lookups).toEqual([{ email_address: email }]);
});

test('a confirmed absent account shows the requested message in TR and EN and permits retry', async ({
  page,
}) => {
  let missing = true;
  await mockAuth(page, {
    token: () =>
      missing
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  const lookups = await mockLoginLookup(page, () => ({ body: false }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toHaveText('Böyle bir kullanıcı yok.');
  await expect(submit).toBeEnabled();
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toHaveText('No such user exists.');
  expect(lookups).toEqual([{ email_address: email }]);
  missing = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(lookups).toHaveLength(1);
});

test('lookup errors remain distinct from missing users and incorrect credentials', async ({ page }) => {
  await mockAuth(page, {
    token: () => ({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } }),
  });
  await mockLoginLookup(page, () => ({
    status: 404,
    body: { code: 'PGRST202', message: 'PRIVATE_SCHEMA_ERROR' },
  }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  const alert = page.locator('#auth-panel [role=alert]');
  await expect(alert).toHaveText('Hesap kontrolü tamamlanamadı. Lütfen tekrar dene.');
  await expect(alert).not.toContainText('PRIVATE_SCHEMA_ERROR');
  await expect(page.locator('#auth-panel button[type=submit]')).toBeEnabled();
});

test('a slow lookup keeps submits disabled and reserves error feedback space on a narrow dark screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuth(page, {
    token: () => ({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } }),
  });
  let resolveLookup;
  const response = new Promise((resolve) => {
    resolveLookup = resolve;
  });
  const lookups = await mockLoginLookup(page, () => response);
  await page.addInitScript(() => localStorage.setItem('kampusx-theme', 'dark'));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.scrollIntoViewIfNeeded();
  const before = await submit.boundingBox();
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.locator('#auth-panel form')).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => lookups.length).toBe(1);
  resolveLookup({ body: false });
  await expect(page.locator('#auth-panel [role=alert]')).toHaveText('Böyle bir kullanıcı yok.');
  const after = await submit.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('login-missing-user-tr-dark.png'), fullPage: true });
});

test('registration sends metadata and displays email-verification guidance', async ({ page }) => {
  const requests = await mockAuth(page, {
    signup: () => ({ body: { ...user, email_confirmed_at: null, confirmed_at: null } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.locator('#auth-panel .success-message')).toBeVisible();
  await expect(page.locator('#auth-panel .success-message')).toContainText(/e-posta/i);
  const submitted = requests.find(({ operation }) => operation === 'signup');
  expect(submitted.body.email).toBe(email);
  expect(submitted.body.data.username).toBe('student');
  expect(submitted.body.data).not.toHaveProperty('role');
});

test('reset requests do not expose whether an account exists', async ({ page }) => {
  const requests = await mockAuth(page, { recover: () => ({ body: {} }) });
  await page.goto('/auth/forgot-password');
  await page.locator('#reset-email').fill(email);
  await page.locator('#auth-panel button[type=submit]').click();
  const success = page.locator('.reset-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText(/hesap|kayıtlı/i);
  await expect(success).toBeFocused();
  expect(requests.find(({ operation }) => operation === 'recover').body.email).toBe(email);
});

test('registration distinguishes email quota from request limits in Turkish and English', async ({
  page,
}) => {
  let code = 'over_email_send_rate_limit';
  await mockAuth(page, {
    signup: () => ({ status: 429, body: { code, msg: 'PRIVATE_PROVIDER_ERROR' } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toContainText('E-posta gönderim sınırına ulaşıldı');
  await expect(alert).not.toContainText('PRIVATE_PROVIDER_ERROR');
  await expect(submit).toBeEnabled();
  code = 'over_request_rate_limit';
  await submit.click();
  await expect(alert).toContainText('İstek sınırına ulaşıldı');
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toContainText('The request limit was reached');
  code = 'over_email_send_rate_limit';
  await submit.click();
  await expect(alert).toContainText('The email sending limit was reached');
});

test('an anonymous visitor cannot open dashboard', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('#login-identity')).toBeVisible();
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
});

test('a rejected stored token cannot open dashboard or reveal profile content', async ({ page }) => {
  const session = sessionResponse();
  await mockAuth(page, { user: () => ({ status: 401, body: { code: 'bad_jwt', msg: 'Invalid token' } }) });
  await page.addInitScript((session) => {
    sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
  }, session);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
  await expect(page.getByText('@student', { exact: true })).toHaveCount(0);
});

test('sign-out clears the session and denies dashboard until the next login', async ({ page }) => {
  const requests = await mockAuth(page, { token: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/auth/login');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(requests.filter(({ operation }) => operation === 'logout')).toHaveLength(1);
  const remains = await page.evaluate(() =>
    [localStorage, sessionStorage].some((storage) => !!storage.getItem('sb-auth-auth-token')),
  );
  expect(remains).toBe(false);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test('registration opens dashboard only when Supabase returns a session', async ({ page }) => {
  await mockAuth(page, { signup: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
```

### `scripts/e2e/dashboard.spec.cjs`

```javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openDashboard(page, language = 'tr', theme = 'light', width = 390) {
  await page.setViewportSize({ width, height: width > 640 ? 900 : 844 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      username: 'elif',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      department_name: 'Bilgisayar Teknolojileri',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh_token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    }),
  );
  await page.goto('/dashboard');
  await expect(
    page.getByRole('tab', { name: language === 'tr' ? 'Üniversite' : 'University', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.evaluate(() => document.fonts.ready);
}

async function swipe(page, from, to) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: from.x, y: from.y }],
  });
  for (let step = 1; step <= 5; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 5, y: from.y + ((to.y - from.y) * step) / 5 }],
    });
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

async function settledDrawer(page) {
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => page.getByRole('dialog').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
}

for (const language of ['tr', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`dashboard geometry and accessibility — ${language}/${theme}`, async ({ page }, info) => {
      await openDashboard(page, language, theme, language === 'en' ? 320 : 1440);
      await expect(page.locator('kx-header, kx-footer')).toHaveCount(0);
      await expect(page.getByRole('tab')).toHaveCount(3);
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect(page.locator('.bottom-nav button')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const surface = await page.locator('.dashboard-shell').evaluate((el) => ({
        actual: getComputedStyle(el).backgroundColor,
        expected: getComputedStyle(document.documentElement).getPropertyValue('--color-surface'),
      }));
      expect(surface.actual).not.toBe('rgba(0, 0, 0, 0)');
      expect(surface.expected.trim()).not.toBe('');
      const audit = await new AxeBuilder({ page }).analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`dashboard-${language}-${theme}.png`) });
      const opener = page.getByRole('button', {
        name: language === 'tr' ? 'Profil menüsünü aç' : 'Open profile menu',
      });
      await opener.click();
      const dialog = page.getByRole('dialog');
      await settledDrawer(page);
      await expect(dialog.getByRole('heading', { name: '@elif' })).toBeVisible();
      await expect(dialog.locator('.profile-details p')).toHaveCount(2);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`drawer-${language}-${theme}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }
}

test('tabs, keyboard and content use one selection state', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  await tabs.nth(1).click();
  await expect(page.getByRole('heading', { name: 'Kampüsünün gündemi' })).toBeVisible();
  await tabs.nth(1).press('ArrowRight');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(2).press('Home');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).press('End');
  await expect(page.getByRole('heading', { name: 'Bölümündeki konuşmalar' })).toBeVisible();
  await tabs.nth(2).press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
});

test('real touch swipes change feeds, clamp boundaries and preserve vertical scroll', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  for (const expected of [1, 2, 2]) {
    await swipe(page, { x: 300, y: 530 }, { x: 85, y: 538 });
    await expect(tabs.nth(expected)).toHaveAttribute('aria-selected', 'true');
  }
  await swipe(page, { x: 85, y: 530 }, { x: 300, y: 538 });
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await swipe(page, { x: 200, y: 630 }, { x: 205, y: 350 });
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('drawer traps focus, locks scroll and closes on backdrop or touch', async ({ page }) => {
  await openDashboard(page);
  const opener = page.getByRole('button', { name: 'Profil menüsünü aç' });
  await opener.click();
  await settledDrawer(page);
  const close = page.getByRole('button', { name: 'Profil menüsünü kapat' });
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  await close.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Çıkış yap', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  const drawerBounds = await page.getByRole('dialog').boundingBox();
  const backdropX = drawerBounds.x + drawerBounds.width + 8;
  await page.mouse.click(backdropX, 300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await opener.click();
  await swipe(page, { x: 270, y: 245 }, { x: 70, y: 250 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('theme and language remain live without resetting the selected feed', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('tab', { name: 'Bölüm', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Department', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page).toHaveTitle('Home — KampüsX');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('heading', { name: 'Inside your department' })).toBeVisible();
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await expect(page.getByRole('dialog').getByText('Bilgisayar Teknolojileri', { exact: true })).toBeVisible();
});

test('reduced motion and unavailable visual controls have no business effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDashboard(page);
  expect(
    await page.locator('.discover-track').evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  for (const button of await page.locator('.bottom-nav button').all()) {
    await expect(button).toBeDisabled();
  }
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  for (const button of await page.locator('.profile-menu button').all()) await expect(button).toBeDisabled();
  await page.getByRole('button', { name: 'Profil menüsünü kapat' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('leaving an open drawer restores the welcome and auth shell', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.evaluate(() => {
    history.pushState({}, '', '/auth/forgot-password');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('kx-header')).toBeVisible();
  await expect(page.locator('kx-footer')).toBeVisible();
  await expect(page.locator('#reset-email')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await page.goto('/');
  await expect(page.locator('.hero-poster')).toBeVisible();
  await expect(page.locator('kx-header')).toBeVisible();
});
```

### `scripts/e2e/password-recovery.spec.cjs`

```javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const user = {
  id: 'f449a9bd-16cb-4aba-bddf-1c8e8a20cc96',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'student@itu.edu.tr',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  created_at: '2026-01-01T00:00:00Z',
};

function accessToken() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email: user.email,
  })}.mock-signature`;
}

function recoveryUrl() {
  return `/auth/update-password#access_token=${accessToken()}&refresh_token=mock-refresh&expires_in=3600&token_type=bearer&type=recovery`;
}

async function mockAuth(page, { update, logout, userResponse } = {}) {
  const requests = [];
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: url.pathname, body: request.postDataJSON() });
    if (url.pathname.endsWith('/user') && request.method() === 'GET') {
      if (userResponse) return userResponse(route);
      return route.fulfill({ json: user });
    }
    if (url.pathname.endsWith('/user') && request.method() === 'PUT') {
      if (update) return update(route);
      return route.fulfill({ json: user });
    }
    if (url.pathname.endsWith('/logout')) {
      if (logout) return logout(route);
      return route.fulfill({ status: 204 });
    }
    if (url.pathname.endsWith('/token')) {
      return route.fulfill({
        json: {
          access_token: accessToken(),
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        },
      });
    }
    // Never allow a recovery test to send email or call a live Supabase project.
    return route.fulfill({ status: 400, json: { code: 'unexpected_test_request', message: 'Mock only' } });
  });
  return requests;
}

async function setPreferences(page, { language = 'tr', theme = 'light' } = {}) {
  await page.addInitScript(
    ({ language, theme }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
    },
    { language, theme },
  );
}

test('a missing recovery link offers a new reset and never shows a password form', async ({ page }) => {
  await setPreferences(page);
  const requests = await mockAuth(page);
  await page.goto('/auth/update-password');
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await page.getByRole('link', { name: 'Yeni sıfırlama bağlantısı iste' }).click();
  await expect(page.locator('#reset-email')).toBeVisible();
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(0);
});

test('an ordinary signed-in session cannot authorize a recovery page', async ({ page }) => {
  await setPreferences(page);
  const requests = await mockAuth(page);
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(user.email);
  await page.locator('#login-password').fill('ExistingPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/auth/update-password');
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(0);
});

test('expired callbacks never display callback errors or credentials', async ({ page }) => {
  await setPreferences(page);
  await mockAuth(page, {
    userResponse: (route) =>
      route.fulfill({ status: 401, json: { code: 'otp_expired', message: 'raw-provider-error' } }),
  });
  await page.goto(recoveryUrl());
  await expect(page.getByRole('alert')).toContainText('geçersiz veya süresi dolmuş');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('raw-provider-error');
  await expect(page).not.toHaveURL(/access_token|refresh_token/);
});

for (const state of [
  { language: 'tr', theme: 'light', width: 1440 },
  { language: 'en', theme: 'dark', width: 320 },
]) {
  test(`recovery validates, masks passwords, saves once and ends session (${state.language}, ${state.theme})`, async ({
    page,
  }) => {
    await setPreferences(page, state);
    await page.setViewportSize({ width: state.width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests = await mockAuth(page);
    await page.goto(recoveryUrl());
    const password = page.locator('#update-password');
    const confirm = page.locator('#update-confirm-password');
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(confirm).toHaveAttribute('autocomplete', 'new-password');
    await expect(page).not.toHaveURL(/access_token|refresh_token/);
    const submit = page.locator('button[type=submit]');
    await submit.click();
    await expect(password).toBeFocused();
    await password.fill('NewPassword123!');
    await confirm.fill('OtherPassword123!');
    await submit.click();
    await expect(confirm).toBeFocused();
    await expect(confirm).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#update-confirm-password-message')).toContainText(
      state.language === 'tr' ? 'aynı olmalı' : 'must match',
    );
    await confirm.fill('NewPassword123!');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: test.info().outputPath(`recovery-${state.language}-${state.theme}.png`),
      fullPage: true,
    });
    await submit.click();
    await expect(page.locator('[data-recovery-result]')).toContainText(
      state.language === 'tr' ? 'Şifren güncellendi' : 'Password updated',
    );
    await expect(page.locator('[data-recovery-result]')).toBeFocused();
    await expect(password).toHaveCount(0);
    const updates = requests.filter((request) => request.method === 'PUT');
    expect(updates).toHaveLength(1);
    expect(updates[0].body).toMatchObject({ password: 'NewPassword123!' });
    expect(requests.filter((request) => request.path.endsWith('/logout'))).toHaveLength(1);
    await page
      .getByRole('link', { name: state.language === 'tr' ? 'Girişe dön' : 'Back to sign in' })
      .click();
    await expect(page.locator('#login-identity')).toBeVisible();
  });
}

test('a failed password update preserves fields and allows a retry', async ({ page }) => {
  await setPreferences(page);
  let calls = 0;
  const requests = await mockAuth(page, {
    update: (route) => {
      calls += 1;
      return calls === 1
        ? route.fulfill({
            status: 422,
            headers: {
              'access-control-allow-origin': '*',
              'access-control-expose-headers': 'x-supabase-api-version',
              'x-supabase-api-version': '2024-01-01',
            },
            json: { code: 'weak_password', message: 'raw-provider-error' },
          })
        : route.fulfill({ json: user });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('daha güçlü bir şifre');
  await expect(page.locator('#update-password')).toHaveValue('NewPassword123!');
  await expect(page.locator('body')).not.toContainText('raw-provider-error');
  expect(requests.filter((request) => request.path.endsWith('/logout'))).toHaveLength(0);
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
});

test('slow password updates prevent duplicate submits', async ({ page }) => {
  await setPreferences(page);
  let complete;
  const gate = new Promise((resolve) => {
    complete = resolve;
  });
  const requests = await mockAuth(page, {
    update: async (route) => {
      await gate;
      await route.fulfill({ json: user });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await page
    .locator('form')
    .evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(1);
  complete();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
});

test('a saved password with failed sign-out offers sign-out retry without another update', async ({
  page,
}) => {
  await setPreferences(page);
  let logoutCalls = 0;
  const requests = await mockAuth(page, {
    logout: (route) => {
      logoutCalls += 1;
      return logoutCalls === 1
        ? route.fulfill({
            status: 500,
            json: { code: 'unexpected_failure', message: 'Mock sign-out failure' },
          })
        : route.fulfill({ status: 204 });
    },
  });
  await page.goto(recoveryUrl());
  await page.locator('#update-password').fill('NewPassword123!');
  await page.locator('#update-confirm-password').fill('NewPassword123!');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('alert')).toContainText('Çıkış işlemi sırasında bir sorun oldu');
  await expect(page.locator('#update-password')).toHaveCount(0);
  await page.getByRole('button', { name: 'Oturumu kapatmayı tekrar dene' }).click();
  await expect(page.locator('[data-recovery-result]')).toContainText('Şifren güncellendi');
  expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(1);
  // SDK removes local credentials even if server logout fails; the retry is
  // idempotent locally and must not resend the password or invent a new token.
  expect(logoutCalls).toBe(1);
  expect(
    await page.evaluate(() => {
      const hasSession = (storage) =>
        Object.keys(storage).some((key) => key.endsWith('-auth-token') && !!storage.getItem(key));
      return hasSession(localStorage) || hasSession(sessionStorage);
    }),
  ).toBe(false);
});
```

### `scripts/e2e/welcome.spec.cjs`

```javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test.beforeEach(async ({ page }) => {
  // All auth traffic is fulfilled locally; UI tests never contact a real project.
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const operation = new URL(request.url()).pathname.split('/auth/v1/')[1];
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'student@itu.edu.tr',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { username: 'student' },
      identities: [],
    };
    if (operation === 'token') {
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const body = {
        access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: expiresAt })}.local_test_signature`,
        refresh_token: 'local_test_refresh_token',
        expires_in: 3600,
        expires_at: expiresAt,
        token_type: 'bearer',
        user,
      };
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    } else if (operation === 'signup') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ...user, email_confirmed_at: null }),
      });
    } else if (operation === 'recover') {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: '{}' });
    } else if (operation === 'user') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(user) });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'unexpected_failure', msg: 'Unexpected mocked operation' }),
      });
    }
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('kampusx-language')) localStorage.setItem('kampusx-language', 'tr');
    if (!localStorage.getItem('kampusx-theme')) localStorage.setItem('kampusx-theme', 'light');
  });
  await page.goto('/');
});
test('login validation, password reveal, and mocked authentication result', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toBeFocused();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('@deniz');
  await page.locator('#login-password').fill('test-password');
  await panel.getByRole('button', { name: 'Şifreyi göster' }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.dashboard-page')).toBeVisible();
});
test('register validates university address and consent; Google stays local', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Kayıt ol', exact: true }).click();
  await panel.getByRole('button', { name: 'Google öğrenci hesabıyla başla' }).click();
  await expect(panel.locator('.info-message')).toContainText(/Google/);
  await page.locator('#register-email').fill('student@gmail.com');
  await page.locator('#register-username').fill('@deniz');
  await page.locator('#register-password').fill('LongPassword123!');
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(page.locator('#register-email')).toBeFocused();
  await expect(panel.getByText('.edu.tr uzantılı üniversite e-postanı kullan.')).toBeVisible();
  await page.locator('#register-email').fill('student@itu.edu.tr');
  await page.locator('#register-consent').check();
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(panel.locator('.success-message')).toContainText(/e-posta/i);
});
test('password reset has validation, loading, success and return', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Şifremi unuttum' }).click();
  await page.locator('#reset-email').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();
  await expect(panel.locator('button[type=submit]')).toBeDisabled();
  await expect(panel.locator('.reset-success')).toContainText(/hesap|kayıtlı/i);
  await expect(panel.locator('.reset-success')).toBeFocused();
  await panel.getByRole('button', { name: 'Girişe dön' }).click();
  await expect(page.locator('#login-identity')).toBeVisible();
});
test('feed keyboard tabs, community CTA and legal modal', async ({ page }) => {
  const university = page.getByRole('tab', { name: 'Üniversitem' });
  await university.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Bölümüm' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Bitirme projesi');
  await page.getByRole('button', { name: 'Katıl: Yazılım Kulübü' }).click();
  await expect(page.locator('#register-email')).toBeVisible();
  await expect(page.locator('#auth-title')).toBeFocused();
  await page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true })).toBeFocused();
});
test('instant language/theme change and persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'English', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
  await page.getByRole('button', { name: 'Switch to dark theme' }).first().click();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-language'))).toBe('en');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-theme'))).toBe('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
});
test('all auth routes lazy load and unknown routes recover', async ({ page }) => {
  for (const [url, field] of [
    ['/auth/login', '#login-identity'],
    ['/auth/register', '#register-email'],
    ['/auth/forgot-password', '#reset-email'],
  ]) {
    await page.goto(url);
    await expect(page.locator(field)).toBeVisible();
  }
  await page.goto('/missing-page');
  await expect(page.getByRole('link', { name: 'Ana sayfaya dön' })).toBeVisible();
});
for (const width of [1440, 768, 390, 320]) {
  for (const language of ['tr', 'en']) {
    for (const theme of ['light', 'dark']) {
      test(`layout and accessibility ${width}px ${language} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        if (width <= 900) await page.getByRole('button', { name: 'Menüyü aç' }).click();
        if (language === 'en')
          await page.getByRole('button', { name: 'English', exact: true }).last().click();
        if (theme === 'dark')
          await page
            .getByRole('button', { name: language === 'tr' ? 'Koyu temaya geç' : 'Switch to dark theme' })
            .last()
            .click();
        if (width <= 900)
          await page.getByRole('button', { name: language === 'tr' ? 'Menüyü kapat' : 'Close menu' }).click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('header').getByRole('button', { name: /Giriş yap|Sign in/ })).toHaveCount(
          0,
        );
        await expect(page.locator('header').getByRole('link', { name: /Hakkında|About/ })).toHaveCount(0);
        await expect(page.locator('.edition-line')).toHaveCount(0);
        await expect(
          page.locator('footer').getByText(/Frontend.*preview|Frontend tasarım|unofficial|resmi olmayan/),
        ).toHaveCount(0);
        await expect(page.locator('footer nav').getByRole('link')).toHaveCount(1);
        await expect(page.locator('footer nav').getByRole('button')).toHaveCount(3);
        if (width > 640) {
          for (const mode of ['login', 'register', 'reset']) {
            const panel = page.locator('#auth-panel');
            if (mode === 'register') await panel.locator('.auth-tabs button').last().click();
            if (mode === 'reset') {
              await panel.locator('.auth-tabs button').first().click();
              await panel
                .getByRole('button', { name: language === 'tr' ? 'Şifremi unuttum' : 'Forgot password?' })
                .click();
            }
            const posterBox = await page.locator('.hero-poster').boundingBox();
            const panelBox = await panel.boundingBox();
            expect(Math.abs(posterBox.y - panelBox.y)).toBeLessThanOrEqual(1);
            expect(Math.abs(posterBox.height - panelBox.height)).toBeLessThanOrEqual(1);
          }
          await page
            .locator('#auth-panel')
            .getByRole('button', { name: language === 'tr' ? 'Girişe dön' : 'Back to sign in' })
            .click();
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        }
        const agendaColors = await page.locator('.marquee-strip').evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, text: style.color };
        });
        expect(agendaColors.background).toBe(theme === 'light' ? 'rgb(237, 239, 245)' : 'rgb(29, 37, 53)');
        expect(agendaColors.text).toBe(theme === 'light' ? 'rgb(21, 33, 58)' : 'rgb(237, 242, 255)');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflow).toBe(false);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => {
          document.querySelectorAll('.reveal-pending').forEach((el) => el.classList.remove('reveal-pending'));
        });
        await page.screenshot({
          path: test.info().outputPath(`${width}-${language}-${theme}.png`),
          fullPage: true,
        });
        if (width === 1440 || width === 390)
          await page.screenshot({ path: test.info().outputPath(`hero-${width}-${language}-${theme}.png`) });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      });
    }
  }
}
```

### `scripts/verify-login-email-lookup.cjs`

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Optional local SQL verification: install PGlite into the ignored .nx directory.
// No Supabase connection, real accounts or project dependency changes are needed.
const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, '.nx/login-sql-verification/node_modules/@electric-sql/pglite');
const { PGlite } = require(modulePath);

async function verify() {
  const db = new PGlite();
  const checks = [];
  const check = async (name, run) => {
    await run();
    checks.push({ name, passed: true });
  };
  const lookup = async (email) => {
    const { rows } = await db.query('select public.kampusx_login_email_exists($1) as present', [email]);
    return rows[0].present;
  };
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role unrelated;
      create schema auth;
      create table auth.users (email text, deleted_at timestamptz);
      insert into auth.users values
        ('student@itu.edu.tr', null),
        ('Deleted@itu.edu.tr', now());
      create table public.users (email text);
      insert into public.users values ('decoy@itu.edu.tr');
    `);
    const migration = fs.readFileSync(
      path.join(root, 'supabase/migrations/20261012174500_login_email_lookup.sql'),
      'utf8',
    );
    await check('migration applies and can be reapplied', async () => {
      await db.exec(migration);
      await db.exec(migration);
    });
    await check('known active email returns true', async () =>
      assert.equal(await lookup('student@itu.edu.tr'), true),
    );
    await check('email comparison trims and ignores case', async () =>
      assert.equal(await lookup(' Student@ITU.EDU.TR '), true),
    );
    await check('missing email returns false', async () =>
      assert.equal(await lookup('missing@itu.edu.tr'), false),
    );
    await check('soft-deleted account returns false', async () =>
      assert.equal(await lookup('deleted@itu.edu.tr'), false),
    );
    await check('invalid or oversized input is not classified as missing', async () => {
      for (const input of [null, '', 'not-an-email', 'a'.repeat(321) + '@itu.edu.tr']) {
        assert.equal(await lookup(input), null);
      }
    });
    await check('public-schema decoy cannot alter the auth lookup', async () =>
      assert.equal(await lookup('decoy@itu.edu.tr'), false),
    );
    await check('the unrelated role has no function access', async () => {
      const { rows } = await db.query(
        "select has_function_privilege('unrelated', 'public.kampusx_login_email_exists(text)', 'execute') as allowed",
      );
      assert.equal(rows[0].allowed, false);
    });
    for (const role of ['anon', 'authenticated']) {
      await check(`${role} can receive only the existence boolean`, async () => {
        await db.exec(`set role ${role}`);
        try {
          assert.equal(await lookup('student@itu.edu.tr'), true);
          assert.equal(await lookup('missing@itu.edu.tr'), false);
          await assert.rejects(db.query('select * from auth.users'), (error) => error.code === '42501');
        } finally {
          await db.exec('reset role');
        }
      });
    }
    const report = {
      engine: 'PGlite PostgreSQL (isolated in-memory fixtures)',
      passed: checks.length,
      failed: 0,
      checks,
    };
    fs.writeFileSync(
      path.join(root, 'docs/login-email-lookup-sql-verification.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(`SQL verification passed: ${checks.length} checks. Real Supabase was not modified.`);
  } finally {
    await db.close();
  }
}

verify().catch(() => {
  console.error('Login email lookup SQL verification failed.');
  process.exitCode = 1;
});
```

### `supabase/migrations/20261012174500_login_email_lookup.sql`

```sql
-- Apply once in this project's Supabase SQL Editor, as postgres.
-- Product decision: login distinguishes an unknown email from incorrect credentials.
-- This intentionally reveals whether a supplied email has an active account.
-- No user rows, IDs, password hashes or roles are returned.
begin;

create or replace function public.kampusx_login_email_exists(email_address text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when email_address is null
      or length(btrim(email_address)) > 320
      or btrim(email_address) !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    then null::boolean
    else exists (
      select 1
      from auth.users as account
      where lower(account.email) = lower(btrim(email_address))
        and account.deleted_at is null
    )
  end;
$function$;

-- Limit grants to this function. Keep auth.users and every other function protected.
revoke all on function public.kampusx_login_email_exists(text) from public, anon, authenticated;
grant execute on function public.kampusx_login_email_exists(text) to anon, authenticated;

comment on function public.kampusx_login_email_exists(text) is
  'Login-only email existence lookup. Returns a boolean; account existence is intentionally disclosed.';

notify pgrst, 'reload schema';
commit;
```

### `docs/login-email-lookup-availability.json`

```json
{
  "date": "2026-10-12",
  "realRpcAvailability": {
    "status": 404,
    "code": "PGRST202"
  },
  "localLoginHttpStatus": 200,
  "migrationApplied": false
}
```
