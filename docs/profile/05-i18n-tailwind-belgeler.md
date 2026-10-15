# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## .gitignore (değişti)

````text
node_modules/
dist/
.nx/
.angular/
.vercel/
test-results/
test-results-security/
playwright-report/
*.log
.env*
!.env.example
apps/shell/src/environments/environment.ts
````

## .postcssrc.json (eklendi)

````json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
````

## DESIGN.md (değişti)

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
themes; Tailwind v4.3.3 loads the existing variable-based preset with `@config`, never independent copies of raw values.
`.postcssrc.json` owns the Tailwind v4 PostCSS integration; sources are limited to shell and shared UI.

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
The user's 15 October security decision replaces account discovery with one generic credential error.
Unknown email and incorrect password use the same TR/EN credentials key. Login sends no account-existence
RPC; network, quota and email-confirmation failures retain actionable, non-password-revealing feedback.
The disabling migration revokes the legacy RPC's execute grant from PUBLIC, anon and authenticated;
it must be applied on the live database independently of deploying the frontend.
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
contains the signed-in user's display name, handle, university, department and mock follow counts. Profile metadata is
display content only; missing university/department values use honest localized placeholders.
The drawer's sign-out control closes the real Supabase session. Discovery uses a single selected index
for tab clicks, Arrow/Home/End keys and horizontal touch swipes. Vertical document scrolling
remains native; the bottom navigation reserves safe-area space. Motion is transform/opacity
only and honors reduced motion. Skeletons are static decoration only for the three planned academic feeds;
Explore uses real rows with loading, error/retry and empty states. Profile menu and bottom navigation are explicitly unavailable
visual items with no navigation or network effects, except the active Profile entry and profile-page Home action. Email/password sign-in redirects to dashboard
only after Supabase returns a session; registration with no session keeps email-verification guidance.
The dashboard guard verifies the session with Supabase getUser; valid signed-in users skip login/register,
and password recovery keeps its own route. Session loss returns to login. The existing auth forms keep
their visual design and welcome keeps its public chrome. Plain login URLs are not treated as callback
links; callback detection requires actual auth parameters. Explore reads authenticated public.posts rows. No fake session is created by dashboard.
University, campus and department filtering remains a planned visual flow because no scope columns were supplied.
The lazy `/profile` and `/profile/edit` routes retain the existing session guard. ProfileService
seeds display identity from the existing session. Names and bios remain in memory;
follow counts and joined date are illustrative. Avatar/banner URLs persist in public.profiles by user_id;
posts and post count come from public.posts. No reply/repost data is invented.
It owns atomic name/bio/photo updates and staged object URLs, releases discarded/replaced assets,
and resets its local state when the signed-in account changes. Academic details and username stay readonly.
Registration now requires university and department and sends allowlisted display metadata to Auth; it does not grant roles.
Upload ownership and a session epoch are checked across asynchronous boundaries. Logout or replacement login
invalidates pending work, including a re-login to the same user; token refresh alone does not. Dirty profile/post
editors leave on session loss without trapping the user in a discard dialog or retaining the old draft.
ProfileRepository snapshots only avatar_url/banner_url and validates their owner and purpose at runtime;
TypeScript payload types are not treated as a security boundary. Media URLs accept only canonical
uid/area/safe-filename paths and the supported image/video extensions in the configured bucket. PNG, JPEG
and WebP dimensions are checked before decoding, with browser decoding and a final pixel-limit check.
Avatar, scrollable TabStrip and floating FormField extend existing owners through optional variants.
SocialPostCard owns feed cards; the marketing PostCardPreview remains its separate existing preview.
ImagePicker owns native file selection and staged previews, ConfirmDialog owns draft-discard confirmation,
and Toast with NoticeService owns saved feedback across route changes. MediaService owns real uploads to the existing public uploads bucket; ProfileRepository and PostsService own the DB boundary.
File selection only stages previews; Save/Publish performs network writes. URLs use uid/purpose/random paths and only
the configured bucket origin is rendered. Confirmed uploads can be reused after a rejected DB write.
Storage and database writes are separate operations; no speculative deletion of possibly referenced objects occurs.
Post composer uses existing FormField/Button/ConfirmDialog owners and the same protected navigation/draft contract.
Ambiguous publication outcomes block blind retries. Only confirmed success triggers the shared toast and feed navigation.
A post is at most 2000 characters with one optional image/video; images accept JPG/PNG/WEBP,
up to 5 MiB and 32 megapixels, with decoded-content checks; videos accept MP4/WEBM up to 50 MiB
with signature and metadata decode checks. Public-file visibility is disclosed before saving. Profile and media geometry stays reserved.
The profile uses a 3:1 cover, an overlapping 96px avatar, a 64px sticky toolbar and sticky scrolling tabs.
IntersectionObserver controls only opacity/transform header motion and is disconnected on teardown.
The editor reserves centered-title space beside its left Cancel/Save controls and blocks duplicate saves.
Dirty route departures use the native shared confirmation dialog, Escape keeps edits, focus returns,
and saved changes update the drawer and every own post card through the same signal.
Production builds use Angular's hashed script CSP. The build adds an exact configured Supabase
connection and media allowlist; Vercel supplies frame, MIME, referrer and device-permission protections.
Static style permissions retain Angular component styles and the existing Google font/icon sources.
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

## README.md (değişti)

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
- Giriş sonrası dashboard, profil çekmecesi ve Keşfet / Üniversite / Kampüs / Bölüm sekmeleri. Keşfet gerçek gönderileri gösterir; akademik kapsam filtreleri geliştirme aşamasındadır.
- Profil, gönderi/yanıt/retweet sekmeleri ve fotoğraf, isim, bio düzenleme ekranı. Profil/kapak fotoğrafları Supabase Storage ve veritabanında saklanır; isim ve bio düzenlemeleri henüz oturum içi görseldir.
- Gerçek metin, fotoğraf ve video paylaşımı; Keşfet ve profil akışında kalıcı gönderiler.
- Kayıt sırasında üniversite ve bölüm bilgileri.
- Anlık Türkçe ve İngilizce dil değişimi.
- Açık ve koyu tema.
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım.
- Klavyeyle kullanım, görünür odak durumları ve anlaşılır form geri bildirimleri.

Tasarım dili, üniversite hayatının enerjisini editoryal tipografi, güçlü renkler ve afiş kompozisyonlarıyla birleştirir.

### Ürün vizyonu

Platformun geliştirme hedefleri; bölüm, üniversite ve genel keşfet akışları, beğeni, yorum, yeniden paylaşım ve alıntılama özellikleridir. Birebir mesajlaşma ve yöneticilerin üyelik isteklerini onayladığı uygulama içi topluluklar da bu kapsamda yer alır.

### Teknoloji

Frontend Angular ve Nx üzerine kuruludur. Ortak arayüz bileşenleri atomic design yaklaşımıyla düzenlenir; renk ve tipografi tasarım token'larıyla yönetilir. Tailwind CSS arayüz stillerini, Transloco dil desteğini, Supabase Auth kimlik doğrulamayı, Supabase Storage ve veritabanı profil medyası ile gönderi kalıcılığını sağlar.

## English

KampüsX is a social platform that brings together university students' campus life, academic networks and everyday conversations. It helps students connect with their universities and departments, discover communities and follow campus news.

### Authentication

Email and password registration, sign-in, session management and password recovery are integrated with Supabase Auth. The sign-in screen includes a “Remember me” option. Password recovery provides an email link that opens the new-password flow.

Successful sign-in opens the session-protected home screen. The profile drawer displays the signed-in account's username and provides sign-out.

### User experience

- A welcome screen introducing campus news, example posts and university communities.
- Dedicated sign-in, registration and password recovery screens.
- A dashboard after sign-in, a profile drawer and Explore / University / Campus / Department tabs. Explore shows persisted posts; academic scope filters are under development.
- A profile with post/reply/repost tabs and photo, name and bio editing. Profile/cover photos persist in Supabase Storage and the database; name and bio edits remain local display changes.
- Real text, photo and video publishing with persisted Explore and profile feeds.
- University and department details during registration.
- Instant Turkish and English language switching.
- Light and dark themes.
- Responsive layouts for desktop, tablet and mobile.
- Keyboard support, visible focus states and clear form feedback.

The visual language combines the energy of campus life with editorial typography, bold colors and poster compositions.

### Product vision

Development goals include department, university and general discovery feeds; likes, comments, reposts and quote posts. Direct messaging and in-app communities with administrator-approved membership requests are also part of the product vision.

### Technology

The frontend is built with Angular and Nx. Shared UI components follow atomic design, with colors and typography managed through design tokens. Tailwind CSS provides interface styling, Transloco provides localization, Supabase Auth handles authentication, and Supabase Storage and database tables persist profile media and posts.
````

## apps/shell/project.json (değişti)

````json
{
  "name": "shell",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/shell/src",
  "tags": ["scope:shell", "type:app"],
  "implicitDependencies": ["shared-ui", "shared-util", "design-tokens"],
  "targets": {
    "configure-environment": {
      "executor": "nx:run-commands",
      "cache": false,
      "options": { "command": "node scripts/generate-environment.cjs" }
    },
    "build": {
      "executor": "@angular/build:application",
      "cache": false,
      "dependsOn": ["configure-environment", "^build"],
      "outputs": ["{workspaceRoot}/dist/apps/shell"],
      "options": {
        "outputPath": "dist/apps/shell",
        "browser": "apps/shell/src/main.ts",
        "index": "apps/shell/src/index.html",
        "tsConfig": "apps/shell/tsconfig.app.json",
        "assets": [{ "glob": "**/*", "input": "apps/shell/src/assets", "output": "assets" }],
        "styles": ["apps/shell/src/styles.css"]
      },
      "configurations": {
        "production": {
          "security": { "autoCsp": true },
          "outputHashing": "all",
          "budgets": [{ "type": "initial", "maximumWarning": "700kb", "maximumError": "1mb" }],
          "optimization": { "scripts": true, "styles": true, "fonts": false }
        },
        "development": { "optimization": false, "sourceMap": true, "extractLicenses": false },
        "e2e": {
          "optimization": false,
          "sourceMap": true,
          "extractLicenses": false,
          "fileReplacements": [
            {
              "replace": "apps/shell/src/environments/environment.ts",
              "with": "apps/shell/src/environments/environment.e2e.ts"
            }
          ]
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular/build:dev-server",
      "dependsOn": ["configure-environment"],
      "options": { "port": 4200, "host": "127.0.0.1" },
      "configurations": {
        "development": { "buildTarget": "shell:build:development" },
        "production": { "buildTarget": "shell:build:production" },
        "e2e": { "buildTarget": "shell:build:e2e" }
      },
      "defaultConfiguration": "development"
    }
  }
}
````

## apps/shell/src/app/features/auth/register-form/register-form.component.ts (değişti)

````typescript
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
      /><kx-form-field
        fieldId="register-university"
        icon="school"
        autocomplete="organization"
        labelKey="auth.register.university"
        placeholderKey="auth.register.universityPlaceholder"
        [control]="form.controls.university"
        [maxLength]="150"
      /><kx-form-field
        fieldId="register-department"
        icon="code"
        labelKey="auth.register.department"
        placeholderKey="auth.register.departmentPlaceholder"
        [control]="form.controls.department"
        [maxLength]="150"
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
    university: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
    department: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
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
      const { data, error } = await this.api.signUp(v.email.trim(), v.password, v.username.trim(), {
        university: v.university.trim(),
        department: v.department.trim(),
      });
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
````

## apps/shell/src/app/features/posts/post-compose.page.css (eklendi)

````css
:host {
  display: block;
  min-height: 100dvh;
  background: var(--color-bg);
}
.compose-page {
  width: min(100%, 760px);
  margin-inline: auto;
  min-height: 100dvh;
  background: var(--color-surface);
  border-inline: 1px solid var(--color-border);
}
header {
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
h1 {
  font-size: 18px;
  font-weight: 800;
}
form {
  padding: 24px 16px;
}
.attachment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-muted);
  margin-top: 10px;
}
.attachment-preview {
  margin-top: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  overflow: hidden;
}
.attachment-preview img,
.attachment-preview video {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: contain;
  background: var(--color-surface-alt);
}
.compose-error {
  min-height: 52px;
  font-size: 12px;
  line-height: 1.7;
  margin-top: 16px;
}
````

## apps/shell/src/app/features/posts/post-compose.page.html (eklendi)

````html
<div class="compose-page" *transloco="let t">
  <header>
    <button kxButton type="button" emphasis="ghost" [disabled]="busy()" (click)="cancel()">
      {{t('profile.edit.cancel')}}
    </button>
    <h1 id="compose-title" tabindex="-1">{{t('posts.heading')}}</h1>
  </header>
  <form novalidate [attr.aria-busy]="busy() || checking()" (submit)="$event.preventDefault(); publish()">
    <kx-form-field
      fieldId="post-content"
      labelKey="posts.content"
      placeholderKey="posts.placeholder"
      [control]="content"
      [multiline]="true"
      [floating]="true"
      [maxLength]="2000"
    />
    <input
      #attachment
      class="sr-only"
      id="post-file"
      type="file"
      tabindex="-1"
      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
      [attr.aria-label]="t('posts.attach')"
      [disabled]="busy() || checking() || uncertain() || published()"
      (change)="selected($event)"
    />
    <div class="attachment-actions">
      <button
        kxButton
        type="button"
        emphasis="outline"
        [disabled]="busy() || checking() || uncertain() || published()"
        (click)="attachment.click()"
      >
        <kx-icon name="add_photo_alternate" />{{t('posts.attach')}}
      </button>
      @if (file()) {<button
        kxButton
        type="button"
        emphasis="ghost"
        [disabled]="busy() || uncertain() || published()"
        (click)="remove()"
      >
        {{t('media.remove')}}</button
      >}
    </div>
    <p class="hint">{{t('posts.fileHint')}}</p>
    <p class="hint">{{t('media.publicHint')}}</p>
    @if (preview()) {
    <div class="attachment-preview">
      @if (type() === 'video') {<video
        [src]="preview()"
        controls
        playsinline
        preload="metadata"
        [attr.aria-label]="t('media.video')"
      ></video
      >} @else {<img [src]="preview()" [alt]="t('profile.content.mediaAlt')" width="640" height="360" />}
    </div>
    }
    <p class="error-text compose-error" role="alert">{{error() ? t(error()) : ''}}</p>
    <button kxButton type="submit" class="full-width" [busy]="busy()" [disabled]="!canPublish()">
      {{t('posts.publish')}}
    </button>
  </form>
  <kx-confirm-dialog
    #confirmation
    dialogId="post-discard"
    titleKey="posts.discardTitle"
    bodyKey="posts.discardText"
    cancelKey="profile.edit.keepEditing"
    confirmKey="profile.edit.discard"
  />
</div>
````

## apps/shell/src/app/features/posts/post-compose.page.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  IconComponent,
} from '@kampusx/shared/ui';
import { MediaError, MediaService } from '../../core/media.service';
import { PostsService } from '../../core/posts.service';
import { NoticeService } from '../../core/notice.service';
import { AuthService } from '../../core/auth.service';
import { bindProfilePage } from '../profile/profile-page-context';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-compose.page.html',
  styleUrl: './post-compose.page.css',
})
export class PostComposePage {
  private readonly media = inject(MediaService);
  private readonly posts = inject(PostsService);
  private readonly notices = inject(NoticeService);
  private readonly auth = inject(AuthService);
  private readonly epoch = this.auth.sessionEpoch();
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly content = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] });
  private readonly value = toSignal(this.content.valueChanges, { initialValue: '' });
  readonly file = signal<File | undefined>(undefined);
  readonly preview = signal('');
  readonly type = signal<'image' | 'video'>('image');
  readonly busy = signal(false);
  readonly checking = signal(false);
  readonly error = signal('');
  readonly uncertain = signal(false);
  readonly published = signal(false);
  readonly dirty = computed(() => !!this.value() || !!this.file());
  readonly canPublish = computed(
    () =>
      !!(this.value().trim() || this.file()) &&
      !this.busy() &&
      !this.checking() &&
      !this.uncertain() &&
      !this.published(),
  );
  private readonly confirmation = viewChild.required<ConfirmDialogComponent>('confirmation');
  private revision = 0;
  constructor() {
    bindProfilePage('posts.title');
    afterNextRender(() => this.document.getElementById('compose-title')?.focus());
    this.destroyRef.onDestroy(() => this.clearPreview());
  }
  async selected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    input.value = '';
    if (!file || this.busy() || this.uncertain() || this.published()) return;
    const revision = ++this.revision;
    this.checking.set(true);
    this.error.set('');
    try {
      const type = await this.media.validate(file, 'post');
      if (this.destroyRef.destroyed || revision !== this.revision || this.auth.sessionEpoch() !== this.epoch)
        return;
      this.clearPreview();
      this.file.set(file);
      this.type.set(type);
      this.preview.set(this.document.defaultView!.URL.createObjectURL(file));
    } catch (error) {
      if (!this.destroyRef.destroyed && revision === this.revision)
        this.error.set(error instanceof MediaError ? error.key : 'media.errors.upload');
    } finally {
      if (!this.destroyRef.destroyed && revision === this.revision) this.checking.set(false);
    }
  }
  remove(): void {
    if (!this.busy() && !this.uncertain() && !this.published()) {
      this.revision++;
      this.checking.set(false);
      this.clearPreview();
      this.file.set(undefined);
      this.error.set('');
    }
  }
  async publish(): Promise<void> {
    if (!this.canPublish() || this.auth.sessionEpoch() !== this.epoch) return;
    this.content.markAsTouched();
    if (this.content.invalid) {
      this.document.getElementById('post-content')?.focus();
      return;
    }
    this.busy.set(true);
    this.content.disable();
    this.error.set('');
    try {
      await this.posts.publish(this.content.value, this.file());
      if (this.destroyRef.destroyed) return;
      this.published.set(true);
      this.notices.show('posts.saved');
      if (!(await this.router.navigateByUrl('/dashboard'))) this.error.set('posts.navigation');
    } catch (error) {
      if (!this.destroyRef.destroyed && !this.published()) {
        const key = error instanceof MediaError ? error.key : 'media.errors.uncertain';
        this.uncertain.set(key === 'media.errors.uncertain');
        this.error.set(key);
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.busy.set(false);
        if (!this.published()) this.content.enable();
      }
    }
  }
  cancel(): void {
    if (!this.busy()) void this.router.navigateByUrl('/dashboard');
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || this.published() || this.auth.sessionEpoch() !== this.epoch) return true;
    if (this.busy()) return false;
    return this.dirty() || this.checking() ? this.confirmation().ask() : true;
  }
  private clearPreview(): void {
    if (this.preview()) this.document.defaultView?.URL.revokeObjectURL(this.preview());
    this.preview.set('');
  }
}
````

## apps/shell/src/assets/i18n/en.json (değişti)

````json
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
    "home": "Back to home",
    "characterCount": "{{count}} of {{max}} characters"
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
      "success": "Check your email to continue. If this address is eligible for sign-up, a confirmation link will be sent.",
      "university": "University",
      "universityPlaceholder": "Your university’s full name",
      "department": "Department",
      "departmentPlaceholder": "Your department’s name"
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
    "passwordMismatch": "The passwords must match.",
    "maxlength": "Enter no more than {{max}} characters."
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
    "sample": "Sample post",
    "title": "Create post — KampüsX",
    "heading": "Create post",
    "content": "Your post",
    "placeholder": "What’s happening on campus?",
    "attach": "Add photo or video",
    "fileHint": "JPG, PNG, WEBP: 5 MB · MP4, WEBM: 50 MB",
    "publish": "Publish",
    "saved": "Your post was published.",
    "loading": "Loading posts…",
    "empty": "No posts yet. You can create your first post.",
    "author": "KampüsX student",
    "discardTitle": "Discard this post?",
    "discardText": "Your unsaved text and file selection will be discarded.",
    "navigation": "Your post was published. Use Cancel to return to your feed."
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
      "department": "Computer Technologies",
      "explore": "Across campuses"
    },
    "menu": {
      "settings": "Settings",
      "account": "Account",
      "community": "Community"
    },
    "tabs": {
      "university": "University",
      "campus": "Campus",
      "department": "Department",
      "explore": "Explore"
    },
    "nav": {
      "home": "Home",
      "messages": "Messages",
      "search": "Search"
    },
    "feeds": {
      "university": {
        "title": "Around your university",
        "description": "A dedicated feed and filters for this area will appear here."
      },
      "campus": {
        "title": "Life on your campus",
        "description": "A dedicated feed and filters for this area will appear here."
      },
      "department": {
        "title": "Inside your department",
        "description": "A dedicated feed and filters for this area will appear here."
      },
      "explore": {
        "title": "Explore campus life",
        "description": "Text, photos and videos shared on KampüsX."
      }
    },
    "logout": "Sign out",
    "profile": {
      "unnamed": "Student",
      "schoolMissing": "University not added",
      "departmentMissing": "Department not added"
    }
  },
  "profile": {
    "title": "Profile — KampüsX",
    "back": "Back to home",
    "coverAlt": "Profile cover photo",
    "addPhoto": "Add a profile photo",
    "following": "Following",
    "followers": "Followers",
    "facultyMissing": "Faculty not added",
    "joined": "Joined {{date}}",
    "postCount": "{{count}} posts",
    "compose": "Create a post",
    "saved": "Your profile was updated.",
    "drawer": {
      "profile": "Profile",
      "history": "History",
      "community": "Communities",
      "settings": "Settings and privacy",
      "help": "Help Center",
      "open": "Open {{name}}’s profile"
    },
    "tabs": {
      "label": "Profile feeds",
      "posts": "Posts",
      "replies": "Replies",
      "retweets": "Reposts"
    },
    "content": {
      "reply": "Replied to a post",
      "retweet": "Reposted",
      "mediaAlt": "Image attached to the post",
      "visualOnly": "Post interactions are not available yet."
    },
    "actions": {
      "reply": "Reply",
      "retweet": "Repost",
      "like": "Like",
      "views": "Views",
      "bookmark": "Bookmark",
      "share": "Share"
    },
    "empty": {
      "title": "Nothing here yet",
      "text": "Posts in this feed will appear here."
    },
    "edit": {
      "title": "Edit Profile — KampüsX",
      "heading": "Edit Profile",
      "button": "Edit Profile",
      "cancel": "Cancel",
      "save": "Save",
      "name": "Name",
      "bio": "Bio",
      "avatar": "Choose a profile photo",
      "cover": "Choose a cover photo",
      "removeImage": "Remove photo",
      "imageHint": "JPG, PNG or WEBP · Up to 5 MB",
      "readonly": "Account and university details",
      "username": "Username",
      "university": "University",
      "faculty": "Faculty / School",
      "department": "Department",
      "readonlyHint": "Your username and university details are set during registration.",
      "discardTitle": "Discard your changes?",
      "discardText": "Your unsaved name, bio and photo changes will be discarded.",
      "keepEditing": "Keep editing",
      "discard": "Discard changes"
    },
    "errors": {
      "name": "Enter a name with up to 50 characters.",
      "bio": "Your bio can contain up to 160 characters.",
      "image": "This image could not be read. Choose a valid JPG, PNG or WEBP.",
      "type": "Choose an image in JPG, PNG or WEBP format.",
      "size": "The image must be 5 MB or smaller.",
      "resolution": "The image resolution is too high. Choose a smaller image.",
      "upload": "The photo could not be prepared. Please try again.",
      "save": "Your profile could not be updated. Please try again.",
      "navigation": "Your profile was saved. Try opening the profile page again."
    },
    "mock": {
      "posts": {
        "library": "A small plan for finals week: the library, coffee and working through questions together. Anyone from my department want to join?",
        "reply": "Count me in! Keeping our class notes in one place would make things easier for everyone.",
        "club": "A new term, new ideas. Let’s build something together at this week’s campus community meetup.",
        "project": "I shared my first Angular project with my friends. The best part was everything we learned from each other.",
        "replyTwo": "Thursday afternoon works for me. We can meet at the library after class.",
        "week": "My favorite thing about campus is how even an ordinary day can turn into a great conversation."
      }
    }
  },
  "media": {
    "video": "Video attached to the post",
    "retry": "Try again",
    "publicHint": "Uploaded files can be viewed publicly.",
    "errors": {
      "type": "Choose JPG, PNG, WEBP, MP4 or WEBM. Profile photos accept images only.",
      "imageSize": "Images must be 5 MB or smaller.",
      "videoSize": "Videos must be 50 MB or smaller.",
      "invalidVideo": "Choose a valid MP4 or WEBM file.",
      "session": "Your session could not be verified. Sign in again.",
      "upload": "The file could not be uploaded. Check your connection and upload permissions, then try again.",
      "profileRead": "Your profile photos could not be loaded. You can try again.",
      "profileSave": "The photos could not be saved to your profile. Check your permissions and profile details, then try again.",
      "postsRead": "Posts could not be loaded. You can try again.",
      "content": "Add text or a file. Text can contain up to 2000 characters.",
      "postSave": "The post could not be saved. Check your details and posting permissions.",
      "uncertain": "We could not confirm whether your post was published. Check your feed before posting again."
    },
    "remove": "Remove file"
  }
}
````

## apps/shell/src/assets/i18n/tr.json (değişti)

````json
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
    "home": "Ana sayfaya dön",
    "characterCount": "{{count}} / {{max}} karakter"
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
      "success": "Devam etmek için e-postanı kontrol et. Bu adresle kayıt işlemi uygunsa doğrulama bağlantısı gönderilir.",
      "university": "Üniversite",
      "universityPlaceholder": "Üniversitenin tam adı",
      "department": "Bölüm",
      "departmentPlaceholder": "Bölümünün adı"
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
    "passwordMismatch": "Yazdığın şifreler aynı olmalı.",
    "maxlength": "En fazla {{max}} karakter yaz."
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
    "sample": "Örnek gönderi",
    "title": "Gönderi oluştur — KampüsX",
    "heading": "Gönderi oluştur",
    "content": "Gönderin",
    "placeholder": "Kampüste neler oluyor?",
    "attach": "Fotoğraf veya video ekle",
    "fileHint": "JPG, PNG, WEBP: 5 MB · MP4, WEBM: 50 MB",
    "publish": "Paylaş",
    "saved": "Gönderin paylaşıldı.",
    "loading": "Gönderiler yükleniyor…",
    "empty": "Henüz paylaşım yok. İlk gönderini oluşturabilirsin.",
    "author": "KampüsX öğrencisi",
    "discardTitle": "Gönderi taslağı silinsin mi?",
    "discardText": "Kaydetmediğin metin ve dosya seçimi silinecek.",
    "navigation": "Gönderin paylaşıldı. Akışını açmak için İptal düğmesini kullanabilirsin."
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
      "department": "Bilgisayar Teknolojileri",
      "explore": "Bütün kampüsler"
    },
    "menu": {
      "settings": "Ayarlar",
      "account": "Hesap",
      "community": "Topluluk"
    },
    "tabs": {
      "university": "Üniversite",
      "campus": "Kampüs",
      "department": "Bölüm",
      "explore": "Keşfet"
    },
    "nav": {
      "home": "Ana sayfa",
      "messages": "Mesajlar",
      "search": "Ara"
    },
    "feeds": {
      "university": {
        "title": "Üniversitende neler oluyor?",
        "description": "Bu alana özel akış ve filtreleme burada yer alacak."
      },
      "campus": {
        "title": "Kampüsünün gündemi",
        "description": "Bu alana özel akış ve filtreleme burada yer alacak."
      },
      "department": {
        "title": "Bölümündeki konuşmalar",
        "description": "Bu alana özel akış ve filtreleme burada yer alacak."
      },
      "explore": {
        "title": "Kampüsleri keşfet",
        "description": "KampüsX’te paylaşılan yazılar, fotoğraflar ve videolar."
      }
    },
    "logout": "Çıkış yap",
    "profile": {
      "unnamed": "Öğrenci",
      "schoolMissing": "Okul bilgisi eklenmemiş",
      "departmentMissing": "Bölüm bilgisi eklenmemiş"
    }
  },
  "profile": {
    "title": "Profil — KampüsX",
    "back": "Ana sayfaya dön",
    "coverAlt": "Profil kapak fotoğrafı",
    "addPhoto": "Profil fotoğrafı ekle",
    "following": "Takip edilen",
    "followers": "Takipçi",
    "facultyMissing": "Fakülte bilgisi eklenmemiş",
    "joined": "{{date}} tarihinde katıldı",
    "postCount": "{{count}} gönderi",
    "compose": "Gönderi oluştur",
    "saved": "Profilin güncellendi.",
    "drawer": {
      "profile": "Profil",
      "history": "Geçmiş",
      "community": "Topluluklar",
      "settings": "Ayarlar ve gizlilik",
      "help": "Yardım Merkezi",
      "open": "{{name}} profilini aç"
    },
    "tabs": {
      "label": "Profil akışları",
      "posts": "Gönderiler",
      "replies": "Yanıtlar",
      "retweets": "Retweetler"
    },
    "content": {
      "reply": "Bir gönderiyi yanıtladı",
      "retweet": "Yeniden paylaştı",
      "mediaAlt": "Gönderiye eklenen görsel",
      "visualOnly": "Gönderi etkileşimleri henüz kullanıma açık değil."
    },
    "actions": {
      "reply": "Yanıtla",
      "retweet": "Yeniden paylaş",
      "like": "Beğen",
      "views": "Görüntülenme",
      "bookmark": "Kaydet",
      "share": "Paylaş"
    },
    "empty": {
      "title": "Henüz burada bir şey yok",
      "text": "Bu akıştaki gönderiler burada görünecek."
    },
    "edit": {
      "title": "Profili Düzenle — KampüsX",
      "heading": "Profili Düzenle",
      "button": "Profili Düzenle",
      "cancel": "İptal",
      "save": "Kaydet",
      "name": "İsim",
      "bio": "Bio",
      "avatar": "Profil fotoğrafı seç",
      "cover": "Kapak fotoğrafı seç",
      "removeImage": "Fotoğrafı kaldır",
      "imageHint": "JPG, PNG veya WEBP · En fazla 5 MB",
      "readonly": "Hesap ve üniversite bilgileri",
      "username": "Kullanıcı adı",
      "university": "Üniversite",
      "faculty": "Fakülte / Yüksekokul",
      "department": "Bölüm",
      "readonlyHint": "Kullanıcı adı ve üniversite bilgileri kayıt sırasında belirlenir.",
      "discardTitle": "Değişiklikler silinsin mi?",
      "discardText": "Kaydetmediğin isim, bio ve fotoğraf değişiklikleri silinecek.",
      "keepEditing": "Düzenlemeye devam et",
      "discard": "Değişiklikleri sil"
    },
    "errors": {
      "name": "İsim boş olamaz ve en fazla 50 karakter olabilir.",
      "bio": "Bio en fazla 160 karakter olabilir.",
      "image": "Bu görsel okunamadı. Geçerli bir JPG, PNG veya WEBP seç.",
      "type": "JPG, PNG veya WEBP formatında bir görsel seç.",
      "size": "Görsel 5 MB veya daha küçük olmalı.",
      "resolution": "Görsel çözünürlüğü çok yüksek. Daha küçük bir görsel seç.",
      "upload": "Fotoğraf hazırlanamadı. Lütfen tekrar dene.",
      "save": "Profil güncellenemedi. Lütfen tekrar dene.",
      "navigation": "Profilin kaydedildi. Profil sayfasını tekrar açmayı dene."
    },
    "mock": {
      "posts": {
        "library": "Final haftası için küçük bir plan: kütüphane, kahve ve birlikte çözülen sorular. Aynı bölümde çalışmak isteyen var mı?",
        "reply": "Ben de katılıyorum! Ders notlarını tek bir yerde toplamak hepimizin işini kolaylaştırır.",
        "club": "Kampüste yeni dönem, yeni fikirler. Bu haftaki topluluk buluşmasında birlikte bir şeyler üretelim.",
        "project": "İlk Angular projemi arkadaşlarımla paylaştım. En güzel kısmı: birbirimizden öğrendiklerimiz.",
        "replyTwo": "Perşembe öğleden sonra uygun olur. Ders çıkışında kütüphanede buluşabiliriz.",
        "week": "Kampüsün en sevdiğim tarafı, sıradan bir günün bile güzel bir sohbete dönüşebilmesi."
      }
    }
  },
  "media": {
    "video": "Gönderiye eklenen video",
    "retry": "Tekrar dene",
    "publicHint": "Yüklediğin dosyalar herkese açık olarak görüntülenebilir.",
    "errors": {
      "type": "JPG, PNG, WEBP, MP4 veya WEBM seç. Profil fotoğraflarında yalnızca görseller kullanılabilir.",
      "imageSize": "Görsel en fazla 5 MB olabilir.",
      "videoSize": "Video en fazla 50 MB olabilir.",
      "invalidVideo": "Geçerli bir MP4 veya WEBM dosyası seç.",
      "session": "Oturumun doğrulanamadı. Yeniden giriş yap.",
      "upload": "Dosya yüklenemedi. Bağlantını ve yükleme izinlerini kontrol edip tekrar dene.",
      "profileRead": "Profil fotoğrafların yüklenemedi. Tekrar deneyebilirsin.",
      "profileSave": "Fotoğraflar profil kaydına yazılamadı. İzinlerini ve profil bilgilerini kontrol edip tekrar dene.",
      "postsRead": "Gönderiler yüklenemedi. Tekrar deneyebilirsin.",
      "content": "Bir metin veya dosya ekle. Metin en fazla 2000 karakter olabilir.",
      "postSave": "Gönderi kaydedilemedi. Bilgilerini ve paylaşım izinlerini kontrol et.",
      "uncertain": "Paylaşımın sonucu doğrulanamadı. Tekrar paylaşmadan önce akışını kontrol et."
    },
    "remove": "Dosyayı kaldır"
  }
}
````

## apps/shell/src/styles.css (değişti)

````css
@import 'tailwindcss' source(none);
@import '../../../libs/shared/ui/styles.css';
@import '../../../libs/shared/design-tokens/tokens.css';
@config '../../../tailwind.config.cjs';
@source './app';
@source '../../../libs/shared/ui';

@layer base {
  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }
  * {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
    scrollbar-gutter: stable;
    scroll-padding-top: 100px;
  }
  body {
    margin: 0;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
    transition:
      background-color var(--motion-fast),
      color var(--motion-fast);
  }
  h1,
  h2,
  h3,
  p,
  figure,
  blockquote {
    margin: 0;
  }
  h1,
  h2,
  h3 {
    text-wrap: balance;
  }
  button,
  input,
  a {
    -webkit-tap-highlight-color: transparent;
  }
  button,
  a {
    touch-action: manipulation;
  }
  button {
    cursor: pointer;
    font: inherit;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  input {
    font: inherit;
  }
  :focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 4px;
  }
  ::selection {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-scroll-thumb) var(--color-bg);
  }
  *::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  *::-webkit-scrollbar-track {
    background: var(--color-bg);
  }
  *::-webkit-scrollbar-thumb {
    background: var(--color-scroll-thumb);
    border: 2px solid var(--color-bg);
    border-radius: 8px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: var(--color-scroll-hover);
  }
  *::-webkit-scrollbar-thumb:active {
    background: var(--color-scroll-active);
  }
  section[id],
  div[id] {
    scroll-margin-top: 100px;
  }
}

.page-container {
  width: min(var(--page-max), calc(100% - 80px));
  margin-inline: auto;
}
.section-space {
  padding-block: 90px;
}
.skip-link {
  position: fixed;
  left: 16px;
  top: -100px;
  z-index: 100;
  padding: 12px 20px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-control);
}
.skip-link:focus {
  top: 12px;
}
.mono-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.015em;
}

/* Layout chrome stays quieter than the campaign poster. */
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(18px);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 82px;
}
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 28px;
  font-size: 12px;
  font-weight: 600;
}
.desktop-nav a {
  padding-block: 12px;
}
.desktop-nav a:hover {
  color: var(--color-primary);
}
.header-actions,
.desktop-settings {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-rule {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}
.menu-button,
.mobile-menu {
  display: none;
}
.hero-section {
  padding-top: 28px;
}
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 28px;
  align-items: stretch;
}
.hero-poster {
  display: flex;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 5px 28px 5px 28px;
  color: var(--color-poster-text);
  background: linear-gradient(135deg, var(--color-poster), var(--color-poster-end));
}
.hero-content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  position: relative;
  padding: 32px 36px 20px;
}
.poster-orbit {
  position: absolute;
  width: 570px;
  height: 570px;
  right: -310px;
  top: -130px;
  border: 1px solid var(--color-poster-line);
  border-radius: 50%;
  box-shadow:
    0 0 0 55px color-mix(in srgb, var(--color-poster-line) 12%, transparent),
    0 0 0 110px color-mix(in srgb, var(--color-poster-line) 8%, transparent);
}
.poster-grain {
  position: absolute;
  inset: 0;
  opacity: 0.13;
  background-image: radial-gradient(var(--color-poster-text) 0.6px, transparent 0.6px);
  background-size: 5px 5px;
  pointer-events: none;
}
.hero-poster::after {
  content: '';
  position: absolute;
  z-index: -1;
  bottom: 10%;
  left: -15%;
  width: 70%;
  aspect-ratio: 1;
  background: var(--color-poster-glow);
  filter: blur(95px);
  opacity: 0.45;
}
.hero-live {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.hero-live .kx-badge {
  border-color: var(--color-poster-line);
  color: var(--color-poster-text);
  font-size: 9px;
  background: color-mix(in srgb, var(--color-poster-end) 35%, transparent);
}
.live-dot {
  height: 5px;
  width: 5px;
  background: var(--color-yellow);
  border-radius: 50%;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-yellow) 13%, transparent);
  animation: pulse 3s ease-in-out infinite;
}
.live-count {
  color: var(--color-poster-muted);
  font-size: 9px;
  font-family: var(--font-mono);
}
.hero-poster h1 {
  margin-top: 22px;
  margin-bottom: 18px;
  font-size: clamp(36px, 4.4vw, 66px);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1.1;
}
.hero-poster h1 > span {
  display: block;
}
.hero-poster h1 > span:last-child {
  font-size: 0.85em;
}
.headline-gradient {
  background: linear-gradient(90deg, var(--color-poster-text), var(--color-poster-muted));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-description {
  color: var(--color-poster-muted);
  font-size: 12px;
  line-height: 1.8;
  max-width: 470px;
}
.hero-description strong {
  color: var(--color-poster-text);
  font-weight: 700;
}
.poster-scene {
  flex: 1;
  min-height: 440px;
  position: relative;
  margin-top: 20px;
}
.scene-photo {
  position: absolute;
  z-index: 2;
  top: 26px;
  left: 0;
  width: 52%;
  transform: rotate(-5deg);
}
.scene-anonymous {
  position: absolute;
  z-index: 3;
  top: 18px;
  right: -3px;
  width: 48%;
  transform: rotate(5deg);
}
.scene-poll {
  position: absolute;
  z-index: 4;
  top: 215px;
  left: 19px;
  width: 49%;
  transform: rotate(3deg);
}
.scene-video {
  position: absolute;
  z-index: 2;
  top: 184px;
  right: -8px;
  width: 45%;
  transform: rotate(-4deg);
}
.scene-sticker {
  position: absolute;
  top: -14px;
  left: 41%;
  z-index: 5;
  padding: 9px 13px;
  font-size: 11px;
  transform: rotate(-9deg);
}
.scene-round {
  position: absolute;
  z-index: 5;
  right: -18px;
  top: 134px;
  width: 69px;
  height: 69px;
  font-size: 9px;
  box-shadow: 3px 3px 0 var(--color-ink);
}
.scene-doodle {
  position: absolute;
  font-size: 50px;
  color: var(--color-poster-muted);
  left: -14px;
  bottom: 4px;
  transform: rotate(10deg);
}
.poster-footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 13px;
  border-top: 1px solid var(--color-poster-line);
  color: var(--color-poster-muted);
  font-family: var(--font-mono);
  font-size: 9px;
}
.poster-footnote > span:first-child {
  display: flex;
  align-items: center;
  gap: 6px;
}
.poster-footnote .material-symbols-outlined {
  font-size: 15px;
}
.hero-auth {
  display: flex;
  min-width: 0;
}
.hero-auth > kx-auth-panel {
  display: flex;
  flex: 1;
  min-width: 0;
}
.hero-auth .auth-panel {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
.hero-auth .auth-trust {
  margin-top: auto;
}
.auth-side-note {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  padding: 20px 0 0;
}
.auth-side-note p {
  font-size: 10px;
  max-width: 160px;
  line-height: 1.6;
  color: var(--color-muted);
}
.tiny-avatars {
  display: inline-flex;
  padding-left: 8px;
}
.tiny-avatars > span {
  width: 28px;
  height: 28px;
  font-size: 20px;
  margin-left: -8px;
  border: 2px solid var(--color-bg);
  border-radius: 50%;
  background: var(--color-soft-yellow);
  overflow: hidden;
}
.micro-features {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 26px;
  padding: 26px 0 35px;
}
.discover-link {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  font-size: 10px;
  color: var(--color-muted);
}
.discover-link:hover {
  color: var(--color-primary);
}

/* Local auth states: no request, no account/session persistence. */
.auth-panel {
  padding: 32px 32px 25px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
}
.auth-heading {
  margin-bottom: 23px;
  position: relative;
}
.auth-mark {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-primary);
  background: var(--color-soft-primary);
  width: 43px;
  height: 43px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.auth-mark .material-symbols-outlined {
  font-size: 25px;
}
.auth-heading .mono-label {
  color: var(--color-muted);
  font-size: 10px;
}
.auth-heading h2 {
  font-size: clamp(24px, 2.05vw, 30px);
  font-weight: 800;
  letter-spacing: -1px;
  margin: 5px 0 8px;
  line-height: 1.25;
}
.auth-heading > p:last-child {
  color: var(--color-muted);
  font-size: 11px;
}
.auth-tabs {
  display: flex;
  background: var(--color-surface-alt);
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 23px;
}
.auth-tabs button {
  flex: 1;
  min-height: 39px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  background: transparent;
}
.auth-tabs button.active {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-border);
  box-shadow: 0 2px 4px color-mix(in srgb, var(--color-ink) 5%, transparent);
}
.auth-tabs button:hover {
  color: var(--color-primary);
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 24px;
}
.form-options .text-button {
  font-size: 10px;
}
.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 10px;
  color: var(--color-muted);
  cursor: pointer;
}
.checkbox-label input {
  width: 15px;
  height: 15px;
  margin-top: 1px;
  flex-shrink: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.consent-label {
  margin-top: 14px;
  font-size: 9px;
}
.auth-bottom {
  text-align: center;
  font-size: 10px;
  color: var(--color-muted);
}
.auth-bottom .text-button {
  font-size: 10px;
}
.form-status {
  min-height: 24px;
  padding-top: 8px;
}
.success-message {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 10px;
  line-height: 1.6;
  color: var(--color-success);
  padding: 9px 0;
}
.success-message .kx-icon {
  width: 17px;
}
.success-message .material-symbols-outlined {
  font-size: 17px;
}
.auth-trust {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 9px;
  padding-top: 19px;
  margin-top: 20px;
}
.auth-trust .material-symbols-outlined {
  font-size: 16px;
}
.auth-trust .kx-icon {
  width: 17px;
}
.demo-note {
  color: var(--color-muted);
  font-size: 8px;
  text-align: center;
  line-height: 1.6;
  margin-top: 9px;
}
.google-button {
  font-size: 10px;
  padding-inline: 10px;
}
.google-g {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
}
.form-divider {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 9px;
  color: var(--color-muted);
  margin-block: 17px;
}
.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.legal-links {
  display: flex;
  gap: 9px;
  font-size: 9px;
  margin-bottom: 15px;
}
.legal-links .text-button {
  font-size: 9px;
}
.info-message {
  background: var(--color-soft-primary);
  border-left: 3px solid var(--color-primary);
  color: var(--color-text);
  padding: 10px;
  font-size: 10px;
  margin-block: 12px;
}
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
}
.reset-success {
  text-align: center;
  padding-block: 20px;
}
.reset-success h3 {
  margin-bottom: 7px;
  font-size: 21px;
  font-weight: 800;
}
.reset-success p {
  font-size: 11px;
  color: var(--color-muted);
  margin-block: 16px 22px;
}
.reset-address {
  overflow-wrap: anywhere;
  font-size: 12px;
}
.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 18px;
  background: var(--color-soft-accent);
  border-radius: 50%;
  color: var(--color-success);
}
.success-icon .material-symbols-outlined {
  font-size: 31px;
}
.standalone-auth {
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 70px;
  align-items: center;
  padding-block: 70px;
}
.auth-poster {
  position: relative;
  background: var(--color-poster);
  padding: 60px;
  border-radius: var(--radius-panel);
  color: var(--color-poster-text);
}
.auth-poster > .kx-icon {
  margin-bottom: 30px;
}
.auth-poster h1 {
  font-size: 58px;
  font-weight: 800;
  letter-spacing: -2px;
  line-height: 1.1;
  white-space: pre-line;
}
.auth-poster p {
  color: var(--color-poster-muted);
  margin-top: 25px;
}
.auth-poster .kx-sticker {
  margin-top: 30px;
}

/* The ticker has a pause control and stops on hover, focus and reduced motion. */

/* Numbered editorial chapters reflect the brief, with original campus artwork. */
.section-kicker {
  display: flex;
  align-items: center;
  gap: 15px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-muted);
  margin-bottom: 28px;
}
.section-kicker > span:first-child {
  color: var(--color-primary);
  font-weight: 600;
}
.section-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.about-intro {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 90px;
  align-items: start;
  margin-bottom: 44px;
}
.about-intro h2,
.communities-heading h2 {
  font-size: clamp(34px, 3.6vw, 52px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -2px;
  white-space: pre-line;
}
.about-intro > div > p {
  font-size: 13px;
  color: var(--color-muted);
  max-width: 430px;
  line-height: 1.9;
}
.about-intro blockquote {
  border-left: 3px solid var(--color-primary);
  padding-left: 18px;
  margin-top: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  max-width: 420px;
}
.about-intro blockquote > span {
  font-size: 43px;
  color: var(--color-primary);
}
.sharing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}
.share-block {
  padding: 24px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.share-photo {
  background: var(--color-soft-accent);
}
.share-video {
  background: var(--color-soft-indigo);
}
.share-text {
  background: var(--color-soft-yellow);
}
.share-visual {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 15px;
}
.photo-frame {
  padding: 8px 8px 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transform: rotate(-8deg);
  box-shadow: 7px 8px 0 color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-radius: 3px;
}
.photo-frame .kx-icon {
  width: 110px;
  height: 80px;
  background: var(--color-soft-accent);
  color: var(--color-accent);
}
.photo-frame .material-symbols-outlined {
  font-size: 70px;
}
.photo-heart {
  position: absolute;
  right: 20%;
  top: 10%;
  font-size: 42px;
  color: var(--color-accent);
  transform: rotate(12deg);
}
.reel-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 124px;
  border: 5px solid var(--color-text);
  border-radius: 14px;
  transform: rotate(10deg);
  background: linear-gradient(145deg, var(--color-indigo), var(--color-poster));
  box-shadow: -8px 8px 0 color-mix(in srgb, var(--color-indigo) 15%, transparent);
}
.reel-screen .material-symbols-outlined {
  font-size: 35px;
  color: var(--color-poster-text);
}
.reel-star {
  position: absolute;
  top: 0;
  left: 20%;
  color: var(--color-indigo);
  font-size: 50px;
}
.chat-bubble {
  width: 115px;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 100px;
  font-family: Georgia, serif;
  line-height: 1;
  padding-top: 32px;
  border-radius: 20px 20px 20px 0;
  color: var(--color-ink);
  background: var(--color-yellow);
  transform: rotate(-7deg);
  box-shadow: 6px 8px 0 color-mix(in srgb, var(--color-ink) 15%, transparent);
}
.small-chat {
  position: absolute;
  right: 20%;
  top: 8px;
  font-size: 40px;
  transform: rotate(13deg);
  color: var(--color-text);
}
.share-block > .kx-icon {
  color: var(--color-muted);
  margin-bottom: 9px;
}
.share-block h3 {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.share-block p {
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-muted);
}
.interaction-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 22px 0 35px;
  font-size: 11px;
  color: var(--color-muted);
}
.feed-showcase {
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  gap: 65px;
  border-top: 1px solid var(--color-border);
  padding-top: 44px;
}
.feed-explanation > .kx-badge {
  color: var(--color-primary);
  background: var(--color-soft-primary);
  border-color: transparent;
}
.feed-explanation h3 {
  font-size: 31px;
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: -1px;
  margin-block: 15px;
  max-width: 350px;
}
.feed-explanation > p {
  font-size: 12px;
  color: var(--color-muted);
}
.feed-trust {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-top: 28px;
  font-size: 10px;
  color: var(--color-muted);
  max-width: 340px;
}
.feed-trust .kx-icon {
  color: var(--color-primary);
}
.feed-preview {
  background: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-panel);
}
.feed-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  padding-inline: 14px;
}
.feed-tabs button {
  flex: 1;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--color-muted);
  padding: 16px 5px 13px;
  font-size: 10px;
  font-weight: 700;
}
.feed-tabs button.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}
.feed-tabs button:hover {
  background: var(--color-soft-primary);
}
.sample-feed {
  padding: 25px;
  min-height: 210px;
}
.feed-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.feed-meta > div:nth-child(2) {
  flex: 1;
}
.feed-meta strong {
  display: block;
  font-size: 11px;
}
.feed-meta span:not(.post-avatar) {
  font-size: 9px;
  color: var(--color-muted);
}
.feed-meta > .kx-icon {
  color: var(--color-primary);
}
.sample-feed > p {
  font-size: 14px;
  line-height: 1.8;
  padding-block: 20px;
  min-height: 85px;
}
.feed-footer {
  display: flex;
  align-items: center;
  gap: 25px;
  color: var(--color-muted);
}
.feed-footer > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
}
.feed-footer .material-symbols-outlined {
  font-size: 16px;
}
.stats-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 30px;
  padding-block: 36px 0;
  margin-top: 36px;
  border-top: 1px solid var(--color-border);
  align-items: center;
}
.sample-label {
  font-family: var(--font-mono);
  color: var(--color-muted);
  font-size: 9px;
}

.communities-section {
  background: var(--color-surface-alt);
  border-block: 1px solid var(--color-border);
}
.communities-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 50px;
  margin-bottom: 36px;
}
.communities-heading p {
  max-width: 540px;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.8;
  margin-top: 17px;
}
.communities-heading .kx-sticker {
  margin-right: 25px;
  flex-shrink: 0;
}
.community-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.collection-note {
  color: var(--color-muted);
  font-size: 9px;
  font-family: var(--font-mono);
  text-align: right;
  margin-top: 16px;
}
.academic-panel {
  display: grid;
  grid-template-columns: 0.9fr 1.2fr;
  gap: 75px;
  padding: 42px;
  margin-top: 55px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}
.academic-intro .mono-label {
  color: var(--color-primary);
}
.academic-intro h3 {
  font-size: 35px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1.2px;
  white-space: pre-line;
  margin-block: 13px;
}
.academic-intro > p:not(.mono-label) {
  font-size: 11px;
  color: var(--color-muted);
  max-width: 300px;
}
.academic-intro .kx-button {
  font-size: 10px;
  margin-top: 23px;
}
.academic-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 35px 25px;
  align-content: center;
  position: relative;
  z-index: 1;
}
.academic-features .micro-feature {
  align-items: flex-start;
}
.academic-features .feature-icon {
  width: 37px;
  height: 37px;
}
.academic-features .micro-feature h3 {
  font-size: 11px;
}
.academic-features .micro-feature p {
  font-size: 9px;
  line-height: 1.6;
}
.academic-asterisk {
  position: absolute;
  right: -20px;
  bottom: -76px;
  font-size: 240px;
  line-height: 1;
  color: var(--color-soft-primary);
  transform: rotate(15deg);
}

.closing-cta {
  position: relative;
  overflow: hidden;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: 24px 6px 24px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 55px 60px;
  margin-block: 75px;
  isolation: isolate;
}
.cta-content {
  position: relative;
  z-index: 1;
}
.cta-content .mono-label {
  opacity: 0.9;
}
.cta-content h2 {
  font-size: clamp(40px, 4.1vw, 58px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -2px;
  white-space: pre-line;
  margin-block: 15px 20px;
}
.cta-content > p:last-child {
  font-size: 11px;
  opacity: 0.9;
  max-width: 350px;
}
.cta-action {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}
.cta-action .kx-sticker {
  font-size: 14px;
  transform: rotate(6deg);
  margin-bottom: 20px;
}
.cta-action .kx-button {
  background: var(--color-on-primary);
  color: var(--color-primary);
  min-width: 220px;
}
.cta-action > span {
  font-size: 9px;
  font-family: var(--font-mono);
}
.cta-orbit {
  position: absolute;
  width: 420px;
  height: 420px;
  border: 1px solid currentColor;
  border-radius: 50%;
  opacity: 0.15;
  right: 12%;
  bottom: -230px;
  box-shadow:
    0 0 0 35px color-mix(in srgb, var(--color-on-primary) 20%, transparent),
    0 0 0 70px color-mix(in srgb, var(--color-on-primary) 15%, transparent);
}
.site-footer {
  padding-bottom: 30px;
}
.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 30px;
}
.footer-top nav {
  display: flex;
  align-items: center;
  gap: 25px;
  font-size: 10px;
  color: var(--color-muted);
}
.footer-top nav button {
  font: inherit;
  border: 0;
  background: none;
  color: inherit;
  padding-block: 10px;
}
.footer-top nav a:hover,
.footer-top nav button:hover {
  color: var(--color-primary);
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding-top: 21px;
  font-size: 8px;
  color: var(--color-muted);
  font-family: var(--font-mono);
}
.not-found {
  padding-block: 100px;
}
.not-found h1 {
  font-size: 40px;
  font-weight: 800;
}
.not-found a {
  color: var(--color-primary);
  text-decoration: underline;
  display: inline-block;
  margin-top: 25px;
}
[kxReveal] {
  transition:
    opacity var(--motion-reveal),
    transform var(--motion-reveal);
}
.reveal-pending {
  opacity: 0;
  transform: translateY(20px);
}
@keyframes pulse {
  50% {
    box-shadow: 0 0 0 7px color-mix(in srgb, var(--color-yellow) 5%, transparent);
  }
}

@media (min-width: 1500px) {
  .hero-poster h1 {
    font-size: 70px;
  }
  .poster-scene {
    min-height: 450px;
  }
}
@media (max-width: 1150px) {
  .page-container {
    width: calc(100% - 48px);
  }
  .desktop-nav {
    gap: 17px;
    font-size: 11px;
  }
  .header-actions,
  .desktop-settings {
    gap: 10px;
  }
  .hero-grid {
    gap: 24px;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  }
  .hero-content {
    padding: 26px 24px 18px;
  }
  .auth-panel {
    padding: 26px 23px;
  }
  .hero-poster h1 {
    font-size: 51px;
  }
  .live-count {
    font-size: 8px;
  }
  .poster-scene {
    min-height: 445px;
  }
  .scene-photo {
    width: 58%;
    left: -7px;
  }
  .scene-anonymous {
    width: 51%;
    right: -7px;
    top: 24px;
  }
  .scene-poll {
    width: 55%;
    left: -4px;
    top: 238px;
  }
  .scene-video {
    width: 50%;
    right: -10px;
    top: 212px;
  }
  .scene-round {
    right: -14px;
    top: 155px;
  }
  .community-grid {
    gap: 13px;
  }
  .micro-features {
    gap: 16px;
  }
  .discover-link {
    font-size: 9px;
    gap: 6px;
  }
  .academic-panel {
    gap: 35px;
  }
  .about-intro {
    gap: 40px;
  }
  .feed-showcase {
    gap: 40px;
  }
}
@media (max-width: 900px) {
  .desktop-nav {
    display: none;
  }
  .header-inner {
    height: 74px;
  }
  .menu-button {
    display: inline-flex;
  }
  .mobile-menu {
    display: block;
    padding: 12px 24px 20px;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }
  .mobile-menu nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px 20px;
  }
  .mobile-menu nav a {
    padding: 10px;
    border-radius: 8px;
    font-size: 12px;
  }
  .mobile-menu nav a:hover {
    background: var(--color-soft-primary);
  }
  .mobile-settings {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-top: 15px;
  }
  .hero-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 18px;
  }
  .hero-poster h1 {
    font-size: 43px;
  }
  .hero-content {
    padding: 24px 20px 18px;
  }
  .hero-description {
    font-size: 10px;
  }
  .hero-live {
    gap: 7px;
  }
  .poster-scene {
    min-height: 460px;
  }
  .scene-photo {
    width: 80%;
    left: -5px;
    top: 35px;
  }
  .scene-anonymous {
    width: 78%;
    right: -3px;
    top: 221px;
  }
  .scene-poll {
    display: none;
  }
  .scene-video {
    width: 61%;
    right: -9px;
    top: 330px;
  }
  .scene-round {
    left: -10px;
    top: 344px;
  }
  .scene-sticker {
    left: auto;
    right: 0;
    top: 7px;
  }
  .auth-panel {
    padding: 24px 20px;
  }
  .auth-heading h2 {
    font-size: 25px;
  }
  .form-options {
    flex-wrap: wrap;
    gap: 8px;
  }
  .micro-features {
    grid-template-columns: repeat(3, 1fr);
  }
  .discover-link {
    display: none;
  }
  .about-intro h2,
  .communities-heading h2 {
    font-size: 40px;
  }
  .community-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  .academic-panel {
    gap: 30px;
    padding: 30px;
  }
  .academic-features {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .feed-showcase {
    gap: 30px;
    grid-template-columns: 0.8fr 1fr;
  }
  .sharing-grid {
    gap: 15px;
  }
  .share-block {
    padding: 20px;
  }
  .share-block h3 {
    font-size: 16px;
  }
  .stats-strip {
    grid-template-columns: repeat(3, 1fr);
  }
  .sample-label {
    grid-column: 1/-1;
    text-align: right;
  }
  .closing-cta {
    padding: 40px;
  }
  .cta-action .kx-button {
    min-width: 190px;
  }
  .footer-top nav {
    gap: 15px;
  }
  .standalone-auth {
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  .auth-poster {
    padding: 40px 25px;
  }
  .auth-poster h1 {
    font-size: 42px;
  }
}
@media (max-width: 640px) {
  .page-container {
    width: calc(100% - 32px);
  }
  .section-space {
    padding-block: 55px;
  }
  .header-inner {
    height: 66px;
  }
  .desktop-settings {
    display: none;
  }
  .header-actions {
    gap: 8px;
  }
  .hero-section {
    padding-top: 20px;
  }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .hero-content {
    padding: 26px 23px 17px;
  }
  .hero-poster h1 {
    font-size: clamp(35px, 9vw, 55px);
    letter-spacing: -0.055em;
  }
  .hero-description {
    font-size: 11px;
    max-width: 390px;
  }
  .hero-live {
    gap: 10px;
  }
  .hero-live .kx-badge {
    font-size: 8px;
  }
  .live-count {
    font-size: 7px;
  }
  .poster-scene {
    min-height: 348px;
    margin-top: 19px;
  }
  .scene-photo {
    width: 62%;
    left: -6px;
    top: 24px;
  }
  .scene-anonymous {
    width: 59%;
    right: -6px;
    top: 190px;
  }
  .scene-video {
    width: 47%;
    right: -8px;
    top: 52px;
  }
  .scene-poll {
    display: none;
  }
  .scene-sticker {
    left: 41%;
    right: auto;
    top: 0;
    font-size: 9px;
    padding: 7px 10px;
  }
  .scene-round {
    left: -2px;
    top: 268px;
    width: 61px;
    height: 61px;
    font-size: 8px;
  }
  .scene-doodle {
    display: none;
  }
  .auth-panel {
    padding: 25px;
    border-radius: 20px;
  }
  .auth-heading h2 {
    font-size: 29px;
  }
  .auth-heading > p:last-child {
    font-size: 12px;
  }
  .auth-heading .mono-label {
    font-size: 10px;
  }
  .auth-side-note {
    padding: 18px 0 0;
  }
  .form-options {
    flex-wrap: nowrap;
  }
  .form-options .text-button,
  .checkbox-label,
  .auth-bottom,
  .auth-bottom .text-button {
    font-size: 11px;
  }
  .auth-trust {
    font-size: 10px;
  }
  .demo-note {
    font-size: 9px;
  }
  .google-button {
    font-size: 10px;
  }
  .micro-features {
    grid-template-columns: 1fr;
    gap: 17px;
    padding-block: 5px 25px;
  }
  .about-intro {
    grid-template-columns: 1fr;
    gap: 25px;
    margin-bottom: 30px;
  }
  .about-intro h2,
  .communities-heading h2 {
    font-size: 37px;
    letter-spacing: -1.6px;
  }
  .about-intro > div > p {
    font-size: 12px;
  }
  .about-intro blockquote {
    font-size: 15px;
  }
  .section-kicker {
    font-size: 9px;
    margin-bottom: 20px;
  }
  .sharing-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .share-block {
    position: relative;
    min-height: 154px;
    padding: 24px 43% 24px 22px;
  }
  .share-visual {
    position: absolute;
    top: 15px;
    right: 12px;
    width: 39%;
    height: 120px;
    margin: 0;
  }
  .photo-frame .kx-icon {
    width: 80px;
    height: 65px;
  }
  .photo-frame .material-symbols-outlined {
    font-size: 50px;
  }
  .photo-heart {
    right: 0;
    font-size: 30px;
  }
  .reel-screen {
    height: 106px;
    width: 68px;
  }
  .reel-star {
    left: 0;
    font-size: 34px;
  }
  .chat-bubble {
    height: 75px;
    width: 90px;
    font-size: 80px;
  }
  .small-chat {
    right: 0;
    top: 0;
    font-size: 30px;
  }
  .share-block h3 {
    font-size: 18px;
  }
  .share-block p {
    font-size: 10px;
  }
  .interaction-note {
    align-items: flex-start;
    padding-block: 20px 30px;
    font-size: 10px;
  }
  .feed-showcase {
    grid-template-columns: 1fr;
    gap: 25px;
    padding-top: 30px;
  }
  .feed-explanation h3 {
    font-size: 30px;
    max-width: 100%;
  }
  .feed-trust {
    padding-top: 18px;
    max-width: 100%;
  }
  .feed-tabs {
    padding-inline: 5px;
  }
  .feed-tabs button {
    font-size: 9px;
  }
  .sample-feed {
    padding: 20px;
  }
  .sample-feed > p {
    font-size: 13px;
  }
  .stats-strip {
    gap: 18px;
    margin-top: 25px;
    padding-top: 25px;
  }
  .communities-heading {
    gap: 15px;
    align-items: flex-start;
  }
  .communities-heading > div {
    flex: 1;
  }
  .communities-heading p {
    font-size: 11px;
  }
  .communities-heading .kx-sticker {
    display: none;
  }
  .community-grid {
    gap: 12px;
  }
  .academic-panel {
    margin-top: 35px;
    grid-template-columns: 1fr;
    padding: 26px 22px;
    gap: 30px;
  }
  .academic-intro h3 {
    font-size: 32px;
  }
  .academic-features {
    grid-template-columns: 1fr;
    gap: 22px;
  }
  .academic-features .micro-feature h3 {
    font-size: 12px;
  }
  .academic-features .micro-feature p {
    font-size: 10px;
  }
  .closing-cta {
    margin-block: 40px;
    padding: 35px 26px;
    flex-direction: column;
    align-items: flex-start;
    gap: 30px;
  }
  .cta-content h2 {
    font-size: 43px;
  }
  .cta-action {
    align-items: flex-start;
    width: 100%;
    gap: 12px;
  }
  .cta-action .kx-sticker {
    position: absolute;
    right: 0;
    top: -80px;
    padding: 10px;
    font-size: 10px;
    transform: rotate(10deg);
  }
  .cta-action .kx-button {
    width: 100%;
  }
  .cta-action > span {
    font-size: 8px;
  }
  .footer-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 25px;
  }
  .footer-top nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
  }
  .footer-bottom {
    flex-wrap: wrap;
    font-size: 7px;
  }
  .footer-bottom > span:last-child {
    width: 100%;
  }
  .standalone-auth {
    grid-template-columns: 1fr;
    gap: 24px;
    padding-block: 30px;
  }
  .auth-poster {
    padding: 28px;
  }
  .auth-poster h1 {
    font-size: 38px;
  }
  .auth-poster > .kx-icon {
    margin-bottom: 15px;
  }
  .auth-poster p {
    font-size: 12px;
  }
  .auth-poster .kx-sticker {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
  .reveal-pending {
    opacity: 1;
    transform: none;
  }
}
@media (forced-colors: active) {
  * {
    scrollbar-color: auto;
  }
  .headline-gradient {
    background: none;
    color: CanvasText;
  }
  .hero-poster {
    background: Canvas;
    color: CanvasText;
  }
  .hero-description,
  .live-count {
    color: CanvasText;
  }
}
````

## docs/GUVENLIK-INCELEMESI-2026-10-14.md (eklendi)

````markdown
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
````

## docs/GUVENLIK-INCELEMESI-2026-10-15.md (eklendi)

````markdown
# KampüsX — güvenlik incelemesi, 15 Ekim 2026

## Sonuç ve kapsam

İnceleme mevcut Angular/Nx uygulamasının Auth, profil, gerçek Storage/gönderi entegrasyonu, veri sahipliği, dosya doğrulama, XSS/CSP, environment ve bağımlılık alanlarını kapsar. Mevcut tablo yapısı, bucket ve gerçek giriş akışı korunmuştur. Yeni tablo oluşturulmadı; canlı kullanıcı, gönderi, dosya veya policy değişikliği yapılmadı. Canlıya deploy/Git push yapılmadı.

Bu çalışma, aşağıda kanıtlanan istemci sorunlarını ve savunma eksiklerini giderir. Canlı Supabase policy/trigger/hook/rol ayarlarına yönetici erişimi olmadan tüm sistemin güvenli olduğu iddia edilmez. Frontend kontrolleri, doğrudan API çağıran bir saldırganı tek başına durduramaz.

## Düzeltilen bulgular

| Bulgu                                                              | Koşul / etkisi                                                                                                                                                                                                                                                                                                                  | Düzeltme                                                                                                                                                                                                      | Kanıt                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Profil repository'si runtime payload'ını doğrudan API'ye veriyordu | TypeScript tipi çalışma anında koruma sağlamaz. Beklenmeyen bir çağıran `user_id`, `role` gibi ek alanlar gönderebiliyordu; INSERT spread'i kullanıcı kimliğini de ezebiliyordu. Mevcut normal UI zaten dar payload kullanıyordu; buradan mevcut canlı RLS'nin aşıldığı veya bir hesabın ele geçirilebildiği sonucu çıkarılmaz. | Payload, await öncesinde yalnız avatar_url/banner_url kopyasıdır. INSERT user_id'si yalnız doğrulanmış oturum sahibidir. Çağıranın nesneyi bekleme sırasında değiştirmesi isteği değiştirmez.                 | Düzeltme öncesinde başarısız, sonrasında başarılı negatif test; ekstra kolonların API payload'ına taşınmadığı doğrulandı. |
| Bekleyen işlemler yalnız kullanıcı kimliğine bağlıydı              | Aynı hesaptan çıkıp yeniden girildiğinde eski yükleme/sorgu aynı uid ile geçerli sayılabiliyordu. Gecikmiş logout/password yanıtı yeni hesabın oturumunu temizleyebilirdi.                                                                                                                                                      | Auth sessionEpoch eklenir. Logout ve yeni oturum eski işi geçersiz kılar; sıradan token refresh etkilemez. Upload, DB yazısı ve yanıt sonrası kontrol yapılır. Yeni hesabın oturumu eski yanıtla temizlenmez. | Aynı kullanıcıya yeniden giriş, gecikmiş feed, bitmap, logout ve password yanıtları için regresyon testleri.              |
| Oturum kaybında kirli editörün rota koruması engel olabiliyordu    | Aktif paylaşım/kirli taslak, güvenli çıkış yönlendirmesini durdurabilir ve eski taslağı açık tutabilirdi.                                                                                                                                                                                                                       | Oturum nesli değişince profil/compose editörlerinden güvenli ayrılmaya izin verilir; taslak blob URL'leri kapanışta bırakılır.                                                                                | Gerçek browser BroadcastChannel çıkış olayıyla kirli compose kapanışı; bekleyen upload bitse bile posts INSERT olmaması.  |
| Medya URL kontrolü yalnız origin/bucket prefix'ine bakıyordu       | Beklenmeyen alt yollar, kodlanmış ayraçlar, SVG/HTML gibi desteklenmeyen dosya URL'leri kabul edilebiliyordu. Bu, img bağlamasında tek başına çalışır XSS kanıtı değildir; medya sözleşmesi gereğinden genişti.                                                                                                                 | Kanonik uid/area/dosya yolu ve JPG/PNG/WEBP/MP4/WEBM uzantıları; credentials/query/hash/normalize edilen yollar reddedilir. Profil URL'si ayrıca kullanıcı ve avatar/banner alanıyla eşleşir.                 | Kodlanmış ayraç, yanlış bucket/origin/owner/area ve aktif dosya formatları reddedilir. Üretimde SVG URL isteği oluşmaz.   |
| MIME sözlüğü prototype anahtarlarını da kabul edebiliyordu         | `constructor` / `__proto__` gibi runtime MIME girdileri object property lookup'ta gerçek whitelist kaydı gibi görülebiliyordu.                                                                                                                                                                                                  | Object.hasOwn ve açık amaç allowlist'i kullanılır.                                                                                                                                                            | Bozuk MIME ve path içeren purpose girdileri decode veya upload öncesi reddedilir.                                         |
| Geçersiz profil URL'si sessizce null'a dönüşüyordu                 | Bozuk/yabancı medya verisi boş profil gibi algılanıp sonraki kayıtta üzerine yazılabilirdi.                                                                                                                                                                                                                                     | Beklenmeyen profil sahibi/URL güvenli okuma hatası üretir; boş gibi kabul edilmez. Önceki ilk-okuma-hatasında save engeli korunur.                                                                            | Yabancı URL okuma hatası ve mevcut kapağı koruyan browser testi.                                                          |

## Kontrol edilip korunan davranışlar

- Gerçek oturum guard'ı Supabase getUser doğrulaması kullanır. Kullanıcı metadata'sı yetki kararı için kullanılmaz.
- PNG/JPEG/WebP başlıkları decode öncesi kontrol edilir; 5 MiB / 32 MP sınırları ve bitmap cleanup korunur. Video 50 MiB sınırı, dosya imzası ve browser metadata decode kontrolüne tabidir.
- Dosya adı kullanıcıdan alınmaz; rastgele UUID üretilir, upsert kapalıdır. Sadece başarıyla yüklenen dosyanın public URL'si kayda girer.
- DB reddi taslağı korur; belirsiz post sonucu otomatik yeniden paylaşılmaz. Başlamış bir HTTP isteğinin logout sonrası sunucuda kesin geri alındığı iddia edilmez; istemci sonraki adımı ve eski yanıtın state'e işlenmesini durdurur.
- HTML içerikler Angular metin bağlamasıyla gösterilir; bypassSecurityTrust/innerHTML/eval üretim uygulamasında kullanılmaz. CSP yetkisiz inline script, farklı origin'e fetch ve izinsiz görsel isteğini engeller.
- Publishable key tarayıcıya açıktır; secret/service_role key environment üretiminde reddedilir. Yerel .env.local ve üretilen environment.ts Git dışında tutulur.
- API parolaları veya auth token'ları diagnostic log'a yazılmıyor. Auth SDK'nın seçilen local/session storage davranışı korunur; bunlar HttpOnly depolama değildir.

## Canlı Supabase sınırı

Salt okunur anonim limit=0 sorguları profiles/posts için HTTP 200 verdi; kullanıcı satırı okunmadı. Bu sonuç API'nin anonim rol tarafından çağrılabildiğini gösterir; RLS'nin etkin veya doğru olduğunu göstermez, veri sızıntısı kanıtı da değildir. `security-anonymous-probes-2026-10-15.json` bunu açıkça kaydeder.

`supabase/00-readiness.sql` ile RLS, grants, kolon izinleri, policy, indeks ve bucket ayarları yönetici tarafından incelenmelidir. Server'da en az şu sınırlar kanıtlanmalıdır: profili yalnız sahibi günceller; post user_id auth.uid ile eşleşir; Storage ilk klasörü uid'dir; hassas rol kolonları istemciden değiştirilemez; MIME/size kotası sunucuda uygulanır. SQL Editor'da hiçbir script otomatik çalıştırılmadı. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage izinleri](https://supabase.com/docs/guides/storage/security/access-control).

`.edu.tr` koşulu ve akademik alanların güvenilirliği frontend readonly/validator ile garanti edilmez. Before User Created hook veya başka sunucu kuralı, e-posta sahipliği doğrulaması, bot koruması ve kota ayarları canlı tarafta ayrıca doğrulanmalıdır. Public uploads bucket'ın dosyaları linki bilenlere açıktır; bu kullanıcının mevcut bucket tercihidir. Backend dosya içerik taraması ve referanslara göre orphan temizleme bu frontend incelemesinin dışında kalır.

## Güncel ürün kararı: hesap varlığı ayrımı kaldırıldı

Kullanıcı 15 Ekim'de güvenli ortak hata mesajını seçti. AuthService artık hesap varlığı sorgusu yapmaz; bilinmeyen e-posta ve yanlış şifre aynı credentials mesajına gider. Eski kullanıcı-yok/sorgu-hatası çevirileri kaldırıldı. Üretim doğrulaması eski RPC isminin bundle'a geri girmesini engeller.

Sunucuda daha önce kurulmuş fonksiyonun dışarıdan çağrılmasını kapatmak için `supabase/migrations/20261015180000_disable_login_email_lookup.sql` hazırlanmış ve yerel PostgreSQL testinde doğrulanmıştır. **Canlı Supabase'de henüz uygulanmadı.** Uygulama sorguyu kullanmıyor; sunucudaki eski EXECUTE yetkisi kaldırılmadan bu riskin tamamen kapandığı söylenemez. Ayrıntılı uygulama adımı `login-email-lookup.md` içindedir. [OWASP authentication responses](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## Kaynak ve bağımlılık taraması

`npm audit --json` güncel kurulu paketler için 0 bilinen açık verdi. Kaynak ve yerelde mevcut Git geçmişi pattern taramasında gerçek privileged key, GitHub token veya private key bulunmadı; kasıtlı, geçersiz negative test fixture'ı ayırt edildi. Bu tarama tüm olası sırları veya uzak ref'leri kapsadığını iddia etmez. Kanıtlar: `security-dependencies-2026-10-15.json`, `security-secret-scan-2026-10-15.json`.

## Doğrulama kanıtı

Tam komutlar ve nihai sonuçlar `security-verification-2026-10-15.json` içine kaydedilir. Servis testleri gerçek iş mantığını DI/SDK sınırında, tarayıcı testleri gerçek SDK'yı izole HTTP transport ile kullanır. Üretim saldırı testleri derlenmiş HTML ve Vercel başlıklarını yerel 4400 sunucusunda çalıştırır. Test kullanıcıları canlı Supabase'e gönderilmez.

Graph indeksi 10 Ekim neslindeydi; yeni servisler için güncel kapsam kaydı yoktu. Bu yüzden inceleme gerçek güncel dosyalar, kaynak taraması ve çalışan negatif testlerle yapıldı. Statik UI aracının Angular event tanıma sınırı ayrı raporlanır; uyarlanmış kontrol diğer kuralları değiştirmeden çalışır. Bu araç runtime güvenlik testinin yerine geçmez.

Kaynak yaklaşımı: [Angular security](https://angular.dev/best-practices/security), [OWASP mass assignment](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html), [Supabase session doğrulaması](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
````

## docs/STORAGE-ENTEGRASYONU.md (eklendi)

````markdown
# KampüsX — gerçek profil ve gönderi yükleme

15 Ekim 2026. Angular 22, Supabase JS v2. Kullanıcının doğruladığı sözleşme: `public.profiles.user_id`, `public.posts.user_id`, public `uploads` bucket. Mevcut gerçek Auth kullanılır; yeni bir kullanıcı/şifre tablosu veya service-role anahtarı eklenmez. Canlı veritabanında test gönderisi veya dosyası oluşturulmadı.

## 1. Neler bağlandı?

| İşlem                                | Davranış / kalıcılık                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kayıt                                | Üniversite ve bölüm zorunlu; `university_name`, `department_name` Auth kullanıcı metadata'sına gönderilir. Bunlar yetki kanıtı değildir.                    |
| Profil/kapak seçimi                  | Tarayıcıda geçici blob önizlemesi; henüz ağ yüklemesi yok.                                                                                                  |
| Profil Kaydet                        | Seçilen dosyalar Storage'a yüklenir; dönen URL'ler `profiles.avatar_url` / `banner_url` alanlarına yazılır. Yenilemede bu alanlar veritabanından okunur.    |
| İsim / bio                           | Önceki görsel kapsam korunur: uygulama belleğinde düzenlenir, veritabanına yazılmaz; yenilemede sıfırlanır. Kalıcılık için ayrıca sütun sözleşmesi gerekir. |
| Gönderi Paylaş                       | Gerçek oturumla metin ve/veya tek görsel/video kaydedilir. Sonuç doğrulanınca Keşfet'e dönülür.                                                             |
| Keşfet / Profil Gönderiler           | Supabase'den alınan kayıtlar gösterilir; uygulama sahte profil gönderileri üretmez.                                                                         |
| Üniversite / Kampüs / Bölüm          | Sekmeler ve mevcut görsel alanlar var; gerçek kapsam filtresi henüz yok. Bunun için posts'a kurum ilişkileri gerekir.                                       |
| Yanıt / yeniden paylaşım / etkileşim | Şimdilik işlevsiz. Sayaçlar takipçi/takip edilen için görsel; gönderi adedi gerçek sorgudan gelir.                                                          |

## 2. Dosya akışı ve gerçek kod örnekleri

İstemci `MediaService` → `ProfileRepository` veya `PostsService` üzerinden çalışır. Dosya yolu kullanıcıdan alınan dosya adını kullanmaz:

```text
uploads/<auth.uid()>/avatar/<randomUUID>.png
uploads/<auth.uid()>/banner/<randomUUID>.webp
uploads/<auth.uid()>/post/<randomUUID>.mp4
```

Aşağıdaki örnekler projedeki servislerin çağrı biçimidir; ek bir Supabase client oluşturma:

```typescript
// Angular component içinde. MediaService + AuthService zaten gerçek client'ı kullanır.
private readonly media = inject(MediaService);
private readonly auth = inject(AuthService);
private readonly repository = inject(ProfileRepository);
private readonly posts = inject(PostsService);

async saveAvatar(file: File) {
  const owner = this.auth.session()?.user.id;
  if (!owner) throw new MediaError('media.errors.session');
  const current = await this.repository.read(owner);
  const uploaded = await this.media.upload(file, 'avatar', owner);
  await this.repository.save(owner, {
    avatar_url: uploaded.url,
    banner_url: current?.banner_url ?? null,
  });
}

async sharePost(content: string, file?: File) {
  await this.posts.publish(content, file);
}
```

Yükleme servisinin SDK çekirdeği:

```typescript
const path = `${owner}/${purpose}/${crypto.randomUUID()}.${extension}`;
const bucket = client.storage.from('uploads');
const { error } = await bucket.upload(path, file, {
  contentType: file.type,
  cacheControl: '3600',
  upsert: false,
});
if (error) throw new MediaError('media.errors.upload');
const url = bucket.getPublicUrl(path).data.publicUrl;
```

`getPublicUrl` URL üretir; dosyanın varlığını kontrol etmez. Bu yüzden yalnızca başarılı upload sonrasında kullanılır. Public bucket dosya okumayı açar, yazma yetkisini açmaz; upload için ayrıca Storage RLS gerekir. [Supabase upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl), [Storage erişim kontrolü](https://supabase.com/docs/guides/storage/security/access-control).

Gönderi kaydının SDK çekirdeği:

```typescript
const { data, error } = await client
  .schema('public')
  .from('posts')
  .insert({
    user_id: owner,
    content: content.trim(),
    media_url: uploaded?.url ?? null,
    media_type: uploaded?.type ?? null, // image | video | null
  })
  .select('id,user_id,content,media_url,media_type')
  .abortSignal(AbortSignal.timeout(20000))
  .single();
```

`id` istemciden gönderilmez; DB tarafından üretilmelidir. Insert sonucunun dönmesi için `.select()` ve uygun SELECT policy gerekir. [Supabase insert](https://supabase.com/docs/reference/javascript/insert).

Tam çalışan kodlar:

- `apps/shell/src/app/core/media.service.ts`: dosya doğrulama/yükleme/URL allowlist.
- `apps/shell/src/app/core/profile-repository.service.ts`: `user_id` ile profil okuma ve URL kaydı.
- `apps/shell/src/app/core/profile.service.ts`: önizleme yaşam döngüsü ve UI senkronizasyonu.
- `apps/shell/src/app/core/posts.service.ts`: gerçek gönderi sorguları ve paylaşım.
- `apps/shell/src/app/features/posts/`: korumalı `/compose` sayfası.

## 3. Supabase tarafında gerekenler

Önce SQL Editor'da yalnızca okuma yapan `supabase/00-readiness.sql` çalıştırılabilir. Bu dosya sütunlar, varsayılanlar, indeksler, RLS/policy ve bucket ayarlarını gösterir; kullanıcı verisi veya anahtar okumaz.

Gereken tablo sözleşmesi:

- `profiles.user_id`: Auth UUID'si, NOT NULL ve tekil. `avatar_url` / `banner_url`: nullable text. Kullanıcının profili yoksa frontend bu üç alanla INSERT dener; başka zorunlu alanların default/trigger ile doldurulması gerekir.
- `posts.id`: otomatik üretilen primary key. `user_id`: Auth UUID'si, NOT NULL. `content`: text (yalnız medyalı gönderide boş string). `media_url`: nullable text. `media_type`: nullable text veya `image`/`video` kabul eden enum/check.
- Her iki `user_id` için `auth.users(id)` foreign key ve gönderilerde `user_id` indeksi tavsiye edilir; mevcut yapı denetlenmeden otomatik ALTER yapılmadı.
- Sayısal identity/serial kullanılıyorsa ilgili sequence için authenticated INSERT rolünün gerekli kullanım izni olmalı; tüm şemaya genel sequence yetkisi verilmedi.
- RLS: profilin sahibi yalnızca kendi satırını okuyup ekleyip güncelleyebilmeli. Oturumlu kullanıcılar keşfet gönderilerini okuyabilir; yalnızca kendi `user_id` değeriyle paylaşabilir.
- Storage INSERT: `uploads` içinde ilk klasör `auth.uid()` olmalı. Avatar/banner yalnız görsel; post görsel/video. Overwrite ve delete frontend tarafından kullanılmaz.
- Bucket sunucu limiti en fazla 50 MiB; MIME allowlist JPG/PNG/WEBP/MP4/WEBM. İstemcide görseller 5 MiB, videolar 50 MiB, çözünürlük 32 MP ile sınırlandırılır.

`supabase/01-storage-rls-template.sql`, bu akış için incelenebilir temel policy şablonudur. **Otomatik uygulanmadı.** Başka mevcut policy bulursa transaction'ı durdurur; mevcut policy'leri silmez. Şablon, yalnızca bilinen medya/gönderi sütunlarına erişim verir; mevcut tablo izinlerini bu dar sözleşmeyle değiştirir. Profilde rol/yetki gibi alanlar varsa mevcut kolon grant'leri ve trigger'lar ayrıca incelenmelidir. [Kolon izinleri](https://supabase.com/docs/guides/database/postgres/column-level-security). Sütunların tamamı bilinmediği için üretime hazır evrensel bir migration olduğu iddia edilmez.

Supabase permissive policy'leri OR ile birleşir; yeni dar bir policy eklemek mevcut `USING(true)` / `WITH CHECK(true)` yetkisini ortadan kaldırmaz. Mevcut policy'ler readiness çıktısıyla birlikte değerlendirilmelidir. Sunucu tarafında dosya içeriği taraması, avatar için ayrı 5 MiB kısıtı, kötüye kullanım kotası ve moderasyon istemci doğrulamasından bağımsızdır. Public bucket'a yüklenen dosyaları URL'yi bilenler giriş yapmadan görebilir. [Storage güvenliği](https://supabase.com/docs/guides/storage/security/access-control), [RLS ve grants](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Hata ve oturum güvenliği

- Kullanıcı kimliği aktif ve Supabase tarafından doğrulanmış oturumdan alınır; dosya yolu formdan gelen bir user_id kullanmaz. Asenkron adımlar arasında kullanıcı kimliği ve oturum nesli tekrar kontrol edilir; aynı hesaba yeni giriş de eski işlemi geçersiz kılar. Token yenileme tek başına taslağı geçersiz kılmaz. Asıl yetki sınırı RLS'dir.
- Profil repository payload'ı runtime'da yalnızca avatar_url/banner_url alanlarına indirilir. URL'nin kullanıcı klasörü ve avatar/banner alanı eşleşmelidir. Beklenmeyen ek alanlar API'ye taşınmaz.
- Dosya türü, boyutu, görsel başlığı ve gerçek tarayıcı decode işlemi kontrol edilir. SVG/HTML yüklenmez. Video MP4/WEBM imzası ve metadata decode ile doğrulanır.
- Başarılı dosya yüklemesi aynı File nesnesiyle DB tekrar denemesinde tekrar kullanılabilir. DB reddi taslağı silmez. Sonucu belirsiz gönderi isteği otomatik yeniden gönderilmez; kullanıcı önce akışını kontrol eder.
- Storage ve DB tek transaction değildir. Yükleme başarılı, DB kaydı başarısız olursa kullanılmayan dosya kalabilir. Eski fotoğraflar da otomatik silinmez. Bağlantılı dosyayı yanlışlıkla silmemek için tahmine dayalı temizleme yapılmaz; ayrı, referansları denetleyen sunucu temizleme işi gerekir.
- DB sorguları 20 saniyede sonlandırılır; bu süre dolması işlemin kesin geri alındığı anlamına gelmez. Storage yüklemesi SDK/network süresince bekler; yüzde ilerleme veya TUS/resumable desteği bu kapsamda yoktur.
- Üretim CSP'si yalnızca yapılandırılmış Supabase origin'ine bağlantı ve medya okuma izni verir. Yeni secret anahtar veya Vercel değişkeni gerekmez: mevcut `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` kullanılır; service-role/secret frontend'e konulmaz.

## 5. Kontrol adımları

1. Mevcut hesabınla giriş yap; drawer ve profilde kayıt sırasında verilen akademik bilgileri kontrol et. Eski hesapların boş akademik metadata'sı otomatik doldurulmaz.
2. Profil Düzenle'de avatar/kapak seç: Kaydet'ten önce Storage'a dosya gitmemeli. Kaydet sonrası profil ve drawer aynı fotoğrafı göstermeli. Yenilemede URL DB'den geri gelmeli.
3. Dashboard `+` üzerinden gönderi oluştur. Metin veya fotoğraf/video seç; Paylaş gerçek kayıt oluşturur. Canlıda bu adımı yaptığında gerçek paylaşım yaptığını unutma.
4. Keşfet ve profil Gönderiler sekmesinde kaydı, yenileme sonrası kalıcılığı kontrol et. Başka hesaba geçince önceki hesabın profil taslağı görünmemeli.
5. DevTools Network'te yükleme sonrasında profiles PATCH/INSERT veya posts INSERT sırasını kontrol et. 403 hatasında RLS ve bucket policy; 400 hatasında kolon/default/enum sözleşmesini denetle. Hata metni gerçek backend detaylarını kullanıcıya sızdırmaz.

Varsayımlar: `posts.id` otomatik üretiliyor; belirtilmeyen zorunlu sütunlar default/trigger ile karşılanıyor; `media_type` değerleri image/video/null. Tarih sütunu doğrulanmadığından sahte paylaşım tarihi gösterilmez. Şimdilik her sorgu en fazla 30 kayıt getirir; `id` azalan sıralama kullanılır. UUID id varsa bu kronolojik sıra garantilemez; gerçek tarih alanı ve pagination ayrı geliştirmedir.
````

## docs/auth-security-review.md (değişti)

````markdown
# KampüsX auth güvenlik ve entegrasyon incelemesi

İnceleme tarihi: **10 Ekim 2026**.

**15 Ekim güncel karar:** Kullanıcı ortak güvenli giriş hata mesajını seçti. Uygulama hesap varlığı RPC'sini artık çağırmıyor. Eski fonksiyonun sunucu erişimini kapatan migration ve yönerge `docs/login-email-lookup.md` içindedir. Aşağıdaki eski karar tarihsel bilgidir.

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

## docs/login-email-lookup-sql-verification.json (değişti)

````json
{
  "engine": "PGlite PostgreSQL (isolated in-memory fixtures)",
  "passed": 16,
  "failed": 0,
  "finalState": "Legacy RPC execute denied for anon/authenticated; migration also safe when RPC is absent.",
  "liveSupabaseChanged": false,
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
    },
    {
      "name": "disabling account discovery is idempotent",
      "passed": true
    },
    {
      "name": "anon has no execute permission after disable",
      "passed": true
    },
    {
      "name": "authenticated has no execute permission after disable",
      "passed": true
    },
    {
      "name": "unrelated has no execute permission after disable",
      "passed": true
    },
    {
      "name": "the disabling migration leaves all user rows untouched",
      "passed": true
    },
    {
      "name": "a project without the old RPC accepts the disabling migration",
      "passed": true
    }
  ]
}
````

## docs/login-email-lookup.md (değişti)

````markdown
# Hesap varlığı sorgusu kaldırıldı — 15 Ekim 2026

Kullanıcının güvenlik kararıyla kayıtlı olmayan e-posta ve yanlış şifre aynı mesajı gösterir:

- TR: **E-posta veya şifre yanlış. Bilgilerini kontrol et.**
- EN: **The email or password is incorrect. Check your details.**

AuthService artık hesap varlığı RPC'sini çağırmaz. Eski RPC'nin eksik, hatalı veya kapalı olması giriş akışını etkilemez. Ağ, kota ve e-posta doğrulama hataları uygun mesajlarını korur. Başarılı gerçek giriş dashboard'u açmaya devam eder.

## Supabase'de kalan adım

Uygulamadan sorguyu kaldırmak, önceden açılmış bir RPC'nin doğrudan çağrılmasını engellemez. Supabase projesinde **SQL Editor → New query** aç; `supabase/migrations/20261015180000_disable_login_email_lookup.sql` dosyasının TAM içeriğini yapıştır ve **Run** ile çalıştır.

Dosya yalnız `public.kampusx_login_email_exists(text)` fonksiyonunun EXECUTE yetkisini PUBLIC, anon ve authenticated rollerinden kaldırır; PostgREST şema önbelleğini yeniler. Tablo, kullanıcı, dosya veya satır oluşturmaz/değiştirmez/silmez. Fonksiyon hiç kurulmadıysa işlem güvenle atlanır. Tekrar çalıştırılabilir. Bu dosya canlı Supabase'de otomatik uygulanmadı.

`20261012174500_login_email_lookup.sql` tarihsel migration'dır. **Tek başına tekrar çalıştırma:** eski erişimi yeniden açar. Sıfırdan migration çalıştırıldığında en son kapatma migration'ı da uygulanmalıdır. 12/14 Ekim raporları ve eski dashboard kaynak dökümleri tarihsel sürümü anlatır; güncel davranış bu belgededir.

## Doğrulama

- Servis ve tarayıcı testleri hatalı girişte RPC isteği gönderilmediğini, TR/EN ortak mesajı, tekrar denemeyi ve başarılı giriş yönlendirmesini doğrular.
- Production çıktı kontrolü eski RPC ismi bulunan JavaScript'i reddeder; eski sorgu yanlışlıkla geri gelemez.
- `node scripts/verify-login-email-lookup.cjs`, önceden kurulu yerel PGlite motorunda eski davranışı kurup kapatma migration'ını test eder: anon/authenticated çağrıları 42501 ile reddedilir; kullanıcı kayıtları korunur; migration fonksiyon yokken de tekrar uygulanır. Kanıt `login-email-lookup-sql-verification.json` içindedir. Gerçek Supabase'e bağlanmaz.

İstemci değişikliği için uygulamanın yeni sürümü dağıtılmalıdır; SQL işlemi bunun ayrı sunucu adımıdır.
````

## docs/login-email-privacy-verification.json (eklendi)

````json
{
  "checkedAt": "2026-10-15",
  "decision": "One generic credential error; no account-existence RPC request.",
  "unit": {
    "command": "npm test",
    "passed": 94,
    "failed": 0
  },
  "browser": {
    "command": "npx playwright test scripts/e2e/auth-integration.spec.cjs scripts/e2e/auth-accessibility.spec.cjs",
    "passed": 14,
    "failed": 0
  },
  "productionSecurity": {
    "command": "npm run test:security",
    "passed": 9,
    "failed": 0
  },
  "sql": {
    "command": "node scripts/verify-login-email-lookup.cjs",
    "passed": 16,
    "failed": 0,
    "engine": "Isolated local PGlite PostgreSQL",
    "liveDatabaseChanged": false
  },
  "build": {
    "command": "npm run build",
    "exitCode": 0,
    "retiredRpcAbsentFromProductionJavaScript": true,
    "verifiedJavaScriptFiles": 18
  },
  "types": {
    "exitCode": 0
  },
  "format": {
    "exitCode": 0
  },
  "i18n": {
    "matchingNonEmptyKeys": 381,
    "exitCode": 0
  },
  "liveFollowup": {
    "sqlApplied": false,
    "migration": "supabase/migrations/20261015180000_disable_login_email_lookup.sql",
    "tableChanges": false,
    "deploymentPerformed": false
  }
}
````

## docs/security-anonymous-probes-2026-10-15.json (eklendi)

````json
{
  "checkedAt": "2026-10-15",
  "probes": [
    {
      "table": "profiles",
      "method": "GET",
      "limit": 0,
      "status": 200,
      "rowsRetrieved": 0
    },
    {
      "table": "posts",
      "method": "GET",
      "limit": 0,
      "status": 200,
      "rowsRetrieved": 0
    }
  ],
  "mutationsPerformed": false,
  "livePoliciesVerified": false,
  "caveat": "An anonymous limit=0 probe never retrieves user records. HTTP status alone does not prove row-level or column-level authorization."
}
````

## docs/security-dependencies-2026-10-15.json (eklendi)

````json
{
  "checkedAt": "2026-10-15",
  "command": "npm audit --json",
  "vulnerabilities": {
    "info": 0,
    "low": 0,
    "moderate": 0,
    "high": 0,
    "critical": 0,
    "total": 0
  },
  "dependencies": {
    "prod": 40,
    "dev": 786,
    "optional": 174,
    "peer": 72,
    "peerOptional": 0,
    "total": 825
  },
  "caveat": "Registry advisory matches for installed dependency versions; not a proof that application logic or server policies are secure."
}
````

## docs/security-secret-scan-2026-10-14.json (eklendi)

````json
{
  "checkedAt": "2026-10-14",
  "workingTreeTextFilesChecked": 190,
  "workingTreeFindings": [],
  "trackedLocalConfiguration": [],
  "localGitHistoryBytesScanned": 1264581,
  "localGitHistorySecretKinds": [],
  "reviewedFalsePositive": {
    "path": "scripts/generate-environment.test.cjs",
    "reason": "One fixed, deliberately invalid secret-key-shaped value tests that browser configuration rejects secret keys; the exact same fixture appears in local history."
  },
  "caveat": "Pattern scan of current non-ignored files and locally available Git history; does not certify absence of every possible credential, remote branches not fetched, or remote dashboard settings."
}
````

## docs/security-secret-scan-2026-10-15.json (eklendi)

````json
{
  "checkedAt": "2026-10-15",
  "workingTreeTextFilesChecked": 212,
  "workingTreeFindings": [],
  "trackedLocalConfiguration": [],
  "localGitHistoryBytesScanned": 1264581,
  "localGitHistorySecretKinds": [],
  "reviewedFalsePositive": {
    "path": "scripts/generate-environment.test.cjs",
    "reason": "One fixed, deliberately invalid secret-key-shaped value tests that browser configuration rejects secret keys; the exact same fixture appears in local history."
  },
  "caveat": "Pattern scan of current non-ignored files and locally available Git history; does not certify absence of every possible credential, remote branches not fetched, or remote dashboard settings."
}
````

## docs/security-verification-2026-10-15.json (eklendi)

````json
{
  "checkedAt": "2026-10-15",
  "scope": "Auth, profile, Storage, posts, SPA/CSP, dependency and secret scan",
  "mutations": {
    "liveDatabase": false,
    "liveStorage": false,
    "liveAuth": false,
    "schemaChanges": false,
    "deployment": false,
    "gitPush": false
  },
  "unit": {
    "command": "npm test",
    "passed": 94,
    "failed": 0
  },
  "browser": {
    "command": "CI=true NODE_ENV=production npm run test:ui",
    "passed": 76,
    "failed": 0,
    "isolatedSdkTransport": true,
    "includesCrossTabSignoutAndLateUpload": true
  },
  "productionSecurity": {
    "command": "npm run test:security",
    "passed": 9,
    "failed": 0,
    "includesStoredPostHtmlAndMediaAllowlist": true
  },
  "build": {
    "command": "npm run build",
    "exitCode": 0,
    "verifiedJavaScriptFiles": 18
  },
  "types": {
    "command": "npm run typecheck",
    "exitCode": 0
  },
  "format": {
    "command": "npm run format:check",
    "exitCode": 0
  },
  "i18n": {
    "command": "npm run check:i18n",
    "matchingNonEmptyKeys": 381,
    "exitCode": 0
  },
  "designLint": {
    "errors": 0,
    "warnings": 0
  },
  "staticAudit": {
    "rawErrors": 14,
    "reason": "Upstream parser does not recognize Angular click/aria-disabled syntax",
    "angularRecognitionErrors": 0,
    "angularRecognitionWarnings": 0
  },
  "dependencyAudit": {
    "knownVulnerabilities": 0,
    "evidence": "security-dependencies-2026-10-15.json"
  },
  "secretScan": {
    "realPatternFindings": 0,
    "trackedLocalConfig": 0,
    "evidence": "security-secret-scan-2026-10-15.json",
    "scope": "Current non-ignored text and locally available Git history; documented invalid fixture excluded"
  },
  "server": {
    "anonymousLimitZeroStatus": {
      "profiles": 200,
      "posts": 200
    },
    "userRowsRead": 0,
    "liveRlsVerified": false,
    "liveAuthHooksVerified": false,
    "sqlExecuted": false,
    "evidence": "security-anonymous-probes-2026-10-15.json"
  },
  "remaining": [
    {
      "item": "Legacy public account-existence RPC",
      "status": "Frontend no longer calls it. Apply the tested disabling migration on live Supabase; not executed remotely."
    },
    {
      "item": "Live RLS / grants / Storage limits / university email hook",
      "status": "Not verified with an authenticated admin; no server policy changed."
    }
  ],
  "report": "GUVENLIK-INCELEMESI-2026-10-15.md",
  "genericLoginMessageUpdate": {
    "checkedAt": "2026-10-15",
    "decision": "One generic credential error; no account-existence RPC request.",
    "unit": {
      "command": "npm test",
      "passed": 94,
      "failed": 0
    },
    "browser": {
      "command": "npx playwright test scripts/e2e/auth-integration.spec.cjs scripts/e2e/auth-accessibility.spec.cjs",
      "passed": 14,
      "failed": 0
    },
    "productionSecurity": {
      "command": "npm run test:security",
      "passed": 9,
      "failed": 0
    },
    "sql": {
      "command": "node scripts/verify-login-email-lookup.cjs",
      "passed": 16,
      "failed": 0,
      "engine": "Isolated local PGlite PostgreSQL",
      "liveDatabaseChanged": false
    },
    "build": {
      "command": "npm run build",
      "exitCode": 0,
      "retiredRpcAbsentFromProductionJavaScript": true,
      "verifiedJavaScriptFiles": 18
    },
    "types": {
      "exitCode": 0
    },
    "format": {
      "exitCode": 0
    },
    "i18n": {
      "matchingNonEmptyKeys": 381,
      "exitCode": 0
    },
    "liveFollowup": {
      "sqlApplied": false,
      "migration": "supabase/migrations/20261015180000_disable_login_email_lookup.sql",
      "tableChanges": false,
      "deploymentPerformed": false
    }
  }
}
````

## docs/supabase/00-readiness.sql (eklendi)

````text
-- READ ONLY: Supabase SQL Editor'da tablo/policy sözleşmesini görmek için.
-- Kullanıcı kayıtlarını, şifreleri veya API anahtarlarını okumaz.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('profiles', 'posts')
order by table_name, ordinal_position;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('profiles', 'posts'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in ('profiles', 'posts'))
   or (n.nspname = 'storage' and c.relname = 'objects');

select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('profiles', 'posts');

select grantee, table_name, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('profiles', 'posts')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, column_name, privilege_type;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'uploads';
````

## docs/supabase/01-storage-rls-template.sql (eklendi)

````text
-- İNCELEME İÇİN ŞABLON: uygulama tarafından otomatik çalıştırılmaz.
-- Önce 00-readiness.sql ve STORAGE-ENTEGRASYONU.md okunmalı.
-- Mevcut başka policy'ler varsa işlem güvenli biçimde DURUR; silinmezler.
begin;
do $$
begin
  if exists (
    select 1 from pg_policies
    where ((schemaname = 'public' and tablename in ('profiles', 'posts'))
       or (schemaname = 'storage' and tablename = 'objects'))
      and policyname not in ('kampusx_profiles_read_own','kampusx_profiles_insert_own',
        'kampusx_profiles_update_own','kampusx_posts_read','kampusx_posts_insert_own',
        'kampusx_uploads_insert_own')
  ) then
    raise exception 'Mevcut policy var. 00-readiness.sql ile inceleyin; otomatik silinmedi.';
  end if;
  if not exists (select 1 from storage.buckets where id = 'uploads' and public = true) then
    raise exception 'uploads public bucket bulunamadı.';
  end if;
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.profiles'::regclass and i.indisunique and i.indisvalid
      and i.indnkeyatts = 1 and i.indpred is null and a.attname = 'user_id'
  ) then
    raise exception 'profiles.user_id tekil (UNIQUE/PRIMARY KEY) olmalı; önce tablo yapısını inceleyin.';
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
grant usage on schema public to authenticated;
-- Profilde rol vb. başka kolonlar varsa bunları istemciye açma.
-- Bu şablon yalnızca aşağıdaki medya/yayın iş akışının yetkilerini tanımlar.
revoke all on public.profiles, public.posts from public, anon, authenticated;
grant select (user_id, avatar_url, banner_url), insert (user_id, avatar_url, banner_url),
  update (avatar_url, banner_url) on public.profiles to authenticated;
grant select (id, user_id, content, media_url, media_type),
  insert (user_id, content, media_url, media_type) on public.posts to authenticated;

drop policy if exists kampusx_profiles_read_own on public.profiles;
create policy kampusx_profiles_read_own on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists kampusx_profiles_insert_own on public.profiles;
create policy kampusx_profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists kampusx_profiles_update_own on public.profiles;
create policy kampusx_profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists kampusx_posts_read on public.posts;
create policy kampusx_posts_read on public.posts for select to authenticated using (true);
drop policy if exists kampusx_posts_insert_own on public.posts;
create policy kampusx_posts_insert_own on public.posts for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and content is not null and char_length(content) <= 2000
  and (char_length(btrim(content)) > 0 or media_url is not null)
  and ((media_url is null and media_type is null)
    or (media_url is not null and media_type in ('image','video')))
);

-- Public dosya okuması bucket üzerinden olur. Upsert/overwrite/delete izni verilmez.
drop policy if exists kampusx_uploads_insert_own on storage.objects;
create policy kampusx_uploads_insert_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    ((storage.foldername(name))[2] in ('avatar','banner')
      and lower(storage.extension(name)) in ('jpg','png','webp'))
    or ((storage.foldername(name))[2] = 'post'
      and lower(storage.extension(name)) in ('jpg','png','webp','mp4','webm'))
  )
);

-- Bucket limiti sunucuda da uygulanır. Dosya içeriği taraması bunun dışındadır.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
where id = 'uploads';
commit;
````

## package-lock.json (değişti)

````json
{
  "name": "kampusx",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "kampusx",
      "version": "0.1.0",
      "dependencies": {
        "@angular/common": "22.2.1",
        "@angular/compiler": "22.2.1",
        "@angular/core": "22.2.1",
        "@angular/forms": "22.2.1",
        "@angular/platform-browser": "22.2.1",
        "@angular/router": "22.2.1",
        "@jsverse/transloco": "8.4.0",
        "@supabase/supabase-js": "^2.117.3",
        "rxjs": "7.8.2",
        "tslib": "^2.8.1"
      },
      "devDependencies": {
        "@angular/build": "22.2.1",
        "@angular/compiler-cli": "22.2.1",
        "@axe-core/playwright": "^4.10.2",
        "@nx/angular": "23.2.1",
        "@playwright/test": "^1.56.1",
        "@tailwindcss/postcss": "4.3.3",
        "autoprefixer": "^10.4.21",
        "nx": "23.2.1",
        "postcss": "^8.5.6",
        "prettier": "^3.6.2",
        "tailwindcss": "4.3.3",
        "typescript": "~6.0.0"
      },
      "engines": {
        "node": "^24.15.0"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.3.0.tgz",
      "integrity": "sha512-U4+70Pc5ZS9osnCBCE5Jha/ciHM+Yp+CNMNC/7HvYbNRk1Ldd+f7qO65W5qfhu/TCv+/ozljlXXe9Nj8419DMA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@ampproject/remapping": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@ampproject/remapping/-/remapping-2.3.0.tgz",
      "integrity": "sha512-30iZtAPgz+LTIYoeivqYo853f02jBYSd5uGnGpkFV0M3xOt9aN73erkgYAmZU43x4VfqcnLxW9Kpg3R5LC4YYw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@angular-devkit/architect": {
      "version": "0.2202.1",
      "resolved": "https://registry.npmjs.org/@angular-devkit/architect/-/architect-0.2202.1.tgz",
      "integrity": "sha512-WGRAxFj+R9LC8HuK3DnDgxHo/XrgfklNQeNgjq/phTEVq5ZdWxc8kDoPA4uQz4vF+HY2eycAAtOPfMvj2TBEiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@angular-devkit/core": "22.2.1",
        "rxjs": "7.8.2"
      },
      "bin": {
        "architect": "bin/cli.js"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
        "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
        "yarn": ">= 1.13.0"
      }
    },
    "node_modules/@angular-devkit/core": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular-devkit/core/-/core-22.2.1.tgz",
      "integrity": "sha512-2oiuWVbUg7pE9kh2grp+MF2ynys+tMWZ/mmoYlqWrhMS2n5oV304ir0/IvvCCSGz9qsbL2A1vZhnlI2UbTSNiA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "8.20.0",
        "ajv-formats": "3.0.1",
        "jsonc-parser": "3.3.1",
        "picomatch": "4.0.7",
        "rxjs": "7.8.2",
        "source-map": "0.8.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
        "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
        "yarn": ">= 1.13.0"
      },
      "peerDependencies": {
        "chokidar": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "chokidar": {
          "optional": true
        }
      }
    },
    "node_modules/@angular-devkit/schematics": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular-devkit/schematics/-/schematics-22.2.1.tgz",
      "integrity": "sha512-frHhFwu2TEfTZX5jfAYL2bztuG5mGggfJhiM9bo5/QtLAi49LtRbJxIktsu6vjJdujxeB2TKD7KqnXwNYgd41Q==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@angular-devkit/core": "22.2.1",
        "jsonc-parser": "3.3.1",
        "magic-string": "1.4.1",
        "ora": "9.4.1",
        "rxjs": "7.8.2"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
        "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
        "yarn": ">= 1.13.0"
      }
    },
    "node_modules/@angular/build": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/build/-/build-22.2.1.tgz",
      "integrity": "sha512-VA8EkK5Y6sJbBFyn2x5jzd3KByh29DDpI7n6hucT0sK6YkMJEvsojPUWet9ifwF3OL+ZrGvxYlAHyZGKVlqw0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@ampproject/remapping": "2.3.0",
        "@angular-devkit/architect": "0.2202.1",
        "@babel/core": "8.0.5",
        "@inquirer/confirm": "6.3.2",
        "@parcel/watcher": "2.6.0",
        "@vitejs/plugin-basic-ssl": "2.3.0",
        "beasties": "0.5.4",
        "browserslist": "^4.26.0",
        "chokidar": "5.0.0",
        "esbuild": "0.28.2",
        "https-proxy-agent": "9.1.0",
        "jsonc-parser": "3.3.1",
        "listr2": "11.1.0",
        "magic-string": "1.4.1",
        "mrmime": "2.0.1",
        "oxc-parser": "0.150.0",
        "parse5-html-rewriting-stream": "8.0.1",
        "picomatch": "4.0.7",
        "piscina": "5.3.2",
        "rolldown": "1.2.8",
        "sass": "1.104.1",
        "sass-embedded": "1.104.1",
        "semver": "7.8.5",
        "source-map-support": "0.5.21",
        "tinyglobby": "0.2.17",
        "vite": "8.3.0",
        "xxhash-wasm": "1.1.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
        "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
        "yarn": ">= 1.13.0"
      },
      "optionalDependencies": {
        "lmdb": "3.5.6"
      },
      "peerDependencies": {
        "@angular/compiler": "^22.0.0",
        "@angular/compiler-cli": "^22.0.0",
        "@angular/core": "^22.0.0",
        "@angular/localize": "^22.0.0",
        "@angular/platform-browser": "^22.0.0",
        "@angular/platform-server": "^22.0.0",
        "@angular/service-worker": "^22.0.0",
        "@angular/ssr": "^22.2.1",
        "istanbul-lib-instrument": "^6.0.0",
        "karma": "^6.4.0",
        "less": "^4.2.0",
        "ng-packagr": "^22.0.0",
        "postcss": "^8.4.0",
        "rollup": "^4.0.0",
        "tailwindcss": "^2.0.0 || ^3.0.0 || ^4.0.0",
        "tslib": "^2.3.0",
        "typescript": ">=6.0 <6.1",
        "vitest": "^4.0.8 || ^5.0.0"
      },
      "peerDependenciesMeta": {
        "@angular/core": {
          "optional": true
        },
        "@angular/localize": {
          "optional": true
        },
        "@angular/platform-browser": {
          "optional": true
        },
        "@angular/platform-server": {
          "optional": true
        },
        "@angular/service-worker": {
          "optional": true
        },
        "@angular/ssr": {
          "optional": true
        },
        "istanbul-lib-instrument": {
          "optional": true
        },
        "karma": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "ng-packagr": {
          "optional": true
        },
        "postcss": {
          "optional": true
        },
        "rollup": {
          "optional": true
        },
        "tailwindcss": {
          "optional": true
        },
        "vitest": {
          "optional": true
        }
      }
    },
    "node_modules/@angular/common": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/common/-/common-22.2.1.tgz",
      "integrity": "sha512-OqBH3EY4i8e3PvnYDugZGipSs1HWs2ZrqoClndKtFDS9mQULSSuLoxjG9nF1J/c+yUqhuyZlHjkXWS0n32pEfw==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/core": "22.2.1",
        "rxjs": "^6.5.3 || ^7.4.0"
      }
    },
    "node_modules/@angular/compiler": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/compiler/-/compiler-22.2.1.tgz",
      "integrity": "sha512-KRSz0c/T5eEiFa+F1l9OppAebJj9pT8kU3ArBMlxR3v/vzhpCfuQsFVQ4xEFC7dEm3zZIdv9ASKAP6ocNC4D/Q==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      }
    },
    "node_modules/@angular/compiler-cli": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/compiler-cli/-/compiler-cli-22.2.1.tgz",
      "integrity": "sha512-Nh8sCBl0JF6x+H7/1hemY76JeTRC66EfMULT4B3ryF9srRSLYc6X6RfPRtYvrIyjgr6h3jZgrNHlV76wiJaOcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "8.0.1",
        "@jridgewell/sourcemap-codec": "^1.4.14",
        "chokidar": "^5.0.0",
        "convert-source-map": "^1.5.1",
        "reflect-metadata": "^0.2.0",
        "semver": "^7.0.0",
        "tslib": "^2.3.0",
        "yargs": "^18.0.0"
      },
      "bin": {
        "ng-xi18n": "bundles/src/bin/ng_xi18n.js",
        "ngc": "bundles/src/bin/ngc.js"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/compiler": "22.2.1",
        "typescript": ">=6.0 <6.1"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@angular/compiler-cli/node_modules/@babel/core": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-8.0.1.tgz",
      "integrity": "sha512-5FgxM4dLQpMJHSiVATk8foW263dVHQHBVpXYiimNECVWG01f4nFyEbQixeT6Mwvg7TayREJ2gpKl3o2RoMdnqw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^8.0.0",
        "@babel/generator": "^8.0.0",
        "@babel/helper-compilation-targets": "^8.0.0",
        "@babel/helpers": "^8.0.0",
        "@babel/parser": "^8.0.0",
        "@babel/template": "^8.0.0",
        "@babel/traverse": "^8.0.0",
        "@babel/types": "^8.0.0",
        "@types/gensync": "^1.0.5",
        "convert-source-map": "^2.0.0",
        "empathic": "^2.0.1",
        "gensync": "^1.0.0-beta.2",
        "import-meta-resolve": "^4.2.0",
        "json5": "^2.2.3",
        "obug": "^2.1.1",
        "semver": "^7.7.3"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@angular/compiler-cli/node_modules/@babel/core/node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@angular/core": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/core/-/core-22.2.1.tgz",
      "integrity": "sha512-a8WlYTRiaMPz1KvLE5xjeWrLyZUuQX8bh6Ak7zajUci9iWsTUQefschjSwP1WKlin3JhM3XjmsTEDyZvSLIfRg==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/compiler": "22.2.1",
        "rxjs": "^6.5.3 || ^7.4.0",
        "zone.js": "~0.15.0 || ~0.16.0"
      },
      "peerDependenciesMeta": {
        "@angular/compiler": {
          "optional": true
        },
        "zone.js": {
          "optional": true
        }
      }
    },
    "node_modules/@angular/forms": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/forms/-/forms-22.2.1.tgz",
      "integrity": "sha512-xHM+PhrvYDJ+edPxh6PWhkE99tXWbsMcxdXCWF6QcyByX+bsW2rVlNZ7dumOsUle9MYa8Yj0lZFACUWbwFw+4w==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "tslib": "^2.3.0",
        "zod": "^4.0.10"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/common": "22.2.1",
        "@angular/core": "22.2.1",
        "@angular/platform-browser": "22.2.1",
        "rxjs": "^6.5.3 || ^7.4.0"
      }
    },
    "node_modules/@angular/platform-browser": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/platform-browser/-/platform-browser-22.2.1.tgz",
      "integrity": "sha512-KQ3oguemaSqyNP00yqEvPouY7NC4Lji+6S8yfjaWaUZjSth/GckpeP/Fo9HtMqd04y6MZ6lEb2hbQtTqFcSdEQ==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/animations": "22.2.1",
        "@angular/common": "22.2.1",
        "@angular/core": "22.2.1"
      },
      "peerDependenciesMeta": {
        "@angular/animations": {
          "optional": true
        }
      }
    },
    "node_modules/@angular/router": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@angular/router/-/router-22.2.1.tgz",
      "integrity": "sha512-HJfJ4yA1znKd9YFtbDOJfKmD12x0PhS7LkmYdWlJRu2WkQZRBVrdGKdmbvV5UvrqCRllVWKpzw1TIZJM69rlcw==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
      },
      "peerDependencies": {
        "@angular/common": "22.2.1",
        "@angular/core": "22.2.1",
        "@angular/platform-browser": "22.2.1",
        "rxjs": "^6.5.3 || ^7.4.0"
      }
    },
    "node_modules/@axe-core/playwright": {
      "version": "4.13.0",
      "resolved": "https://registry.npmjs.org/@axe-core/playwright/-/playwright-4.13.0.tgz",
      "integrity": "sha512-6YLx+kxXu5GJceG4ozFg+33a2EMTdjYwWGloJ3sb9Kta5pp+ZNS53uxGVog5JetIY8s++P5UrtX+cri+u0VAVg==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "axe-core": "~4.13.0"
      },
      "peerDependencies": {
        "playwright-core": ">= 1.0.0"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-8.0.6.tgz",
      "integrity": "sha512-uMHhvmDmwFiLuiozaoRYTZHqMFuu3fem/X9JY78lohAuLoh8LSGGC8JqUzo2cVuBsBxkjMZNk56CE7ock8Xxkw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^8.0.6",
        "js-tokens": "^10.0.0"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "8.0.5",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-8.0.5.tgz",
      "integrity": "sha512-YLsYoQMvL8l8WrGpN3Zj7O1wK5LEBN+cQtux7BcuHyxIXve724XG+zuJ1n3U1cUweRtTzQOA4IHbuQw3N34SZw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "8.0.5",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-8.0.5.tgz",
      "integrity": "sha512-2/oWkgTbBYoqioCWAE4XJobOrzwxTDa5/XjDP3tJ1BhDr/owcd9qnXBp4xc3/2G5X4bvXM04nrxbRJxFcXAxFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^8.0.0",
        "@babel/generator": "^8.0.5",
        "@babel/helper-compilation-targets": "^8.0.5",
        "@babel/helpers": "^8.0.5",
        "@babel/parser": "^8.0.5",
        "@babel/template": "^8.0.0",
        "@babel/traverse": "^8.0.5",
        "@babel/types": "^8.0.5",
        "@types/gensync": "^1.0.5",
        "convert-source-map": "^2.0.0",
        "empathic": "^2.0.1",
        "gensync": "^1.0.0-beta.2",
        "import-meta-resolve": "^4.2.0",
        "json5": "^2.2.3",
        "obug": "^2.1.1",
        "verkit": "^0.3.2"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/core/node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@babel/generator": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-8.0.6.tgz",
      "integrity": "sha512-/pcanjdRsonCexCuxgGD8fKnBLLzk2i9uM4kmcmGyyev2R5YDs+rafMYZ89RvaGY1mW8T7C5au0TyYaEeHBGng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^8.0.6",
        "@babel/types": "^8.0.6",
        "@jridgewell/gen-mapping": "0.4.0-beta.0",
        "@jridgewell/trace-mapping": "^0.3.31",
        "@types/jsesc": "^2.5.0",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/generator/node_modules/@jridgewell/gen-mapping": {
      "version": "0.4.0-beta.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.4.0-beta.0.tgz",
      "integrity": "sha512-JdGNkbE4GlNPYQhM0L95fBQr7ctLZJ276QXQLTad4t1oSdnnCI3fDq9DW3BqYAWv8Wc3+HS+4Gsii1oPMCfz1w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.6.0-beta.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.29.7.tgz",
      "integrity": "sha512-OoK6239jHPuSQOoS0kfTVKn0b/rVTk0seKq4Gd2UMLtmOVLjDC0ki3e+c90Trqv2gMfvJFqkiljrr568+qddiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-8.0.6.tgz",
      "integrity": "sha512-HTrtZ4+iA0+kzdbCgvdSk1U4pEl3BvpGnlUbualCGNbrVhhQvhgBzurTUmqpWyvyHbWYWaIfdx2mOlL9LJjsew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^8.0.5",
        "@babel/helper-validator-option": "^8.0.0",
        "browserslist": "^4.24.0",
        "flru": "1.0.2",
        "verkit": "^0.3.2"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-8.0.6.tgz",
      "integrity": "sha512-OdnA/N52LhzFpeUuVz5YGuSWjc7TPHiFmVYZbPlSgExocO2GwbxVpSni9MVs5wwW+wZ4kPuwBEBN9pIPDYz1mA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-member-expression-to-functions/-/helper-member-expression-to-functions-7.29.7.tgz",
      "integrity": "sha512-j+7JYmk1JYDtACIGj0QJqqWZjoUpMoEikQGADMaHgCMCSDqd2+P32rfcibUNrGOMWrlzK1WJBdxrB3JJQZwWtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.29.7.tgz",
      "integrity": "sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@babel/helper-optimise-call-expression": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-optimise-call-expression/-/helper-optimise-call-expression-7.29.7.tgz",
      "integrity": "sha512-+kmGVjcT9RGYzoDwdwEqEvGgKe3BYq+O1iGzjFubaNgZHwYHP6lsF2Yghf4kEuv9BV7tYDZ913aBW9am6YKong==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-optimise-call-expression/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-optimise-call-expression/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-optimise-call-expression/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.29.7.tgz",
      "integrity": "sha512-G7sHYigPY17oO5SYWnfD/0MTBwVR781S/JI643e/JhUYgVgWE/61SoW3NH9KWUKyKq5LVh3npif99Wkt6j86Jw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-skip-transparent-expression-wrappers/-/helper-skip-transparent-expression-wrappers-7.29.7.tgz",
      "integrity": "sha512-brcMGQaVzIeUb+6/bs1Av0f8YuNNjKY2JyvfRCsFuFsdKccEQ5Ges2y74D74NZ1Rz8lKJ9ksJkfqwQFJ/iNEyQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-8.0.6.tgz",
      "integrity": "sha512-+6HYEBnsDRZHJtUTAEfMQd0zMDqdFHS7C+5vAsEZqBUr3vEMWOWlHJ0Jz1gS8jJIlCvLsuA6ivmeoqzH936YcA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-8.0.6.tgz",
      "integrity": "sha512-HYx0YmuchRxRSpnjvcNffnPS8DCauKNmnumIuHG3jnQAVewRA7kfJGwF13ayEpSZs7s4R/oBH4eppuXcAQd5JQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-8.0.0.tgz",
      "integrity": "sha512-U4Dybxh4WESWHt5XhBeExi4DrY0/DNK1aHpQbsrQXCUbFHuMweT0TpLEWKvaraV2Y6fS+ZXunsZ8zIuZIgvF2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/helper-wrap-function": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-wrap-function/-/helper-wrap-function-7.29.7.tgz",
      "integrity": "sha512-iES0Skag9ERIF68aXadpO6dbXa03mNWK3sEqJaMnLNs/eC3l0lkImdfoy6Y09/SfkpawdAB4RjQ7PVA7TcVGdw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@babel/helpers": {
      "version": "8.0.5",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-8.0.5.tgz",
      "integrity": "sha512-fQtPOXjYOYv85PIdwotp2TJGVYOycX0PQq+l844fFAxOULtBy8BVF35GyeueX0r4KvDthqPH5xAI1clQPk/2uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^8.0.0",
        "@babel/types": "^8.0.5"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-8.0.6.tgz",
      "integrity": "sha512-LpGDIYJAzc3Y3PT9x+FxBrGYu2PlWxLmyN7SwPTzaX0LSwEmFJBsRnPBqmaXF2r1v+Zhz6lNiEJ+7yKtM5+Ugg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^8.0.6"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.29.10.tgz",
      "integrity": "sha512-NpugTzbKgGrNe45Ui32cN8vCFFMxVtP/9rtfwv0nP5FRDAjvYBxJcLVpYA9mr1jxP6cnIT7x9LUzuDTbWYYNRA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-8.0.0.tgz",
      "integrity": "sha512-eAD0QW/AlbamBbw0FeGiwasbCVPq5ncW0HNVyLP3B9czqLyh4gvw+5JTSNt6le9+ziAU7mqDZsKTHf3jTb4chQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^8.0.0",
        "@babel/parser": "^8.0.0",
        "@babel/types": "^8.0.0"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-8.0.6.tgz",
      "integrity": "sha512-ilYV+qLStGzSKLipJlETdvdtpK3rAuwfCmCoGKv15MU4EoeIuLkespSNoNLFGOPSciEHx9TLWtN5mv0fz5w5mQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^8.0.6",
        "@babel/generator": "^8.0.6",
        "@babel/helper-globals": "^8.0.6",
        "@babel/parser": "^8.0.6",
        "@babel/template": "^8.0.0",
        "@babel/types": "^8.0.6",
        "obug": "^2.1.1"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "8.0.6",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-8.0.6.tgz",
      "integrity": "sha512-c+xgSWboV2pdwXP67BUWDVRHi2BO5Q3KwxyFVs7taVTY+fsK47/L51ZXQoV9rozHJDNHvJ4v4WEsI/IlxV2l2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^8.0.6",
        "@babel/helper-validator-identifier": "^8.0.6"
      },
      "engines": {
        "node": "^22.18.0 || >=24.11.0"
      }
    },
    "node_modules/@bufbuild/protobuf": {
      "version": "2.16.0",
      "resolved": "https://registry.npmjs.org/@bufbuild/protobuf/-/protobuf-2.16.0.tgz",
      "integrity": "sha512-FWa0sPlqYGJgpTs6OxBRcL/AW4JT0OIO+W1ajerluoTVh8CV0B7XM1qsNCRgnkSCkRCgOICKHRQlY17jrsm0+Q==",
      "dev": true,
      "license": "(Apache-2.0 AND BSD-3-Clause)"
    },
    "node_modules/@cacheable/memory": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@cacheable/memory/-/memory-2.2.0.tgz",
      "integrity": "sha512-CTLKqLItRCEixEAewD3/j9DB3/o96gpTPD4eJ1v+DGOlxZRZncRQkGYqqnAGCscYd6RNeXfGeiuCphsPtqyIfQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@cacheable/utils": "^2.5.0",
        "@keyv/bigmap": "^1.3.1",
        "hookified": "^1.15.1",
        "keyv": "^5.6.0"
      }
    },
    "node_modules/@cacheable/utils": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/@cacheable/utils/-/utils-2.5.0.tgz",
      "integrity": "sha512-buipgOVDkkPXNR5+xBpDw7Zk2n1EvU7qBJCNUcL7rhQ//kfpOXPAvQ511Os0vpLYJ1pZnvudNytkQt2hst3wqA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "hashery": "^1.5.1",
        "keyv": "^5.6.0"
      }
    },
    "node_modules/@clack/core": {
      "version": "1.4.3",
      "resolved": "https://registry.npmjs.org/@clack/core/-/core-1.4.3.tgz",
      "integrity": "sha512-/kr3UWNtdJfxZtPgDqUOmG2pvwlmcLGheex5yiZKdwbzZJxhV+HMNR9QNmyY5cGwTNV6LrR7Jtp+KjhUAP1qBQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-wrap-ansi": "^0.2.0",
        "sisteransi": "^1.0.5"
      },
      "engines": {
        "node": ">= 20.12.0"
      }
    },
    "node_modules/@clack/prompts": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/@clack/prompts/-/prompts-1.7.0.tgz",
      "integrity": "sha512-y7/yvZ2TPAnR9+jnc00klvNNLkJiXFFrQA/hlLCcxA9a2A4zQIOimyFQ9XfwYKiGD1fb5GY8vbKIIgO8d5Tb2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@clack/core": "1.4.3",
        "fast-string-width": "^3.0.2",
        "fast-wrap-ansi": "^0.2.0",
        "sisteransi": "^1.0.5"
      },
      "engines": {
        "node": ">= 20.12.0"
      }
    },
    "node_modules/@emnapi/core": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.4.5.tgz",
      "integrity": "sha512-XsLw1dEOpkSX/WucdqUhPWP7hDxSvZiY+fsUC14h+FtQ2Ifni4znbBt8punRX+Uj2JG/uDb8nEHVKvrVlvdZ5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@emnapi/wasi-threads": "1.0.4",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.4.5.tgz",
      "integrity": "sha512-++LApOtY0pEEz1zrd9vy1/zXVaVJJ/EbAF3u0fXIzPJEDtnITsBGbbK0EkM72amhl/R5b+5xx0Y/QhcVOpuulg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.0.4.tgz",
      "integrity": "sha512-PJR+bOmMOPH8AtcTGAyYNiuJ3/Fcoj2XN/gBEWzDIKh254XO+mM9XoXHk5GNEhodxeMznbg7BlRojVbKN+gC6g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.2.tgz",
      "integrity": "sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.2.tgz",
      "integrity": "sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.2.tgz",
      "integrity": "sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.2.tgz",
      "integrity": "sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.2.tgz",
      "integrity": "sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.2.tgz",
      "integrity": "sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.2.tgz",
      "integrity": "sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.2.tgz",
      "integrity": "sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.2.tgz",
      "integrity": "sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.2.tgz",
      "integrity": "sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.2.tgz",
      "integrity": "sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.2.tgz",
      "integrity": "sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.2.tgz",
      "integrity": "sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.2.tgz",
      "integrity": "sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.2.tgz",
      "integrity": "sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.2.tgz",
      "integrity": "sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz",
      "integrity": "sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.2.tgz",
      "integrity": "sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.2.tgz",
      "integrity": "sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.2.tgz",
      "integrity": "sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.2.tgz",
      "integrity": "sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.2.tgz",
      "integrity": "sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz",
      "integrity": "sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz",
      "integrity": "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.10.1",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.10.1.tgz",
      "integrity": "sha512-cuadcxVFE8sDK6iWJbs8Sn0av2Nrh2QSGQhVlBW9AaAHqHwjWsZHT8LJ4hFGPh7ASBV2deFdM7H/DPjulmh8rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^3.4.3"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.12.2",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.2.tgz",
      "integrity": "sha512-EriSTlt5OC9/7SXkRSCAhfSxxoSUgBm33OH+IkwbdpgoqsSsUg7y3uh+IICI/Qg4BBWr3U2i39RpmycbxMq4ew==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/config-array": {
      "version": "0.23.5",
      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.23.5.tgz",
      "integrity": "sha512-Y3kKLvC1dvTOT+oGlqNQ1XLqK6D1HU2YXPc52NmAlJZbMMWDzGYXMiPRJ8TYD39muD/OTjlZmNJ4ib7dvSrMBA==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@eslint/object-schema": "^3.0.5",
        "debug": "^4.3.1",
        "minimatch": "^10.2.4"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      }
    },
    "node_modules/@eslint/config-helpers": {
      "version": "0.7.0",
      "resolved": "https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.7.0.tgz",
      "integrity": "sha512-DObd/KKUsU+FaFv4PLxSRenpXfQWmPXXP3pPZ6/K1PCrMu2vQpMDMuQe/BqYeoLcz8ro0bVDF1RxOJgfVEdhUw==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@eslint/core": "^1.2.1"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      }
    },
    "node_modules/@eslint/core": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-1.2.1.tgz",
      "integrity": "sha512-MwcE1P+AZ4C6DWlpin/OmOA54mmIZ/+xZuJiQd4SyB29oAJjN30UW9wkKNptW2ctp4cEsvhlLY/CsQ1uoHDloQ==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@types/json-schema": "^7.0.15"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      }
    },
    "node_modules/@eslint/object-schema": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-3.0.5.tgz",
      "integrity": "sha512-vqTaUEgxzm+YDSdElad6PiRoX4t8VGDjCtt05zn4nU810UIx/uNEV7/lZJ6KwFThKZOzOxzXy48da+No7HZaMw==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      }
    },
    "node_modules/@eslint/plugin-kit": {
      "version": "0.7.3",
      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.7.3.tgz",
      "integrity": "sha512-IkO+/KEUvwbVpiURZg+P7zF74z5Jxe0UgJxVni+RtoHQ6IZieXaO02kmadomap/q+l6bc/jdPGGqTjhuZnuz1Q==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@eslint/core": "^1.2.1",
        "levn": "^0.4.1"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      }
    },
    "node_modules/@harperfast/extended-iterable": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@harperfast/extended-iterable/-/extended-iterable-1.0.3.tgz",
      "integrity": "sha512-sSAYhQca3rDWtQUHSAPeO7axFIUJOI6hn1gjRC5APVE1a90tuyT8f5WIgRsFhhWA7htNkju2veB9eWL6YHi/Lw==",
      "dev": true,
      "license": "Apache-2.0",
      "optional": true
    },
    "node_modules/@humanfs/core": {
      "version": "0.19.2",
      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.2.tgz",
      "integrity": "sha512-UhXNm+CFMWcbChXywFwkmhqjs3PRCmcSa/hfBgLIb7oQ5HNb1wS0icWsGtSAUNgefHeI+eBrA8I1fxmbHsGdvA==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@humanfs/types": "^0.15.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/node": {
      "version": "0.16.8",
      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.8.tgz",
      "integrity": "sha512-gE1eQNZ3R++kTzFUpdGlpmy8kDZD/MLyHqDwqjkVQI0JMdI1D51sy1H958PNXYkM2rAac7e5/CnIKZrHtPh3BQ==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "dependencies": {
        "@humanfs/core": "^0.19.2",
        "@humanfs/types": "^0.15.0",
        "@humanwhocodes/retry": "^0.4.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/types": {
      "version": "0.15.0",
      "resolved": "https://registry.npmjs.org/@humanfs/types/-/types-0.15.0.tgz",
      "integrity": "sha512-ZZ1w0aoQkwuUuC7Yf+7sdeaNfqQiiLcSRbfI08oAxqLtpXQr9AIVX7Ay7HLDuiLYAaFPu8oBYNq/QIi9URHJ3Q==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/retry": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz",
      "integrity": "sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": ">=18.18"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@inquirer/ansi": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/@inquirer/ansi/-/ansi-2.0.8.tgz",
      "integrity": "sha512-WpQM+Ti6Z40EFwwt+uL2p4UabT+W179zHp6HhLVOzfbwnVn05IPO/eXIZXGNqcT1jbQ15SujNLzQ39k4QPPxBQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=23.5.0 || ^22.13.0 || ^20.17.0"
      }
    },
    "node_modules/@inquirer/confirm": {
      "version": "6.3.2",
      "resolved": "https://registry.npmjs.org/@inquirer/confirm/-/confirm-6.3.2.tgz",
      "integrity": "sha512-Xvr/0HggjddPtGppuqVmxhTw+Hr8PvsZ/k0HmOEaAqQEt80OITNkFWnsdNmyT0/eM4Ab+iJLx2R8rctlEyfSVg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@inquirer/core": "^12.0.3",
        "@inquirer/type": "4.1.1"
      },
      "engines": {
        "node": ">=23.5.0 || ^22.13.0 || ^20.17.0"
      },
      "peerDependencies": {
        "@types/node": ">=18"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        }
      }
    },
    "node_modules/@inquirer/core": {
      "version": "12.0.3",
      "resolved": "https://registry.npmjs.org/@inquirer/core/-/core-12.0.3.tgz",
      "integrity": "sha512-wsSy0sznmXwkty+2PzZwx00Cazc/E0r0B7mAzdGROz2Ct+DFZXaK7WDjGZvgjRldxH5ZhFVfF2lgkYrqgOw2KA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@inquirer/ansi": "^2.0.8",
        "@inquirer/figures": "^2.0.9",
        "@inquirer/type": "4.1.1",
        "cli-width": "^4.1.0",
        "fast-wrap-ansi": "^0.2.0",
        "mute-stream": "^3.0.0",
        "signal-exit": "^4.1.0"
      },
      "engines": {
        "node": ">=23.5.0 || ^22.13.0 || ^20.17.0"
      },
      "peerDependencies": {
        "@types/node": ">=18"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        }
      }
    },
    "node_modules/@inquirer/figures": {
      "version": "2.0.9",
      "resolved": "https://registry.npmjs.org/@inquirer/figures/-/figures-2.0.9.tgz",
      "integrity": "sha512-EAWgUTGQ/Umgga51dE3B2PUHbufuXarDfg86uVgoSgNHNNQnyFKcOrQLWVqYMghuSyHh8+2HUH0Js9cTC1WAdg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=23.5.0 || ^22.13.0 || ^20.17.0"
      }
    },
    "node_modules/@inquirer/type": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/@inquirer/type/-/type-4.1.1.tgz",
      "integrity": "sha512-yJoHYrMnxIsJZCY+0Vb66Dy3he3kL3e2wOBKhoSwWWAzZAY82emlxwgprCtp6yRixvNRNq9ztfRWQYPNr3Go7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=23.5.0 || ^22.13.0 || ^20.17.0"
      },
      "peerDependencies": {
        "@types/node": ">=18"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        }
      }
    },
    "node_modules/@jest/diff-sequences": {
      "version": "30.0.1",
      "resolved": "https://registry.npmjs.org/@jest/diff-sequences/-/diff-sequences-30.0.1.tgz",
      "integrity": "sha512-n5H8QLDJ47QqbCNn5SuFjCRDrOLEZ0h8vAHCK5RL9Ls7Xa8AQLa/YxAc9UjFqoEDM48muwtBGjtMY5cr0PLDCw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@jsverse/transloco": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/@jsverse/transloco/-/transloco-8.4.0.tgz",
      "integrity": "sha512-dGeD2gkYqnSgbG/j6ILXCafgnrGbwcfgpL48m42DoemXutkuN2k/TFskaU27yNM9BeeaNX7zqQtFGdKmz/2wXw==",
      "license": "MIT",
      "dependencies": {
        "@jsverse/transloco-utils": "^8.4.0",
        "@jsverse/utils": "1.0.0-beta.5",
        "tslib": "^2.2.0"
      },
      "peerDependencies": {
        "@angular/core": ">=16.0.0",
        "rxjs": ">=6.0.0"
      }
    },
    "node_modules/@jsverse/transloco-utils": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/@jsverse/transloco-utils/-/transloco-utils-8.4.0.tgz",
      "integrity": "sha512-0gJIpjX15a1UmBmwxHI3fXDu0VElU4FaunbYv6O13DOkhdSY8eV6Whdljokv5dJqXSLKdMxI624upkN13enKJg==",
      "license": "MIT",
      "dependencies": {
        "cosmiconfig": "^8.1.3",
        "tslib": "^2.3.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@jsverse/utils": {
      "version": "1.0.0-beta.5",
      "resolved": "https://registry.npmjs.org/@jsverse/utils/-/utils-1.0.0-beta.5.tgz",
      "integrity": "sha512-z7IdlV6BdSeF3Veii8Yyk64KuyTjNIQnFaW5PAhmDx0wN29lB2BFp8WO6+tJPLPjtlz2yKeNrjkp1XqnMPaeHA==",
      "license": "MIT"
    },
    "node_modules/@keyv/bigmap": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/@keyv/bigmap/-/bigmap-1.3.1.tgz",
      "integrity": "sha512-WbzE9sdmQtKy8vrNPa9BRnwZh5UF4s1KTmSK0KUVLo3eff5BlQNNWDnFOouNpKfPKDnms9xynJjsMYjMaT/aFQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "hashery": "^1.4.0",
        "hookified": "^1.15.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "peerDependencies": {
        "keyv": "^5.6.0"
      }
    },
    "node_modules/@keyv/serialize": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@keyv/serialize/-/serialize-1.1.1.tgz",
      "integrity": "sha512-dXn3FZhPv0US+7dtJsIi2R+c7qWYiReoEh5zUntWCf4oSpMNib8FDhSoed6m3QyZdx5hK7iLFkYk3rNxwt8vTA==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/@lmdb/lmdb-darwin-arm64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-darwin-arm64/-/lmdb-darwin-arm64-3.5.6.tgz",
      "integrity": "sha512-mY5FG4TjPAkY4P0w+OhHaUka5mDh2TX2WKYIwuKzJ1zeW3VvRgxdam/lGJTquI+bthTx5CSHDW+BAQCnNAzkEA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@lmdb/lmdb-darwin-x64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-darwin-x64/-/lmdb-darwin-x64-3.5.6.tgz",
      "integrity": "sha512-foa+pwitysO8k+xhs7psBFfTKnVgR69NlZRRTHaFVDqphh7AdGpLeyRzKw/ofatr/sN6TiHRRW6mmop0ZrrppQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@lmdb/lmdb-linux-arm": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-linux-arm/-/lmdb-linux-arm-3.5.6.tgz",
      "integrity": "sha512-QR4YRyR5h5Z8eGXrNQjiyo2NNDfqi3tCc9dQG5Is1blCt+qWw1ZoBWhlWAr5d+jshkifMIJjVHzHGKbkKzF8Tw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@lmdb/lmdb-linux-arm64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-linux-arm64/-/lmdb-linux-arm64-3.5.6.tgz",
      "integrity": "sha512-HmiyFFdJa38s1heCMSooSPaBSFTHJ3C+ERPp28xAPlDX1YiALJVOgbry065nXd8Y7KISWjnw05zpG1RX8IfftA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@lmdb/lmdb-linux-x64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-linux-x64/-/lmdb-linux-x64-3.5.6.tgz",
      "integrity": "sha512-ADzCuCF2cTNiX9kDScqcz1fjnAkxPpQNneV3KFTdV3wWtVlI2sTGzySoMTgDpinkMMFj1NTJlxA6XR8fwc4hlA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@lmdb/lmdb-win32-arm64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-win32-arm64/-/lmdb-win32-arm64-3.5.6.tgz",
      "integrity": "sha512-J7A9aEQsQiv0TYtBGL7NDIPp2lOS8nnl+zm4sWZm1xlsTTaQ4PgD096Adzdrk27rw3UxCkDXdCUa4ax41oztBQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@lmdb/lmdb-win32-x64": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/@lmdb/lmdb-win32-x64/-/lmdb-win32-x64-3.5.6.tgz",
      "integrity": "sha512-1g7G0knRX2iV/voDu54yxrGqw5Dk0w2oIYb7dgJq8IkOi+m7wbD8Q3QpPFjh0C01G58S88dqGn03len6UPCXsg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-darwin-arm64": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-darwin-arm64/-/msgpackr-extract-darwin-arm64-3.0.4.tgz",
      "integrity": "sha512-LCkGo6JDfaBhgST7UpPWgNgLINpcpabaHfyz5OBx75nUYxBsaEPxjnyNjWpeb/xBup/682QnBfRBy2/LvPutZQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-darwin-x64": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-darwin-x64/-/msgpackr-extract-darwin-x64-3.0.4.tgz",
      "integrity": "sha512-zExlW9zUJKZH/tOtVMttwjKa4Xm/3KcNjnE3dPN92uCktwavMxpgCA3MoJK/DOnTWsQgo224OaST27/mPNAf+w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-linux-arm": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-linux-arm/-/msgpackr-extract-linux-arm-3.0.4.tgz",
      "integrity": "sha512-Tg3yX65f5GbtXLkrYEHE5oibZG9epyYWas7FogTTEJeDEF9JlXJzKgXaNhT3UXlTOeA+AfZpYZYZ0uPj7Cfquw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-linux-arm64": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-linux-arm64/-/msgpackr-extract-linux-arm64-3.0.4.tgz",
      "integrity": "sha512-dgX0P/9wGPJeHFBG+ZmhgE6bmtMt7NP5CRBGyyktpopdk/mW4POnrpQsSLtKI1dwpc+pPLuXHDh6vvskyQE/sw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-linux-x64": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-linux-x64/-/msgpackr-extract-linux-x64-3.0.4.tgz",
      "integrity": "sha512-8TNXMEjJc3QEy7R/x1INhgiU+XakDAFUzBhaz7+Rbrs8NH5UQeHQxxmzsSBJGyV6I1jW79undiQm8tOI+D+8FQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@msgpackr-extract/msgpackr-extract-win32-x64": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@msgpackr-extract/msgpackr-extract-win32-x64/-/msgpackr-extract-win32-x64-3.0.4.tgz",
      "integrity": "sha512-CmCXPQrkbwExx3j946/PtHWHbYJiCRBRDl4BlkRQcJB/YOwQxJRTpoo7aTsortjgoJ1x7opzTSxn7C+ASSLVjQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@napi-rs/nice": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice/-/nice-1.1.1.tgz",
      "integrity": "sha512-xJIPs+bYuc9ASBl+cvGsKbGrJmS6fAKaSZCnT0lhahT5rhA2VVy9/EcIgd2JhtEuFOJNx7UHNn/qiTPTY4nrQw==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "optionalDependencies": {
        "@napi-rs/nice-android-arm-eabi": "1.1.1",
        "@napi-rs/nice-android-arm64": "1.1.1",
        "@napi-rs/nice-darwin-arm64": "1.1.1",
        "@napi-rs/nice-darwin-x64": "1.1.1",
        "@napi-rs/nice-freebsd-x64": "1.1.1",
        "@napi-rs/nice-linux-arm-gnueabihf": "1.1.1",
        "@napi-rs/nice-linux-arm64-gnu": "1.1.1",
        "@napi-rs/nice-linux-arm64-musl": "1.1.1",
        "@napi-rs/nice-linux-ppc64-gnu": "1.1.1",
        "@napi-rs/nice-linux-riscv64-gnu": "1.1.1",
        "@napi-rs/nice-linux-s390x-gnu": "1.1.1",
        "@napi-rs/nice-linux-x64-gnu": "1.1.1",
        "@napi-rs/nice-linux-x64-musl": "1.1.1",
        "@napi-rs/nice-openharmony-arm64": "1.1.1",
        "@napi-rs/nice-win32-arm64-msvc": "1.1.1",
        "@napi-rs/nice-win32-ia32-msvc": "1.1.1",
        "@napi-rs/nice-win32-x64-msvc": "1.1.1"
      }
    },
    "node_modules/@napi-rs/nice-android-arm-eabi": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-android-arm-eabi/-/nice-android-arm-eabi-1.1.1.tgz",
      "integrity": "sha512-kjirL3N6TnRPv5iuHw36wnucNqXAO46dzK9oPb0wj076R5Xm8PfUVA9nAFB5ZNMmfJQJVKACAPd/Z2KYMppthw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-android-arm64": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-android-arm64/-/nice-android-arm64-1.1.1.tgz",
      "integrity": "sha512-blG0i7dXgbInN5urONoUCNf+DUEAavRffrO7fZSeoRMJc5qD+BJeNcpr54msPF6qfDD6kzs9AQJogZvT2KD5nw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-darwin-arm64": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-darwin-arm64/-/nice-darwin-arm64-1.1.1.tgz",
      "integrity": "sha512-s/E7w45NaLqTGuOjC2p96pct4jRfo61xb9bU1unM/MJ/RFkKlJyJDx7OJI/O0ll/hrfpqKopuAFDV8yo0hfT7A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-darwin-x64": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-darwin-x64/-/nice-darwin-x64-1.1.1.tgz",
      "integrity": "sha512-dGoEBnVpsdcC+oHHmW1LRK5eiyzLwdgNQq3BmZIav+9/5WTZwBYX7r5ZkQC07Nxd3KHOCkgbHSh4wPkH1N1LiQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-freebsd-x64": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-freebsd-x64/-/nice-freebsd-x64-1.1.1.tgz",
      "integrity": "sha512-kHv4kEHAylMYmlNwcQcDtXjklYp4FCf0b05E+0h6nDHsZ+F0bDe04U/tXNOqrx5CmIAth4vwfkjjUmp4c4JktQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-arm-gnueabihf": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-arm-gnueabihf/-/nice-linux-arm-gnueabihf-1.1.1.tgz",
      "integrity": "sha512-E1t7K0efyKXZDoZg1LzCOLxgolxV58HCkaEkEvIYQx12ht2pa8hoBo+4OB3qh7e+QiBlp1SRf+voWUZFxyhyqg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-arm64-gnu": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-arm64-gnu/-/nice-linux-arm64-gnu-1.1.1.tgz",
      "integrity": "sha512-CIKLA12DTIZlmTaaKhQP88R3Xao+gyJxNWEn04wZwC2wmRapNnxCUZkVwggInMJvtVElA+D4ZzOU5sX4jV+SmQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-arm64-musl": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-arm64-musl/-/nice-linux-arm64-musl-1.1.1.tgz",
      "integrity": "sha512-+2Rzdb3nTIYZ0YJF43qf2twhqOCkiSrHx2Pg6DJaCPYhhaxbLcdlV8hCRMHghQ+EtZQWGNcS2xF4KxBhSGeutg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-ppc64-gnu": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-ppc64-gnu/-/nice-linux-ppc64-gnu-1.1.1.tgz",
      "integrity": "sha512-4FS8oc0GeHpwvv4tKciKkw3Y4jKsL7FRhaOeiPei0X9T4Jd619wHNe4xCLmN2EMgZoeGg+Q7GY7BsvwKpL22Tg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-riscv64-gnu": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-riscv64-gnu/-/nice-linux-riscv64-gnu-1.1.1.tgz",
      "integrity": "sha512-HU0nw9uD4FO/oGCCk409tCi5IzIZpH2agE6nN4fqpwVlCn5BOq0MS1dXGjXaG17JaAvrlpV5ZeyZwSon10XOXw==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-s390x-gnu": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-s390x-gnu/-/nice-linux-s390x-gnu-1.1.1.tgz",
      "integrity": "sha512-2YqKJWWl24EwrX0DzCQgPLKQBxYDdBxOHot1KWEq7aY2uYeX+Uvtv4I8xFVVygJDgf6/92h9N3Y43WPx8+PAgQ==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-x64-gnu": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-x64-gnu/-/nice-linux-x64-gnu-1.1.1.tgz",
      "integrity": "sha512-/gaNz3R92t+dcrfCw/96pDopcmec7oCcAQ3l/M+Zxr82KT4DljD37CpgrnXV+pJC263JkW572pdbP3hP+KjcIg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-linux-x64-musl": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-linux-x64-musl/-/nice-linux-x64-musl-1.1.1.tgz",
      "integrity": "sha512-xScCGnyj/oppsNPMnevsBe3pvNaoK7FGvMjT35riz9YdhB2WtTG47ZlbxtOLpjeO9SqqQ2J2igCmz6IJOD5JYw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-openharmony-arm64": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-openharmony-arm64/-/nice-openharmony-arm64-1.1.1.tgz",
      "integrity": "sha512-6uJPRVwVCLDeoOaNyeiW0gp2kFIM4r7PL2MczdZQHkFi9gVlgm+Vn+V6nTWRcu856mJ2WjYJiumEajfSm7arPQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-win32-arm64-msvc": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-win32-arm64-msvc/-/nice-win32-arm64-msvc-1.1.1.tgz",
      "integrity": "sha512-uoTb4eAvM5B2aj/z8j+Nv8OttPf2m+HVx3UjA5jcFxASvNhQriyCQF1OB1lHL43ZhW+VwZlgvjmP5qF3+59atA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-win32-ia32-msvc": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-win32-ia32-msvc/-/nice-win32-ia32-msvc-1.1.1.tgz",
      "integrity": "sha512-CNQqlQT9MwuCsg1Vd/oKXiuH+TcsSPJmlAFc5frFyX/KkOh0UpBLEj7aoY656d5UKZQMQFP7vJNa1DNUNORvug==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/nice-win32-x64-msvc": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/nice-win32-x64-msvc/-/nice-win32-x64-msvc-1.1.1.tgz",
      "integrity": "sha512-vB+4G/jBQCAh0jelMTY3+kgFy00Hlx2f2/1zjMoH821IbplbWZOkLiTYXQkygNTzQJTq5cvwBDgn2ppHD+bglQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "0.2.4",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-0.2.4.tgz",
      "integrity": "sha512-9zESzOO5aDByvhIAsOy9TbpZ0Ur2AJbUI7UT73kcUTS2mxAMHOBaa1st/jAymNoCtvrit99kkzT1FZuXVcgfIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@emnapi/core": "^1.1.0",
        "@emnapi/runtime": "^1.1.0",
        "@tybys/wasm-util": "^0.9.0"
      }
    },
    "node_modules/@nx/angular": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/angular/-/angular-23.2.1.tgz",
      "integrity": "sha512-94TpS2u4rcHkPyoa6lE0J2aMaAVrOnSRyrmF0dTck9ImX5bPnBRB6Ml9QehHM6cQ5SERRvgPZd0L2yIa5DQxWA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nx/devkit": "23.2.1",
        "@nx/eslint": "23.2.1",
        "@nx/js": "23.2.1",
        "@nx/web": "23.2.1",
        "@phenomnomnominal/tsquery": "~6.2.0",
        "@typescript-eslint/type-utils": "^8.0.0",
        "jsonc-parser": "^3.2.0",
        "magic-string": "~0.30.2",
        "picocolors": "^1.1.0",
        "picomatch": "4.0.4",
        "semver": "^7.6.3",
        "tslib": "^2.3.0"
      },
      "peerDependencies": {
        "@angular-devkit/build-angular": ">= 20.0.0 < 23.0.0",
        "@angular-devkit/core": ">= 20.0.0 < 23.0.0",
        "@angular-devkit/schematics": ">= 20.0.0 < 23.0.0",
        "@angular/build": ">= 20.0.0 < 23.0.0",
        "@nx/cypress": "23.2.1",
        "@nx/module-federation": "23.2.1",
        "@nx/playwright": "23.2.1",
        "@nx/rspack": "23.2.1",
        "@nx/webpack": "23.2.1",
        "@schematics/angular": ">= 20.0.0 < 23.0.0",
        "ng-packagr": ">= 20.0.0 < 23.0.0",
        "rxjs": "^6.5.3 || ^7.5.0",
        "webpack-merge": "^5.8.0"
      },
      "peerDependenciesMeta": {
        "@angular-devkit/build-angular": {
          "optional": true
        },
        "@angular/build": {
          "optional": true
        },
        "@nx/cypress": {
          "optional": true
        },
        "@nx/module-federation": {
          "optional": true
        },
        "@nx/playwright": {
          "optional": true
        },
        "@nx/rspack": {
          "optional": true
        },
        "@nx/webpack": {
          "optional": true
        },
        "ng-packagr": {
          "optional": true
        },
        "webpack-merge": {
          "optional": true
        }
      }
    },
    "node_modules/@nx/angular/node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/@nx/angular/node_modules/picomatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
      "integrity": "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/@nx/devkit": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/devkit/-/devkit-23.2.1.tgz",
      "integrity": "sha512-uMGbMJpCi+y7eHBEWqygA8JITNgzFZdzVmcKX17EXnFreu14aWZ1kyo6Qh9pKIcbJigO3F46w6ANlYp6wgCovQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ejs": "5.0.1",
        "minimatch": "10.2.5",
        "semver": "^7.6.3",
        "tslib": "^2.3.0",
        "yargs-parser": "21.1.1"
      },
      "peerDependencies": {
        "nx": ">= 22 <= 24 || ^23.0.0-0"
      }
    },
    "node_modules/@nx/eslint": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/eslint/-/eslint-23.2.1.tgz",
      "integrity": "sha512-cqvudRspelZJVxASZIImeGlBXMrZ+83T1IVadFSOwShSNvJiwfpzPs+7jDduspTvgJkOgndxAasawbZ8L6Qxaw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nx/devkit": "23.2.1",
        "@nx/js": "23.2.1",
        "semver": "^7.6.3",
        "tslib": "^2.3.0",
        "typescript": "~6.0.3"
      },
      "peerDependencies": {
        "@nx/jest": "23.2.1",
        "@zkochan/js-yaml": "0.0.7",
        "eslint": "^9.0.0 || ^10.0.0"
      },
      "peerDependenciesMeta": {
        "@nx/jest": {
          "optional": true
        },
        "@zkochan/js-yaml": {
          "optional": true
        }
      }
    },
    "node_modules/@nx/js": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/js/-/js-23.2.1.tgz",
      "integrity": "sha512-52vAau7gmL4oFIohwAQ+rhnbbKeIAir6bKam0+lURvwSFHpkHPzMa0m8L/IlCO9mbRp2vx0gYONsPtL1k7jbqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.29.6",
        "@babel/plugin-proposal-decorators": "^7.22.7",
        "@babel/plugin-transform-class-properties": "^7.22.5",
        "@babel/plugin-transform-class-static-block": "^7.22.5",
        "@babel/plugin-transform-private-methods": "^7.22.5",
        "@babel/plugin-transform-private-property-in-object": "^7.22.5",
        "@babel/plugin-transform-runtime": "^7.23.2",
        "@babel/preset-env": "^7.23.2",
        "@babel/preset-typescript": "^7.22.5",
        "@babel/runtime": "^7.22.6",
        "@nx/devkit": "23.2.1",
        "@nx/workspace": "23.2.1",
        "@zkochan/js-yaml": "0.0.7",
        "babel-plugin-const-enum": "^1.0.1",
        "babel-plugin-macros": "^3.1.0",
        "babel-plugin-transform-typescript-metadata": "^0.3.1",
        "chalk": "^4.1.0",
        "columnify": "^1.6.0",
        "detect-port": "^2.1.0",
        "ignore": "^7.0.5",
        "js-tokens": "^4.0.0",
        "jsonc-parser": "^3.2.0",
        "npm-run-path": "^4.0.1",
        "picocolors": "^1.1.0",
        "picomatch": "4.0.4",
        "semver": "^7.6.3",
        "source-map-support": "0.5.19",
        "tinyglobby": "^0.2.12",
        "tslib": "^2.3.0"
      },
      "peerDependencies": {
        "@swc/cli": ">=0.6.0 <0.9.0",
        "verdaccio": "^6.0.5"
      },
      "peerDependenciesMeta": {
        "@swc/cli": {
          "optional": true
        },
        "verdaccio": {
          "optional": true
        }
      }
    },
    "node_modules/@nx/js/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/compat-data": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/core": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helpers": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/template": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/core/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-compilation-targets": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-compilation-targets/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-create-class-features-plugin": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-class-features-plugin/-/helper-create-class-features-plugin-7.29.7.tgz",
      "integrity": "sha512-IY3ZD9Tmooqr3TUhc3DUWxiuo8xx1DWLhd5M7hQ+ZWJamqM2BbalrBJb2MisSLoYorOj75U03qULCxQTY9r3hg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-member-expression-to-functions": "^7.29.7",
        "@babel/helper-optimise-call-expression": "^7.29.7",
        "@babel/helper-replace-supers": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-create-class-features-plugin/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-create-regexp-features-plugin": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-regexp-features-plugin/-/helper-create-regexp-features-plugin-7.29.10.tgz",
      "integrity": "sha512-/YY9soQuWa8TURtHXHT+GbklpbAA+dZErxFGHIr6qgDg96xuGWrTAs1+MfjgVJPF0YLQsOVsOYs8lhgsPbOinQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "regexpu-core": "^6.5.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-create-regexp-features-plugin/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-define-polyfill-provider": {
      "version": "0.6.8",
      "resolved": "https://registry.npmjs.org/@babel/helper-define-polyfill-provider/-/helper-define-polyfill-provider-0.6.8.tgz",
      "integrity": "sha512-47UwBLPpQi1NoWzLuHNjRoHlYXMwIJoBf7MFou6viC/sIHWYygpvr0B6IAyh5sBdA2nr2LPIRww8lfaUVQINBA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.28.6",
        "@babel/helper-plugin-utils": "^7.28.6",
        "debug": "^4.4.3",
        "lodash.debounce": "^4.0.8",
        "resolve": "^1.22.11"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-module-transforms": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.29.7.tgz",
      "integrity": "sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-remap-async-to-generator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-remap-async-to-generator/-/helper-remap-async-to-generator-7.29.7.tgz",
      "integrity": "sha512-16AMiW26DbXWBbr3B8wNozKM0ydMLB892vaOaJW/fPJdnT8vJk5sdkQcU/isqUxyCE0cEoa8wZOcbgDuC4b6Og==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-wrap-function": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-replace-supers": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-replace-supers/-/helper-replace-supers-7.29.7.tgz",
      "integrity": "sha512-atfGXWSeCiF4DnKZIfmJfQRkSw9b9gNNXR1kqKjbhG4pGYCOnkp8OcTB8E3NXjBu8NpheSnOeNKz8KT7UNFTmQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-member-expression-to-functions": "^7.29.7",
        "@babel/helper-optimise-call-expression": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helper-validator-option": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.29.7.tgz",
      "integrity": "sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/helpers": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.10.tgz",
      "integrity": "sha512-EMCx3AGZ3WfAl6ht7AyQoPm2Lh+BGYEMdc4Q6Hf7uSCDOZFuLq44qNwL+iaim8VlyYhRAo4X43+weadK8ZB4Yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-firefox-class-in-computed-class-key": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-firefox-class-in-computed-class-key/-/plugin-bugfix-firefox-class-in-computed-class-key-7.29.7.tgz",
      "integrity": "sha512-j8SrR0zLZrRsC09DlszEx8FpMiwukKffYXMK0d5LmOglO7vGG6sz/BR/20yHqWH+Lnn31JTt2PE3hIWNgM2J6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-safari-class-field-initializer-scope": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-class-field-initializer-scope/-/plugin-bugfix-safari-class-field-initializer-scope-7.29.7.tgz",
      "integrity": "sha512-r8j8escF+U2FUHo0KOhPUdMzUO+jp9fInva6+ACVAF3Y97Ev+5iNZwiqTghmzNeWwDkOPlYuTcfb1vDaoZKmAQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression/-/plugin-bugfix-safari-id-destructuring-collision-in-function-expression-7.29.7.tgz",
      "integrity": "sha512-GE1TFSiuFeGsCxmYXZl8HwoPrVlwe4rHPFE8weieGKZqnDORK+Ar3vgWMgW+AOxQ6/2TgLSKx9p6W7O4rC6qgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-safari-rest-destructuring-rhs-array": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-rest-destructuring-rhs-array/-/plugin-bugfix-safari-rest-destructuring-rhs-array-7.29.7.tgz",
      "integrity": "sha512-oBNVCvnO5tND+xSopWvV8WNGfpTfgP4Zr/YXXSj8zfmcPktp5Ku/aZlsIowgSD4fjmgHn6sGmB9APVsU5zOdhA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining/-/plugin-bugfix-v8-spread-parameters-in-optional-chaining-7.29.7.tgz",
      "integrity": "sha512-QQt9qKHZ2sg/kivaLr7lnQr8HVrQDdBNSfCsTjiDxRuX/K5ORyKq+Bu8Xr0cDE3Dfkv0cw28Ve0EKyKMvulkOw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7",
        "@babel/plugin-transform-optional-chaining": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.13.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly/-/plugin-bugfix-v8-static-class-fields-redefine-readonly-7.29.7.tgz",
      "integrity": "sha512-pn6QacGLgvCcwc+syUhKE/qSjV2D1IHDB84RNxWYSt1mW3K/SCtjinZ2p0cETJxAWBjPy3K/1lHwG5BjjPxNlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-proposal-decorators": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-decorators/-/plugin-proposal-decorators-7.29.7.tgz",
      "integrity": "sha512-EtU0Hi3GvrTqD56xKmZvV/uCXK2ZbwVNPNLAquVItcAZpUhkXwWlo3Fmj0c2LxgSf2I8IDULeAepwNP1OefLXg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/plugin-syntax-decorators": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-proposal-private-property-in-object": {
      "version": "7.21.0-placeholder-for-preset-env.2",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-property-in-object/-/plugin-proposal-private-property-in-object-7.21.0-placeholder-for-preset-env.2.tgz",
      "integrity": "sha512-SOSkfJDddaM7mak6cPEpswyTRnuRltl429hMraQEglW+OkovnCzsiszTmsrlY//qLFjCpQDFRvjdm2wA5pPm9w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-decorators": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-decorators/-/plugin-syntax-decorators-7.29.7.tgz",
      "integrity": "sha512-9MTTLbF39X6sqM92JPEsoI7++26hjZvzkxKZy64aMhWLH2mPkJ/Q3AV4QLmls3R14FpSpkOwQQfUh962JGQxxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-import-assertions": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-assertions/-/plugin-syntax-import-assertions-7.29.7.tgz",
      "integrity": "sha512-/An1OCBN93thpBAGyfsK2pcf0jvju1SAtKkL2Ny++B5Sy6sqgzXDQH1cZxWbF96Wuk+bn41MDA9bLd4VVAw6rw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-import-attributes": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-attributes/-/plugin-syntax-import-attributes-7.29.7.tgz",
      "integrity": "sha512-zGYcYfq/WmZ4V+kBIXQon9dSSc8ircGZqw9ZaNhhGj9nZkeBu1jHLBDQqYYi5WA9uawvA2sIMbry2nCFhf5Djg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-jsx": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-jsx/-/plugin-syntax-jsx-7.29.7.tgz",
      "integrity": "sha512-TSu8+mHCoEaaCDEZ0I3+6mvTBYR4PCxQwf2z9/r5Tbztv6NaLR3B9thGTTxX2WGuGHJqRiAbKPeGTJ5XWXVg6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-typescript": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.29.7.tgz",
      "integrity": "sha512-ngr+82Sh0xMz25TPCZi+nC2iTzjfCdWS2ONXTp/PtSCHCgaCNBpdMqgvJ2ccdLlClVZ7sisIgB914j/JFe+RZA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-syntax-unicode-sets-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-unicode-sets-regex/-/plugin-syntax-unicode-sets-regex-7.18.6.tgz",
      "integrity": "sha512-727YkEAPwSIQTv5im8QHz3upqp92JTWhidIC81Tdx4VJYIte/VndKf1qKrfnnhPLiPghStWfvC/iFaMCQu7Nqg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-arrow-functions": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.29.7.tgz",
      "integrity": "sha512-N7zArUXWzAMzm+/N0uPBeVB3Fam5lMxtUwMmDK5f/IBBS7a7p1qeUoxd/6CckXoxUdgsntq1Dh8xNW06maZbDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-async-generator-functions": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-generator-functions/-/plugin-transform-async-generator-functions-7.29.7.tgz",
      "integrity": "sha512-d98gXZkgswvkyohMBABkhm3GeXhYj8psWfwQ2C7gtfrKGTykQa/iOIi+JJhwMjPlZ6Vm2XN+DCf3Es1EoG4ZLA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-remap-async-to-generator": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-async-to-generator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-to-generator/-/plugin-transform-async-to-generator-7.29.7.tgz",
      "integrity": "sha512-pcUb2SS+RMo9TWVBwKGI5ShtoG7R+zBsFmCKDa6fe8c+hPr3XJlZgoE5j6i8W7gDjhyvy+85vmYexanvXh3d1w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-remap-async-to-generator": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-block-scoped-functions": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoped-functions/-/plugin-transform-block-scoped-functions-7.29.7.tgz",
      "integrity": "sha512-cUSmjh72N+rN4PrkFlN1dJwNCwjVp5d38/CQrEsFggkD10UiFlBFgdH3tv5dNsLuHY+3S8db2xCHjhZcv5WgvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-block-scoping": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoping/-/plugin-transform-block-scoping-7.29.7.tgz",
      "integrity": "sha512-ONyr4+AZhKh8yKWInVxU9AXA9EbsyeLcL6V0dJy6M2/62vuvpGm29zzuymbTpdc451GEpDIdAyPLP3r+P61yKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-class-properties": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-class-properties/-/plugin-transform-class-properties-7.29.7.tgz",
      "integrity": "sha512-GtcpjFvanPfzNQi3eTitsCqtRRmmqzpy/A+yhTR1HaZo1Ly3EA8ZXxlPyHdR8/IuRMYc3E4wdGBewB2QKQjAaA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-class-static-block": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-class-static-block/-/plugin-transform-class-static-block-7.29.7.tgz",
      "integrity": "sha512-kibJgmEdX2iMwsHY2tSZNDgj8PwIlCQz7FK9KuGKO8zsuoUwSEhoNnNVp/emKWrbY4HeO6kkXfdMqRKKKXBm2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.12.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-classes": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-classes/-/plugin-transform-classes-7.29.7.tgz",
      "integrity": "sha512-qV0OGGBVacduzQHE649JyCneOFI/maT+YKsO+K4Yi3xv2wTPNjM/W2o2gdzMwEAZz7fXNTHAe0NcSg30bIN69g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-globals": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-replace-supers": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-computed-properties": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-computed-properties/-/plugin-transform-computed-properties-7.29.7.tgz",
      "integrity": "sha512-RK7/IyU5phpuCdBAuig5VkzG/EnbDaui5SQGdU9BFrHdV+mV4cUjLMQ9lJDjLNtWHsqtiefpGZUXQP2BiTYMsA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/template": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-destructuring": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-destructuring/-/plugin-transform-destructuring-7.29.7.tgz",
      "integrity": "sha512-iPX8aD6H9zV5s7ZsqTdNocPN/MGQ5sSMnElKrktxjJRMnB2jN/1p2+R7GkfD6CAYoVFqy5A4XnSIUeGgJzIWpg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-dotall-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dotall-regex/-/plugin-transform-dotall-regex-7.29.7.tgz",
      "integrity": "sha512-3qc18hsD2RdZiyJNDNc7HQpv6xbncwh8FYtxNFFzclSyh/trPD9KkVR9BDECUjDLvb7yJVF15GfYUuC+LMkkiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-duplicate-keys": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-keys/-/plugin-transform-duplicate-keys-7.29.7.tgz",
      "integrity": "sha512-6IvRRriEMqnBwD6chtxdLpMYCHWEzN+oL5cyQtjykya19UgzbmKhxmhZgKC/LHxS2nYr9Q/qYPZ5Lr6jOL9+yQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-duplicate-named-capturing-groups-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-named-capturing-groups-regex/-/plugin-transform-duplicate-named-capturing-groups-regex-7.29.7.tgz",
      "integrity": "sha512-2wiIyo2BjtgU7HufSeDnL9L2O7zr8jmhFKuSr65VpRkUiRKRNpb0mdlk56+XPPKoIrfHqzbMuglDvZun0RISsA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-dynamic-import": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dynamic-import/-/plugin-transform-dynamic-import-7.29.7.tgz",
      "integrity": "sha512-giOlEm/EFjfjr+te9NsdjkUo2v4f8rS/SXPumRVHAtbNcyNlvtREkU1dZzaIDclNpnaVhlCqRdFKhJBjBikzLg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-explicit-resource-management": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-explicit-resource-management/-/plugin-transform-explicit-resource-management-7.29.7.tgz",
      "integrity": "sha512-Rstj7coNz8sE+7Ju7ihpHLI564lsK5pUpNNlvptCIC/16E/S5hbl6n3kESPKdNRmqEWlpn5xpS5Q2dvXBsySLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/plugin-transform-destructuring": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-exponentiation-operator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-exponentiation-operator/-/plugin-transform-exponentiation-operator-7.29.7.tgz",
      "integrity": "sha512-zFpMOTLZBdW5LfObqcSbL6kefg4R4eLdmvS0wbN9M6D5Mym/sKm9toOoWyVOa+xDjvCnuWcHls2YonXwHvH3CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-export-namespace-from": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-export-namespace-from/-/plugin-transform-export-namespace-from-7.29.7.tgz",
      "integrity": "sha512-24B2nOy2TeJSMheqwPD4DDQOV/elLSIlKxjZt4i05H5AgdPdWR3n18HnNrcJ+j76WJd9gbwb9jPjNYUy6RautA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-for-of": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-for-of/-/plugin-transform-for-of-7.29.7.tgz",
      "integrity": "sha512-zeSIHh0+E1Um1WJRXCFlHQYu2ieJNdivLLjlBEp+dIBu3S51n+SZZmIXjxnItw6pz56Cn+KvK68BIBVsxq2JiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-function-name": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-function-name/-/plugin-transform-function-name-7.29.7.tgz",
      "integrity": "sha512-otRWaHXE6fbAGkePvaj/kvs3HsqXfPhlnzwSOlnFgbqCPMd975dW+4wZ00WFBt+/YlBGcJwNrARQTOJOb4ZrIg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-json-strings": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-json-strings/-/plugin-transform-json-strings-7.29.7.tgz",
      "integrity": "sha512-RRnE2+eon1rJAq8MnoF1b5kTpY1vU88twHcvcKMrsqP/jxIRqDVs9iJB5fqPuqyeFAW0wJo4MlUIPpQCq/aRsg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-literals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-literals/-/plugin-transform-literals-7.29.7.tgz",
      "integrity": "sha512-DZ/oLP21ZuWx1vKqnoNv6/tvEK48AQOBRai40CX9dTjGluvT/YZCyY3rryDtyUqCEoyNroy5KKPwX2iQCiRvyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-logical-assignment-operators": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-logical-assignment-operators/-/plugin-transform-logical-assignment-operators-7.29.7.tgz",
      "integrity": "sha512-A0H91hh6W8MFRkp5TqJmMr39jzGD1A1E1Ysiv2O06Sfbhkapm+XyIzxWCEh5kqwOZ1/8QZ0dY3SeQ7XBqfJd5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-member-expression-literals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-member-expression-literals/-/plugin-transform-member-expression-literals-7.29.7.tgz",
      "integrity": "sha512-hl1kwFZCCiDyfH25Xmco9jTrkPgnS9pmOzSG7W5I4SaGbLeqKv417hcU2RKmaxoPEgsoJh7ZPOrnPGq99bHoUg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-modules-amd": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-amd/-/plugin-transform-modules-amd-7.29.7.tgz",
      "integrity": "sha512-fxtQoH3m5ywUSIfaH0FGCzWu4McsYon5bD3K4XnskC7f+OyQMj7rsOMi4NvvmJ83WwBAg4UCe+ov4VZlqEvyew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-modules-commonjs": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.29.7.tgz",
      "integrity": "sha512-j0vCldybPC5b5dwCQOJ21uKtHzt7hxLygJTg9eF1ScfaikEDNfzn94XoW5Fi+seBR0nCyL23xaBFFkq7dTM8XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-modules-systemjs": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-systemjs/-/plugin-transform-modules-systemjs-7.29.8.tgz",
      "integrity": "sha512-6iSnEK0zlkLKU4heofK/AdmRD4e2SHVpJMtrwnTCzhnaM98ria4rTrOXBBi45BTTYnJtO8txnPsX4fChYXkmeA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7",
        "@babel/traverse": "^7.29.8"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-modules-umd": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-umd/-/plugin-transform-modules-umd-7.29.7.tgz",
      "integrity": "sha512-B4UkaTK3QpgCwJnrxKfMPKdo92CN7OKXAlpAAnM3UPu0Q0lCCk57ylA9AJbRy2v8dDKOPAAWcoR6CMyeoHwRCA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-named-capturing-groups-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-named-capturing-groups-regex/-/plugin-transform-named-capturing-groups-regex-7.29.7.tgz",
      "integrity": "sha512-vuFoLwr4qnv2xbZ16SQd6uPcH5FNrLHhk/Jzo++0XJFcaDsr4gjJVg6j398oMHiC+83k/GiBzviwF5KBJkPUtQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-new-target": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-new-target/-/plugin-transform-new-target-7.29.7.tgz",
      "integrity": "sha512-fEo41GmsOUhOBlw8ioo6zvjX5Xc2Lqkzlyfqbpsk3eB6TReV18uhxZ0esfEokVbY2+PVJAQHNKxER6lGrzNd3A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-nullish-coalescing-operator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-nullish-coalescing-operator/-/plugin-transform-nullish-coalescing-operator-7.29.7.tgz",
      "integrity": "sha512-idmp1dFaekP9GbcMvG24Kvw2BfhFZjHnNJCkV4WuIY4PskJzwI3f1N5OdgYke38T7rftO6ERulFRn2cFeZwRkg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-numeric-separator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-numeric-separator/-/plugin-transform-numeric-separator-7.29.7.tgz",
      "integrity": "sha512-zR7fv/z14OjgHl4AgRtkDBvBMhIzCxqV/qN/2BCRC7LjFwvuzjYe7gDWxC4Wl/SNsLM6SE1IWvRPYMgSJaUvNw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-object-rest-spread": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-rest-spread/-/plugin-transform-object-rest-spread-7.29.7.tgz",
      "integrity": "sha512-Ld98jn4c0smUywL57m7SgsHq3OpThOa6LqZJif3G6jYOovPleoFhVrBJ1WegRApSFB2wu4+RelAj9AC9G08Z4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/plugin-transform-destructuring": "^7.29.7",
        "@babel/plugin-transform-parameters": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-object-super": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-super/-/plugin-transform-object-super-7.29.7.tgz",
      "integrity": "sha512-Ea/diGcw0twB5IlZPO5sgET6fJsLJqPABqTuFWIR+iMPGPZJkATEIWx0wa+aEQ5UY1CBQyP/gkAiLEqn1vBiQA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-replace-supers": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-optional-catch-binding": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-optional-catch-binding/-/plugin-transform-optional-catch-binding-7.29.7.tgz",
      "integrity": "sha512-sLsyndxK2VwX6yNUOakMb7Sh553ZTe/vVM1XJ+9Z5aW1ytsc8xOIwmyk05NNjN60vkc5/KqoTH6hB4V41LJhng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-optional-chaining": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-optional-chaining/-/plugin-transform-optional-chaining-7.29.7.tgz",
      "integrity": "sha512-6GM1dhvK3gNODkXcEcMCOLEDCLSoZ/sBbro2Ax8HURyasQ4NshagQixkRFdh5niI6E4gmA/jYI/4aT7rRos3ZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-parameters": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-parameters/-/plugin-transform-parameters-7.29.7.tgz",
      "integrity": "sha512-ZDOBqV/qLYJI0YElr8DcENEyARsFQeESqWXH6gZlghYXuPPjvweuDhP4VyEi4BlUBlLRFZVjxoZDMjxhLW766g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-private-methods": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-private-methods/-/plugin-transform-private-methods-7.29.7.tgz",
      "integrity": "sha512-/6Rz4DK1ETDEM/bWHsPHcaEe7ZaT1EqSXjtSP/L0DijOYuaUhiRiOKcwpZ8P7zR4xXEHc2ITdiCgBm9Tpyv9ug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-private-property-in-object": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-private-property-in-object/-/plugin-transform-private-property-in-object-7.29.7.tgz",
      "integrity": "sha512-+BNo06dnrzdNNqCm1X6YUaVv0DKk8Q+JYcoZfOkLhYWNCXzlwTSRq8zGWayT1csjcpNXV9CQTBRRbmTLZac5cA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-property-literals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-property-literals/-/plugin-transform-property-literals-7.29.7.tgz",
      "integrity": "sha512-bOMRLQuI0A5ZqHq3OWJ89/rXpJ/NJrbVhXiP4zwPGMs6kpcVsuTUNjwoE30K0Qm3mf48a/TnRYYD6vPNqcg6jA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-regenerator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regenerator/-/plugin-transform-regenerator-7.29.8.tgz",
      "integrity": "sha512-0UpIXPtdDtMXfnV2OJAVMLpj3H/92vmkA6lpSRakmycJvj3VUy6Xs1dM8tXRugupykr5WB+LpiVl0J8LMVg2mg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-regexp-modifiers": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regexp-modifiers/-/plugin-transform-regexp-modifiers-7.29.7.tgz",
      "integrity": "sha512-mB5Fs0VWrJ42ZCmc8114v60qetdaUVNkj9PmSZRmanCZM3S9hm0CFRLjRmYIsuXav14l2jvZ+4T8iiCGnhj3nQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-reserved-words": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-reserved-words/-/plugin-transform-reserved-words-7.29.7.tgz",
      "integrity": "sha512-5+YhdpVgmfSmwZyLMftfaiffLRMHjzIRHFHHLdibcSyJm2pasMrKHrO3Ptrt2DRshjvpgjEJJ1zVW14WPq/6QA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-runtime": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-runtime/-/plugin-transform-runtime-7.29.7.tgz",
      "integrity": "sha512-xmAscdE/AsqRW7vutbPNoUmu/nF5SrLKPs7aoJgEjo35lLKA/Bc0i2rMv/hr1+Y0o1bQCiVtith3u2vdgRL39Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "babel-plugin-polyfill-corejs2": "^0.4.14",
        "babel-plugin-polyfill-corejs3": "^0.13.0",
        "babel-plugin-polyfill-regenerator": "^0.6.5",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-runtime/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-shorthand-properties": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-shorthand-properties/-/plugin-transform-shorthand-properties-7.29.7.tgz",
      "integrity": "sha512-I+WYbGBAiCn7nA6xBrlgPH+MB7HWb4u8pv5S0Pv7OtwNvIFvCCb24YlttKEeUFVurfBCEaOTnuhlqsb7f0Z5Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-spread": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-spread/-/plugin-transform-spread-7.29.8.tgz",
      "integrity": "sha512-4S9ksMGVWUshvgK0mKfvZky7leuG5/uoFVwMpAomJ8bMoDJiNHRVmc1EglwW/CmGVSqqWpEbXm9FmbRit22qoA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-sticky-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-sticky-regex/-/plugin-transform-sticky-regex-7.29.7.tgz",
      "integrity": "sha512-BCHzNYJGe9l7EpwwDBN/ztlL2NYFFq8hp9ddjtUEM9f2O7S7kKV/lL6Fwo7IF7NSkYhPK2vO+86nIGltA90MsA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-template-literals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-template-literals/-/plugin-transform-template-literals-7.29.7.tgz",
      "integrity": "sha512-NCSEJ4sLFU2gqAub45HYh4fus2yQ36rr6ei6vpU7NdoJqCpxvEG8E6eJpscGyXP3VHD2Ny+fSXr04k1hoUrFqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-typeof-symbol": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typeof-symbol/-/plugin-transform-typeof-symbol-7.29.7.tgz",
      "integrity": "sha512-223mNGoTkBiTEWFoK+Q6Go3tueMRclO8vxxxxquNCYuNI4jWOofFKJRRDu6SDrB8Sgo1UEGW9T4GAQ8ZyRso1A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-typescript": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typescript/-/plugin-transform-typescript-7.29.9.tgz",
      "integrity": "sha512-FFwIwzU+7SCOuxxV4YtJql6T9981ZVTm+FHO5GhVsRqCTdy0WwrEZh3l42ARpXruJUDGOptdduHW6Zr7pNPLNg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-create-class-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.29.7",
        "@babel/plugin-syntax-typescript": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-unicode-escapes": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-escapes/-/plugin-transform-unicode-escapes-7.29.7.tgz",
      "integrity": "sha512-jCfXxSjf94lf4E0hKE0AByxF6F3/pVFqRdUUNkDJhsY0m1ZKjnN6ZYyMeHNpzflxb/0q5b7t3p+BE+SLF1WOtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-unicode-property-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-property-regex/-/plugin-transform-unicode-property-regex-7.29.7.tgz",
      "integrity": "sha512-OgZ+zoAJgZLUCunsTRQ5LAjOywDv5zzZ2/hQ5aMw1pGXyY2rtE8/chXYUmu3AlVHKpm10KEdG9aMwbI/K76ZGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-unicode-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-regex/-/plugin-transform-unicode-regex-7.29.7.tgz",
      "integrity": "sha512-7D/x/23/d/3VqZ0QA+LGbZMlGwZjztBygSWWWsfTPoQ1oQ6Q1P6Mr3d0kk42XabyUVw+fha3LqdRsFqeKqvCyA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/plugin-transform-unicode-sets-regex": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-sets-regex/-/plugin-transform-unicode-sets-regex-7.29.7.tgz",
      "integrity": "sha512-BLOhLht9DOJwIxlmp91wHvkXv1lguuHS3/FwUO8HL1H0u8s4hR1gASVFyilu9iGtcTRYqjTZmlsFFeQletntEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/preset-env": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/preset-env/-/preset-env-7.29.7.tgz",
      "integrity": "sha512-GYzX36n1nsciIb0uyH0GHwxwtNwPQIcpxSeiVLDtG/B7jB5xXgchnmL1f/jCX5o+pwnaDBtO60ONSJhEBJfxYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "@babel/plugin-bugfix-firefox-class-in-computed-class-key": "^7.29.7",
        "@babel/plugin-bugfix-safari-class-field-initializer-scope": "^7.29.7",
        "@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": "^7.29.7",
        "@babel/plugin-bugfix-safari-rest-destructuring-rhs-array": "^7.29.7",
        "@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": "^7.29.7",
        "@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly": "^7.29.7",
        "@babel/plugin-proposal-private-property-in-object": "7.21.0-placeholder-for-preset-env.2",
        "@babel/plugin-syntax-import-assertions": "^7.29.7",
        "@babel/plugin-syntax-import-attributes": "^7.29.7",
        "@babel/plugin-syntax-unicode-sets-regex": "^7.18.6",
        "@babel/plugin-transform-arrow-functions": "^7.29.7",
        "@babel/plugin-transform-async-generator-functions": "^7.29.7",
        "@babel/plugin-transform-async-to-generator": "^7.29.7",
        "@babel/plugin-transform-block-scoped-functions": "^7.29.7",
        "@babel/plugin-transform-block-scoping": "^7.29.7",
        "@babel/plugin-transform-class-properties": "^7.29.7",
        "@babel/plugin-transform-class-static-block": "^7.29.7",
        "@babel/plugin-transform-classes": "^7.29.7",
        "@babel/plugin-transform-computed-properties": "^7.29.7",
        "@babel/plugin-transform-destructuring": "^7.29.7",
        "@babel/plugin-transform-dotall-regex": "^7.29.7",
        "@babel/plugin-transform-duplicate-keys": "^7.29.7",
        "@babel/plugin-transform-duplicate-named-capturing-groups-regex": "^7.29.7",
        "@babel/plugin-transform-dynamic-import": "^7.29.7",
        "@babel/plugin-transform-explicit-resource-management": "^7.29.7",
        "@babel/plugin-transform-exponentiation-operator": "^7.29.7",
        "@babel/plugin-transform-export-namespace-from": "^7.29.7",
        "@babel/plugin-transform-for-of": "^7.29.7",
        "@babel/plugin-transform-function-name": "^7.29.7",
        "@babel/plugin-transform-json-strings": "^7.29.7",
        "@babel/plugin-transform-literals": "^7.29.7",
        "@babel/plugin-transform-logical-assignment-operators": "^7.29.7",
        "@babel/plugin-transform-member-expression-literals": "^7.29.7",
        "@babel/plugin-transform-modules-amd": "^7.29.7",
        "@babel/plugin-transform-modules-commonjs": "^7.29.7",
        "@babel/plugin-transform-modules-systemjs": "^7.29.7",
        "@babel/plugin-transform-modules-umd": "^7.29.7",
        "@babel/plugin-transform-named-capturing-groups-regex": "^7.29.7",
        "@babel/plugin-transform-new-target": "^7.29.7",
        "@babel/plugin-transform-nullish-coalescing-operator": "^7.29.7",
        "@babel/plugin-transform-numeric-separator": "^7.29.7",
        "@babel/plugin-transform-object-rest-spread": "^7.29.7",
        "@babel/plugin-transform-object-super": "^7.29.7",
        "@babel/plugin-transform-optional-catch-binding": "^7.29.7",
        "@babel/plugin-transform-optional-chaining": "^7.29.7",
        "@babel/plugin-transform-parameters": "^7.29.7",
        "@babel/plugin-transform-private-methods": "^7.29.7",
        "@babel/plugin-transform-private-property-in-object": "^7.29.7",
        "@babel/plugin-transform-property-literals": "^7.29.7",
        "@babel/plugin-transform-regenerator": "^7.29.7",
        "@babel/plugin-transform-regexp-modifiers": "^7.29.7",
        "@babel/plugin-transform-reserved-words": "^7.29.7",
        "@babel/plugin-transform-shorthand-properties": "^7.29.7",
        "@babel/plugin-transform-spread": "^7.29.7",
        "@babel/plugin-transform-sticky-regex": "^7.29.7",
        "@babel/plugin-transform-template-literals": "^7.29.7",
        "@babel/plugin-transform-typeof-symbol": "^7.29.7",
        "@babel/plugin-transform-unicode-escapes": "^7.29.7",
        "@babel/plugin-transform-unicode-property-regex": "^7.29.7",
        "@babel/plugin-transform-unicode-regex": "^7.29.7",
        "@babel/plugin-transform-unicode-sets-regex": "^7.29.7",
        "@babel/preset-modules": "0.1.6-no-external-plugins",
        "babel-plugin-polyfill-corejs2": "^0.4.15",
        "babel-plugin-polyfill-corejs3": "^0.14.0",
        "babel-plugin-polyfill-regenerator": "^0.6.6",
        "core-js-compat": "^3.48.0",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/preset-env/node_modules/babel-plugin-polyfill-corejs3": {
      "version": "0.14.2",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs3/-/babel-plugin-polyfill-corejs3-0.14.2.tgz",
      "integrity": "sha512-coWpDLJ410R781Npmn/SIBZEsAetR4xVi0SxLMXPaMO4lSf1MwnkGYMtkFxew0Dn8B3/CpbpYxN0JCgg8mn67g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-define-polyfill-provider": "^0.6.8",
        "core-js-compat": "^3.48.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/preset-env/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/preset-modules": {
      "version": "0.1.6-no-external-plugins",
      "resolved": "https://registry.npmjs.org/@babel/preset-modules/-/preset-modules-0.1.6-no-external-plugins.tgz",
      "integrity": "sha512-HrcgcIESLm9aIR842yhJ5RWan/gebQUJ6E/E5+rf0y9o6oj7w0Br+sWuL6kEQ/o/AdfvR1Je9jG18/gnpwjEyA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@babel/types": "^7.4.4",
        "esutils": "^2.0.2"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/preset-typescript": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/preset-typescript/-/preset-typescript-7.29.7.tgz",
      "integrity": "sha512-/Foi8vKY2EVbed/1eZx0gJEEwHAIxogrySI7rULcRIvhZzbvoE/b5qG5Ghc0WKAFKOHA9SD1x7RsFlOYdutIiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "@babel/plugin-syntax-jsx": "^7.29.7",
        "@babel/plugin-transform-modules-commonjs": "^7.29.7",
        "@babel/plugin-transform-typescript": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@nx/js/node_modules/babel-plugin-const-enum": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/babel-plugin-const-enum/-/babel-plugin-const-enum-1.2.0.tgz",
      "integrity": "sha512-o1m/6iyyFnp9MRsK1dHF3bneqyf3AlM2q3A/YbgQr2pCat6B6XJVDv2TXqzfY2RYUi4mak6WAksSBPlyYGx9dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@babel/plugin-syntax-typescript": "^7.3.3",
        "@babel/traverse": "^7.16.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@nx/js/node_modules/babel-plugin-polyfill-corejs2": {
      "version": "0.4.17",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs2/-/babel-plugin-polyfill-corejs2-0.4.17.tgz",
      "integrity": "sha512-aTyf30K/rqAsNwN76zYrdtx8obu0E4KoUME29B1xj+B3WxgvWkp943vYQ+z8Mv3lw9xHXMHpvSPOBxzAkIa94w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.28.6",
        "@babel/helper-define-polyfill-provider": "^0.6.8",
        "semver": "^6.3.1"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/babel-plugin-polyfill-corejs2/node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@nx/js/node_modules/babel-plugin-polyfill-corejs3": {
      "version": "0.13.0",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs3/-/babel-plugin-polyfill-corejs3-0.13.0.tgz",
      "integrity": "sha512-U+GNwMdSFgzVmfhNm8GJUX88AadB3uo9KpJqS3FaqNIPKgySuvMb+bHPsOmmuWyIcuqZj/pzt1RUIUZns4y2+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-define-polyfill-provider": "^0.6.5",
        "core-js-compat": "^3.43.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/babel-plugin-polyfill-regenerator": {
      "version": "0.6.8",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-regenerator/-/babel-plugin-polyfill-regenerator-0.6.8.tgz",
      "integrity": "sha512-M762rNHfSF1EV3SLtnCJXFoQbbIIz0OyRwnCmV0KPC7qosSfCO0QLTSuJX3ayAebubhE6oYBAYPrBA5ljowaZg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-define-polyfill-provider": "^0.6.8"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@nx/js/node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@nx/js/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@nx/js/node_modules/picomatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
      "integrity": "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/@nx/js/node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/@nx/js/node_modules/source-map-support": {
      "version": "0.5.19",
      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.19.tgz",
      "integrity": "sha512-Wonm7zOCIJzBGQdB+thsPar0kYuCIzYvxZwlBa87yi/Mdjv7Tip2cyVbLj5o0cFPN4EVkuTwb3GDDyUx2DGnGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/@nx/nx-darwin-arm64": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-darwin-arm64/-/nx-darwin-arm64-23.2.1.tgz",
      "integrity": "sha512-majzvZlhlWL8MSDEKbQoGv3qM1u7v8Pk7X86srWsySbGDnCJ5BpMFyqMeroQ3AY4lxRjLYWACX5YXVPy2ttRtQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@nx/nx-darwin-x64": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-darwin-x64/-/nx-darwin-x64-23.2.1.tgz",
      "integrity": "sha512-C+KkJwGOZ3h2RjEoQk2SWBdMlKq4BdMfTtxCJ9YgCxjPKqT8V/57tn1Dzz9fnw76P8+PocsfRdjIS0cj9r7isA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@nx/nx-freebsd-x64": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-freebsd-x64/-/nx-freebsd-x64-23.2.1.tgz",
      "integrity": "sha512-GxxMtUlZWy74b15iyHVw+c4a0V2pSHR6RKbvmaSJQ3BXJrJarIqaWys/JrvcV2I/AjtrN7Tq7cFxCEaxkwCsEA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@nx/nx-linux-arm-gnueabihf": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-linux-arm-gnueabihf/-/nx-linux-arm-gnueabihf-23.2.1.tgz",
      "integrity": "sha512-Wr/VLZkPhEsDN7GGx0wOmvZ6v7yMrMf9WpLfrcTVe10NPUB/y6xYaoTDo8teKOBNLsPJ73C40bj2ZBmWtGPg7Q==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@nx/nx-linux-arm64-gnu": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-linux-arm64-gnu/-/nx-linux-arm64-gnu-23.2.1.tgz",
      "integrity": "sha512-lGPhJYkJbIlTWj38FrHZ3qnaGkAfafPrK+6KjGdt+ubDOt9fp0lyUbEhfdg9JuIL++hOgcTHvz0FOA6S+7k3nA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@nx/nx-linux-arm64-musl": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-linux-arm64-musl/-/nx-linux-arm64-musl-23.2.1.tgz",
      "integrity": "sha512-HrHBmBjh++NBE1p0DBjnc53Ech86/4gy4V1bAUJRViG1/FSJAopKE8qQqanYfShOUsHXk6ohPIhf6nlC8LsFFQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@nx/nx-linux-x64-gnu": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-linux-x64-gnu/-/nx-linux-x64-gnu-23.2.1.tgz",
      "integrity": "sha512-D1mSU/kdC1N8aeo7RpmuXWOl77GR4QIbam4dpUmezAwdNkIHlIq7hwqec+4HDWum9nlNmQX/dZn0nZaBem0rRA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@nx/nx-linux-x64-musl": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-linux-x64-musl/-/nx-linux-x64-musl-23.2.1.tgz",
      "integrity": "sha512-p8Lc4RLu7cj4iP7NCnivLv4Qw+RorrLRO6s2J0LNIMH4nI1PAu5p5IztsCb3lsRo0f/ERCQ8DGwBn2BM1J8Blg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@nx/nx-win32-arm64-msvc": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-win32-arm64-msvc/-/nx-win32-arm64-msvc-23.2.1.tgz",
      "integrity": "sha512-XWYG+6P368xOZXU1z3QH4jXlaajQDxlXVGzYXogp+i09twEAhE7LV6fmv8gQptBta67EZy610KcKu38IVn6x7Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@nx/nx-win32-x64-msvc": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/nx-win32-x64-msvc/-/nx-win32-x64-msvc-23.2.1.tgz",
      "integrity": "sha512-qZQBNB4L/yljM81Fm5M/LoyCMoGJc7yc//KePQ5xiyhzZjJENooHsFkB8ps/pSv4cfHKfYJbvgBAMPOLXeHqqA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@nx/web": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/web/-/web-23.2.1.tgz",
      "integrity": "sha512-XmlnwbNP4cjNHmD9G7C/aWigxujmDhIB6mTFw9qCq27c7q52baDRFVQhQsS9JZxla44Z4oUhc9Jgf0Rvn35qMA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nx/devkit": "23.2.1",
        "@nx/js": "23.2.1",
        "detect-port": "^2.1.0",
        "http-server": "^14.1.0",
        "picocolors": "^1.1.0",
        "tslib": "^2.3.0"
      },
      "peerDependencies": {
        "@nx/cypress": "23.2.1",
        "@nx/eslint": "23.2.1",
        "@nx/jest": "23.2.1",
        "@nx/playwright": "23.2.1",
        "@nx/vite": "23.2.1",
        "@nx/webpack": "23.2.1"
      },
      "peerDependenciesMeta": {
        "@nx/cypress": {
          "optional": true
        },
        "@nx/eslint": {
          "optional": true
        },
        "@nx/jest": {
          "optional": true
        },
        "@nx/playwright": {
          "optional": true
        },
        "@nx/vite": {
          "optional": true
        },
        "@nx/webpack": {
          "optional": true
        }
      }
    },
    "node_modules/@nx/workspace": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/@nx/workspace/-/workspace-23.2.1.tgz",
      "integrity": "sha512-lC5NdIQUK7tmz4SeJE0zJ+DTDTAYvbs88gZJQZBwAqkky20ZlRnJiebrOXHlhhVn6Cn35XVLmEkhEsZVda1R0A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nx/devkit": "23.2.1",
        "@zkochan/js-yaml": "0.0.7",
        "chalk": "^4.1.0",
        "nx": "23.2.1",
        "picomatch": "4.0.4",
        "semver": "^7.6.3",
        "tslib": "^2.3.0",
        "yargs-parser": "21.1.1"
      }
    },
    "node_modules/@nx/workspace/node_modules/picomatch": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.4.tgz",
      "integrity": "sha512-QP88BAKvMam/3NxH6vj2o21R6MjxZUAd6nlwAS/pnGvN9IVLocLHxGYIzFhg6fUQ+5th6P4dv4eW9jX3DSIj7A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/@oxc-parser/binding-android-arm-eabi": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-android-arm-eabi/-/binding-android-arm-eabi-0.150.0.tgz",
      "integrity": "sha512-oQef2Zu4Prz1KLKznz3HqZzU9uVoA5PMoDZuuLmqms7hKmKSAPzlaMnLllJq3t+rgKmfJJ2siPrpZfFrW06btw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-android-arm64": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-android-arm64/-/binding-android-arm64-0.150.0.tgz",
      "integrity": "sha512-B6ofpoFiAUwIZ0MJ2IgHPvZK8FAtL4qzSZRwOkAKIfxEobE1mQC8nDdiFZj7pUaJiVUVCsfkMsBJKedzO8rZvA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-darwin-arm64": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-darwin-arm64/-/binding-darwin-arm64-0.150.0.tgz",
      "integrity": "sha512-J+9IHKzx/bSz1JetOfD4zKXSK9sOm4/a7+0qomJODcTL6JsRXGeV/ZdkAPSIDydfFmWzYCraMlQEosSZEyBYkQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-darwin-x64": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-darwin-x64/-/binding-darwin-x64-0.150.0.tgz",
      "integrity": "sha512-v6IPfcAcSYrBWXV5Tce1DmxDMXLhEYpIIWiRFPJopgCVscZdLaV4MRQOUxvL3usQlw+yrwYOjBFB9IwBx+jUiQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-freebsd-x64": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-freebsd-x64/-/binding-freebsd-x64-0.150.0.tgz",
      "integrity": "sha512-AoR/4jD02HET0KO0yNT4nbTE+XJUxiO9jB1X/ycEjUE3WrIJ3IjV/Vf+gskhWLcqqeXfvNnkDtBR7epllAm88A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-arm-gnueabihf": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-0.150.0.tgz",
      "integrity": "sha512-A/hycCFjLUrCmLoL5O/vBp40ohlaXO1Ta3v5hqYZxicYFs129wZmgZJggcW4mYGYbZebQLhup+N8JjeQl8qwyw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-arm-musleabihf": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-arm-musleabihf/-/binding-linux-arm-musleabihf-0.150.0.tgz",
      "integrity": "sha512-pbqahg1Pkz7J4RKmXm30s/iQu99hv64ayXCu8P4p75HcEH5azOdR4eGqiB6lFGkFR3mMpzaYsSKLkS8oJbjmeQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-arm64-gnu": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-0.150.0.tgz",
      "integrity": "sha512-HV11aRbBQGwqv8bEo+K/6qr88uB4fEe1mhXncMhlVCrj+WpBSraxrUzHaPVmeQRU6x6x8v/3DuCbbo93rpp+fw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-arm64-musl": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-arm64-musl/-/binding-linux-arm64-musl-0.150.0.tgz",
      "integrity": "sha512-k6pVkJqALwtEuP4zukVhGRhdIy4+ofChUIUUsAHHyqDZlNsknmel3JjbggrJiWGaes6h/dIcWmEXsKW4SmK9oQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-ppc64-gnu": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-0.150.0.tgz",
      "integrity": "sha512-tEFg39mw/rHO5n8GK2DR4ZMFfsPQZtnQIPbsIpjoQRomJc/2tRfsCSmCT6gNit+NZGoeJG5aH9ATDH5bf0WnoQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-riscv64-gnu": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-riscv64-gnu/-/binding-linux-riscv64-gnu-0.150.0.tgz",
      "integrity": "sha512-0JO7IFkoek6HqV589Menx3hJySNXi6quRhO4tq2P7kpEHKEXoDATnoPVUpn5B7gDH2KLkdo751N0uIrGJFCTCw==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-riscv64-musl": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-riscv64-musl/-/binding-linux-riscv64-musl-0.150.0.tgz",
      "integrity": "sha512-7XPzREnyAS5wHU9aB+49Uaqgoo1gVCklHc3DRlc3fJy2tXD/eAJFN1QFz/crj+Ulup5P1+axNREF+/RGaB/IRA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-s390x-gnu": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-0.150.0.tgz",
      "integrity": "sha512-7n7ZxcbRWDFaTdyj8M8p0O9OfzoMKm8O6syBAIgcSutbOALq0Bb9G52Me+XH0anMLZV+NgXc726gqgG2q39vcQ==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-x64-gnu": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-x64-gnu/-/binding-linux-x64-gnu-0.150.0.tgz",
      "integrity": "sha512-Vx0GSA9ZCRTUiczoEQnIIyXkMvtEY8uc6IiwLQtMe5ci2sXPqjrry0Ek5fsPP1k2kCzkML3ow9UOOEgnEDi7Bw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-linux-x64-musl": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-linux-x64-musl/-/binding-linux-x64-musl-0.150.0.tgz",
      "integrity": "sha512-ii4/9m3viDLssMnfXU7/Pni/3nYplApuGayceX4qsVGaqqQJCx3tHIH9M/HWIeSty5i8LjS21zPYT6lVIkwLxw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-openharmony-arm64": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-openharmony-arm64/-/binding-openharmony-arm64-0.150.0.tgz",
      "integrity": "sha512-ZtoxX5rez36ZWkwtiEhjkCPnlTPoQ2I7lIL0IYZ1yjxMYohbvoOjBmUIZzrf9W/HouONq0omIfTeCWEY+R380w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-win32-arm64-msvc": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-0.150.0.tgz",
      "integrity": "sha512-VqeRb5JX/bKYBrff7TUDvJyKY0914UzuCkuXIGxJS4FUmvMNfqkCbc7Sq90iMz9DlmAtlggwaBYQ9eg3h3ltiw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-win32-ia32-msvc": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-win32-ia32-msvc/-/binding-win32-ia32-msvc-0.150.0.tgz",
      "integrity": "sha512-EPqJfeZ4Pgg2BJSsCV8GozxV0FDltRzpVtGVa1r2noJu1iu+opOw3gtBWXwIo9odCT/MdFfyHxdy0/CRqs3OqA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-parser/binding-win32-x64-msvc": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-parser/binding-win32-x64-msvc/-/binding-win32-x64-msvc-0.150.0.tgz",
      "integrity": "sha512-n5YMzbqwPQqozbkrexi0lNZrUz5cnPHalYpFWe6Dau7AmKIWNo+y24IwzDuZEQtEdUHuKhXmMMih/MPjOI+CMw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxc-project/types": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.150.0.tgz",
      "integrity": "sha512-rDS5/31E9HfPl/CIzGrn0DOlvBbXFseQ5URJ9sYMfstbKLD/c6Gm9vmRzRGDdAXyOIL4zmO37lc9RIwYqVruZw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/oxc-project"
      }
    },
    "node_modules/@parcel/watcher": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher/-/watcher-2.6.0.tgz",
      "integrity": "sha512-7FNeNl8NCE7aINx7WXiKQrPYZWC/hvrTsmk6zmxbI7LTXE7hVek/n8AfVgpe2y82zl3w0HvCHN0bVKMBoJcC0w==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "detect-libc": "^2.0.3",
        "is-glob": "^4.0.3",
        "node-addon-api": "^7.0.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "@parcel/watcher-android-arm64": "2.6.0",
        "@parcel/watcher-darwin-arm64": "2.6.0",
        "@parcel/watcher-darwin-x64": "2.6.0",
        "@parcel/watcher-freebsd-x64": "2.6.0",
        "@parcel/watcher-linux-arm-glibc": "2.6.0",
        "@parcel/watcher-linux-arm-musl": "2.6.0",
        "@parcel/watcher-linux-arm64-glibc": "2.6.0",
        "@parcel/watcher-linux-arm64-musl": "2.6.0",
        "@parcel/watcher-linux-x64-glibc": "2.6.0",
        "@parcel/watcher-linux-x64-musl": "2.6.0",
        "@parcel/watcher-win32-arm64": "2.6.0",
        "@parcel/watcher-win32-x64": "2.6.0"
      }
    },
    "node_modules/@parcel/watcher-android-arm64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-android-arm64/-/watcher-android-arm64-2.6.0.tgz",
      "integrity": "sha512-trgpLSCKRC/huFjXX/Smh+0sWe4+YtKfktIToiMl59ghz7z+qkH6kMvNnUbLyRs9N11t8l4svSCs1+5B3rOAhA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-darwin-arm64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-darwin-arm64/-/watcher-darwin-arm64-2.6.0.tgz",
      "integrity": "sha512-Y3QV0gl7Q1zbfueunkWIERICbEojQFCgpyG7YqOGNFLsckXyI1xu9mAIUpKY9QBYzBtSkN8dBPwd3yiAO9ovMw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-darwin-x64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-darwin-x64/-/watcher-darwin-x64-2.6.0.tgz",
      "integrity": "sha512-Ohv6OpzhUfKYD7Beb8kDvG0jbIxORCYY1JRdZnaBtnjjkJxgD7ZVL0nw2sCYd0yTMKTvz3nnTnOF3cDifK+kvw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-freebsd-x64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-freebsd-x64/-/watcher-freebsd-x64-2.6.0.tgz",
      "integrity": "sha512-5HmXvDgs8VK+74jF9y9/2FE3/OnlcKmc56tjmSrEuZjpSZOGL+fvAu+HKJBdPs9uwoP2hE6TlSUpXZ/C5jUFmQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-arm-glibc": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-arm-glibc/-/watcher-linux-arm-glibc-2.6.0.tgz",
      "integrity": "sha512-Ps/hui3A+vMbjdqlqAowK2ZL8+BO8dBjxeWXj6npTBs3jx4wWmbPpaLuqwrQrSqIVMCnpWo238bJ1U37GhQOYg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-arm-musl": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-arm-musl/-/watcher-linux-arm-musl-2.6.0.tgz",
      "integrity": "sha512-9c6AUHgHoG+IY88MRIHupztQiQnrbqHYQjkM2btA+Bf/wQnQMuiD0Wfk1EVv3TlNT3x41uU71rn6E4xh/+zvkw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-arm64-glibc": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-arm64-glibc/-/watcher-linux-arm64-glibc-2.6.0.tgz",
      "integrity": "sha512-yHRqS2owEXe6Hic9z6Mh1ECsCd+ODVOGvZDyciqRd21+v+o+DnXMOrw50DSpIG2sb8GPEaPPmfeCAWKPJdq46g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-arm64-musl": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-arm64-musl/-/watcher-linux-arm64-musl-2.6.0.tgz",
      "integrity": "sha512-WhB2e/V7rqdHHWZusBSPuy5Ei8S6lSz6FE5TKKQz5h3a0O+C+mhY7vxU9b/stqvMb8beLnPY82ZrFTLKs+SrKA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-x64-glibc": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-x64-glibc/-/watcher-linux-x64-glibc-2.6.0.tgz",
      "integrity": "sha512-ulGE6x6Oz6iAwg75T8YQSoguBWasniIbX+QWpaYPcCnDOpdWX3k+4xbEYPZVLxOuoJI+svJJPD3sEj8G7lrQ3A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-linux-x64-musl": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-linux-x64-musl/-/watcher-linux-x64-musl-2.6.0.tgz",
      "integrity": "sha512-tkBYKt7YQrjIJWYDnto2YgO8MRkjlMTSNoRHzsXinBqbLdeOM3L32wPZJvIZxqaLMfSlS/4sUjH/6STVP/XDLw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-win32-arm64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-win32-arm64/-/watcher-win32-arm64-2.6.0.tgz",
      "integrity": "sha512-gIZAP23jaHjGWasY/TY6yL7NHFClf0Ga7FN+iINvk+KN94rhm94lYZhFsbYFNcA04/onvGD9kKmiJLJB2HbNwQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@parcel/watcher-win32-x64": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/@parcel/watcher-win32-x64/-/watcher-win32-x64-2.6.0.tgz",
      "integrity": "sha512-cA+/pXV2YkfxlIcXOQ5fSWqAzzPyD78/x5qbK/I0vUkrlYHA8TIz+MXjAbGouguKVSI4bOmkTSJ1/poVSsgt+A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@phenomnomnominal/tsquery": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/@phenomnomnominal/tsquery/-/tsquery-6.2.0.tgz",
      "integrity": "sha512-Vo9nkhfZxDB/sBiqIY3pjDC4mOSyure+AFlEW5hcy/tRE82MqCXjRN4InnVNMldinRt0dLYqg4HAU2XPq5e1LA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/esquery": "^1.5.4",
        "esquery": "^1.7.0"
      },
      "peerDependencies": {
        "typescript": ">3.0.0"
      }
    },
    "node_modules/@playwright/test": {
      "version": "1.63.0",
      "resolved": "https://registry.npmjs.org/@playwright/test/-/test-1.63.0.tgz",
      "integrity": "sha512-oxMK4vllB9RK5NQ2l1pq1IfOf2AvnEuj/vYGDj0H2nMtmtZpKtCwt/l00GEO6xjGfpBNAvjovvYdCm50dRQkpQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "playwright": "1.63.0"
      },
      "bin": {
        "playwright": "cli.js"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/@rolldown/binding-android-arm-eabi": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm-eabi/-/binding-android-arm-eabi-1.2.8.tgz",
      "integrity": "sha512-tN5aztYkKCte4i5SIrrz5yK/HMjEuCqCSCJa418jOV8tZ1cBY3YF2otxB1ktPxzsLA1BeTqwapK0bfjxNvHJVw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-android-arm64": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.2.8.tgz",
      "integrity": "sha512-dIYTWl9XprMUiQFoc55KUyk/oS8SKYH3zFl0LTR7RT0Xj4hgSVyuJcroH8JUu8RcpF8fTB6E0aOwCkZoYPcDSQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-arm64": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.2.8.tgz",
      "integrity": "sha512-PCSDQGXD2IyTEFrcgPyBM8jJuGmrbCMuoIOXdbEGVemruKACXoLQJrb+A45Z0L5t1RQkdfJprAYPkikbh7dzdA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-x64": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.2.8.tgz",
      "integrity": "sha512-Uk7lRsGhPFHVX/sAUC6D5H9Ol30dFHd6iquokll2th3LpdJ3F5CzQB+7DHn0Ri2mG+U7k2zXiPHDrwZenXhwSA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-freebsd-x64": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.2.8.tgz",
      "integrity": "sha512-DjszaTEVogPqA5bYzsEeqDCQxbcp2fexQwKcRspYji2yzR68fCf+e4fx6kBSRDwX5/brZaHw/hWS9+A/+/w9sQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm-gnueabihf": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.2.8.tgz",
      "integrity": "sha512-zmwa7FTmdzB6aaEEuuls18H6Ap5JmJPSoPTuXixeJZV6tG40SyLkApQtz1g8ptZtiEKqj9OM0oNLPh1AgvE31Q==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-gnu": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.2.8.tgz",
      "integrity": "sha512-KdYQDPHwJVnbFwdTGMgxsI9SqblBlz6STGM+w1We/d5B8OWWidYH0MwkU/uA1wM5fIpO2MkOVxXrNzzuZhw9ew==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-musl": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.2.8.tgz",
      "integrity": "sha512-jFJTifHnNPY+yzOoNZQfSIysrVyXzEQPhPnOUjmD1bcQGHH6s7c8cViKWar8YplQImE5N9JRqMCLrM2CdxOrZA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-ppc64-gnu": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.2.8.tgz",
      "integrity": "sha512-FhiOziBDWPBjbcmRzfLyIJnaP7AVMFXT7YCXPjXxj7wKU3vx24RjrCNN/zjvVa+N2vVoHJwCoUBvsrN/DG3zIA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-s390x-gnu": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.2.8.tgz",
      "integrity": "sha512-WnHfADMzOV2Y55wlx1hzzQnar/wDt/VdvWSD99r18Mz9ylNieIGOkRx3UV21h7m/eJvjySYJkO26VvGNFkwsIQ==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-gnu": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.2.8.tgz",
      "integrity": "sha512-H9tRr5ibfXFVLxbPOseVewewFpl28zcEdjRDt2FTUZU7odxP0gEv1ki4/kGmcGOh78oRwZuuQllGLZ9zTJp84g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-musl": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.2.8.tgz",
      "integrity": "sha512-UefiqfM3D6IVNlZ8tSGs9+Ejjud2T+oxO0IHADU45Y+lyEjD2dVFyZHbkfX0LUb5Zugo/oIv1eCO/KVYhgYJYA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-openharmony-arm64": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.2.8.tgz",
      "integrity": "sha512-637Ke4kWSy6rp9cxQ9gMOXlxPgIw/c1beASV4M//3+9I4uwBVOOl74G+e3zyU3u19U7RkRl/HuewixZ/Z6+Rjg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-arm64-msvc": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.2.8.tgz",
      "integrity": "sha512-xWBkPOF1Q9k/Gv1nQXnVdLxKu74jXppuOM4Z3mnypVUJJJwLsMl7hNJGRAUJoG8A5MgOI1ACKM+wBFxSJzKy4A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-x64-msvc": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.2.8.tgz",
      "integrity": "sha512-uz2ZvfgXbxqNwijjjbxrnvALwpyODDcgc1T1N8N3rf/DXKQmaFwmB4LX4yyjggpwN2obdQLb2rgirX5ffCWYng==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.1.tgz",
      "integrity": "sha512-2j9bGt5Jh8hj+vPtgzPtl72j0yRxHAyumoo6TNfAjsLB04UtpSvPbPcDcBMxz7n+9CYB0c1GxQFxYRg2jimqGw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@schematics/angular": {
      "version": "22.2.1",
      "resolved": "https://registry.npmjs.org/@schematics/angular/-/angular-22.2.1.tgz",
      "integrity": "sha512-L4Nl8D43znCzXwze9PtbQhG1GKlhWq9ip8Hz+e3LHgG3WpT5Tlr7aVsyHDqb9Qetuy0Mpd4tXE15STtGdA897w==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@angular-devkit/core": "22.2.1",
        "@angular-devkit/schematics": "22.2.1",
        "jsonc-parser": "3.3.1",
        "oxc-parser": "0.150.0",
        "typescript": "6.0.3"
      },
      "engines": {
        "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
        "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
        "yarn": ">= 1.13.0"
      }
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@supabase/auth-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/auth-js/-/auth-js-2.117.3.tgz",
      "integrity": "sha512-XOZV+jllcU2Hzij8SwgM78zl0lOEr6BTjzi2MYkBb39nOAQzb5AelGpMUvVj7lwGSB11JmpAs/FEQroAyFzWEA==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/functions-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/functions-js/-/functions-js-2.117.3.tgz",
      "integrity": "sha512-6GuizbP4N5xWaxEVUsI+UQpJdmMmn0t3sYNpObo9gCAldvM22gFjnYzRVmkHxp5ylU21azEYmiWVwk9iDgCMkQ==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/phoenix": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/@supabase/phoenix/-/phoenix-0.4.5.tgz",
      "integrity": "sha512-aAn9H9ovVyeApKy11OWOrrOGq8DV68yWeH4ud2lN9fzn4aO8Zb5GLL9m1pUg9nLqIcT+ZDfAcsZe0E/nqdv2lw==",
      "license": "MIT"
    },
    "node_modules/@supabase/postgrest-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/postgrest-js/-/postgrest-js-2.117.3.tgz",
      "integrity": "sha512-NpyTgullu6tw11ojYKTdZg9HannZ4mu4FUlhc9V5zDXOVllUJzEmuyLM+WWoYF0BurfrRvarimpm3SR8P0Gzfw==",
      "license": "MIT",
      "dependencies": {
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/realtime-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/realtime-js/-/realtime-js-2.117.3.tgz",
      "integrity": "sha512-4W4ISbreRygNXbhwqxeqyuRul8RPx+SF+Hp2IT8wctebQEHSVCULfKatiRiEhmasfoXvYm2AHV4XFsOxhoousA==",
      "license": "MIT",
      "dependencies": {
        "@supabase/phoenix": "0.4.5",
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/storage-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/storage-js/-/storage-js-2.117.3.tgz",
      "integrity": "sha512-QhUxFC33Crlw6WDeA4hLADdi1PzjI3c4UJs7ivWHHEnU7ulmCWEZSDaRCuIfmsjUwbHYaIfRNFQNsm+IsGYS6w==",
      "license": "MIT",
      "dependencies": {
        "iceberg-js": "^0.8.1",
        "tslib": "2.8.1"
      },
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/@supabase/supabase-js": {
      "version": "2.117.3",
      "resolved": "https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-2.117.3.tgz",
      "integrity": "sha512-K+f8PimXDunPWQ63CKRXaF5pbVPJxmfw5ryAnh0s9S9PkwcuqBjiSpIaqpF7KLDljeYwXIL85ST8QxaO0+XuvA==",
      "license": "MIT",
      "dependencies": {
        "@supabase/auth-js": "2.117.3",
        "@supabase/functions-js": "2.117.3",
        "@supabase/postgrest-js": "2.117.3",
        "@supabase/realtime-js": "2.117.3",
        "@supabase/storage-js": "2.117.3"
      },
      "engines": {
        "node": ">=22.0.0"
      },
      "peerDependencies": {
        "@opentelemetry/api": ">=1.0.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        }
      }
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.3.3.tgz",
      "integrity": "sha512-/T8IKEsf9VTU6tLjgC7+sv2mOPtQxzE2jMw7u4Tt40Tx+QSZxpzh95/H6cMKoja9XuW7iMdLJYBB0o9G1CaAgg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.5",
        "enhanced-resolve": "^5.24.1",
        "jiti": "^2.7.0",
        "lightningcss": "1.32.0",
        "magic-string": "^0.30.21",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.3.3"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.32.0",
        "lightningcss-darwin-arm64": "1.32.0",
        "lightningcss-darwin-x64": "1.32.0",
        "lightningcss-freebsd-x64": "1.32.0",
        "lightningcss-linux-arm-gnueabihf": "1.32.0",
        "lightningcss-linux-arm64-gnu": "1.32.0",
        "lightningcss-linux-arm64-musl": "1.32.0",
        "lightningcss-linux-x64-gnu": "1.32.0",
        "lightningcss-linux-x64-musl": "1.32.0",
        "lightningcss-win32-arm64-msvc": "1.32.0",
        "lightningcss-win32-x64-msvc": "1.32.0"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-android-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-darwin-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-darwin-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-freebsd-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-linux-x64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/@tailwindcss/node/node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.3.3.tgz",
      "integrity": "sha512-krXjAikiaFSPaK/FkAQT5UTx3VormQaiZ5hBFlJZ9UFQGB/rwg1MZIhHAG9smMQRTdyJxP6Qt5MwMtdyU5FWrA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.3.3",
        "@tailwindcss/oxide-darwin-arm64": "4.3.3",
        "@tailwindcss/oxide-darwin-x64": "4.3.3",
        "@tailwindcss/oxide-freebsd-x64": "4.3.3",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.3.3",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.3.3",
        "@tailwindcss/oxide-linux-arm64-musl": "4.3.3",
        "@tailwindcss/oxide-linux-x64-gnu": "4.3.3",
        "@tailwindcss/oxide-linux-x64-musl": "4.3.3",
        "@tailwindcss/oxide-wasm32-wasi": "4.3.3",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.3.3",
        "@tailwindcss/oxide-win32-x64-msvc": "4.3.3"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.3.3.tgz",
      "integrity": "sha512-Y85A2gmPSkl5Ve5qR86GL4HT509cFqQh1aes9p3sSkyTPwt0Pppf3GkwGe4JPACcRYjgJIEhQgM6dBClnr0NYw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.3.3.tgz",
      "integrity": "sha512-BiaWatpBcERQFDlOjRDpIVXuFK5PJez5SA4JMg6VYZdBYU+qKfV/vqjcIs+IYmtitf1xYQZTwXvU/8y4lfZUGw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.3.3.tgz",
      "integrity": "sha512-fAeUqfV5ndhxRwai8cXGzdLvul9utWOmeTkv69unv4ZXixjn61Z+p9lCWdwOwA3TYboG3BwdVuN/RDjhBRl0mw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.3.3.tgz",
      "integrity": "sha512-iyf5bV6+wnAlflVeEy7R25dupxTNECZN5QMI0qNT6eT+EgaGdZcKhGkr5SdoaWiLJ3spLqIY9VCeSGrwmtg4kw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.3.3.tgz",
      "integrity": "sha512-aAYUprJAJQWWbRrPvtjdroZ56Md+JM8pMiopS6xGEwDfLhqj+2ver2p4nU4Mb3CRqcMmNBjo8KkUgcxhkzVQGQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.3.3.tgz",
      "integrity": "sha512-nDxldcEENOxZRzC2uu9jrutZdAAQtb+8WWDCSnWL1zvBk1+FN+x6MtDViPB5AJMfttVCUhehGWus3XBPgatM/w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.3.3.tgz",
      "integrity": "sha512-Md44bD6veX/PC5iyF8cDVnw4HBIANZepRZZ7a8DQOvkfo5WUBwcp6iAuCUz23u+4SUkhJlD3eL7hNdW8ezd/kA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.3.3.tgz",
      "integrity": "sha512-tx7us1muwOKAKWao2v/GaafFeQboE6aj88vC6ziN2NCGcRm8gWUhwjzg+YdVB1e4boAtdtma4L43onunI6NS4w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.3.3.tgz",
      "integrity": "sha512-SJxX60smvHgasZoBy11dX6YRjXJFovwWBoedhbQPOBzgFWBHGB+TVPWB9BxzR7TTxU8FQZAI2AyiNCMzFm8Img==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz",
      "integrity": "sha512-jx1+rPhY/5Ympkktd656HBWEBLxP7dH06losBLjjf5vgCODXvi9KhtftWcMIwTFIDqBr7cRnQkdLnAG+IOlGvQ==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.11.1",
        "@emnapi/runtime": "^1.11.1",
        "@emnapi/wasi-threads": "^1.2.2",
        "@napi-rs/wasm-runtime": "^1.1.4",
        "@tybys/wasm-util": "^0.10.2",
        "tslib": "^2.8.1"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.3.3.tgz",
      "integrity": "sha512-3rc292Ca2ceK6Ulcc/bAVnTs/3nDtoPhyEKlgPv+yQJQi/JS/AMJlqzxvlDacL1nekbrcf6bTqp/jV4qgnPxNQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.3.3.tgz",
      "integrity": "sha512-yJ0pwIVc/nYeGoV02WtsN8KYyLQv7kyI2wDnkezyJlGGjkd4QLwDGAwl47YpPJeuI0M0ObaXGSPjvWDPeTPggw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/postcss": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/postcss/-/postcss-4.3.3.tgz",
      "integrity": "sha512-JTSZZGQi1AyKirbLN3azmjVzef92tcX7h+iSqPdaeStyFpGpDlKvvpxeOE8njhbUanbRwr3z8DyzhICWnMtQeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "@tailwindcss/node": "4.3.3",
        "@tailwindcss/oxide": "4.3.3",
        "postcss": "^8.5.16",
        "tailwindcss": "4.3.3"
      }
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.9.0.tgz",
      "integrity": "sha512-6+7nlbMVX/PVDCwaIQ8nTOPveOcFLSt8GcXdx8hD0bt39uWxYT88uXzqTd4fTvqta7oeUJqudepapKNt2DYJFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/esquery": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/@types/esquery/-/esquery-1.5.4.tgz",
      "integrity": "sha512-yYO4Q8H+KJHKW1rEeSzHxcZi90durqYgWVfnh5K6ZADVBjBv2e1NEveYX5yT2bffgN7RqzH3k9930m+i2yBoMA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "*"
      }
    },
    "node_modules/@types/esrecurse": {
      "version": "4.3.1",
      "resolved": "https://registry.npmjs.org/@types/esrecurse/-/esrecurse-4.3.1.tgz",
      "integrity": "sha512-xJBAbDifo5hpffDBuHl0Y8ywswbiAp/Wi7Y/GtAgSlZyIABppyurxVueOPE8LUQOxdlgi6Zqce7uoEpqNTeiUw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/@types/estree": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/gensync": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@types/gensync/-/gensync-1.0.5.tgz",
      "integrity": "sha512-MbsRCT7mTikHwKZ0X+LVUTLRrZZRLipTuXEO9qOYO+zmjMVk81axyClMROf6uoPD9MRVu46bx8zoR0Ad9q3NAg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/jsesc": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/@types/jsesc/-/jsesc-2.5.1.tgz",
      "integrity": "sha512-9VN+6yxLOPLOav+7PwjZbxiID2bVaeq0ED4qSQmdQTdjnXJSaCVKTR58t15oqH1H5t8Ng2ZX1SabJVoN9Q34bw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/@types/parse-json": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@types/parse-json/-/parse-json-4.0.2.tgz",
      "integrity": "sha512-dISoDXWWQwUquiKsyZ4Ng+HX2KsPL7LyHKHQwgGFEA3IaKac4Obd+h2a/a6waisAoepJlBcx9paWqjA8/HVjCw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@typescript-eslint/project-service": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/project-service/-/project-service-8.71.0.tgz",
      "integrity": "sha512-aABjw5rjBacYONVPaPiWOCjJu0vEF4a25iQuodlmQYL1trtLZ0X/y+2Vzl3BKI1odM4LnwLE1oUDXYp1wzx1TQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/tsconfig-utils": "^8.71.0",
        "@typescript-eslint/types": "^8.71.0",
        "debug": "^4.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-8.71.0.tgz",
      "integrity": "sha512-gWF0BhUcnjZxSpLE8ngS/59n2SB0J3YqRxvX1+2aoRJk9hNtHSLOV+TcarFiOr5ipXm3yc1QrI4c9YZc8zyCxw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.0",
        "@typescript-eslint/visitor-keys": "8.71.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/tsconfig-utils": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/tsconfig-utils/-/tsconfig-utils-8.71.0.tgz",
      "integrity": "sha512-Z1UlWHADEK2Mlb9NpWfDeSjqoZ5EyrOv4R3eQpbkzqn/EwaIdOpXXupEA1+0ZIOSJSZZDBHG0BrQyN8zUG6Pwg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/type-utils": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/type-utils/-/type-utils-8.71.0.tgz",
      "integrity": "sha512-i8uO1qbdxeKgRnS5sCRt6On3/nfo2d2DwQe3Yvjx543zLy7r8ySqRuPPiIIXAhS03U0v5NfAFx+rUgxFzKKwNw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.0",
        "@typescript-eslint/typescript-estree": "8.71.0",
        "@typescript-eslint/utils": "8.71.0",
        "debug": "^4.4.3",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-8.71.0.tgz",
      "integrity": "sha512-cJ4OoxPGWvFnBTnSZyaU+qJzGTqPTGJY+gDchj6cRyLRdmIdt4rcsE4twj+zPfrNiWuVi38wijHzShL++Z9atQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.71.0.tgz",
      "integrity": "sha512-PEEF4G5sLLWAS5BpPrUvms4ySZkiBQQZM4z+3ReI46axK5Vqr/vXBQatJQIZZOYdGyPUAKTtsrWzpqKuU+3DEw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/project-service": "8.71.0",
        "@typescript-eslint/tsconfig-utils": "8.71.0",
        "@typescript-eslint/types": "8.71.0",
        "@typescript-eslint/visitor-keys": "8.71.0",
        "debug": "^4.4.3",
        "minimatch": "^10.2.2",
        "semver": "^7.7.3",
        "tinyglobby": "^0.2.15",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/utils": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/utils/-/utils-8.71.0.tgz",
      "integrity": "sha512-pKR/tEMVrXZG23UFKUn5BQf3zfmfk7KQceI2cGzywZ5nxM5Eu3hEJU1utjWzydtzBbcJAQhHN8iPCxobHpPcZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.9.1",
        "@typescript-eslint/scope-manager": "8.71.0",
        "@typescript-eslint/types": "8.71.0",
        "@typescript-eslint/typescript-estree": "8.71.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "8.71.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-8.71.0.tgz",
      "integrity": "sha512-8eQ9R218XORK+KLosnf4bu/QsUXvUyVwTbArg7/0NMB1Pu87OJKvj4nhFblkYE8gQV73mW1dx1ptlPCkwRGa7A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.0",
        "eslint-visitor-keys": "^5.0.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys/node_modules/eslint-visitor-keys": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz",
      "integrity": "sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@vitejs/plugin-basic-ssl": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-basic-ssl/-/plugin-basic-ssl-2.3.0.tgz",
      "integrity": "sha512-bdyo8rB3NnQbikdMpHaML9Z1OZPBu6fFOBo+OtxsBlvMJtysWskmBcnbIDhUqgC8tcxNv/a+BcV5U+2nQMm1OQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "peerDependencies": {
        "vite": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/@yarnpkg/lockfile": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@yarnpkg/lockfile/-/lockfile-1.1.0.tgz",
      "integrity": "sha512-GpSwvyXOcOOlV70vbnzjj4fW5xW/FdUF6nQEt1ENy7m4ZCczi1+/buVUPAqmGfqznsORNFzUMjctTIp8a9tuCQ==",
      "dev": true,
      "license": "BSD-2-Clause"
    },
    "node_modules/@zkochan/js-yaml": {
      "version": "0.0.7",
      "resolved": "https://registry.npmjs.org/@zkochan/js-yaml/-/js-yaml-0.0.7.tgz",
      "integrity": "sha512-nrUSn7hzt7J6JWgWGz78ZYI8wj+gdIJdk0Ynjpp8l+trkn58Uqsf6RYrYkEK+3X18EX+TNdtJI0WxAtc+L84SQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/acorn": {
      "version": "8.18.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.18.0.tgz",
      "integrity": "sha512-lGq+9yr1/GuAWaVYIHRjvvySG5/4VfKIvC8EWxStPdcDh/Ka7FG3twP6v4d5BkravUilhIAsG4Qj83t02LWUPQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/address": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/address/-/address-2.0.3.tgz",
      "integrity": "sha512-XNAb/a6TCqou+TufU8/u11HCu9x1gYvOoxLwtlXgIqmkrYQADVv6ljyW2zwiPhHz9R1gItAWpuDrdJMmrOBFEA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 16.0.0"
      }
    },
    "node_modules/agent-base": {
      "version": "9.0.0",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-9.0.0.tgz",
      "integrity": "sha512-TQf59BsZnytt8GdJKLPfUZ54g/iaUL2OWDSFCCvMOhsHduDQxO8xC4PNeyIkVcA5KwL2phPSv0douC0fgWzmnA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/ajv": {
      "version": "8.20.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.20.0.tgz",
      "integrity": "sha512-Thbli+OlOj+iMPYFBVBfJ3OmCAnaSyNn4M1vz9T6Gka5Jt9ba/HIR56joy65tY6kx/FCF5VXNB819Y7/GUrBGA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.3",
        "fast-uri": "^3.0.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-formats": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/ajv-formats/-/ajv-formats-3.0.1.tgz",
      "integrity": "sha512-8iUql50EUR+uUcdRQ3HDqa6EVyo3docL8g5WJ3FNcWmu62IbkGUue/pEyLBW8VGKKucTPgqeks4fIU1DA4yowQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "ajv": {
          "optional": true
        }
      }
    },
    "node_modules/ansi-escapes": {
      "version": "7.3.0",
      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-7.3.0.tgz",
      "integrity": "sha512-BvU8nYgGQBxcmMuEeUEmNTvrMVjJNSH7RgW24vXexN4Ven6qCvy4TntnvlnwnMLTVlcRQQdbRY8NKnaIoeWDNg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "environment": "^1.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "license": "Python-2.0"
    },
    "node_modules/async": {
      "version": "3.2.6",
      "resolved": "https://registry.npmjs.org/async/-/async-3.2.6.tgz",
      "integrity": "sha512-htCUDlxyyCLMgaM3xXg0C0LW2xqfuQ6p05pCEIsXuyQ+a1koYKTuBMzRNwmybfLgvJDMd0r1LTn4+E0Ti6C2AA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/autoprefixer": {
      "version": "10.6.1",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.6.1.tgz",
      "integrity": "sha512-cL1Qz6ADZhcEbny/8HPfe99J6HhNoYtpX2LFLIbhgGE7Q1hlQVkYFdetDN7Id3KiQxhDrHwzlHr/YQCnZ8+xSA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/autoprefixer"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "browserslist": "^4.28.9",
        "caniuse-lite": "^1.0.30001810",
        "fraction.js": "^5.3.4",
        "picocolors": "^1.1.1",
        "postcss-value-parser": "^4.2.0"
      },
      "bin": {
        "autoprefixer": "bin/autoprefixer"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/axe-core": {
      "version": "4.13.0",
      "resolved": "https://registry.npmjs.org/axe-core/-/axe-core-4.13.0.tgz",
      "integrity": "sha512-UzGt8zg7Ny8djbYMhxl2zuEevVa7r2gJjYY5Lwr1xM7+XU2nd6CkIWFTVcCIbAP63vSz71NaVyyuSk9lHKcy0A==",
      "dev": true,
      "license": "MPL-2.0",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/axios": {
      "version": "1.20.0",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.20.0.tgz",
      "integrity": "sha512-r8aOh8j9cGKpgQAqpzrUHnSIc6a59Y3Xf/cv8sy1DrHCkZHzQGEuoq1tARk6qSyDdtQGSDgpb9kFlruzPvrgwg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.16.0",
        "form-data": "^4.0.6",
        "https-proxy-agent": "^5.0.1",
        "proxy-from-env": "^2.1.0"
      }
    },
    "node_modules/axios/node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/axios/node_modules/https-proxy-agent": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/babel-plugin-macros": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/babel-plugin-macros/-/babel-plugin-macros-3.1.0.tgz",
      "integrity": "sha512-Cg7TFGpIr01vOQNODXOOaGz2NpCU5gl8x1qJFbb6hbZxR7XrcE2vtbAsTAbJ7/xwJtUuJEw8K8Zr/AE0LHlesg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.12.5",
        "cosmiconfig": "^7.0.0",
        "resolve": "^1.19.0"
      },
      "engines": {
        "node": ">=10",
        "npm": ">=6"
      }
    },
    "node_modules/babel-plugin-macros/node_modules/cosmiconfig": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/cosmiconfig/-/cosmiconfig-7.1.0.tgz",
      "integrity": "sha512-AdmX6xUzdNASswsFtmwSt7Vj8po9IuqXm0UXz7QKPuEUmPB4XyjGfaAr2PSuELMwkRMVH1EpIkX5bTZGRB3eCA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/parse-json": "^4.0.0",
        "import-fresh": "^3.2.1",
        "parse-json": "^5.0.0",
        "path-type": "^4.0.0",
        "yaml": "^1.10.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/babel-plugin-macros/node_modules/yaml": {
      "version": "1.10.3",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-1.10.3.tgz",
      "integrity": "sha512-vIYeF1u3CjlhAFekPPAk2h/Kv4T3mAkMox5OymRiJQB0spDP10LHvt+K7G9Ny6NuuMAb25/6n1qyUjAcGNf/AA==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/babel-plugin-transform-typescript-metadata": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/babel-plugin-transform-typescript-metadata/-/babel-plugin-transform-typescript-metadata-0.3.2.tgz",
      "integrity": "sha512-mWEvCQTgXQf48yDqgN7CH50waTyYBeP2Lpqx4nNWab9sxEpdXVeKgfj1qYI2/TgUPQtNFZ85i3PemRtnXVYYJg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0"
      }
    },
    "node_modules/balanced-match": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz",
      "integrity": "sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.11.27",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.27.tgz",
      "integrity": "sha512-ElY12DaROGuan+lMmZ8Cvo/ZUbXPe7Enc/9VU/b1T3Kp4dwytRcNdR8DoSJN5SNJT/CuvcCA0DHDVmMOCePdRQ==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/basic-auth": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/basic-auth/-/basic-auth-2.0.1.tgz",
      "integrity": "sha512-NF+epuEdnUYVlGuhaxbbq+dvJttwLnGY+YixlXlME5KpQ5W3CnXA5cVTneY3SPbPDRkcjMbifrwmFYcClgOZeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "5.1.2"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/beasties": {
      "version": "0.5.4",
      "resolved": "https://registry.npmjs.org/beasties/-/beasties-0.5.4.tgz",
      "integrity": "sha512-8/lOOjT+PElYCnaUbmhgd3Uad5R1VTQ4Wg0k4rK8bX04m5WEqHNmnlLy3Q/lJ7dk25XA+72gayzc/skTfKKpcA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "css-select": "^7.0.0",
        "css-what": "^8.0.0",
        "dom-serializer": "^3.0.0",
        "domhandler": "^6.0.0",
        "htmlparser2": "^12.0.0",
        "picocolors": "^1.1.1",
        "postcss": "^8.4.49",
        "postcss-media-query-parser": "^0.2.3",
        "postcss-safe-parser": "^7.0.1"
      },
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/bl": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/bl/-/bl-4.1.0.tgz",
      "integrity": "sha512-1W07cM9gS6DcLperZfFSj+bWLtaPGSOHWhPiGzXmvVJbRLdG82sH/Kn8EtW1VqWVA54AKf2h5k5BbnIbwF3h6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "buffer": "^5.5.0",
        "inherits": "^2.0.4",
        "readable-stream": "^3.4.0"
      }
    },
    "node_modules/boolbase": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/boolbase/-/boolbase-2.0.0.tgz",
      "integrity": "sha512-DkVaaQHymRhpYEYo9x1oo7Q7B0Y6KJUsjm3c9eTyFDby4MHLBTwZ6ZDWBel5zrYxj1WsZgC5oLpiz+93MluXeA==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/brace-expansion": {
      "version": "5.0.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.12.tgz",
      "integrity": "sha512-YovQ3rzhaLMIrDjNDMkNS01tea93qhEhG5xy8f6+R0l+dw3Ki+5sCoIoI942iuLZTHWogWktgwVDhU09iNEimQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^4.0.2"
      },
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/browserslist": {
      "version": "4.29.3",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.29.3.tgz",
      "integrity": "sha512-1R4kiYKXGViqEN0CnoDrXc1StD9niAwu+j2dukWzrD4bJgsD4lDmEp0CRbc6E/vYJIfTHwPmwyaKtVSudICdPA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.11.26",
        "caniuse-lite": "^1.0.30001813",
        "electron-to-chromium": "^1.5.439",
        "node-releases": "^2.0.57",
        "update-browserslist-db": "^1.3.3"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/buffer": {
      "version": "5.7.1",
      "resolved": "https://registry.npmjs.org/buffer/-/buffer-5.7.1.tgz",
      "integrity": "sha512-EHcyIPBQ4BSGlvjB16k5KgAJ27CIsHY/2JBmCRReo48y9rQ3MaUzWX3KVlBa4U7MyX02HdVj0K7C3WaB3ju7FQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.1.13"
      }
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/bundle-name": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/bundle-name/-/bundle-name-4.1.0.tgz",
      "integrity": "sha512-tjwM5exMg6BGRI+kNmTntNsvdZS1X8BFYS6tnJ2hdH0kVxM6/eVZ2xy+FqStSWvYmtfFMDLIxurorHwDKfDz5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "run-applescript": "^7.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cacheable": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/cacheable/-/cacheable-2.5.0.tgz",
      "integrity": "sha512-60cyAOytib/OzBw1JNSoSV/boK1AtHryDIjvVBk7XbN4ugfkM3+Sry7fEjNgPMGgOjuaZPAp8ruZ0Cxafwyq9g==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@cacheable/memory": "^2.2.0",
        "@cacheable/utils": "^2.5.0",
        "hookified": "^1.15.0",
        "keyv": "^5.6.0",
        "qified": "^0.10.1"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001814",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001814.tgz",
      "integrity": "sha512-/Uaf1lAzr59XcMpW0o96WoEfr+VXK2OX4U9AgFoiSHsVJ4HppnIFUjtYzsyDH2+tgANaQb2/oxYGwCPapN1FpA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/chokidar": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-5.0.0.tgz",
      "integrity": "sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "readdirp": "^5.0.0"
      },
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/cli-cursor": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-5.0.0.tgz",
      "integrity": "sha512-aCj4O5wKyszjMmDT4tZj93kxyydN/K5zPWSCe6/0AV/AA1pqe5ZBIw0a2ZfPQV7lL5/yb5HsUreJ6UFAF1tEQw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "restore-cursor": "^5.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-spinners": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/cli-spinners/-/cli-spinners-2.6.1.tgz",
      "integrity": "sha512-x/5fWmGMnbKQAaNwN+UZlV79qBLM9JFnJuJ03gIi5whrob0xV0ofNVHy9DhwGdsMJQc2OKv0oGmLzvaqvAVv+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-truncate": {
      "version": "6.1.1",
      "resolved": "https://registry.npmjs.org/cli-truncate/-/cli-truncate-6.1.1.tgz",
      "integrity": "sha512-06p9vyLahLa4zkGcgsGxU6iEkSOiuI4fhCH6Emhe2lPAcoUv73n72DnODsnHA+5wwXGnV0n9M9/qOQJSjYhFhw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "slice-ansi": "^9.0.0",
        "string-width": "^8.2.0"
      },
      "engines": {
        "node": ">=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/cli-width": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/cli-width/-/cli-width-4.1.0.tgz",
      "integrity": "sha512-ouuZd4/dm2Sw5Gmqy6bGyNNNe1qt9RpmxveLSO7KcgsTnU7RXfsw+/bukWGo1abgBiMAic068rclZsO4IWmmxQ==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">= 12"
      }
    },
    "node_modules/cliui": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz",
      "integrity": "sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.1",
        "wrap-ansi": "^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/cliui/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/cliui/node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/clone": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/clone/-/clone-1.0.4.tgz",
      "integrity": "sha512-JQHZ2QMW6l3aH/j6xCqQThY/9OH4D/9ls34cgkUBiEeocRTU04tHfKPBsUK1PqZCUQM7GiA0IIXJSuXHI64Kbg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/colorjs.io": {
      "version": "0.7.1",
      "resolved": "https://registry.npmjs.org/colorjs.io/-/colorjs.io-0.7.1.tgz",
      "integrity": "sha512-LY7OHnJZxHwT5UlzNa9bbhHHDbzB6yE5+3MIPwJEQKRvSCt/T4G7epsj+9j2BExUIIfXFIJGsIXUKdfrK9Q5tA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/color"
      }
    },
    "node_modules/columnify": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/columnify/-/columnify-1.6.0.tgz",
      "integrity": "sha512-lomjuFZKfM6MSAnV9aCZC9sc0qGbmZdfygNv+nCpqVkSKdCxCklLtd16O0EILGkImHw9ZpHkAnHaB+8Zxq5W6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "strip-ansi": "^6.0.1",
        "wcwidth": "^1.0.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/convert-source-map": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-1.9.0.tgz",
      "integrity": "sha512-ASFBup0Mz1uyiIjANan1jzLQami9z1PoYSZCiiYW2FczPbenXc45FZdBZLzOT+r6+iciuEModtmCti+hjaAk0A==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/core-js-compat": {
      "version": "3.50.0",
      "resolved": "https://registry.npmjs.org/core-js-compat/-/core-js-compat-3.50.0.tgz",
      "integrity": "sha512-XGpFGbMLHwSt74YLTKho7Ib242qi6O8MSX+sRokV4oz7iKXvQWGYZthjIhjRGMxjzVkAubBO512dKGYcefmX3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "browserslist": "^4.28.7"
      },
      "engines": {
        "node": ">=6.4.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/core-js"
      }
    },
    "node_modules/corser": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/corser/-/corser-2.0.1.tgz",
      "integrity": "sha512-utCYNzRSQIZNPIcGZdQc92UVJYAhtGAteCFg0yRaFm8f0P+CPtyGyHXJcGXnffjCybUCEx3FQ2G7U3/o9eIkVQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4.0"
      }
    },
    "node_modules/cosmiconfig": {
      "version": "8.3.6",
      "resolved": "https://registry.npmjs.org/cosmiconfig/-/cosmiconfig-8.3.6.tgz",
      "integrity": "sha512-kcZ6+W5QzcJ3P1Mt+83OUv/oHFqZHIx8DuxG6eZ5RGMERoLqp4BuGjhHLYGK+Kf5XVkQvqBSmAy/nGWN3qDgEA==",
      "license": "MIT",
      "dependencies": {
        "import-fresh": "^3.3.0",
        "js-yaml": "^4.1.0",
        "parse-json": "^5.2.0",
        "path-type": "^4.0.0"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/d-fischer"
      },
      "peerDependencies": {
        "typescript": ">=4.9.5"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/css-select": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/css-select/-/css-select-7.0.0.tgz",
      "integrity": "sha512-snmjEVXy+1LnwXdxhYvTMj1d9tOh4HxkA1YmoayVBeeyR2C14Pum7fcxJIm4SswYspVy866eYNwlH6xC3/VH5g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "boolbase": "^2.0.0",
        "css-what": "^8.0.0",
        "domhandler": "^6.0.1",
        "domutils": "^4.0.2",
        "nth-check": "^3.0.1"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/css-what": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/css-what/-/css-what-8.0.0.tgz",
      "integrity": "sha512-DH0Bqq3DNp5tdOReuNyAA+Ev4Y2GS5FMbZpeTLP6C4CDi0h5nL0BmUPChXw3o/qbHLDWHl49sbNqQVY7bMSDdw==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/default-browser": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/default-browser/-/default-browser-5.2.1.tgz",
      "integrity": "sha512-WY/3TUME0x3KPYdRRxEJJvXRHV4PyPoUsxtZa78lwItwRQRHhd2U9xOscaT/YTf8uCXIAjeJOFBVEh/7FtD8Xg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "bundle-name": "^4.1.0",
        "default-browser-id": "^5.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/default-browser-id": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/default-browser-id/-/default-browser-id-5.0.0.tgz",
      "integrity": "sha512-A6p/pu/6fyBcA1TRz/GqWYPViplrftcW2gZC9q79ngNCKAeR/X3gcEdXQHl4KNXV+3wgIJ1CPkJQ3IHM6lcsyA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/defaults": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/defaults/-/defaults-1.0.4.tgz",
      "integrity": "sha512-eFuaLoy/Rxalv2kr+lqMlUnrDWV+3j4pljOIJgLIhI058IQfWJ7vXhyEIHu+HtC738klGALYxOKDO0bQP3tg8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "clone": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/define-lazy-prop": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/define-lazy-prop/-/define-lazy-prop-3.0.0.tgz",
      "integrity": "sha512-N+MeXYoqr3pOgn8xfyRPREN7gHakLYjhsHhWGT3fWAiL4IkAt0iDw14QiiEm2bE30c5XX5q0FtAA3CK5f9/BUg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/detect-port": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/detect-port/-/detect-port-2.1.0.tgz",
      "integrity": "sha512-epZuWb/6Q62L+nDHJc/hQAqf8pylsqgk3BpZXVBx1CDnr3nkrVNn73Uu1rXcFzkNcc+hkP3whuOg7JZYaQB65Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "address": "^2.0.1"
      },
      "bin": {
        "detect": "dist/commonjs/bin/detect-port.js",
        "detect-port": "dist/commonjs/bin/detect-port.js"
      },
      "engines": {
        "node": ">= 16.0.0"
      }
    },
    "node_modules/dom-serializer": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/dom-serializer/-/dom-serializer-3.1.1.tgz",
      "integrity": "sha512-4MEa38/QexBob6gFNwu+EGdWvhJ1OKuNwdYY3Y3NyeWDQfnGeDYQUDfIRzWu5B5gsv03so2Uxd28YC6zrsx3Lw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "domelementtype": "^3.0.0",
        "domhandler": "^6.0.0",
        "entities": "^8.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/cheeriojs/dom-serializer?sponsor=1"
      }
    },
    "node_modules/domelementtype": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/domelementtype/-/domelementtype-3.0.0.tgz",
      "integrity": "sha512-umCQid3jKbDmVjx8jGaW7uUykm4DEUeyV21hPxNMo2nV955DhUThwqyOIDtreepP31hl84X7G5U9ZfsWvIB3Pg==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fb55"
        }
      ],
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/domhandler": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/domhandler/-/domhandler-6.0.1.tgz",
      "integrity": "sha512-gYzvtM72ZtxQO0T048kd6HWSbbGCNOUwcnfQ01cqIJ4X2IYKFFHZ5mKvrQETcFXxsRObZulDaKmy//R7TPtsBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "domelementtype": "^3.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/fb55/domhandler?sponsor=1"
      }
    },
    "node_modules/domutils": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/domutils/-/domutils-4.0.2.tgz",
      "integrity": "sha512-qI4JLRKnSzqFqr7hAlS5xQDusBCjKSEG4t4+7aNrIQMHBcsC2TGEhuyABJdYkgSewL57PNLYEiibY2iPKhKpaA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "dom-serializer": "^3.0.0",
        "domelementtype": "^3.0.0",
        "domhandler": "^6.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/fb55/domutils?sponsor=1"
      }
    },
    "node_modules/dotenv": {
      "version": "16.4.7",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.4.7.tgz",
      "integrity": "sha512-47qPchRCykZC03FhkYAhrvwU4xDBFIj1QPqaarj6mdM/hgUzfPHcpkHJOn3mJAufFeeAxAzeGsr5X0M4k6fLZQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dotenv-expand": {
      "version": "12.0.3",
      "resolved": "https://registry.npmjs.org/dotenv-expand/-/dotenv-expand-12.0.3.tgz",
      "integrity": "sha512-uc47g4b+4k/M/SeaW1y4OApx+mtLWl92l5LMPP0GNXctZqELk+YGgOPIIC5elYmUH4OuoK3JLhuRUYegeySiFA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "dotenv": "^16.4.5"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ejs": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ejs/-/ejs-5.0.1.tgz",
      "integrity": "sha512-COqBPFMxuPTPspXl2DkVYaDS3HtrD1GpzOGkNTJ1IYkifq/r9h8SVEFrjA3D9/VJGOEoMQcrlhpntcSUrM8k6A==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "ejs": "bin/cli.js"
      },
      "engines": {
        "node": ">=0.12.18"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.444",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.444.tgz",
      "integrity": "sha512-5ss/uJfoDYDHT0lfJzT6FbcskIzROIOPf0BbbFkGcvDzoJU7i//9GDrwwIHQVmIsrAGiF3ihpADBRIsrEFt1rQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/empathic": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/empathic/-/empathic-2.1.0.tgz",
      "integrity": "sha512-AnfC1ATldl49/cvZdLPDjBfrRNwbDO05aibiOtzQu3qtlbJtomNLhF30HEtn/7iBz50dlMECqATo3fG0LrdEgw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/end-of-stream": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.5.tgz",
      "integrity": "sha512-ooEGc6HP26xXq/N+GCGOT0JKCLDGrq2bQUZrQ7gyrJiZANJ/8YDTxTpQBXGMn+WbIQXNVpyWymm7KYVICQnyOg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "once": "^1.4.0"
      }
    },
    "node_modules/enhanced-resolve": {
      "version": "5.26.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.26.0.tgz",
      "integrity": "sha512-9vhedylFonb2YGogzUKX6+Ja72gOJbN1QHAqdrvqLwhdl/QWbKopzoUC9EbQNVsAns/bx/4uyqalrQAoy1IByw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.3.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/entities": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/entities/-/entities-8.1.0.tgz",
      "integrity": "sha512-kxL7msIffSuh9aaFAMD7rxAIuTRMAHMeBtgHW2yUdWw732ZNh4MehkF2gdjvtdmikkaIP9bFDDJOPlsvm7avrA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/environment": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/environment/-/environment-1.1.0.tgz",
      "integrity": "sha512-xUtoPkMggbz0MPyPiIWr1Kp4aeWJjDZ6SMvURhimjdZgsRuDplF5/s9hcgGhyXMhs+6vpnuoiZ2kFiu3FMnS8Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/error-ex": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.4.tgz",
      "integrity": "sha512-sqQamAnR14VgCr1A618A3sGrygcpK+HEbenA/HiEAkkUwcZIIB/tgWqHFxWgOyDh4nB4JCRimh79dR5Ywc9MDQ==",
      "license": "MIT",
      "dependencies": {
        "is-arrayish": "^0.2.1"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/esbuild": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz",
      "integrity": "sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.28.2",
        "@esbuild/android-arm": "0.28.2",
        "@esbuild/android-arm64": "0.28.2",
        "@esbuild/android-x64": "0.28.2",
        "@esbuild/darwin-arm64": "0.28.2",
        "@esbuild/darwin-x64": "0.28.2",
        "@esbuild/freebsd-arm64": "0.28.2",
        "@esbuild/freebsd-x64": "0.28.2",
        "@esbuild/linux-arm": "0.28.2",
        "@esbuild/linux-arm64": "0.28.2",
        "@esbuild/linux-ia32": "0.28.2",
        "@esbuild/linux-loong64": "0.28.2",
        "@esbuild/linux-mips64el": "0.28.2",
        "@esbuild/linux-ppc64": "0.28.2",
        "@esbuild/linux-riscv64": "0.28.2",
        "@esbuild/linux-s390x": "0.28.2",
        "@esbuild/linux-x64": "0.28.2",
        "@esbuild/netbsd-arm64": "0.28.2",
        "@esbuild/netbsd-x64": "0.28.2",
        "@esbuild/openbsd-arm64": "0.28.2",
        "@esbuild/openbsd-x64": "0.28.2",
        "@esbuild/openharmony-arm64": "0.28.2",
        "@esbuild/sunos-x64": "0.28.2",
        "@esbuild/win32-arm64": "0.28.2",
        "@esbuild/win32-ia32": "0.28.2",
        "@esbuild/win32-x64": "0.28.2"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "10.12.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-10.12.0.tgz",
      "integrity": "sha512-npHjrHb2o4ehH3mE+YuxABR+0gyb0aVWCIolgJDArwCiHEIsonBm3ZKjel5b0U5+a+MbEvIyRCGCzD3eKKK2NA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "workspaces": [
        "packages/*"
      ],
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.8.0",
        "@eslint-community/regexpp": "^4.12.2",
        "@eslint/config-array": "^0.23.5",
        "@eslint/config-helpers": "^0.7.0",
        "@eslint/core": "^1.2.1",
        "@eslint/plugin-kit": "^0.7.3",
        "@humanfs/node": "^0.16.6",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@humanwhocodes/retry": "^0.4.2",
        "@types/estree": "^1.0.6",
        "ajv": "^6.14.0",
        "cross-spawn": "^7.0.6",
        "debug": "^4.3.2",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^9.1.2",
        "eslint-visitor-keys": "^5.0.1",
        "espree": "^11.2.0",
        "esquery": "^1.7.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "11.1.5 || >11.1.6 <12",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "minimatch": "^10.2.5",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      },
      "peerDependencies": {
        "jiti": "*"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-scope": {
      "version": "9.1.2",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-9.1.2.tgz",
      "integrity": "sha512-xS90H51cKw0jltxmvmHy2Iai1LIqrfbw57b79w/J7MfvDfkIkFZ+kj6zC3BjtUwh150HsSSdxXZcsuv72miDFQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "peer": true,
      "dependencies": {
        "@types/esrecurse": "^4.3.1",
        "@types/estree": "^1.0.8",
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint/node_modules/ajv": {
      "version": "6.15.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz",
      "integrity": "sha512-fgFx7Hfoq60ytK2c7DhnF8jIvzYgOMxfugjLOSMHjLIPgenqa7S7oaagATUq99mV6IYvN2tRmC0wnTYX6iPbMw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/eslint/node_modules/eslint-visitor-keys": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz",
      "integrity": "sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint/node_modules/ignore": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/eslint/node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/espree": {
      "version": "11.2.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-11.2.0.tgz",
      "integrity": "sha512-7p3DrVEIopW1B1avAGLuCSh1jubc01H2JHc8B4qqGblmg5gI9yumBgACjWo4JlIc04ufug4xJ3SQI8HkS/Rgzw==",
      "dev": true,
      "license": "BSD-2-Clause",
      "peer": true,
      "dependencies": {
        "acorn": "^8.16.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^5.0.1"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree/node_modules/eslint-visitor-keys": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz",
      "integrity": "sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==",
      "dev": true,
      "license": "Apache-2.0",
      "peer": true,
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.7.0.tgz",
      "integrity": "sha512-Ap6G0WQwcU/LHsvLwON1fAQX9Zp0A2Y6Y/cJBl9r/JbW90Zyg4/zbG6zzKa2OTALELarYHmKu0GhpM5EO+7T0g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dev": true,
      "license": "BSD-2-Clause",
      "peer": true,
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/eventemitter3": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-4.0.7.tgz",
      "integrity": "sha512-8guHBZCwKnFhYdHr2ysuRWErTwhoN2X8XELRlrRwpmfeY2jjuUN4taQMsULKUVo1K4DvZl+0pgfyoysHxvmvEw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/fast-string-truncated-width": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/fast-string-truncated-width/-/fast-string-truncated-width-3.0.3.tgz",
      "integrity": "sha512-0jjjIEL6+0jag3l2XWWizO64/aZVtpiGE3t0Zgqxv0DPuxiMjvB3M24fCyhZUO4KomJQPj3LTSUnDP3GpdwC0g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-string-width": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/fast-string-width/-/fast-string-width-3.0.2.tgz",
      "integrity": "sha512-gX8LrtNEI5hq8DVUfRQMbr5lpaS4nMIWV+7XEbXk2b8kiQIizgnlr12B4dA3ZEx3308ze0O4Q1R+cHts8kyUJg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-string-truncated-width": "^3.0.2"
      }
    },
    "node_modules/fast-uri": {
      "version": "3.1.8",
      "resolved": "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.8.tgz",
      "integrity": "sha512-GZMtZUTNRpOVIECoXwLNZS5xUGE+mVNbTB8h/7Rwh2TFWcBQiPzTgyZi05BF9UMZKkLJv8XBRJTlU7zg8+ZfMg==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/fast-wrap-ansi": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/fast-wrap-ansi/-/fast-wrap-ansi-0.2.2.tgz",
      "integrity": "sha512-7F2Fl+TjRSenLqlU3UjSH0iyqopqoZIu7eZVpEirP2g1GtWa2G/ecEmBdgz31+Mxr+ELclgg6sokpSFIQiZ02Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-string-width": "^3.0.2"
      }
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/figures": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/figures/-/figures-3.2.0.tgz",
      "integrity": "sha512-yaduQFRKLXYOGgEn6AZau90j3ggSOyiqXU0F9JZfeXYhNa+Jk4X+s45A2zg5jns87GAFa34BBm2kXw4XpNcbdg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "escape-string-regexp": "^1.0.5"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/figures/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha512-vbRorB5FUQWvla16U8R/qgaFIya2qGzwDrNmCZuYKrbdSUMG6I1ZCGQRefkRVhuOkIGVne7BQ35DSfo1qvJqFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "11.1.5",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-11.1.5.tgz",
      "integrity": "sha512-+PFTHITI08JIGhnNpGNI8T8inUpgZfk3GNEqfT9R2zZV2iFXg3CvqzSl/uEhs7TSGujYRELEANyDvS8Fj7+S7Q==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "flat-cache": "^6.1.23"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/flat/-/flat-5.0.2.tgz",
      "integrity": "sha512-b6suED+5/3rTpUBdG1gupIl8MPFCAMA0QXwmljLhvCUKcUvdE4gWky9zpuGCcXHOsz4J9wPGNWq6OKpmIzz3hQ==",
      "dev": true,
      "license": "BSD-3-Clause",
      "bin": {
        "flat": "cli.js"
      }
    },
    "node_modules/flat-cache": {
      "version": "6.1.23",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-6.1.23.tgz",
      "integrity": "sha512-f++BY9pTk+983xK1FLzlLpmM0i0z+jHmx3QESGkURMXujQZz1k5wzwX6hjnQ8goaD0B+sYnDK1yZ6MTyZfUaqA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "cacheable": "^2.5.0",
        "flatted": "^3.4.2",
        "hookified": "^1.15.0"
      }
    },
    "node_modules/flatted": {
      "version": "3.4.4",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.4.4.tgz",
      "integrity": "sha512-5+ybhBZANEJxaH3X5evAFatUxLfEHSr7n6kYJ+1Qd0mUqr4eu9gIf6GDbWHf8RJijHrjjO8G+la14SlL2SeS1Q==",
      "dev": true,
      "license": "ISC",
      "peer": true
    },
    "node_modules/flru": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/flru/-/flru-1.0.2.tgz",
      "integrity": "sha512-kWyh8ADvHBFz6ua5xYOPnUroZTT/bwWfrCeL0Wj1dzG4/YOmOcfJ99W8dOVyyynJN35rZ9aCOtHChqQovV7yog==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.16.1",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.16.1.tgz",
      "integrity": "sha512-FNvFGzoMLWmE6Yj9spb/zjd7yiNCHiAW9/Tg9CXrQ8wuu32HtlJOwWO11OJafl5FfY3DxTdQ0vj42zU1kvv5jg==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/form-data": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.6.tgz",
      "integrity": "sha512-vKatAh4SlVfgbv+YtmhiRjhEMJsYpsG1Y2rMQtR+SVSbytsSD1YGzDIcrAJmdFec88u/+VoGmxnl+80gL1tRCQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.4",
        "mime-types": "^2.1.35"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fraction.js": {
      "version": "5.3.4",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-5.3.4.tgz",
      "integrity": "sha512-1X1NTtiJphryn/uLQz3whtY6jK3fTqoE3ohKs0tT+Ujr1W59oopxmoEh7Lu5p6vBaPbgoM0bzveAW4Qi5RyWDQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/rawify"
      }
    },
    "node_modules/fs-constants": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/fs-constants/-/fs-constants-1.0.0.tgz",
      "integrity": "sha512-y6OAwoSIf7FyjMIv94u+b5rdheZEjzR63GTyZJm5qh4Bi+2YgwLCcI/fPFZkL5PSixOt6ZNKm+w+Hfp/Bciwow==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-east-asian-width": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/get-east-asian-width/-/get-east-asian-width-1.7.0.tgz",
      "integrity": "sha512-XjH1AECxf0giL2V1aU8vKyRR2ppRUb5c0EvT7zuJTokQ74bNo52zOtghqdWIqrhUD79fo3x0WfKZdOqxF6LG1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dev": true,
      "license": "ISC",
      "peer": true,
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hashery": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/hashery/-/hashery-1.5.1.tgz",
      "integrity": "sha512-iZyKG96/JwPz1N55vj2Ie2vXbhu440zfUfJvSwEqEbeLluk7NnapfGqa7LH0mOsnDxTF85Mx8/dyR6HfqcbmbQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "hookified": "^1.15.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/he": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/he/-/he-1.2.0.tgz",
      "integrity": "sha512-F/1DnUGPopORZi0ni+CvrCgHQ5FyEAHRLSApuYWMmrbSwoN2Mn/7k+Gl38gJnR7yyDZk6WLXwiGod1JOWNDKGw==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "he": "bin/he"
      }
    },
    "node_modules/hookified": {
      "version": "1.15.1",
      "resolved": "https://registry.npmjs.org/hookified/-/hookified-1.15.1.tgz",
      "integrity": "sha512-MvG/clsADq1GPM2KGo2nyfaWVyn9naPiXrqIe4jYjXNZQt238kWyOGrsyc/DmRAQ+Re6yeo6yX/yoNCG5KAEVg==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/html-encoding-sniffer": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-3.0.0.tgz",
      "integrity": "sha512-oWv4T4yJ52iKrufjnyZPkrN0CH3QnrUqdB6In1g5Fe1mia8GmF36gnfNySxoZtxD5+NmYw1EElVXiBk93UeskA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "whatwg-encoding": "^2.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/htmlparser2": {
      "version": "12.0.0",
      "resolved": "https://registry.npmjs.org/htmlparser2/-/htmlparser2-12.0.0.tgz",
      "integrity": "sha512-Tz7u1i95/g2x2jz81+x0FBVhBhY5aRTvD3tXXdFaljuNdzDLJ8UGNRrTcj2cgQvAg3iW/h77Fz15nLW0L0CrZw==",
      "dev": true,
      "funding": [
        "https://github.com/fb55/htmlparser2?sponsor=1",
        {
          "type": "github",
          "url": "https://github.com/sponsors/fb55"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "domelementtype": "^3.0.0",
        "domhandler": "^6.0.0",
        "domutils": "^4.0.2",
        "entities": "^8.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/http-proxy": {
      "version": "1.18.1",
      "resolved": "https://registry.npmjs.org/http-proxy/-/http-proxy-1.18.1.tgz",
      "integrity": "sha512-7mz/721AbnJwIVbnaSv1Cz3Am0ZLT/UBwkC92VlxhXv/k/BBQfM2fXElQNC27BVGr0uwUpplYPQM9LnaBMR5NQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eventemitter3": "^4.0.0",
        "follow-redirects": "^1.0.0",
        "requires-port": "^1.0.0"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/http-server": {
      "version": "14.1.1",
      "resolved": "https://registry.npmjs.org/http-server/-/http-server-14.1.1.tgz",
      "integrity": "sha512-+cbxadF40UXd9T01zUHgA+rlo2Bg1Srer4+B4NwIHdaGxAGGv59nYRnGGDJ9LBk7alpS0US+J+bLLdQOOkJq4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "basic-auth": "^2.0.1",
        "chalk": "^4.1.2",
        "corser": "^2.0.1",
        "he": "^1.2.0",
        "html-encoding-sniffer": "^3.0.0",
        "http-proxy": "^1.18.1",
        "mime": "^1.6.0",
        "minimist": "^1.2.6",
        "opener": "^1.5.1",
        "portfinder": "^1.0.28",
        "secure-compare": "3.0.1",
        "union": "~0.5.0",
        "url-join": "^4.0.1"
      },
      "bin": {
        "http-server": "bin/http-server"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-9.1.0.tgz",
      "integrity": "sha512-ag87y7cJJ9/3+GxFr8Oy4O5faDsGRGnBGsJj/YjOSsSx/5eadKLYTMPlzuR6obgoCDDm0abAAZitXXQkMOPSpA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "9.0.0",
        "debug": "^4.3.4",
        "proxy-agent-negotiate": "1.1.0"
      },
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/iceberg-js": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/iceberg-js/-/iceberg-js-0.8.1.tgz",
      "integrity": "sha512-1dhVQZXhcHje7798IVM+xoo/1ZdVfzOMIc8/rgVSijRK38EDqOJoGula9N/8ZI5RD8QTxNQtK/Gozpr+qUqRRA==",
      "license": "MIT",
      "engines": {
        "node": ">=20.0.0"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/ignore": {
      "version": "7.0.12",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-7.0.12.tgz",
      "integrity": "sha512-/8UvqAPU9DGTI9k4mxtf49U37Isfwr8Uts96+SBHIkFxPJnHS0Ew4f00sM4Scd8V8EjM0jUNtVDdv1kPdt35lg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/immutable": {
      "version": "5.1.9",
      "resolved": "https://registry.npmjs.org/immutable/-/immutable-5.1.9.tgz",
      "integrity": "sha512-m8nVez3rwrgmWxtLMt1ZYXB2Lv7OKYn/disyxAlSDYAlKSlFoPPfIAmAM/M5xqL4m4C/wAPw7S2/CNaUii1Hxg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/import-fresh": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
      "integrity": "sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==",
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/import-meta-resolve": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/import-meta-resolve/-/import-meta-resolve-4.2.0.tgz",
      "integrity": "sha512-Iqv2fzaTQN28s/FwZAoFq0ZSs/7hMAHJVX+w8PZl3cY19Pxk6jFFalxQoIfW2826i/fDLXv8IiEZRIT0lDuWcg==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/is-arrayish": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.2.1.tgz",
      "integrity": "sha512-zz06S8t0ozoDXMG+ube26zeCTNXcKIPJZJi8hBrF4idCLms4CG9QtK7qBl1boi5ODzFpjswb5JPmHCbMpjaYzg==",
      "license": "MIT"
    },
    "node_modules/is-core-module": {
      "version": "2.17.0",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.17.0.tgz",
      "integrity": "sha512-J/vG0zBCbIKOQFfufSwyXdMrsohyJIUNkrnmo6WZGzoM7tr/lsbfW5b2BvisL6zsyMzK9UxV9L6c7AoFbyXHOA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-docker": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-docker/-/is-docker-3.0.0.tgz",
      "integrity": "sha512-eljcgEDlEns/7AXFosB5K/2nCM4P7FQPkGc/DWLy5rmFEWvZayGrik1d9/QIY5nJ4f9YsVvBkA6kJpHn9rISdQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "is-docker": "cli.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-inside-container": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-inside-container/-/is-inside-container-1.0.0.tgz",
      "integrity": "sha512-KIYLCCJghfHZxqjYBE7rEy0OBuTd5xCHS7tHVgvCLkx7StIoaxwNW3hCALgEUjFfeRk+MG/Qxmp/vtETEF3tRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-docker": "^3.0.0"
      },
      "bin": {
        "is-inside-container": "cli.js"
      },
      "engines": {
        "node": ">=14.16"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-interactive": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-interactive/-/is-interactive-1.0.0.tgz",
      "integrity": "sha512-2HvIEKRoqS62guEC+qBjpvRubdX910WCMuJTZ+I9yvqKU2/12eSL549HMwtabb4oupdj2sMP50k+XJfB/8JE6w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-unicode-supported": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-0.1.0.tgz",
      "integrity": "sha512-knxG2q4UC3u8stRGyAVJCOdxFmv5DZiRcdlIaAQXAbSfJya+OhopNotLQrstBhququ4ZpuKbDc/8S6mgXgPFPw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-wsl": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/is-wsl/-/is-wsl-3.1.0.tgz",
      "integrity": "sha512-UcVfVfaK4Sc4m7X3dUSoHoozQGBEFeDC+zVo06t98xe8CzHSZZBekNXH+tu0NalHolcJ/QAGqS46Hef7QXBIMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-inside-container": "^1.0.0"
      },
      "engines": {
        "node": ">=16"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/jiti": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz",
      "integrity": "sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/js-tokens": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-10.0.0.tgz",
      "integrity": "sha512-lM/UBzQmfJRo9ABXbPWemivdCW8V2G8FHaHdypQaIy523snUjog0W71ayWXTjiR+ixeMyVHN2XcpnTd/liPg/Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz",
      "integrity": "sha512-SFNOvSJ+Dgf/9An904Yx+CgSlIPCkIpao4qo51lpee25TIRejdH3rhR4EZMGoNx3/TP3O+wzWuiTFl4sqbltzA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/puzrin"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/nodeca"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-parse-even-better-errors": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/json-parse-even-better-errors/-/json-parse-even-better-errors-2.3.1.tgz",
      "integrity": "sha512-xyFwyhro/JEof6Ghe2iz2NcXoj2sloNsWr/XsERDK/oiPCfaNhl5ONfp+jQdAZRQQ0IJWNzH9zIZF7li91kh2w==",
      "license": "MIT"
    },
    "node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
      "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/jsonc-parser": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/jsonc-parser/-/jsonc-parser-3.3.1.tgz",
      "integrity": "sha512-HUgH65KyejrUFPvHFPbqOY0rsFip3Bo5wb4ngvdi1EpCYWUQDC5V+Y7mZws+DLkr4M//zQJoanu1SP+87Dv1oQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/keyv": {
      "version": "5.6.0",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-5.6.0.tgz",
      "integrity": "sha512-CYDD3SOtsHtyXeEORYRx2qBtpDJFjRTGXUtmNEMGyzYOKj1TE3tycdlho7kA1Ufx9OYWZzg52QFBGALTirzDSw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "@keyv/serialize": "^1.1.1"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.33.0.tgz",
      "integrity": "sha512-WkUDrojuJs0xkgGf2udWxa3yGBRxPtxUkB79i6aCZLRgc7PM8fZe9TosfPDcvEpQZbuFASnHYmRLBLUbmLOIIA==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.33.0",
        "lightningcss-darwin-arm64": "1.33.0",
        "lightningcss-darwin-x64": "1.33.0",
        "lightningcss-freebsd-x64": "1.33.0",
        "lightningcss-linux-arm-gnueabihf": "1.33.0",
        "lightningcss-linux-arm64-gnu": "1.33.0",
        "lightningcss-linux-arm64-musl": "1.33.0",
        "lightningcss-linux-x64-gnu": "1.33.0",
        "lightningcss-linux-x64-musl": "1.33.0",
        "lightningcss-win32-arm64-msvc": "1.33.0",
        "lightningcss-win32-x64-msvc": "1.33.0"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.33.0.tgz",
      "integrity": "sha512-gEpRTalKdosp4Bb8qWtc2iOgE5SeIHlpS1up9bFq2wAyYhl1UdTObYiHe98zEM9SQvSoqQZ1IQD0JNpg3Ml5pg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.33.0.tgz",
      "integrity": "sha512-Sciaz8eenNTKn9b3t7+xr0ipTp9YxKQY4npwQ3mrRuL0BAVHBLyZxofhaKBAVtzmtRZ/zTyo0/to4B1uWG/Djg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.33.0.tgz",
      "integrity": "sha512-Z5UPAxzrjlWNNyGy6i65cJzzvgJ5D3T6wMvs+gWpY9d7qRhANrxqAp6LhxIgZhWEw18RfJTGcRxjuLIBr+m8XQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.33.0.tgz",
      "integrity": "sha512-QQM/Ti/hQajJwCY+RiWuCZ9sdtI/XQk7nDK5vC8kkdwixezOlDgvDx7+RT+QjK6FcFT4MpsuoBnHIo/O3StRRg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.33.0.tgz",
      "integrity": "sha512-N7FVBe6iS24MlM6R/4RBTxGhQheZGs7tiQ9U32UtF75NzP5Q7xWPRqLBCKxlRQRk3rY1jCIPLzx7WzOhuUIRLQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.33.0.tgz",
      "integrity": "sha512-j2v/itmy4HlNxlc6voKXYgBqNi0Ng2LShg4z7GufpEgs05P+2suBVyi9I6YHq5uoVFx9ETin3eCEhLVyXGQnKg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.33.0.tgz",
      "integrity": "sha512-yiO5ROMuYQgXbC60yjZU5CYSFZGKXL0HFATXt9mHJn1+zW55oCtMI9NfcVhYLMFDL7gV7oBPon/EmMMGg2OvtQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.33.0.tgz",
      "integrity": "sha512-ar+Ju7LmcN0Jo4FpL4hpFybwNG9/3A/Br5KW2n2jyODg3MEZXaDYADdemoNS+BDNfMgKvylJLj4S5tyRActuAg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.33.0.tgz",
      "integrity": "sha512-RYiYbkokw0trfKqqzfF55lginwEPrD3OJDfTuJzFs1MK6iFnDenaz1fqLLtX4ITG3OktJQXOeTaw1awrBAlZPw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.33.0.tgz",
      "integrity": "sha512-1K+MPfLSFVpphzpdbfkhlWk6wBrTObBzS2T6db10PNOZgR9GoVsAWzwNyuhUYYbTp23j+4RrncfujZ4uAzXvwA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.33.0.tgz",
      "integrity": "sha512-OlEICDx/Xl0FqSp4bry8zFnCvGpig3Gl4gCquvYwHuqJKEC1+n9NgDniFvqHGmMv1ZkqDJrDqKKSykTDX+ehuA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-2.0.3.tgz",
      "integrity": "sha512-cNOjgCnLB+FnvWWtyRTzmB3POJ+cXxTA81LoW7u8JdmhfXzriropYwpjShnz1QLLWsQwY7nIxoDmcPTwphDK9w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      }
    },
    "node_modules/listr2": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/listr2/-/listr2-11.1.0.tgz",
      "integrity": "sha512-xsuczF6mWkEo/E80QHaEokQzKmTy7m80KcLRnkUt9wrcePres2w7dbQi5zOsWtDUg8Dac4gPFyu4EJ/IvKwTOg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cli-truncate": "^6.1.1",
        "log-update": "^8.0.0",
        "wrap-ansi": "^10.0.1"
      },
      "engines": {
        "node": ">=22.13.0"
      }
    },
    "node_modules/lmdb": {
      "version": "3.5.6",
      "resolved": "https://registry.npmjs.org/lmdb/-/lmdb-3.5.6.tgz",
      "integrity": "sha512-j3uE8ReKNyUWDjhfEFSJqE/1DLtfTR5Z8yFzVHvBjAk37wNg7HdScjcv8ttPHRvrdgPQMPWxFFI0SsdBzI5lBw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@harperfast/extended-iterable": "^1.0.3",
        "msgpackr": "^1.11.2",
        "node-addon-api": "^6.1.0",
        "node-gyp-build-optional-packages": "5.2.2",
        "ordered-binary": "^1.5.3",
        "weak-lru-cache": "^1.2.2"
      },
      "bin": {
        "download-lmdb-prebuilds": "bin/download-prebuilds.js"
      },
      "optionalDependencies": {
        "@lmdb/lmdb-darwin-arm64": "3.5.6",
        "@lmdb/lmdb-darwin-x64": "3.5.6",
        "@lmdb/lmdb-linux-arm": "3.5.6",
        "@lmdb/lmdb-linux-arm64": "3.5.6",
        "@lmdb/lmdb-linux-x64": "3.5.6",
        "@lmdb/lmdb-win32-arm64": "3.5.6",
        "@lmdb/lmdb-win32-x64": "3.5.6"
      }
    },
    "node_modules/lmdb/node_modules/node-addon-api": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-6.1.0.tgz",
      "integrity": "sha512-+eawOlIgy680F0kBzPUNFhMZGtJ1YmqM6l4+Crf4IkImjYrO/mqPwRMh352g23uIaQKFItcQ64I7KMaJxHgAVA==",
      "dev": true,
      "license": "MIT",
      "optional": true
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash.debounce": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/lodash.debounce/-/lodash.debounce-4.0.8.tgz",
      "integrity": "sha512-FT1yDzDYEoYWhnSGnpE/4Kj1fLZkDFyqRb7fNt6FdYOSxlUWAtp42Eh6Wb0rGIv/m9Bgo7x4GhQbm5Ys4SG5ow==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/log-symbols": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-4.1.0.tgz",
      "integrity": "sha512-8XPvpAA8uyhfteu8pIvQxpJZ7SYYdpUivZpGy6sFsBuKRY/7rQGavedeB8aK+Zkyq6upMFVL/9AW6vOYzfRyLg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chalk": "^4.1.0",
        "is-unicode-supported": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/log-update": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/log-update/-/log-update-8.0.0.tgz",
      "integrity": "sha512-lddSgOt3bPASrylL54ZSpy8nBHns+vBVSoILlVOx+dei300pnLRN958rj/EdlVLKuWlSESU3qdnDZdAI7FXYGg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-escapes": "^7.3.0",
        "cli-cursor": "^5.0.0",
        "slice-ansi": "^9.0.0",
        "string-width": "^8.2.0",
        "strip-ansi": "^7.2.0",
        "wrap-ansi": "^10.0.0"
      },
      "engines": {
        "node": ">=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/log-update/node_modules/ansi-regex": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.4.0.tgz",
      "integrity": "sha512-KzTVk2tCWAHtYrvvvaP8bJKJq2pVinhLcGEQdtLIYPbmNGNyYe8QwNaTUYQp2J7/vIsUKt5QCqAfUkYyG9DkOw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/log-update/node_modules/strip-ansi": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.2.0.tgz",
      "integrity": "sha512-yDPMNjp4WyfYBkHnjIRLfca1i6KMyGCtsVgoKe/z1+6vukgaENdgGBZt+ZmKPc4gavvEZ5OgHfHdrazhgNyG7w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^6.2.2"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/magic-string": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-1.4.1.tgz",
      "integrity": "sha512-8lyCu36ErXR0J9uaGKlKQoiLZKmtI63YGLE8G2o9jyRPdr4X47LusSOwgOJOzcVtp81fTAAjxR7BwKz682Jhow==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.6.0"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/mime": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-1.6.0.tgz",
      "integrity": "sha512-x0Vn8spI+wuJ1O6S7gnbaQg8Pxh4NNHb7KSINmEWKiPE4RKOplvijn+NkmYmmRgP68mc70j2EbeTFRsrswaQeg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mimic-fn": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/mimic-fn/-/mimic-fn-2.1.0.tgz",
      "integrity": "sha512-OqbOk5oEQeAZ8WXWydlu9HJjz9WVdEIvamMCcXmuqUYjTknH/sqsWvhQ3vgwKFRR1HpjvNBKQ37nbJgYzGqGcg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/mimic-function": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/mimic-function/-/mimic-function-5.0.1.tgz",
      "integrity": "sha512-VP79XUPxV2CigYP3jWwAUFSku2aKqBH7uTAapFWCBqutsbmDo96KY5o8uh6U+/YSIn5OxJnXp73beVkpqMIGhA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/minimatch": {
      "version": "10.2.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.5.tgz",
      "integrity": "sha512-MULkVLfKGYDFYejP07QOurDLLQpcjk7Fw+7jXS2R2czRQzR56yHRveU5NDJEOviH+hETZKSkIk5c+T23GjFUMg==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "brace-expansion": "^5.0.5"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/mrmime": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/mrmime/-/mrmime-2.0.1.tgz",
      "integrity": "sha512-Y3wQdFg2Va6etvQ5I82yUhGdsKrcYox6p7FfL1LbK2J4V01F9TGlepTIhnK24t7koZibmg82KGglhA1XK5IsLQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/msgpackr": {
      "version": "1.12.1",
      "resolved": "https://registry.npmjs.org/msgpackr/-/msgpackr-1.12.1.tgz",
      "integrity": "sha512-4EUH9tQHnMmEgzW/MdAP0KIfa1T9AF+htl0ffe2n5vb2EKn9y2co8ccpgWko6S52Jy1PQZKwRnx5/KkYjtd9MQ==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "optionalDependencies": {
        "msgpackr-extract": "^3.0.2"
      }
    },
    "node_modules/msgpackr-extract": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/msgpackr-extract/-/msgpackr-extract-3.0.4.tgz",
      "integrity": "sha512-4kmO/MdyUIkLIvTPr8VHLil4AtoKIoniWPIEk5+CDy0xnWC84azhSFmuJ7PxZdsYtiP5kEeQsORAVIeMgxT+Hw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "node-gyp-build-optional-packages": "5.2.2"
      },
      "bin": {
        "download-msgpackr-prebuilds": "bin/download-prebuilds.js"
      },
      "optionalDependencies": {
        "@msgpackr-extract/msgpackr-extract-darwin-arm64": "3.0.4",
        "@msgpackr-extract/msgpackr-extract-darwin-x64": "3.0.4",
        "@msgpackr-extract/msgpackr-extract-linux-arm": "3.0.4",
        "@msgpackr-extract/msgpackr-extract-linux-arm64": "3.0.4",
        "@msgpackr-extract/msgpackr-extract-linux-x64": "3.0.4",
        "@msgpackr-extract/msgpackr-extract-win32-x64": "3.0.4"
      }
    },
    "node_modules/mute-stream": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/mute-stream/-/mute-stream-3.0.0.tgz",
      "integrity": "sha512-dkEJPVvun4FryqBmZ5KhDo0K9iDXAwn08tMLDinNdRBNPcYEDiWYysLcc6k3mjTMlbP9KyylvRpd4wFtwrT9rw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "^20.17.0 || >=22.9.0"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.19",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.19.tgz",
      "integrity": "sha512-Y2tUNy4ouw6tq5oDSKeQYGOyhkUBhNOcGV/02KC+6kd9eDGqdZd++mjMiIDilrBYvjEnCYvVtsuHCuP+okSfug==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/node-addon-api": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-7.1.1.tgz",
      "integrity": "sha512-5m3bsyrjFWE1xf7nz7YXdN4udnVtXK6/Yfgn5qnahL6bCkf2yKt4k3nuTKAtT4r3IG8JNR2ncsIMdZuAzJjHQQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-gyp-build-optional-packages": {
      "version": "5.2.2",
      "resolved": "https://registry.npmjs.org/node-gyp-build-optional-packages/-/node-gyp-build-optional-packages-5.2.2.tgz",
      "integrity": "sha512-s+w+rBWnpTMwSFbaE0UXsRlg7hU4FjekKU4eyAih5T8nJuNZT1nNsskXpxmeqSK9UzkBl6UgRlnKc8hz8IEqOw==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "detect-libc": "^2.0.1"
      },
      "bin": {
        "node-gyp-build-optional-packages": "bin.js",
        "node-gyp-build-optional-packages-optional": "optional.js",
        "node-gyp-build-optional-packages-test": "build-test.js"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.57",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.57.tgz",
      "integrity": "sha512-kQK9LGGFiHtrWiNhZtA7Qbw17AQz+dmsEKODRIVTXA9+e5MS/2gZEBhYJt13GrAz5/IOZKddH/0Z3TP/Zgo+yw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/npm-run-path": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/npm-run-path/-/npm-run-path-4.0.1.tgz",
      "integrity": "sha512-S48WzZW777zhNIrn7gxOlISNAqi9ZC/uQFnRdbeIHhZhCA6UqpkOT8T1G7BvfdgP4Er8gF4sUbaS0i7QvIfCWw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/nth-check": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/nth-check/-/nth-check-3.0.1.tgz",
      "integrity": "sha512-GX0gsdbGVCgnRgbeGaubfjpBXyYRWOOCVeYh08bSQvDZqxz5ndXs1OTfAt/h36G1xvI94YIspsI0sVFqAV9+RQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "boolbase": "^2.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/fb55/nth-check?sponsor=1"
      }
    },
    "node_modules/nx": {
      "version": "23.2.1",
      "resolved": "https://registry.npmjs.org/nx/-/nx-23.2.1.tgz",
      "integrity": "sha512-QOgM7EcJ6gvLKZ3Azno7wdoXXhRhZHbRDN79gCmGXsBxH9WBXCeSy3DyGdee/d5Fa6GnxVOgwKTCx8l0eA+vHw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "@clack/core": "1.4.3",
        "@clack/prompts": "1.7.0",
        "@emnapi/core": "1.4.5",
        "@emnapi/runtime": "1.4.5",
        "@emnapi/wasi-threads": "1.0.4",
        "@jest/diff-sequences": "30.0.1",
        "@napi-rs/wasm-runtime": "0.2.4",
        "@tybys/wasm-util": "0.9.0",
        "@yarnpkg/lockfile": "1.1.0",
        "@zkochan/js-yaml": "0.0.7",
        "agent-base": "6.0.2",
        "ansi-regex": "5.0.1",
        "ansi-styles": "4.3.0",
        "argparse": "2.0.1",
        "asynckit": "0.4.0",
        "axios": "1.18.1",
        "balanced-match": "4.0.3",
        "base64-js": "1.5.1",
        "bl": "4.1.0",
        "brace-expansion": "5.0.9",
        "buffer": "5.7.1",
        "bundle-name": "4.1.0",
        "call-bind-apply-helpers": "1.0.2",
        "chalk": "4.1.2",
        "cli-cursor": "3.1.0",
        "cli-spinners": "2.6.1",
        "cliui": "8.0.1",
        "clone": "1.0.4",
        "color-convert": "2.0.1",
        "color-name": "1.1.4",
        "combined-stream": "1.0.8",
        "debug": "4.4.3",
        "default-browser": "5.2.1",
        "default-browser-id": "5.0.0",
        "defaults": "1.0.4",
        "define-lazy-prop": "3.0.0",
        "delayed-stream": "1.0.0",
        "dotenv": "16.4.7",
        "dotenv-expand": "12.0.3",
        "dunder-proto": "1.0.1",
        "ejs": "5.0.1",
        "emoji-regex": "8.0.0",
        "end-of-stream": "1.4.5",
        "es-define-property": "1.0.1",
        "es-errors": "1.3.0",
        "es-object-atoms": "1.1.1",
        "es-set-tostringtag": "2.1.0",
        "escalade": "3.2.0",
        "escape-string-regexp": "1.0.5",
        "fast-string-truncated-width": "3.0.3",
        "fast-string-width": "3.0.2",
        "fast-wrap-ansi": "0.2.0",
        "figures": "3.2.0",
        "flat": "5.0.2",
        "follow-redirects": "1.16.0",
        "form-data": "4.0.6",
        "fs-constants": "1.0.0",
        "function-bind": "1.1.2",
        "get-caller-file": "2.0.5",
        "get-intrinsic": "1.3.0",
        "get-proto": "1.0.1",
        "gopd": "1.2.0",
        "has-flag": "4.0.0",
        "has-symbols": "1.1.0",
        "has-tostringtag": "1.0.2",
        "hasown": "2.0.4",
        "https-proxy-agent": "5.0.1",
        "ieee754": "1.2.1",
        "ignore": "7.0.5",
        "inherits": "2.0.4",
        "is-docker": "3.0.0",
        "is-fullwidth-code-point": "3.0.0",
        "is-inside-container": "1.0.0",
        "is-interactive": "1.0.0",
        "is-unicode-supported": "0.1.0",
        "is-wsl": "3.1.0",
        "isexe": "2.0.0",
        "json5": "2.2.3",
        "jsonc-parser": "3.3.1",
        "lines-and-columns": "2.0.3",
        "log-symbols": "4.1.0",
        "math-intrinsics": "1.1.0",
        "mime-db": "1.52.0",
        "mime-types": "2.1.35",
        "mimic-fn": "2.1.0",
        "minimatch": "10.2.5",
        "minimist": "1.2.8",
        "ms": "2.1.3",
        "npm-run-path": "4.0.1",
        "once": "1.4.0",
        "onetime": "5.1.2",
        "open": "10.1.0",
        "ora": "5.4.1",
        "path-key": "3.1.1",
        "picocolors": "1.1.1",
        "proxy-from-env": "2.1.0",
        "readable-stream": "3.6.2",
        "require-directory": "2.1.1",
        "resolve.exports": "2.0.3",
        "restore-cursor": "3.1.0",
        "run-applescript": "7.0.0",
        "safe-buffer": "5.2.1",
        "semver": "7.8.4",
        "signal-exit": "3.0.7",
        "sisteransi": "1.0.5",
        "smol-toml": "1.6.1",
        "string_decoder": "1.3.0",
        "string-width": "4.2.3",
        "strip-ansi": "6.0.1",
        "strip-bom": "3.0.0",
        "supports-color": "7.2.0",
        "tar-stream": "2.2.0",
        "tmp": "0.2.7",
        "tsconfig-paths": "4.2.0",
        "tslib": "2.8.1",
        "util-deprecate": "1.0.2",
        "wcwidth": "1.0.1",
        "which": "3.0.1",
        "wrap-ansi": "7.0.0",
        "wrappy": "1.0.2",
        "y18n": "5.0.8",
        "yaml": "2.9.0",
        "yargs": "17.7.2",
        "yargs-parser": "21.1.1"
      },
      "bin": {
        "nx": "dist/bin/nx.js",
        "nx-cloud": "dist/bin/nx-cloud.js"
      },
      "optionalDependencies": {
        "@nx/nx-darwin-arm64": "23.2.1",
        "@nx/nx-darwin-x64": "23.2.1",
        "@nx/nx-freebsd-x64": "23.2.1",
        "@nx/nx-linux-arm-gnueabihf": "23.2.1",
        "@nx/nx-linux-arm64-gnu": "23.2.1",
        "@nx/nx-linux-arm64-musl": "23.2.1",
        "@nx/nx-linux-x64-gnu": "23.2.1",
        "@nx/nx-linux-x64-musl": "23.2.1",
        "@nx/nx-win32-arm64-msvc": "23.2.1",
        "@nx/nx-win32-x64-msvc": "23.2.1"
      },
      "peerDependencies": {
        "@swc-node/register": "^1.11.1",
        "@swc/core": "^1.15.8"
      },
      "peerDependenciesMeta": {
        "@swc-node/register": {
          "optional": true
        },
        "@swc/core": {
          "optional": true
        }
      }
    },
    "node_modules/nx/node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/nx/node_modules/balanced-match": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.3.tgz",
      "integrity": "sha512-1pHv8LX9CpKut1Zp4EXey7Z8OfH11ONNH6Dhi2WDUt31VVZFXZzKwXcysBgqSumFCmR+0dqjMK5v5JiFHzi0+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/nx/node_modules/cli-cursor": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-3.1.0.tgz",
      "integrity": "sha512-I/zHAwsKf9FqGoXM4WWRACob9+SNukZTd94DWF57E4toouRulbCxcUh6RKUEOQlYTHJnzkPMySvPNaaSLNfLZw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "restore-cursor": "^3.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/nx/node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
      "integrity": "sha512-vbRorB5FUQWvla16U8R/qgaFIya2qGzwDrNmCZuYKrbdSUMG6I1ZCGQRefkRVhuOkIGVne7BQ35DSfo1qvJqFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/nx/node_modules/fast-wrap-ansi": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/fast-wrap-ansi/-/fast-wrap-ansi-0.2.0.tgz",
      "integrity": "sha512-rLV8JHxTyhVmFYhBJuMujcrHqOT2cnO5Zxj37qROj23CP39GXubJRBUFF0z8KFK77Uc0SukZUf7JZhsVEQ6n8w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-string-width": "^3.0.2"
      }
    },
    "node_modules/nx/node_modules/follow-redirects": {
      "version": "1.16.0",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.16.0.tgz",
      "integrity": "sha512-y5rN/uOsadFT/JfYwhxRS5R7Qce+g3zG97+JrtFZlC9klX/W5hD7iiLzScI4nZqUS7DNUdhPgw4xI8W2LuXlUw==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/nx/node_modules/https-proxy-agent": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/nx/node_modules/ignore": {
      "version": "7.0.5",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-7.0.5.tgz",
      "integrity": "sha512-Hs59xBNfUIunMFgWAbGX5cq6893IbWg4KnrjbYwX3tx0ztorVgTDA6B2sxf8ejHJ4wz8BqGUMYlnzNBer5NvGg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/nx/node_modules/ora": {
      "version": "5.4.1",
      "resolved": "https://registry.npmjs.org/ora/-/ora-5.4.1.tgz",
      "integrity": "sha512-5b6Y85tPxZZ7QytO+BQzysW31HJku27cRIlkbAXaNx+BdcVi+LlRFmVXzeF6a7JCwJpyw5c4b+YSVImQIrBpuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "bl": "^4.1.0",
        "chalk": "^4.1.0",
        "cli-cursor": "^3.1.0",
        "cli-spinners": "^2.5.0",
        "is-interactive": "^1.0.0",
        "is-unicode-supported": "^0.1.0",
        "log-symbols": "^4.1.0",
        "strip-ansi": "^6.0.0",
        "wcwidth": "^1.0.1"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/nx/node_modules/restore-cursor": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/restore-cursor/-/restore-cursor-3.1.0.tgz",
      "integrity": "sha512-l+sSefzHpj5qimhFSE5a8nufZYAM3sBSVMAPtYkmC+4EH2anSGaEMXSD0izRQbu9nfyQ9y5JrVmp7E8oZrUjvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "onetime": "^5.1.0",
        "signal-exit": "^3.0.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/nx/node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/nx/node_modules/semver": {
      "version": "7.8.4",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.4.tgz",
      "integrity": "sha512-rUCObTnP32Q08R2uuIrt7r9PlEonuTmtuXYcW6s5kjdlj3xbnwe+21yXptAUYcMAABLkYYTtnmzb3w3EDZfueA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/nx/node_modules/signal-exit": {
      "version": "3.0.7",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
      "integrity": "sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/nx/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/nx/node_modules/which": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/which/-/which-3.0.1.tgz",
      "integrity": "sha512-XA1b62dzQzLfaEOSQFTCOd5KFf/1VSzZo7/7TUjnya6u0vGGKzU96UQBZTAThCb2j4/xjBAyii1OhRLJEivHvg==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/which.js"
      },
      "engines": {
        "node": "^14.17.0 || ^16.13.0 || >=18.0.0"
      }
    },
    "node_modules/nx/node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/nx/node_modules/yargs": {
      "version": "17.7.2",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.7.2.tgz",
      "integrity": "sha512-7dSzzRQ++CKnNI/krKnYRV7JKKPUXMEh61soaHKg9mrWEhzFWhFnxPxGl+69cD1Ou63C13NUPCnmIcrvqCuM6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cliui": "^8.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.1.1"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/obug": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/obug/-/obug-2.2.1.tgz",
      "integrity": "sha512-XrsrhT5sybtKI6wakr2SPOlGZWWYbUXZ7a0jT8/QOeAPau+1X/bSegNe5YR75oJmEZQbKningirmGOEJCIk61Q==",
      "dev": true,
      "funding": [
        "https://github.com/sponsors/sxzz",
        "https://opencollective.com/debug"
      ],
      "license": "MIT",
      "engines": {
        "node": ">=12.20.0"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/onetime": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/onetime/-/onetime-5.1.2.tgz",
      "integrity": "sha512-kbpaSSGJTWdAY5KPVeMOKXSrPtr8C8C7wodJbcsd51jRnmD+GZu8Y0VoU6Dm5Z4vWr0Ig/1NKuWRKf7j5aaYSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mimic-fn": "^2.1.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/open": {
      "version": "10.1.0",
      "resolved": "https://registry.npmjs.org/open/-/open-10.1.0.tgz",
      "integrity": "sha512-mnkeQ1qP5Ue2wd+aivTD3NHd/lZ96Lu0jgf0pwktLPtx6cTZiH7tyeGRRHs0zX0rbrahXPnXlUnbeXyaBBuIaw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "default-browser": "^5.2.1",
        "define-lazy-prop": "^3.0.0",
        "is-inside-container": "^1.0.0",
        "is-wsl": "^3.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/opener": {
      "version": "1.5.2",
      "resolved": "https://registry.npmjs.org/opener/-/opener-1.5.2.tgz",
      "integrity": "sha512-ur5UIdyw5Y7yEj9wLzhqXiy6GZ3Mwx0yGI+5sMn2r0N0v3cKJvUmFH5yPP+WXh9e0xfyzyJX95D8l088DNFj7A==",
      "dev": true,
      "license": "(WTFPL OR MIT)",
      "bin": {
        "opener": "bin/opener-bin.js"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.5"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/ora": {
      "version": "9.4.1",
      "resolved": "https://registry.npmjs.org/ora/-/ora-9.4.1.tgz",
      "integrity": "sha512-6VlU9MLXbjVQD04AZCMX28hVtA5bUoadvUqO76MUCVA0ilwJbMiHsITRPfyVm6p/BC0Av/BXMujx39WCe1LEqw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "chalk": "^5.6.2",
        "cli-cursor": "^5.0.0",
        "cli-spinners": "^3.2.0",
        "is-interactive": "^2.0.0",
        "is-unicode-supported": "^2.1.0",
        "log-symbols": "^7.0.1",
        "stdin-discarder": "^0.3.2",
        "string-width": "^8.1.0"
      },
      "engines": {
        "node": ">=20"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora/node_modules/chalk": {
      "version": "5.6.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.6.2.tgz",
      "integrity": "sha512-7NzBL0rN6fMUW+f7A6Io4h40qQlG+xGmtMxfbnH/K7TAtt8JQWVQK+6g0UXKMeVJoyV5EkkNsErQ8pVD3bLHbA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": "^12.17.0 || ^14.13 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/ora/node_modules/cli-spinners": {
      "version": "3.4.0",
      "resolved": "https://registry.npmjs.org/cli-spinners/-/cli-spinners-3.4.0.tgz",
      "integrity": "sha512-bXfOC4QcT1tKXGorxL3wbJm6XJPDqEnij2gQ2m7ESQuE+/z9YFIWnl/5RpTiKWbMq3EVKR4fRLJGn6DVfu0mpw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=18.20"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora/node_modules/is-interactive": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-interactive/-/is-interactive-2.0.0.tgz",
      "integrity": "sha512-qP1vozQRI+BMOPcjFzrjXuQvdak2pHNUMZoeG2eRbiSqyvbEf/wQtEOTOX1guk6E3t36RkaqiSt8A/6YElNxLQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora/node_modules/is-unicode-supported": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-2.1.0.tgz",
      "integrity": "sha512-mE00Gnza5EEB3Ds0HfMyllZzbBrmLOX3vfWoj9A9PEnTfratQ/BcaJOuMhnkhjXvb2+FkY3VuHqtAGpTPmglFQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ora/node_modules/log-symbols": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-7.0.1.tgz",
      "integrity": "sha512-ja1E3yCr9i/0hmBVaM0bfwDjnGy8I/s6PP4DFp+yP+a+mrHO4Rm7DtmnqROTUkHIkqffC84YY7AeqX6oFk0WFg==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "is-unicode-supported": "^2.0.0",
        "yoctocolors": "^2.1.1"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ordered-binary": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/ordered-binary/-/ordered-binary-1.6.2.tgz",
      "integrity": "sha512-BY+qgDArmYpvvmij141xbkB4Cw8RFLBQM5Zj4MODFb1SyXBRE/xO4Xj/QWbR7aUEBxbkjuNdsFVCL2TmbYrlNg==",
      "dev": true,
      "license": "MIT",
      "optional": true
    },
    "node_modules/oxc-parser": {
      "version": "0.150.0",
      "resolved": "https://registry.npmjs.org/oxc-parser/-/oxc-parser-0.150.0.tgz",
      "integrity": "sha512-zwajKw1GUa57IOdafIS7/yOObGF2NihwIfZfs5yJTRprMSkiwhWOc/k+n8bwnUPbHr2/XsjfBO8KyTPaW3VpWg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@oxc-project/types": "^0.150.0"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/oxc-project"
      },
      "optionalDependencies": {
        "@oxc-parser/binding-android-arm-eabi": "0.150.0",
        "@oxc-parser/binding-android-arm64": "0.150.0",
        "@oxc-parser/binding-darwin-arm64": "0.150.0",
        "@oxc-parser/binding-darwin-x64": "0.150.0",
        "@oxc-parser/binding-freebsd-x64": "0.150.0",
        "@oxc-parser/binding-linux-arm-gnueabihf": "0.150.0",
        "@oxc-parser/binding-linux-arm-musleabihf": "0.150.0",
        "@oxc-parser/binding-linux-arm64-gnu": "0.150.0",
        "@oxc-parser/binding-linux-arm64-musl": "0.150.0",
        "@oxc-parser/binding-linux-ppc64-gnu": "0.150.0",
        "@oxc-parser/binding-linux-riscv64-gnu": "0.150.0",
        "@oxc-parser/binding-linux-riscv64-musl": "0.150.0",
        "@oxc-parser/binding-linux-s390x-gnu": "0.150.0",
        "@oxc-parser/binding-linux-x64-gnu": "0.150.0",
        "@oxc-parser/binding-linux-x64-musl": "0.150.0",
        "@oxc-parser/binding-openharmony-arm64": "0.150.0",
        "@oxc-parser/binding-win32-arm64-msvc": "0.150.0",
        "@oxc-parser/binding-win32-ia32-msvc": "0.150.0",
        "@oxc-parser/binding-win32-x64-msvc": "0.150.0"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-json": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/parse-json/-/parse-json-5.2.0.tgz",
      "integrity": "sha512-ayCKvm/phCGxOkYRSCM82iDwct8/EonSEgCSxWxD7ve6jHggsFl4fZVQBPRNgQoKiuV/odhFrGzQXZwbifC8Rg==",
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.0.0",
        "error-ex": "^1.3.1",
        "json-parse-even-better-errors": "^2.3.0",
        "lines-and-columns": "^1.1.6"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parse-json/node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/parse-json/node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/parse-json/node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "license": "MIT"
    },
    "node_modules/parse-json/node_modules/lines-and-columns": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
      "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
      "license": "MIT"
    },
    "node_modules/parse5": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/parse5/-/parse5-8.0.1.tgz",
      "integrity": "sha512-z1e/HMG90obSGeidlli3hj7cbocou0/wa5HacvI3ASx34PecNjNQeaHNo5WIZpWofN9kgkqV1q5YvXe3F0FoPw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "entities": "^8.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/parse5-html-rewriting-stream": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/parse5-html-rewriting-stream/-/parse5-html-rewriting-stream-8.0.1.tgz",
      "integrity": "sha512-NaRku2aMpUN1Sh1Gyk1KWUh2A7EJx2c6qYzvwsPtqhoHoaURshdrceYK3LunVCm3WHhm6FS7Vcczbvdh3/UIVw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "entities": "^8.0.0",
        "parse5": "^8.0.0",
        "parse5-sax-parser": "^8.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/parse5-sax-parser": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/parse5-sax-parser/-/parse5-sax-parser-8.0.0.tgz",
      "integrity": "sha512-/dQ8UzHZwnrzs3EvDj6IkKrD/jIZyTlB+8XrHJvcjNgRdmWruNdN9i9RK/JtxakmlUdPwKubKPTCqvbTgzGhrw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parse5": "^8.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/path-type": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-type/-/path-type-4.0.0.tgz",
      "integrity": "sha512-gDKb8aZMDeD/tZWs9P6+q0J9Mwkdl6xMV8TjnGP3qJVJ06bdMgkbBlLU8IdfOsIsFz2BW1rNVT3XuNEl8zPAvw==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/piscina": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/piscina/-/piscina-5.3.2.tgz",
      "integrity": "sha512-vv7l/mM7B9WgrhDaudIqv1x6v4LOBRYYmpWGdWushhpbCmVHp11sUB2v4hj1CAeTGXVxuZFz6xOU1RalAiPKfQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=20.x"
      },
      "optionalDependencies": {
        "@napi-rs/nice": "^1.0.4"
      }
    },
    "node_modules/playwright": {
      "version": "1.63.0",
      "resolved": "https://registry.npmjs.org/playwright/-/playwright-1.63.0.tgz",
      "integrity": "sha512-+7ziBLidS4NaNCdt57SUDT+wYmmd5fmiQejUic/kb+YsYSCPyOOE9sebzMjNmQrsnNpDJqd4WHvV/8lfKfUDUg==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "playwright-core": "1.63.0"
      },
      "bin": {
        "playwright": "cli.js"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/playwright-core": {
      "version": "1.63.0",
      "resolved": "https://registry.npmjs.org/playwright-core/-/playwright-core-1.63.0.tgz",
      "integrity": "sha512-rYCsBF/M5HjUch52bbtVONEFjv6Xu8sm8h72dNlR5bzIE1fvC/bxgspzkjSfU+MweEMmPM8KJebG6nnyxo5mCg==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "playwright-core": "cli.js"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/portfinder": {
      "version": "1.0.38",
      "resolved": "https://registry.npmjs.org/portfinder/-/portfinder-1.0.38.tgz",
      "integrity": "sha512-rEwq/ZHlJIKw++XtLAO8PPuOQA/zaPJOZJ37BVuN97nLpMJeuDVLVGRwbFoBgLudgdTMP2hdRJP++H+8QOA3vg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async": "^3.2.6",
        "debug": "^4.3.6"
      },
      "engines": {
        "node": ">= 10.12"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.28",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.28.tgz",
      "integrity": "sha512-RRuzqDtt5Y9h3quz5hWhK+TPnsmVs6WwSU6LkJMeY4HstUEDuYTG8UJSdawMRzmzAtV+KEoG8N3Qg2qLy5vM/A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.18",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss-media-query-parser": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/postcss-media-query-parser/-/postcss-media-query-parser-0.2.3.tgz",
      "integrity": "sha512-3sOlxmbKcSHMjlUXQZKQ06jOswE7oVkXPxmZdoB1r5l0q6gTFTQSHxNxOrCccElbW7dxNytifNEo8qidX2Vsig==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/postcss-safe-parser": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/postcss-safe-parser/-/postcss-safe-parser-7.1.0.tgz",
      "integrity": "sha512-1WzZxRLaAFwEh6Do+zyGpjWV3nGJNxxhuh7Ubu/q1ICImMgZJnLwhoaEpRbG4pJppp2Y1ncL9ffA2f+LhrefQg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss-safe-parser"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=18.0"
      },
      "peerDependencies": {
        "postcss": "^8.4.31"
      }
    },
    "node_modules/postcss-value-parser": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/postcss-value-parser/-/postcss-value-parser-4.2.0.tgz",
      "integrity": "sha512-1NNCs6uurfkVbeXG4S8JFT9t19m45ICnif8zWLd5oPSZ50QnwMfK+H3jv408d4jw/7Bttv5axS5IiHoLaVNHeQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/prettier": {
      "version": "3.9.9",
      "resolved": "https://registry.npmjs.org/prettier/-/prettier-3.9.9.tgz",
      "integrity": "sha512-Z/CJHIkdujO/OtN7nXUii0Rf3VT5SRuhjBA82Xvu2XhBUgX3nhP67T0LHceBdQLex7OOFGTox+Q5Yg8Jk2Qivg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "prettier": "bin/prettier.cjs"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/prettier/prettier?sponsor=1"
      }
    },
    "node_modules/proxy-agent-negotiate": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/proxy-agent-negotiate/-/proxy-agent-negotiate-1.1.0.tgz",
      "integrity": "sha512-N8IBcM3UgCVzz2L2Lqv8DVntDnnC8/hiV4nEDUPkqq72TPUgYWjQc+bdZlBPZK9LzPAvOY//gAt0S0DApoOXWQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      },
      "peerDependencies": {
        "kerberos": "^2.0.0"
      },
      "peerDependenciesMeta": {
        "kerberos": {
          "optional": true
        }
      }
    },
    "node_modules/proxy-from-env": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-2.1.0.tgz",
      "integrity": "sha512-cJ+oHTW1VAEa8cJslgmUZrc+sjRKgAKl3Zyse6+PV38hZe/V6Z14TbCuXcan9F9ghlz4QrFr2c92TNF82UkYHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qified": {
      "version": "0.10.1",
      "resolved": "https://registry.npmjs.org/qified/-/qified-0.10.1.tgz",
      "integrity": "sha512-+Owyggi9IxT1ePKGafcI87ubSmxol6smwJ+RAHDQlx9+9cPwFWDiKFFCPuWhr9ignlGpZ9vDQLw67N4dcTVFEA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "hookified": "^2.1.1"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/qified/node_modules/hookified": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/hookified/-/hookified-2.2.0.tgz",
      "integrity": "sha512-p/LgFzRN5FeoD3DLS6bkUapeye6E4SI6yJs6KetENd18S+FBthqYq2amJUWpt5z0EQwwHemidjY5OqJGEKm5uA==",
      "dev": true,
      "license": "MIT",
      "peer": true
    },
    "node_modules/qs": {
      "version": "6.16.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.16.0.tgz",
      "integrity": "sha512-h6fhOIaRrID2CbEY2fqs+7t+UXZo+MLAnU5gRIq85uFtdiUPCdsApMlHhXogKVM4HM2DVbIjGNTTYH2OcmP1vA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "es-define-property": "^1.0.1",
        "side-channel": "^1.1.1"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/readdirp": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-5.1.1.tgz",
      "integrity": "sha512-Kko+Y5XQ6fM+Ce3dq3m9YGxnacYZYl9cA1wZjaF3Vbry2L3i1qVg8+CAgNPsXRArPMUMCaOR7oa9Nqntc43JKA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "type": "individual",
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/reflect-metadata": {
      "version": "0.2.2",
      "resolved": "https://registry.npmjs.org/reflect-metadata/-/reflect-metadata-0.2.2.tgz",
      "integrity": "sha512-urBwgfrvVP/eAyXx4hluJivBKzuEbSQs9rKWCrCkbSxNv8mxPcUZKeuoF3Uy4mJl3Lwprp6yy5/39VWigZ4K6Q==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/regenerate": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.5.0.tgz",
      "integrity": "sha512-1s+CxXjJ71i7LNVy8nYwg47XV4y6lAnOEhsMtSKq3WpmPfhl9LuKlTqKIn/3yUpE8lBz+W+TT88Bxyhnr0U4yw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/regenerate-unicode-properties": {
      "version": "10.3.0",
      "resolved": "https://registry.npmjs.org/regenerate-unicode-properties/-/regenerate-unicode-properties-10.3.0.tgz",
      "integrity": "sha512-9ns8odR8e9q3otKeHj3DE80jZYKg6zVeZKE+zQmRKXFoVUcuiTGeO6iusDhPRoIQQPVPRvH+SfBhrTud4eczuw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "regenerate": "^1.4.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/regexpu-core": {
      "version": "6.5.3",
      "resolved": "https://registry.npmjs.org/regexpu-core/-/regexpu-core-6.5.3.tgz",
      "integrity": "sha512-E8VgUoSK+LMQrLboDxavm76MTBGrQhx9RiNuomRmYnZ10Uw12HrI8fkxOOncktb2hBpzIZ9SV/347euQHG5z+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "regenerate": "^1.5.0",
        "regenerate-unicode-properties": "^10.3.0",
        "regjsgen": "^0.8.0",
        "regjsparser": "^0.13.0",
        "unicode-match-property-ecmascript": "^2.0.0",
        "unicode-match-property-value-ecmascript": "^2.2.1"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/regjsgen": {
      "version": "0.8.0",
      "resolved": "https://registry.npmjs.org/regjsgen/-/regjsgen-0.8.0.tgz",
      "integrity": "sha512-RvwtGe3d7LvWiDQXeQw8p5asZUmfU1G/l6WbUXeHta7Y2PEIvBTwH6E2EfmYUK8pxcxEdEmaomqyp0vZZ7C+3Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/regjsparser": {
      "version": "0.13.4",
      "resolved": "https://registry.npmjs.org/regjsparser/-/regjsparser-0.13.4.tgz",
      "integrity": "sha512-EWV80YgFaVgFrjGCAsV7oybp4GOxbls5RzBg8OB0nKEVXsBJR1JlV8Di1JhCROg3MzTfe1RI8yitIm1eOs68iA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "jsesc": "~3.1.0"
      },
      "bin": {
        "regjsparser": "bin/parser"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-from-string": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/require-from-string/-/require-from-string-2.0.2.tgz",
      "integrity": "sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/requires-port": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/requires-port/-/requires-port-1.0.0.tgz",
      "integrity": "sha512-KigOCHcocU3XODJxsu8i/j8T9tzT4adHiecwORRQ0ZZFcp7ahwXuRU1m+yuO90C5ZUyGeGfocHDI14M3L3yDAQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/resolve": {
      "version": "1.22.12",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.12.tgz",
      "integrity": "sha512-TyeJ1zif53BPfHootBGwPRYT1RUt6oGWsaQr8UyZW/eAm9bKoijtvruSDEmZHm92CwS9nj7/fWttqPCgzep8CA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "is-core-module": "^2.16.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/resolve.exports": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/resolve.exports/-/resolve.exports-2.0.3.tgz",
      "integrity": "sha512-OcXjMsGdhL4XnbShKpAcSqPMzQoYkYyhbEaeSko47MjRP9NfEQMhZkXL1DoFlt9LWQn4YttrdnV6X2OiyzBi+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/restore-cursor": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/restore-cursor/-/restore-cursor-5.1.0.tgz",
      "integrity": "sha512-oMA2dcrw6u0YfxJQXm342bFKX/E4sG9rbTzO9ptUcR/e8A33cHuvStiYOwH7fszkZlZ1z/ta9AAoPk2F4qIOHA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "onetime": "^7.0.0",
        "signal-exit": "^4.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/restore-cursor/node_modules/onetime": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/onetime/-/onetime-7.0.0.tgz",
      "integrity": "sha512-VXJjc87FScF88uafS3JllDgvAm+c/Slfz06lorj2uAY34rlUu0Nt+v8wreiImcrgAjjIHp1rXpTDlLOGw29WwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mimic-function": "^5.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/rolldown": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.2.8.tgz",
      "integrity": "sha512-Z67nTmhZe7anqnM/EjI392w5i/ANUinjip7QYsOyN37oayduxt3ksdX0hf5OOamkAd53BiIHfbfSzfUmzKFQqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@oxc-project/types": "=0.149.0",
        "@rolldown/pluginutils": "^1.0.0"
      },
      "bin": {
        "rolldown": "bin/cli.mjs"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "optionalDependencies": {
        "@rolldown/binding-android-arm-eabi": "1.2.8",
        "@rolldown/binding-android-arm64": "1.2.8",
        "@rolldown/binding-darwin-arm64": "1.2.8",
        "@rolldown/binding-darwin-x64": "1.2.8",
        "@rolldown/binding-freebsd-x64": "1.2.8",
        "@rolldown/binding-linux-arm-gnueabihf": "1.2.8",
        "@rolldown/binding-linux-arm64-gnu": "1.2.8",
        "@rolldown/binding-linux-arm64-musl": "1.2.8",
        "@rolldown/binding-linux-ppc64-gnu": "1.2.8",
        "@rolldown/binding-linux-s390x-gnu": "1.2.8",
        "@rolldown/binding-linux-x64-gnu": "1.2.8",
        "@rolldown/binding-linux-x64-musl": "1.2.8",
        "@rolldown/binding-openharmony-arm64": "1.2.8",
        "@rolldown/binding-win32-arm64-msvc": "1.2.8",
        "@rolldown/binding-win32-x64-msvc": "1.2.8"
      }
    },
    "node_modules/rolldown/node_modules/@oxc-project/types": {
      "version": "0.149.0",
      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.149.0.tgz",
      "integrity": "sha512-Efcc+iF0j3Bf67YjEqIqWXbX5XddXoK/Mw4K1/JuXwRCZ8N16VR7iT23nlCc9XrveFVh/E5Rqs2StT0V8v9LdA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/oxc-project"
      }
    },
    "node_modules/run-applescript": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/run-applescript/-/run-applescript-7.0.0.tgz",
      "integrity": "sha512-9by4Ij99JUr/MCFBUkDKLWK3G9HVXmabKz9U5MlIAIuvuzkiOicRYs8XJLxX+xahD+mLiiCYDqF9dKAgtzKP1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/rxjs": {
      "version": "7.8.2",
      "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-7.8.2.tgz",
      "integrity": "sha512-dhKf903U/PQZY6boNNtAGdWbG85WAbjT/1xYoZIC7FAY0yWapOBQVsVrDl58W86//e1VpMNBtRV4MaXfdMySFA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.1.0"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.1.2.tgz",
      "integrity": "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/sass": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass/-/sass-1.104.1.tgz",
      "integrity": "sha512-yDA+1aIG3EHgN4V/BvuhCvu61FF6hEd4e+9DxikUm9U0CAGuvdIZ/UYy7qbOxjhbbWQraoyLlMuzdRGOSV5Bmw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "chokidar": "^5.0.0",
        "immutable": "^5.1.5",
        "source-map-js": ">=0.6.2 <2.0.0"
      },
      "bin": {
        "sass": "sass.js"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "optionalDependencies": {
        "@parcel/watcher": "^2.4.1"
      }
    },
    "node_modules/sass-embedded": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded/-/sass-embedded-1.104.1.tgz",
      "integrity": "sha512-7LxbtPJ1MWKVbhzOnGx1sHTkHTcHVJ9hbgVsU29p/8gY1VeXt19fcJFr5xsx2f6zfrrR3FeOcYMt0uYDLAxpgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@bufbuild/protobuf": "^2.5.0",
        "colorjs.io": "^0.7.0",
        "immutable": "^5.1.5",
        "rxjs": "^7.4.0",
        "supports-color": "^8.1.1",
        "sync-child-process": "^1.0.2",
        "varint": "^6.0.0"
      },
      "bin": {
        "sass": "dist/bin/sass.js"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "optionalDependencies": {
        "sass-embedded-all-unknown": "1.104.1",
        "sass-embedded-android-arm": "1.104.1",
        "sass-embedded-android-arm64": "1.104.1",
        "sass-embedded-android-riscv64": "1.104.1",
        "sass-embedded-android-x64": "1.104.1",
        "sass-embedded-darwin-arm64": "1.104.1",
        "sass-embedded-darwin-x64": "1.104.1",
        "sass-embedded-linux-arm": "1.104.1",
        "sass-embedded-linux-arm64": "1.104.1",
        "sass-embedded-linux-musl-arm": "1.104.1",
        "sass-embedded-linux-musl-arm64": "1.104.1",
        "sass-embedded-linux-musl-riscv64": "1.104.1",
        "sass-embedded-linux-musl-x64": "1.104.1",
        "sass-embedded-linux-riscv64": "1.104.1",
        "sass-embedded-linux-x64": "1.104.1",
        "sass-embedded-unknown-all": "1.104.1",
        "sass-embedded-win32-arm64": "1.104.1",
        "sass-embedded-win32-x64": "1.104.1"
      }
    },
    "node_modules/sass-embedded-all-unknown": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-all-unknown/-/sass-embedded-all-unknown-1.104.1.tgz",
      "integrity": "sha512-toyMCyUKkT6DsYlHuKZGjd8T6WltaW4TGX07F7HnF4tNJM5m/8VaVsd74zrq3QSPqGE9JjxIDK4NrNc/QY9pkA==",
      "cpu": [
        "!arm",
        "!arm64",
        "!riscv64",
        "!x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "sass": "1.104.1"
      }
    },
    "node_modules/sass-embedded-android-arm": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-android-arm/-/sass-embedded-android-arm-1.104.1.tgz",
      "integrity": "sha512-g/XPAJYAzSSQZFP4xCdGD0HLKB4mf24cJ/+5Nls8rMool3jNkBv9+AFO4EV0b+RxN8rLcEsMccH1CR64yIFYcQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-android-arm64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-android-arm64/-/sass-embedded-android-arm64-1.104.1.tgz",
      "integrity": "sha512-yW3BVW4YFpN2vu2cVQ+Pz5JrRTvoIz36aCdo+J/Mo1A9gEN8eVPV/AL7aeZ803YdKgIitd3qw3pY4wpmT6TXNg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-android-riscv64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-android-riscv64/-/sass-embedded-android-riscv64-1.104.1.tgz",
      "integrity": "sha512-ZYY8oMKQS7Q/6FBoC8w3T16O3MucDe3xv8iKym41Nht5uvLCGGpm4fC4OF5nlv7wQkJv8oactYddGG3Wd0Rqkg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-android-x64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-android-x64/-/sass-embedded-android-x64-1.104.1.tgz",
      "integrity": "sha512-5WZKC4lSfjMIjzZdQUlYQUAV+UiatBhD8w28U7cYLLj4/dMgEPOBd4g3VMv0BwpgH2JOaycMS42dXq29W2bcDg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-darwin-arm64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-darwin-arm64/-/sass-embedded-darwin-arm64-1.104.1.tgz",
      "integrity": "sha512-oatuHzn0NsEg0d9Dcze6CuWUPvuETtMxRK4cv0eRAg7p6R0vHnv5GZRyWG6gEy3nc/ha/L+GtTasWVU82f4jrQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-darwin-x64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-darwin-x64/-/sass-embedded-darwin-x64-1.104.1.tgz",
      "integrity": "sha512-gql/5sHGzUTVwuHfM3QLCDeb6NYwen+LLj22gz81C2NKHF/4nUtDyh4N+fURWdT7J0/EhtMOd0+FLML3sGNP7g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-arm": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-arm/-/sass-embedded-linux-arm-1.104.1.tgz",
      "integrity": "sha512-WfmshPJOp9vUKxgp8wZ2ncaKBbyrlW9J51M2aUQHWECjMNxTULnGOHWSmD7FViXv4zwn1Co5FIFQUipW7RCxtA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": "glibc",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-arm64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-arm64/-/sass-embedded-linux-arm64-1.104.1.tgz",
      "integrity": "sha512-sVWUKXNTu8sP3X95Df0xo/t49Ce5IseTIMqXHxhFBKVmx7gf7kBWNLK0wH5ym+4khc+B5nNJPgq4IxpelG8tMQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": "glibc",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-musl-arm": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-musl-arm/-/sass-embedded-linux-musl-arm-1.104.1.tgz",
      "integrity": "sha512-k0cQ/CxBzFVYiQEObg6CpF6CUglkdEhi/DZgZXQbwC27kbGGY+fatmIs/cFPJL2z1ulACwoAr86RQUFzYvw5eg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": "musl",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-musl-arm64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-musl-arm64/-/sass-embedded-linux-musl-arm64-1.104.1.tgz",
      "integrity": "sha512-H7b+LzZ/w8pwNExInM8HDHraqvxCMdUc5ZRGU/aSJJhZ9HjeRKBjF3GxaisVHnx7o18j1l4VQ5cLBL9tTmNzZw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": "musl",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-musl-riscv64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-musl-riscv64/-/sass-embedded-linux-musl-riscv64-1.104.1.tgz",
      "integrity": "sha512-9DYdn4wfrkidjxJVtEd2iCx8HKdZe+uF82GDmrYEZhgu4NjVE6a4fQyW7OLwzn3erZMHKBaObBOH1d37DnXI1A==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": "musl",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-musl-x64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-musl-x64/-/sass-embedded-linux-musl-x64-1.104.1.tgz",
      "integrity": "sha512-5xz+nAr01b6yaRdrGVgE7lNvm1lGFjwNdUvnz+teidvHCbD5oTcbhrRVrnDoLHHvq5n3Jve9TzWaaHhezaEfHA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": "musl",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-riscv64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-riscv64/-/sass-embedded-linux-riscv64-1.104.1.tgz",
      "integrity": "sha512-oWryPJWTXK5adtlz/FD7wd2kS4I0CEgp6mWLUVb4oMFURMLz9bA9fO87D7lc4SV++lds7T51PU1kykCbOvNHMg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": "glibc",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-linux-x64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-linux-x64/-/sass-embedded-linux-x64-1.104.1.tgz",
      "integrity": "sha512-j/sX/yKTx/wJKepC5/ISlR6kPeSuHKThf76D2za5i2VnbHg0MN19jQq3WMorowR3kRghqt6azs3awogG+e7IRA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": "glibc",
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-unknown-all": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-unknown-all/-/sass-embedded-unknown-all-1.104.1.tgz",
      "integrity": "sha512-RaMsYZB5mRioL4qhoI7T5mmNb2OunakbPTJW2cuu3MeIULnGoxo7Wd5QKFxeQvF7sSQL57RuaQ+q9pH+/pQ9Fg==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "!android",
        "!darwin",
        "!linux",
        "!win32"
      ],
      "dependencies": {
        "sass": "1.104.1"
      }
    },
    "node_modules/sass-embedded-win32-arm64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-win32-arm64/-/sass-embedded-win32-arm64-1.104.1.tgz",
      "integrity": "sha512-fS6DL7lcnTPclqGLF4xRt8egZlFY9cU23d57ufbWqaUbCFu9JTu0+8qB4jMxfx1la6byi3GoSTfbnNOLfWv8sw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded-win32-x64": {
      "version": "1.104.1",
      "resolved": "https://registry.npmjs.org/sass-embedded-win32-x64/-/sass-embedded-win32-x64-1.104.1.tgz",
      "integrity": "sha512-/c4N2A93Ckms6DuRFVftKYISuI1tyC8gmlVJ8WaWFzgCBN/Swq2rARJIBUNeuxlmxjmYXfd3+2f/u887K63wbA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/sass-embedded/node_modules/supports-color": {
      "version": "8.1.1",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-8.1.1.tgz",
      "integrity": "sha512-MpUEN2OodtUzxvKQl72cUF7RQ5EiHsGvSsVG0ia9c5RbWGL2CI4C7EpPS8UTBIplnlzZiNuV56w+FuNxy3ty2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/supports-color?sponsor=1"
      }
    },
    "node_modules/secure-compare": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/secure-compare/-/secure-compare-3.0.1.tgz",
      "integrity": "sha512-AckIIV90rPDcBcglUwXPF3kg0P0qmPsPXAj6BBEENQE1p5yA1xfmDJzfi1Tappj37Pv2mVbKpL3Z1T+Nn7k1Qw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/signal-exit": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/sisteransi": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/sisteransi/-/sisteransi-1.0.5.tgz",
      "integrity": "sha512-bLGGlR1QxBcynn2d5YmDX4MGjlZvy2MRBDRNHLJ8VI6l6+9FUiyTFNJ0IveOSP0bcXgVDPRcfGqA0pjaqUpfVg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/slice-ansi": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/slice-ansi/-/slice-ansi-9.0.1.tgz",
      "integrity": "sha512-aBY19bn/XA+hKOKX0qL7Z0UfdBsbQvc9hn993U8ALUjzxCvDcuZqLoRXjGJrUARWAlwMnsRVD9sw2AFNOYvalA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^6.2.3",
        "is-fullwidth-code-point": "^5.1.0"
      },
      "engines": {
        "node": ">=22"
      },
      "funding": {
        "url": "https://github.com/chalk/slice-ansi?sponsor=1"
      }
    },
    "node_modules/slice-ansi/node_modules/ansi-styles": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.3.tgz",
      "integrity": "sha512-4Dj6M28JB+oAH8kFkTLUo+a2jwOFkuqb3yucU0CANcRRUbxS0cP0nZYCGjcc3BNXwRIsUVmDGgzawme7zvJHvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/slice-ansi/node_modules/is-fullwidth-code-point": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-5.1.0.tgz",
      "integrity": "sha512-5XHYaSyiqADb4RnZ1Bdad6cPp8Toise4TzEjcOYDHZkTCbKgiUl7WTUCpNWHuxmDt91wnsZBc9xinNzopv3JMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "get-east-asian-width": "^1.3.1"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/smol-toml": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/smol-toml/-/smol-toml-1.9.0.tgz",
      "integrity": "sha512-hpd+HLON7HdZXqYchMM/+LaTTbdK0AU3NngIJ4KVyWbY9bfQqdL9cD+4yf6dUoU2Ap4VsU0JkQi6FxAI1B2mXQ==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "url": "https://github.com/sponsors/cyyynthia"
      }
    },
    "node_modules/source-map": {
      "version": "0.8.0",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.8.0.tgz",
      "integrity": "sha512-d8EqvL+k/SOXCreS/SUzg2ciyHqBBLcN/yuRjFsbvVhHTE2pgei7oAhmPM7kWFbkX6OSMQfUq4KbkF3au9lhYQ==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">= 12"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.2.tgz",
      "integrity": "sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/source-map-support": {
      "version": "0.5.21",
      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.21.tgz",
      "integrity": "sha512-uBHU3L3czsIyYXKX88fdrGovxdSCoTGDRZ6SYXtSRxLZUzHg5P/66Ht6uoUlHu9EZod+inXhKo3qQgwXUT/y1w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/source-map-support/node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/stdin-discarder": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/stdin-discarder/-/stdin-discarder-0.3.2.tgz",
      "integrity": "sha512-eCPu1qRxPVkl5605OTWF8Wz40b4Mf45NY5LQmVPQ599knfs5QhASUm9GbJ5BDMDOXgrnh0wyEdvzmL//YMlw0A==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string_decoder/node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/string-width": {
      "version": "8.3.0",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-8.3.0.tgz",
      "integrity": "sha512-ZbmZM0JCihQN91dWnxoipT2KOEyHqEyfRXUyjuRhW8b/xnqPDoq4gWEVApTVa9db2wN8mmoikgFBbjh71+cGeQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "get-east-asian-width": "^1.5.0",
        "strip-ansi": "^7.1.2"
      },
      "engines": {
        "node": ">=20"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string-width/node_modules/ansi-regex": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.4.0.tgz",
      "integrity": "sha512-KzTVk2tCWAHtYrvvvaP8bJKJq2pVinhLcGEQdtLIYPbmNGNyYe8QwNaTUYQp2J7/vIsUKt5QCqAfUkYyG9DkOw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/string-width/node_modules/strip-ansi": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.2.0.tgz",
      "integrity": "sha512-yDPMNjp4WyfYBkHnjIRLfca1i6KMyGCtsVgoKe/z1+6vukgaENdgGBZt+ZmKPc4gavvEZ5OgHfHdrazhgNyG7w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^6.2.2"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sync-child-process": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/sync-child-process/-/sync-child-process-1.0.2.tgz",
      "integrity": "sha512-8lD+t2KrrScJ/7KXCSyfhT3/hRq78rC0wBFqNJXv3mZyn6hW2ypM05JmlSvtqRbeq6jqA94oHbxAr2vYsJ8vDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "sync-message-port": "^1.0.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/sync-message-port": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/sync-message-port/-/sync-message-port-1.2.0.tgz",
      "integrity": "sha512-gAQ9qrUN/UCypHtGFbbe7Rc/f9bzO88IwrG8TDo/aMKAApKyD6E3W4Cm0EfhfBb6Z6SKt59tTCTfD+n1xmAvMg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.3.3.tgz",
      "integrity": "sha512-gOhV3P7ufE62QDGg1zVaTgCR+EtPv92k2nIhVcVKcLmxT1sUBsQGhnZj175j+MqRt4zLF7ic+sCYjfhxMxj7YQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.3.3.tgz",
      "integrity": "sha512-uxc/zpqFg6x7C8vOE7lh6Lbda8eEL9zmVm/PLeTPBRhh1xCgdWaQ+J1CUieGpIfm2HdtsUpRv+HshiasBMcc6A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tar-stream": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/tar-stream/-/tar-stream-2.2.0.tgz",
      "integrity": "sha512-ujeqbceABgwMZxEJnk2HDY2DlnUZ+9oEcb1KzTVfYHio0UE6dG71n60d8D2I4qNvleWrrXpmjpt7vZeF1LnMZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "bl": "^4.0.3",
        "end-of-stream": "^1.4.1",
        "fs-constants": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.1.1"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tmp": {
      "version": "0.2.7",
      "resolved": "https://registry.npmjs.org/tmp/-/tmp-0.2.7.tgz",
      "integrity": "sha512-e0votIpp4Uo2AJYSzVHV6xCcawuiez3DzqDAbrTc3YxBkplN6e+dM13ZeIcZnDg/QpSuU2zfZ3rzwY8ukEnaXw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.14"
      }
    },
    "node_modules/ts-api-utils": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-2.5.0.tgz",
      "integrity": "sha512-OJ/ibxhPlqrMM0UiNHJ/0CKQkoKF243/AEmplt3qpRgkW8VG7IfOS41h7V8TjITqdByHzrjcS/2si+y4lIh8NA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.12"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4"
      }
    },
    "node_modules/tsconfig-paths": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-4.2.0.tgz",
      "integrity": "sha512-NoZ4roiN7LnbKn9QqE1amc9DJfzvZXxF4xDavcOWt1BPkdx+m+0gJuPM+S0vCe7zTJMYUP0R8pO2XMr+Y8oLIg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "json5": "^2.2.2",
        "minimist": "^1.2.6",
        "strip-bom": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/typescript": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-6.0.3.tgz",
      "integrity": "sha512-y2TvuxSZPDyQakkFRPZHKFm+KKVqIisdg9/CZwm9ftvKXLP8NRWj38/ODjNbr43SsoXqNuAisEf1GdCxqWcdBw==",
      "devOptional": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/unicode-canonical-property-names-ecmascript": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/unicode-canonical-property-names-ecmascript/-/unicode-canonical-property-names-ecmascript-2.0.1.tgz",
      "integrity": "sha512-dA8WbNeb2a6oQzAQ55YlT5vQAWGV9WXOsi3SskE3bcCdM0P4SDd+24zS/OCacdRq5BkdsRj9q3Pg6YyQoxIGqg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-match-property-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-match-property-ecmascript/-/unicode-match-property-ecmascript-2.0.0.tgz",
      "integrity": "sha512-5kaZCrbp5mmbz5ulBkDkbY0SsPOjKqVS35VpL9ulMPfSl0J0Xsm+9Evphv9CoIZFwre7aJoa94AY6seMKGVN5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "unicode-canonical-property-names-ecmascript": "^2.0.0",
        "unicode-property-aliases-ecmascript": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-match-property-value-ecmascript": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/unicode-match-property-value-ecmascript/-/unicode-match-property-value-ecmascript-2.2.1.tgz",
      "integrity": "sha512-JQ84qTuMg4nVkx8ga4A16a1epI9H6uTXAknqxkGF/aFfRLw1xC/Bp24HNLaZhHSkWd3+84t8iXnp1J0kYcZHhg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-property-aliases-ecmascript": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/unicode-property-aliases-ecmascript/-/unicode-property-aliases-ecmascript-2.2.0.tgz",
      "integrity": "sha512-hpbDzxUY9BFwX+UeBnxv3Sh1q7HFxj48DTmXchNgRa46lO8uj3/1iEn3MiNUYTg1g9ctIqXCCERn8gYZhHC5lQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/union": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/union/-/union-0.5.0.tgz",
      "integrity": "sha512-N6uOhuW6zO95P3Mel2I2zMsbsanvvtgn6jVqJv4vbVcz/JN0OkL9suomjQGmWtxJQXOCqUJvquc1sMeNz/IwlA==",
      "dev": true,
      "dependencies": {
        "qs": "^6.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.3.3.tgz",
      "integrity": "sha512-pJ2sYawQS0R/WI928Gj5GlPhTGzbMelq0+4INtSYNDV9ErKJcX6xjGWkoG/VnB3dpUm00zALaqkrUD77pO5TDQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "peer": true,
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/url-join": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/url-join/-/url-join-4.0.1.tgz",
      "integrity": "sha512-jk1+QP6ZJqyOiuEI9AEWQfju/nB2Pw466kbA0LEZljHwKeMgd9WrAEgEGxjPDD2+TNbbb37rTyhEfrCXfuKXnA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/varint": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/varint/-/varint-6.0.0.tgz",
      "integrity": "sha512-cXEIW6cfr15lFv563k4GuVuW/fiwjknytD37jIOLSdSWuOI6WnO/oKwmP2FQTU2l01LP8/M5TSAJpzUaGe3uWg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/verkit": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/verkit/-/verkit-0.3.2.tgz",
      "integrity": "sha512-zj/ob3UsvJGN0whEAKFp53REA5X66hvffVqoCtVQAakJKnKlH+/PcOfMoFwIG/o4rElqLv/ycAFlx8ZlXUorCg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.12.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sxzz"
      }
    },
    "node_modules/vite": {
      "version": "8.3.0",
      "resolved": "https://registry.npmjs.org/vite/-/vite-8.3.0.tgz",
      "integrity": "sha512-lhZBVvEHefgE+HQZC9O7EBJgCU/nVzFNl7vkS4RE0APtWLP02/8QVIkQtzBxPquh7lq5/78NHipTj7ODQ6XuyQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "lightningcss": "^1.33.0",
        "picomatch": "^4.0.7",
        "postcss": "^8.5.28",
        "rolldown": "~1.2.6",
        "tinyglobby": "^0.2.17"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "@vitejs/devtools": "^0.7.1",
        "esbuild": "^0.27.0 || ^0.28.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "@vitejs/devtools": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/wcwidth": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/wcwidth/-/wcwidth-1.0.1.tgz",
      "integrity": "sha512-XHPEwS0q6TaxcvG85+8EYkbiCux2XtWG2mkc47Ng2A77BQu9+DqIOJldST4HgPkuea7dvKSj5VgX3P1d4rW8Tg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "defaults": "^1.0.3"
      }
    },
    "node_modules/weak-lru-cache": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/weak-lru-cache/-/weak-lru-cache-1.2.2.tgz",
      "integrity": "sha512-DEAoo25RfSYMuTGc9vPJzZcZullwIqRDSI9LOy+fkCJPi6hykCnfKaXTuPBDuXAUcqHXyOgFtHNp/kB2FjYHbw==",
      "dev": true,
      "license": "MIT",
      "optional": true
    },
    "node_modules/whatwg-encoding": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-encoding/-/whatwg-encoding-2.0.0.tgz",
      "integrity": "sha512-p41ogyeMUrw3jWclHWTQg1k05DSVXPLcVxRTYsXUk+ZooOCZLcoYgPZ/HL/D/N+uQPOtcp1me1WhBEaX02mhWg==",
      "deprecated": "Use @exodus/bytes instead for a more spec-conformant and faster implementation",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "iconv-lite": "0.6.3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "license": "ISC",
      "peer": true,
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "10.0.2",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-10.0.2.tgz",
      "integrity": "sha512-6OLRNZqRntVGBm26ghZ5eZhCuWWyOkRCSn8XsOIuq5stpCE/tjLbdozd93naILZig0lmD8ANfRwnhn0DLeXGlg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^6.2.3",
        "string-width": "^8.2.0"
      },
      "engines": {
        "node": ">=20"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-styles": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.3.tgz",
      "integrity": "sha512-4Dj6M28JB+oAH8kFkTLUo+a2jwOFkuqb3yucU0CANcRRUbxS0cP0nZYCGjcc3BNXwRIsUVmDGgzawme7zvJHvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/xxhash-wasm": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/xxhash-wasm/-/xxhash-wasm-1.1.0.tgz",
      "integrity": "sha512-147y/6YNh+tlp6nd/2pWq38i9h6mz/EuQ6njIrmW8D1BS5nCqs0P6DG+m6zTGnNz5I+uhZ0SHxBs9BsPrwcKDA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yaml": {
      "version": "2.9.0",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.9.0.tgz",
      "integrity": "sha512-2AvhNX3mb8zd6Zy7INTtSpl1F15HW6Wnqj0srWlkKLcpYl/gMIMJiyuGq2KeI2YFxUPjdlB+3Lc10seMLtL4cA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "yaml": "bin.mjs"
      },
      "engines": {
        "node": ">= 14.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/eemeli"
      }
    },
    "node_modules/yargs": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-18.2.0.tgz",
      "integrity": "sha512-9OpKOLeaoNFecEp7P6iYbzze/5CqWoH7N3SMs/6y1XF4nMvFMspEGZzJ6uFi9MmQwXhyzqYoSEKO3tvA3Z/o2w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cliui": "^9.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "string-width": "^8.2.1",
        "y18n": "^5.0.5",
        "yargs-parser": "^22.0.0"
      },
      "engines": {
        "node": "^20.19.0 || ^22.12.0 || >=23"
      }
    },
    "node_modules/yargs-parser": {
      "version": "21.1.1",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz",
      "integrity": "sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yargs/node_modules/ansi-regex": {
      "version": "6.4.0",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.4.0.tgz",
      "integrity": "sha512-KzTVk2tCWAHtYrvvvaP8bJKJq2pVinhLcGEQdtLIYPbmNGNyYe8QwNaTUYQp2J7/vIsUKt5QCqAfUkYyG9DkOw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/yargs/node_modules/ansi-styles": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.3.tgz",
      "integrity": "sha512-4Dj6M28JB+oAH8kFkTLUo+a2jwOFkuqb3yucU0CANcRRUbxS0cP0nZYCGjcc3BNXwRIsUVmDGgzawme7zvJHvg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/yargs/node_modules/cliui": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-9.0.1.tgz",
      "integrity": "sha512-k7ndgKhwoQveBL+/1tqGJYNz097I7WOvwbmmU2AR5+magtbjPWQTS1C5vzGkBC8Ym8UWRzfKUzUUqFLypY4Q+w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "string-width": "^7.2.0",
        "strip-ansi": "^7.1.0",
        "wrap-ansi": "^9.0.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/yargs/node_modules/cliui/node_modules/string-width": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^10.3.0",
        "get-east-asian-width": "^1.0.0",
        "strip-ansi": "^7.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/yargs/node_modules/emoji-regex": {
      "version": "10.6.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-10.6.0.tgz",
      "integrity": "sha512-toUI84YS5YmxW219erniWD0CIVOo46xGKColeNQRgOzDorgBi1v4D71/OFzgD9GO2UGKIv1C3Sp8DAn0+j5w7A==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/yargs/node_modules/strip-ansi": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.2.0.tgz",
      "integrity": "sha512-yDPMNjp4WyfYBkHnjIRLfca1i6KMyGCtsVgoKe/z1+6vukgaENdgGBZt+ZmKPc4gavvEZ5OgHfHdrazhgNyG7w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^6.2.2"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/yargs/node_modules/wrap-ansi": {
      "version": "9.0.2",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-9.0.2.tgz",
      "integrity": "sha512-42AtmgqjV+X1VpdOfyTGOYRi0/zsoLqtXQckTmqTeybT+BDIbM/Guxo7x3pE2vtpr1ok6xRqM9OpBe+Jyoqyww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^6.2.1",
        "string-width": "^7.0.0",
        "strip-ansi": "^7.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/yargs/node_modules/wrap-ansi/node_modules/string-width": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^10.3.0",
        "get-east-asian-width": "^1.0.0",
        "strip-ansi": "^7.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/yargs/node_modules/yargs-parser": {
      "version": "22.0.0",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-22.0.0.tgz",
      "integrity": "sha512-rwu/ClNdSMpkSrUb+d6BRsSkLUq1fmfsY6TOpYzTwvwkg1/NRG85KBy3kq++A8LKQwX6lsu+aWad+2khvuXrqw==",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "^20.19.0 || ^22.12.0 || >=23"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/yoctocolors": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/yoctocolors/-/yoctocolors-2.2.0.tgz",
      "integrity": "sha512-xYqdZFUK/VYazNl/oCDYN+3WloWQwMfZxBoiNt6qNyk+xfOdi598muWE42rNZFp1kNOiqW936q5RhUdnpqElSg==",
      "dev": true,
      "license": "MIT",
      "peer": true,
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "4.6.5",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.6.5.tgz",
      "integrity": "sha512-v5l/aFXZQeai4awLbOpSoHecE9UiMrnfx75tEXLjNonXVARxQ5mOeipTjROUchszUNCqnE+hqAMujRsRHsut2Q==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    }
  }
}
````

## package.json (değişti)

````json
{
  "name": "kampusx",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": "^24.15.0"
  },
  "scripts": {
    "start": "nx serve shell",
    "build": "node scripts/build-production.cjs",
    "verify:production": "node scripts/verify-production-output.cjs",
    "typecheck": "node scripts/generate-environment.cjs && tsc --noEmit -p apps/shell/tsconfig.app.json",
    "configure:environment": "node scripts/generate-environment.cjs",
    "format": "prettier --write apps libs scripts *.json *.md *.cjs",
    "format:check": "prettier --check apps libs scripts *.json *.md *.cjs",
    "test": "node --test scripts/validators.test.cjs scripts/generate-environment.test.cjs scripts/auth-services.test.cjs scripts/auth-storage.test.cjs scripts/verify-production-output.test.cjs scripts/profile-services.test.cjs scripts/production-security.test.cjs scripts/social-services.test.cjs",
    "check:i18n": "node scripts/check-i18n.cjs",
    "test:ui": "playwright test",
    "test:security": "playwright test --config=playwright.security.config.cjs"
  },
  "dependencies": {
    "@angular/common": "22.2.1",
    "@angular/compiler": "22.2.1",
    "@angular/core": "22.2.1",
    "@angular/forms": "22.2.1",
    "@angular/platform-browser": "22.2.1",
    "@angular/router": "22.2.1",
    "@jsverse/transloco": "8.4.0",
    "@supabase/supabase-js": "^2.117.3",
    "rxjs": "7.8.2",
    "tslib": "^2.8.1"
  },
  "devDependencies": {
    "@angular/build": "22.2.1",
    "@angular/compiler-cli": "22.2.1",
    "@axe-core/playwright": "^4.10.2",
    "@nx/angular": "23.2.1",
    "@playwright/test": "^1.56.1",
    "@tailwindcss/postcss": "4.3.3",
    "autoprefixer": "^10.4.21",
    "nx": "23.2.1",
    "postcss": "^8.5.6",
    "prettier": "^3.6.2",
    "tailwindcss": "4.3.3",
    "typescript": "~6.0.0"
  },
  "overrides": {
    "nx": {
      "axios": "1.20.0",
      "brace-expansion": "5.0.12",
      "smol-toml": "1.9.0"
    }
  }
}
````

## playwright.security.config.cjs (eklendi)

````javascript
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './scripts/security',
  testMatch: '*.spec.cjs',
  outputDir: 'test-results-security',
  workers: 1,
  timeout: 30000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4400', browserName: 'chromium' },
  webServer: {
    command: 'node scripts/security/serve-production.cjs',
    url: 'http://127.0.0.1:4400',
    reuseExistingServer: false,
  },
});
````

## supabase/migrations/20261012174500_login_email_lookup.sql (değişti)

````text
-- HISTORICAL: superseded by 20261015180000_disable_login_email_lookup.sql.
-- Do not run this migration on its own; the latest migration disables public access.
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
````

## supabase/migrations/20261015180000_disable_login_email_lookup.sql (eklendi)

````text
-- 15 October 2026: generic credential errors replace public account discovery.
-- Run in Supabase SQL Editor as the project database owner.
-- Idempotent, including projects that never installed the legacy RPC.
-- No tables, users, files or rows are created, changed or deleted.
begin;
do $migration$
begin
  if to_regprocedure('public.kampusx_login_email_exists(text)') is not null then
    revoke execute on function public.kampusx_login_email_exists(text)
      from public, anon, authenticated;
  end if;
end
$migration$;
notify pgrst, 'reload schema';
commit;
````

## vercel.json (değişti)

````json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/apps/shell/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        {
          "key": "Content-Security-Policy",
          "value": "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
````
