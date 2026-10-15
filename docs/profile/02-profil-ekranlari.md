# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## apps/shell/src/app/features/profile/components/profile-header.component.css (eklendi)

````css
:host {
  display: contents;
}
.profile-toolbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 8px 16px;
  margin-bottom: -64px;
}
.toolbar-surface {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  backdrop-filter: blur(18px);
  transition: opacity var(--motion-fast) ease-out;
  z-index: -1;
  border-bottom: 1px solid var(--color-border);
}
.collapsed .toolbar-surface {
  opacity: 1;
}
.toolbar-identity {
  min-width: 0;
  flex: 1;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity var(--motion-fast) ease-out,
    transform var(--motion-fast) ease-out;
}
.collapsed .toolbar-identity {
  opacity: 1;
  transform: none;
}
.toolbar-identity strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 800;
}
.toolbar-identity span {
  font-size: 11px;
  color: var(--color-muted);
}
.profile-cover {
  width: 100%;
  aspect-ratio: 3/1;
  background: var(--color-surface-alt);
}
.profile-cover > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-cover-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(
    120deg,
    var(--color-soft-primary),
    var(--color-surface-alt),
    var(--color-soft-accent)
  );
}
.profile-cover-placeholder img {
  opacity: 0.22;
}
.profile-identity {
  padding: 0 24px 24px;
}
.large-avatar {
  display: block;
  position: relative;
  margin-top: -52px;
  width: 104px;
  height: 104px;
  border: 4px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-surface);
  padding: 0;
  cursor: pointer;
}
.camera-badge {
  position: absolute;
  display: grid;
  place-items: center;
  right: 0;
  bottom: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: 2px solid var(--color-surface);
}
.camera-badge kx-icon {
  transform: scale(0.72);
}
h1 {
  margin-top: 16px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.profile-username {
  color: var(--color-muted);
  font-size: 12px;
  margin-top: 4px;
}
.profile-bio {
  font-size: 14px;
  line-height: 1.7;
  margin-top: 16px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.profile-academic {
  display: grid;
  gap: 7px;
  margin-top: 20px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--color-muted);
}
.profile-academic p,
.profile-joined {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.profile-academic span {
  overflow-wrap: anywhere;
}
.profile-joined {
  margin-top: 14px;
  font-size: 12px;
  color: var(--color-muted);
  align-items: center;
}
.profile-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}
.profile-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: var(--color-muted);
  font-size: 12px;
}
.profile-counts strong {
  color: var(--color-text);
}
.profile-preferences {
  display: flex;
  align-items: center;
  gap: 8px;
}
.edit-profile {
  margin-top: 20px;
  width: 100%;
}
@media (max-width: 640px) {
  .profile-identity {
    padding-inline: 16px;
  }
  h1 {
    font-size: 20px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .toolbar-surface,
  .toolbar-identity {
    transition: none;
  }
}
````

## apps/shell/src/app/features/profile/components/profile-header.component.html (eklendi)

````html
<ng-container *transloco="let t">
  <header class="profile-toolbar" [class.collapsed]="collapsed()">
    <span class="toolbar-surface" aria-hidden="true"></span>
    <button
      kxIconButton
      type="button"
      [surface]="true"
      [attr.aria-label]="t('profile.back')"
      (click)="backRequested.emit()"
    >
      <kx-icon name="arrow_back" />
    </button>
    <div class="toolbar-identity" [attr.aria-hidden]="!collapsed()">
      <strong [title]="profile().fullName">{{ profile().fullName }}</strong
      ><span>{{ t('profile.postCount', { count: profile().postCount }) }}</span>
    </div>
    <button
      kxIconButton
      type="button"
      [surface]="true"
      aria-disabled="true"
      [attr.aria-label]="t('dashboard.nav.search')"
      [title]="t('dashboard.visualOnly')"
    >
      <kx-icon name="search" />
    </button>
  </header>
  <div class="profile-cover">
    @if (profile().coverUrl) {
      <img [src]="profile().coverUrl" [alt]="t('profile.coverAlt')" width="760" height="253" />
    } @else {
      <div class="profile-cover-placeholder" aria-hidden="true">
        <img src="assets/logo.svg" alt="" width="72" height="72" />
      </div>
    }
  </div>
  <section class="profile-identity">
    <button
      type="button"
      class="large-avatar"
      [attr.aria-label]="t(profile().avatarUrl ? 'profile.edit.avatar' : 'profile.addPhoto')"
      (click)="editRequested.emit()"
    >
      <kx-avatar [initials]="initials()" [src]="profile().avatarUrl" size="profile" />
      @if (!profile().avatarUrl) {
        <span class="camera-badge" aria-hidden="true"><kx-icon name="photo_camera" /></span>
      }
    </button>
    <h1 #name>{{ profile().fullName }}</h1>
    <p class="profile-username">{{ '@' + profile().username }}</p>
    @if (profile().bio) {
      <p class="profile-bio">{{ profile().bio }}</p>
    }
    <div class="profile-academic">
      <p>
        <kx-icon name="school" /><span>{{
          profile().university || t('dashboard.profile.schoolMissing')
        }}</span>
      </p>
      <p>
        <kx-icon name="apartment" /><span>{{ profile().faculty || t('profile.facultyMissing') }}</span>
      </p>
      <p>
        <kx-icon name="code" /><span>{{
          profile().department || t('dashboard.profile.departmentMissing')
        }}</span>
      </p>
    </div>
    <p class="profile-joined">
      <kx-icon name="calendar_month" />{{ t('profile.joined', { date: joined() }) }}
    </p>
    <div class="profile-meta-row">
      <div class="profile-counts">
        <span
          ><strong>{{ profile().followingCount | kxNumber }}</strong> {{ t('profile.following') }}</span
        ><span
          ><strong>{{ profile().followersCount | kxNumber }}</strong> {{ t('profile.followers') }}</span
        >
      </div>
      <div class="profile-preferences">
        <kx-language-switcher
          [touch]="true"
          [active]="language()"
          (changed)="languageChanged.emit($event)"
        /><kx-theme-toggle [touch]="true" [dark]="dark()" (changed)="themeChanged.emit()" />
      </div>
    </div>
    <button kxButton type="button" emphasis="outline" class="edit-profile" (click)="editRequested.emit()">
      {{ t('profile.edit.button') }}
    </button>
  </section>
</ng-container>
````

## apps/shell/src/app/features/profile/components/profile-header.component.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  ButtonComponent,
  IconButtonComponent,
  IconComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';
import { LocalizedNumberPipe, profileInitials } from '@kampusx/shared/util';
import type { Profile } from '../../../core/profile.model';
@Component({
  selector: 'kx-profile-header',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    ButtonComponent,
    IconButtonComponent,
    IconComponent,
    LocalizedNumberPipe,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css',
})
export class ProfileHeaderComponent {
  readonly profile = input.required<Profile>();
  readonly language = input('tr');
  readonly dark = input(false);
  readonly backRequested = output<void>();
  readonly editRequested = output<void>();
  readonly languageChanged = output<string>();
  readonly themeChanged = output<void>();
  readonly collapsed = signal(false);
  readonly initials = computed(() => profileInitials(this.profile().fullName));
  readonly joined = computed(() =>
    new Intl.DateTimeFormat(this.language() === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(this.profile().joinedAt)),
  );
  private readonly name = viewChild.required<ElementRef<HTMLElement>>('name');
  constructor() {
    const document = inject(DOCUMENT),
      destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.collapsed.set(!entry.isIntersecting && entry.boundingClientRect.top < 64);
        },
        { rootMargin: '-64px 0px 0px 0px' },
      );
      observer.observe(this.name().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
      document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
}
````

## apps/shell/src/app/features/profile/components/profile-post-list.component.ts (eklendi)

````typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent, SocialPostCardComponent } from '@kampusx/shared/ui';
import type { Profile, ProfilePost } from '../../../core/profile.model';
@Component({
  selector: 'kx-profile-post-list',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, SocialPostCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @for (post of posts(); track post.id) {
      <kx-social-post-card [post]="post" [author]="profile()" [language]="language()" />
    } @empty {
      <div class="empty-state">
        <kx-icon name="forum" />
        <h2>{{ t('profile.empty.title') }}</h2>
        <p>{{ t('profile.empty.text') }}</p>
      </div>
    }
  </ng-container>`,
  styles: `
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: var(--color-muted);
    }
    .empty-state kx-icon {
      color: var(--color-primary);
      margin-bottom: 16px;
    }
    h2 {
      font-size: 18px;
      font-weight: 800;
      color: var(--color-text);
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      line-height: 1.8;
    }
  `,
})
export class ProfilePostListComponent {
  readonly posts = input.required<readonly ProfilePost[]>();
  readonly profile = input.required<Profile>();
  readonly language = input('tr');
}
````

## apps/shell/src/app/features/profile/profile-edit.page.css (eklendi)

````css
:host {
  display: block;
}
.edit-page {
  min-height: 100dvh;
  background: var(--color-bg);
}
.edit-shell {
  width: min(100%, 760px);
  margin-inline: auto;
  min-height: 100dvh;
  border-inline: 1px solid var(--color-border);
  background: var(--color-surface);
  padding-bottom: calc(36px + env(safe-area-inset-bottom));
}
.edit-toolbar {
  position: sticky;
  top: 0;
  z-index: 40;
  min-height: 68px;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  backdrop-filter: blur(18px);
}
.edit-actions {
  display: flex;
  gap: 4px;
}
.edit-actions button {
  padding-inline: 10px;
  font-size: 12px;
}
.edit-toolbar h1 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 260px);
  max-width: 220px;
  text-align: center;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 800;
  outline-offset: 4px;
}
.avatar-zone {
  position: relative;
  margin-top: -52px;
  padding: 0 20px 68px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.image-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 36ch;
  font-size: 11px;
  line-height: 1.8;
  color: var(--color-muted);
}
.edit-fields {
  padding: 0 24px;
}
.edit-fields > kx-form-field {
  display: block;
  margin-bottom: 20px;
}
.save-error {
  min-height: 24px;
  font-size: 12px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.readonly-section {
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
}
.readonly-section h2 {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 18px;
}
.readonly-section label {
  display: block;
  font-size: 11px;
  color: var(--color-muted);
  margin: 16px 0 6px;
}
.readonly-section .kx-input {
  background: var(--color-surface-alt);
  color: var(--color-muted);
}
.readonly-section textarea {
  resize: none;
  padding: 12px 16px;
  height: auto;
  font-size: 12px;
  line-height: 1.6;
}
.readonly-section p {
  margin-top: 14px;
  font-size: 11px;
  line-height: 1.8;
  color: var(--color-muted);
}
.edit-preferences {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
@media (max-width: 640px) {
  .edit-fields {
    padding-inline: 16px;
  }
  .avatar-zone {
    padding-inline: 16px;
    gap: 16px;
  }
  .image-hint {
    max-width: 20ch;
  }
  .edit-toolbar h1 {
    font-size: 14px;
  }
}
````

## apps/shell/src/app/features/profile/profile-edit.page.html (eklendi)

````html
<div class="edit-page" *transloco="let t">
  <div class="edit-shell">
    <header class="edit-toolbar">
      <div class="edit-actions">
        <button kxButton type="button" emphasis="ghost" [disabled]="saving()" (click)="cancel()">
          {{ t('profile.edit.cancel') }}</button
        ><button
          kxButton
          type="submit"
          form="profile-edit-form"
          [disabled]="!hasChanges() || uploading() || profiles.loading() || !!profiles.readError()"
          [busy]="saving()"
        >
          {{ t('profile.edit.save') }}
        </button>
      </div>
      <h1 #title tabindex="-1">{{ t('profile.edit.heading') }}</h1>
    </header>
    <form
      id="profile-edit-form"
      [formGroup]="form"
      novalidate
      (ngSubmit)="save()"
      [attr.aria-busy]="saving() || uploading()"
    >
      <kx-image-picker
        mode="cover"
        pickerId="profile-cover-file"
        labelKey="profile.edit.cover"
        [imageUrl]="cover()"
        [busy]="coverBusy() || saving()"
        [errorKey]="coverError()"
        (selected)="selectImage('cover',$event)"
        (removed)="removeImage('cover')"
      />
      <div class="avatar-zone">
        <kx-image-picker
          mode="avatar"
          pickerId="profile-avatar-file"
          labelKey="profile.edit.avatar"
          [imageUrl]="avatar()"
          [initials]="initials()"
          [busy]="avatarBusy() || saving()"
          [errorKey]="avatarError()"
          (selected)="selectImage('avatar',$event)"
          (removed)="removeImage('avatar')"
        />
        <p class="image-hint"><kx-icon name="info" />{{ t('profile.edit.imageHint') }}</p>
      </div>
      <div class="edit-fields">
        <kx-form-field
          fieldId="profile-name"
          labelKey="profile.edit.name"
          placeholderKey="profile.edit.name"
          autocomplete="name"
          [control]="form.controls.fullName"
          [floating]="true"
          [maxLength]="50"
        /><kx-form-field
          fieldId="profile-bio"
          labelKey="profile.edit.bio"
          placeholderKey="profile.edit.bio"
          [control]="form.controls.bio"
          [floating]="true"
          [multiline]="true"
          [maxLength]="160"
        />
        <p class="image-hint">{{t('media.publicHint')}}</p>
        <p class="save-error error-text" role="alert">
          {{ (error() || profiles.readError()) ? t(error() || profiles.readError()) : '' }}
        </p>
        @if (profiles.readError()) {<button
          kxButton
          type="button"
          emphasis="outline"
          [disabled]="profiles.loading()"
          (click)="retryRead()"
        >
          {{t('media.retry')}}</button
        >}
        <section class="readonly-section" [attr.aria-label]="t('profile.edit.readonly')">
          <h2>{{ t('profile.edit.readonly') }}</h2>
          <label for="profile-username">{{ t('profile.edit.username') }}</label
          ><input kxInput id="profile-username" readonly [value]="'@'+baseline().username" />
          <label for="profile-university">{{ t('profile.edit.university') }}</label
          ><textarea
            id="profile-university"
            class="kx-input resize-none"
            rows="2"
            readonly
            [value]="baseline().university || t('dashboard.profile.schoolMissing')"
          ></textarea>
          <label for="profile-faculty">{{ t('profile.edit.faculty') }}</label
          ><textarea
            id="profile-faculty"
            class="kx-input resize-none"
            rows="2"
            readonly
            [value]="baseline().faculty || t('profile.facultyMissing')"
          ></textarea>
          <label for="profile-department">{{ t('profile.edit.department') }}</label
          ><textarea
            id="profile-department"
            class="kx-input resize-none"
            rows="2"
            readonly
            [value]="baseline().department || t('dashboard.profile.departmentMissing')"
          ></textarea>
          <p>{{ t('profile.edit.readonlyHint') }}</p>
        </section>
        <div class="edit-preferences">
          <kx-language-switcher
            [touch]="true"
            [active]="language.language()"
            (changed)="language.set($event)"
          /><kx-theme-toggle [touch]="true" [dark]="theme.dark()" (changed)="theme.toggle()" />
        </div>
      </div>
    </form>
    <kx-confirm-dialog
      #confirmation
      dialogId="profile-discard"
      titleKey="profile.edit.discardTitle"
      bodyKey="profile.edit.discardText"
      cancelKey="profile.edit.keepEditing"
      confirmKey="profile.edit.discard"
    />
  </div>
</div>
````

## apps/shell/src/app/features/profile/profile-edit.page.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  IconComponent,
  ImagePickerComponent,
  InputDirective,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';
import { profileInitials, validateAndFocus } from '@kampusx/shared/util';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { ProfileError } from '../../core/profile.model';
import { MediaError } from '../../core/media.service';
import { NoticeService } from '../../core/notice.service';
import { LanguageService } from '../../core/language.service';
import { ThemeService } from '../../core/theme.service';
import { bindProfilePage } from './profile-page-context';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    IconComponent,
    ImagePickerComponent,
    InputDirective,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-edit.page.html',
  styleUrl: './profile-edit.page.css',
})
export class ProfileEditPage {
  readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeService);
  private readonly auth = inject(AuthService);
  private readonly epoch = this.auth.sessionEpoch();
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly baseline = signal(this.profiles.profile());
  readonly initials = computed(() => profileInitials(this.values()?.fullName || this.baseline().fullName));
  readonly form = new FormGroup({
    fullName: new FormControl(this.baseline().fullName, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        (control) => (String(control.value).trim() ? null : { required: true }),
      ],
    }),
    bio: new FormControl(this.baseline().bio || '', {
      nonNullable: true,
      validators: [Validators.maxLength(160)],
    }),
  });
  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly avatar = signal<string | null>(this.baseline().avatarUrl || null);
  readonly cover = signal<string | null>(this.baseline().coverUrl || null);
  readonly avatarBusy = signal(false);
  readonly coverBusy = signal(false);
  readonly avatarError = signal('');
  readonly coverError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  private revision = { avatar: 0, cover: 0 };
  readonly hasChanges = computed(
    () =>
      this.values()?.fullName?.trim() !== this.baseline().fullName ||
      this.values()?.bio?.trim() !== (this.baseline().bio || '') ||
      this.avatar() !== (this.baseline().avatarUrl || null) ||
      this.cover() !== (this.baseline().coverUrl || null),
  );
  readonly uploading = computed(() => this.avatarBusy() || this.coverBusy());
  private readonly confirmation = viewChild.required<ConfirmDialogComponent>('confirmation');
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');
  constructor() {
    bindProfilePage('profile.edit.title');
    const document = inject(DOCUMENT);
    afterNextRender(() => {
      document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
      this.title().nativeElement.focus({ preventScroll: true });
    });
    this.destroyRef.onDestroy(() => {
      this.profiles.releaseUpload(this.avatar());
      this.profiles.releaseUpload(this.cover());
    });
  }
  async selectImage(kind: 'avatar' | 'cover', file: File): Promise<void> {
    const revision = ++this.revision[kind];
    const busy = kind === 'avatar' ? this.avatarBusy : this.coverBusy,
      error = kind === 'avatar' ? this.avatarError : this.coverError,
      image = kind === 'avatar' ? this.avatar : this.cover;
    busy.set(true);
    error.set('');
    try {
      const url = await (kind === 'avatar'
        ? this.profiles.uploadAvatar(file)
        : this.profiles.uploadCover(file));
      if (this.destroyRef.destroyed || revision !== this.revision[kind]) {
        this.profiles.releaseUpload(url);
        return;
      }
      this.profiles.releaseUpload(image());
      image.set(url);
    } catch (reason) {
      if (!this.destroyRef.destroyed && revision === this.revision[kind])
        error.set(reason instanceof ProfileError ? reason.key : 'profile.errors.upload');
    } finally {
      if (!this.destroyRef.destroyed && revision === this.revision[kind]) busy.set(false);
    }
  }
  removeImage(kind: 'avatar' | 'cover'): void {
    const image = kind === 'avatar' ? this.avatar : this.cover,
      error = kind === 'avatar' ? this.avatarError : this.coverError;
    this.revision[kind]++;
    this.profiles.releaseUpload(image());
    image.set(null);
    error.set('');
  }
  async save(): Promise<void> {
    if (this.auth.sessionEpoch() !== this.epoch) return;
    if (this.saving() || this.uploading() || !this.hasChanges() || !validateAndFocus(this.form, this.host))
      return;
    this.saving.set(true);
    this.form.disable({ emitEvent: false });
    this.error.set('');
    try {
      const next = await this.profiles.updateProfile({
        ...this.form.getRawValue(),
        avatarUrl: this.avatar(),
        coverUrl: this.cover(),
      });
      if (this.destroyRef.destroyed) return;
      this.baseline.set(next);
      this.avatar.set(next.avatarUrl || null);
      this.cover.set(next.coverUrl || null);
      this.form.setValue({ fullName: next.fullName, bio: next.bio || '' });
      this.notices.show('profile.saved');
      if (!(await this.router.navigateByUrl('/profile'))) this.error.set('profile.errors.navigation');
    } catch (reason) {
      if (!this.destroyRef.destroyed)
        this.error.set(
          reason instanceof ProfileError || reason instanceof MediaError ? reason.key : 'profile.errors.save',
        );
    } finally {
      if (!this.destroyRef.destroyed) {
        this.form.enable({ emitEvent: false });
        this.saving.set(false);
      }
    }
  }
  async retryRead(): Promise<void> {
    const before = this.baseline();
    await this.profiles.reload();
    if (this.destroyRef.destroyed || this.profiles.readError()) return;
    const next = this.profiles.profile();
    if (this.avatar() === (before.avatarUrl || null)) this.avatar.set(next.avatarUrl || null);
    if (this.cover() === (before.coverUrl || null)) this.cover.set(next.coverUrl || null);
    this.baseline.set(next);
  }
  cancel(): void {
    if (!this.saving()) void this.router.navigateByUrl('/profile');
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || this.auth.sessionEpoch() !== this.epoch) return true;
    if (this.saving() && this.hasChanges()) return false;
    return this.hasChanges() || this.uploading() ? this.confirmation().ask() : true;
  }
}
````

## apps/shell/src/app/features/profile/profile-page-context.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
export function bindProfilePage(titleKey: string): void {
  const auth = inject(AuthService),
    router = inject(Router),
    document = inject(DOCUMENT),
    i18n = inject(TranslocoService),
    destroyRef = inject(DestroyRef);
  const epoch = auth.sessionEpoch();
  effect(() => {
    if (auth.initialized() && (!auth.session() || auth.sessionEpoch() !== epoch))
      void router.navigateByUrl('/auth/login', { replaceUrl: true });
  });
  i18n
    .selectTranslate(titleKey)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((title) => (document.title = title));
  destroyRef.onDestroy(() => (document.title = i18n.translate('common.title')));
}
````

## apps/shell/src/app/features/profile/profile.page.css (eklendi)

````css
:host {
  display: block;
}
.profile-page {
  min-height: 100dvh;
  background: var(--color-bg);
}
.profile-shell {
  width: min(100%, 760px);
  margin-inline: auto;
  border-inline: 1px solid var(--color-border);
  background: var(--color-surface);
  min-height: 100dvh;
  padding-bottom: calc(108px + env(safe-area-inset-bottom));
}
.profile-tabs {
  position: sticky;
  top: 64px;
  z-index: 30;
  background: var(--color-surface);
}
.profile-feed {
  min-height: 480px;
  touch-action: pan-y pinch-zoom;
  outline-offset: -4px;
}
.compose-fab {
  position: fixed;
  z-index: 35;
  bottom: calc(100px + env(safe-area-inset-bottom));
  right: max(20px, calc((100vw - 760px) / 2 + 20px));
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-panel);
}
.compose-fab:hover {
  background: var(--color-primary);
}
````

## apps/shell/src/app/features/profile/profile.page.html (eklendi)

````html
<div class="profile-page" *transloco="let t">
  <div class="profile-shell">
    <kx-profile-header
      [profile]="profiles.profile()"
      [language]="language.language()"
      [dark]="theme.dark()"
      (backRequested)="back()"
      (editRequested)="edit()"
      (languageChanged)="language.set($event)"
      (themeChanged)="theme.toggle()"
    />
    <div class="profile-tabs">
      <kx-tab-strip
        baseId="profile-feed"
        labelKey="profile.tabs.label"
        [items]="tabs"
        [active]="active()"
        [scrollable]="true"
        (selected)="active.set($event)"
      />
    </div>
    @if (profiles.readError()) {
    <p class="info-message" role="alert">
      {{t(profiles.readError())}}<button
        kxButton
        emphasis="ghost"
        type="button"
        (click)="profiles.reload()"
        [disabled]="profiles.loading()"
      >
        {{t('media.retry')}}
      </button>
    </p>
    }
    <div
      #viewport
      class="profile-feed"
      role="tabpanel"
      [id]="'profile-feed-panel-'+tabs[active()].id"
      [attr.aria-labelledby]="'profile-feed-tab-'+tabs[active()].id"
      tabindex="0"
      (pointerdown)="pointerDown($event)"
      (pointerup)="pointerUp($event)"
      (pointercancel)="cancelSwipe()"
    >
      @if (postsApi.error()) {
      <p class="info-message" role="alert">
        {{t(postsApi.error())}}
        <button
          kxButton
          emphasis="ghost"
          type="button"
          (click)="postsApi.load()"
          [disabled]="postsApi.loading()"
        >
          {{t('media.retry')}}
        </button>
      </p>
      } @else if (postsApi.loading() && !posts().length) {
      <p class="info-message" role="status">{{t('posts.loading')}}</p>
      } @else {
      <kx-profile-post-list
        [posts]="posts()"
        [profile]="profiles.profile()"
        [language]="language.language()"
      />
      }
    </div>
    <button
      kxIconButton
      type="button"
      class="compose-fab"
      (click)="compose()"
      [attr.aria-label]="t('profile.compose')"
      [title]="t('profile.compose')"
    >
      <kx-icon name="add" />
    </button>
    <kx-dashboard-bottom-nav [homeEnabled]="true" [currentHome]="false" />
  </div>
</div>
````

## apps/shell/src/app/features/profile/profile.page.ts (eklendi)

````typescript
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, IconButtonComponent, IconComponent, TabStripComponent } from '@kampusx/shared/ui';
import { PostsService } from '../../core/posts.service';
import { filterProfilePosts, horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';
import { ProfileService } from '../../core/profile.service';
import { LanguageService } from '../../core/language.service';
import { ThemeService } from '../../core/theme.service';
import { DashboardBottomNavComponent } from '../dashboard/bottom-nav/bottom-nav.component';
import { ProfileHeaderComponent } from './components/profile-header.component';
import { ProfilePostListComponent } from './components/profile-post-list.component';
import { bindProfilePage } from './profile-page-context';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ButtonComponent,
    IconButtonComponent,
    IconComponent,
    TabStripComponent,
    DashboardBottomNavComponent,
    ProfileHeaderComponent,
    ProfilePostListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage {
  readonly profiles = inject(ProfileService);
  readonly postsApi = inject(PostsService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly active = signal(0);
  readonly posts = computed(() => filterProfilePosts(this.profiles.posts(), this.active()));
  readonly tabs = [
    { id: 'posts', labelKey: 'profile.tabs.posts' },
    { id: 'replies', labelKey: 'profile.tabs.replies' },
    { id: 'retweets', labelKey: 'profile.tabs.retweets' },
  ];
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private swipe: SwipePoint | null = null;
  constructor() {
    bindProfilePage('profile.title');
  }
  edit(): void {
    void this.router.navigateByUrl('/profile/edit');
  }
  compose(): void {
    void this.router.navigateByUrl('/compose');
  }
  back(): void {
    void this.router.navigateByUrl('/dashboard');
  }
  pointerDown(event: PointerEvent): void {
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) {
      this.swipe = null;
      return;
    }
    this.swipe = swipePoint(event);
    this.viewport().nativeElement.setPointerCapture(event.pointerId);
  }
  pointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction) this.active.set(Math.max(0, Math.min(2, this.active() + direction)));
  }
  cancelSwipe(): void {
    this.swipe = null;
  }
}
````
