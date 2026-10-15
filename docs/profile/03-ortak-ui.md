# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## libs/shared/ui/atoms/avatar/avatar.component.css (değişti)

````css
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
.avatar-profile {
  width: 96px;
  height: 96px;
  font-size: 34px;
}
.avatar {
  overflow: hidden;
}
.avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
````

## libs/shared/ui/atoms/avatar/avatar.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'kx-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="avatar"
    [class.avatar-large]="size() === 'large'"
    [class.avatar-profile]="size() === 'profile'"
    aria-hidden="true"
  >
    @if (src() && !imageFailed()) {
      <img [src]="src()" alt="" width="96" height="96" (error)="imageFailed.set(true)" />
    } @else {
      {{ initials() }}
    }
  </span>`,
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  readonly initials = input.required<string>();
  readonly size = input<'small' | 'large' | 'profile'>('small');
  readonly src = input<string>();
  readonly imageFailed = signal(false);
  constructor() {
    effect(() => {
      this.src();
      this.imageFailed.set(false);
    });
  }
}
````

## libs/shared/ui/atoms/icon-button/icon-button.component.css (eklendi)

````css
:host {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: transform var(--motion-fast) ease-out;
}
:host(.icon-button-surface) {
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border-color: var(--color-border);
}
:host(:hover) {
  background: var(--color-surface-alt);
}
:host(:active) {
  transform: scale(0.95);
}
:host(:disabled),
:host([aria-disabled='true']) {
  cursor: default;
}
@media (prefers-reduced-motion: reduce) {
  :host {
    transition: none;
  }
}
````

## libs/shared/ui/atoms/icon-button/icon-button.component.ts (eklendi)

````typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'button[kxIconButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './icon-button.component.css',
  host: { class: 'kx-icon-button', '[class.icon-button-surface]': 'surface()', '[disabled]': 'disabled()' },
})
export class IconButtonComponent {
  readonly surface = input(false);
  readonly disabled = input(false);
}
````

## libs/shared/ui/index.ts (değişti)

````typescript
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
export * from './atoms/icon-button/icon-button.component';
export * from './molecules/image-picker/image-picker.component';
export * from './molecules/toast/toast.component';
export * from './organisms/confirm-dialog/confirm-dialog.component';
export * from './organisms/social-post-card/social-post-card.component';
````

## libs/shared/ui/molecules/form-field/form-field.component.css (eklendi)

````css
.form-field.field-floating {
  position: relative;
}
.field-floating > label {
  position: absolute;
  top: 12px;
  left: 16px;
  z-index: 1;
  margin: 0;
  font-size: 11px;
  color: var(--color-muted);
  line-height: 1.5;
}
.field-floating .kx-input {
  height: 68px;
  padding: 30px 16px 10px;
}
.field-floating textarea.kx-input {
  height: auto;
  min-height: 144px;
  resize: none;
}
.field-counter {
  text-align: right;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
}
.field-floating .field-message {
  padding-right: 68px;
}
.field-floating .field-counter {
  position: absolute;
  bottom: 0;
  right: 0;
}
````

## libs/shared/ui/molecules/form-field/form-field.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { validationKey } from '@kampusx/shared/util';
import { InputDirective } from '../../atoms/input/input.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, InputDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-field.component.css',
  template: `<div class="form-field" *transloco="let t" [class.field-floating]="floating()">
    <label [for]="fieldId()">{{ t(labelKey()) }}</label>
    <div class="input-wrap">
      @if (!floating()) {
        <kx-icon [name]="icon()" />
      }
      @if (multiline()) {
        <textarea
          class="kx-input"
          [id]="fieldId()"
          [formControl]="control()"
          [attr.maxlength]="maxLength() || null"
          [attr.aria-invalid]="control().touched && control().invalid"
          [attr.aria-describedby]="fieldId() + '-message ' + fieldId() + '-counter'"
          rows="4"
        ></textarea>
      } @else {
        <input
          kxInput
          [id]="fieldId()"
          [type]="type()"
          [formControl]="control()"
          [placeholder]="floating() ? ' ' : t(placeholderKey())"
          [attr.maxlength]="maxLength() || null"
          [autocomplete]="autocomplete()"
          [attr.aria-invalid]="control().touched && control().invalid"
          [attr.aria-describedby]="fieldId() + '-message' + (maxLength() ? ' ' + fieldId() + '-counter' : '')"
          [class.input-valid]="control().touched && control().valid"
        />
      }
    </div>
    <p
      class="field-message"
      [class.error-text]="!!errorKey()"
      [id]="fieldId() + '-message'"
      aria-live="polite"
    >
      {{ errorKey() ? t(errorKey(), { max: maxLength() }) : hintKey() ? t(hintKey()) : '' }}
    </p>
    @if (maxLength()) {
      <p
        class="field-counter"
        [id]="fieldId() + '-counter'"
        [attr.aria-label]="t('common.characterCount', { count: count(), max: maxLength() })"
      >
        {{ count() }} / {{ maxLength() }}
      </p>
    }
  </div>`,
})
export class FormFieldComponent {
  readonly fieldId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly placeholderKey = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly icon = input('alternate_email');
  readonly hintKey = input('');
  readonly floating = input(false);
  readonly multiline = input(false);
  readonly maxLength = input(0);
  private readonly revision = signal(0);
  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() => this.revision.update((value) => value + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }
  count(): number {
    this.revision();
    return this.control().value.length;
  }
  errorKey() {
    this.revision();
    return validationKey(this.control());
  }
}
````

## libs/shared/ui/molecules/image-picker/image-picker.component.css (eklendi)

````css
:host {
  display: block;
}
.picker {
  position: relative;
}
.cover-picker {
  aspect-ratio: 3 / 1;
  background: var(--color-surface-alt);
}
.cover-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-primary);
  background: linear-gradient(
    120deg,
    var(--color-soft-primary),
    var(--color-surface-alt),
    var(--color-soft-accent)
  );
}
.cover-placeholder kx-icon {
  transform: scale(2);
  opacity: 0.45;
}
.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.avatar-picker {
  width: 104px;
  border: 4px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-surface);
}
.choose-image {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.choose-image:active {
  transform: translate(-50%, -50%) scale(0.95);
}
.avatar-picker .choose-image {
  left: auto;
  top: auto;
  right: -8px;
  bottom: -8px;
  transform: none;
}
.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
}
.avatar-picker .remove-image {
  top: -8px;
  right: -8px;
}
.picker-error {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  width: max(100%, 260px);
  max-width: calc(100vw - 40px);
  font-size: 12px;
  line-height: 1.6;
}
.cover-picker .picker-error {
  padding-inline: 16px;
  top: auto;
  bottom: 10px;
  width: 100%;
  background: var(--color-surface);
}
````

## libs/shared/ui/molecules/image-picker/image-picker.component.ts (eklendi)

````typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
@Component({
  selector: 'kx-image-picker',
  standalone: true,
  imports: [TranslocoDirective, AvatarComponent, IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './image-picker.component.css',
  template: `<div
    *transloco="let t"
    class="picker"
    [class.cover-picker]="mode() === 'cover'"
    [class.avatar-picker]="mode() === 'avatar'"
    [attr.aria-busy]="busy()"
  >
    @if (mode() === 'avatar') {
      <kx-avatar [initials]="initials()" [src]="imageUrl() || undefined" size="profile" />
    } @else if (imageUrl()) {
      <img class="cover-preview" [src]="imageUrl()" [alt]="t('profile.coverAlt')" width="760" height="253" />
    } @else {
      <div class="cover-placeholder" aria-hidden="true"><kx-icon name="school" /></div>
    }
    <input
      #file
      class="sr-only"
      type="file"
      tabindex="-1"
      [id]="pickerId()"
      accept="image/jpeg,image/png,image/webp"
      [disabled]="busy()"
      [attr.aria-label]="t(labelKey())"
      [attr.aria-describedby]="pickerId() + '-help ' + pickerId() + '-error'"
      (change)="onFile($event)"
    />
    <button
      kxIconButton
      type="button"
      [surface]="true"
      [disabled]="busy()"
      class="choose-image"
      [attr.aria-label]="t(labelKey())"
      [attr.aria-describedby]="pickerId() + '-help'"
      (click)="file.click()"
    >
      <kx-icon [name]="busy() ? 'hourglass_top' : 'photo_camera'" />
    </button>
    @if (imageUrl()) {
      <button
        kxIconButton
        type="button"
        [surface]="true"
        [disabled]="busy()"
        class="remove-image"
        [attr.aria-label]="t('profile.edit.removeImage')"
        (click)="removed.emit()"
      >
        <kx-icon name="close" />
      </button>
    }
    <p class="sr-only" [id]="pickerId() + '-help'">{{ t('profile.edit.imageHint') }}</p>
    <p class="picker-error error-text" [id]="pickerId() + '-error'" role="alert">
      {{ errorKey() ? t(errorKey()) : '' }}
    </p>
  </div>`,
})
export class ImagePickerComponent {
  readonly pickerId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly mode = input<'avatar' | 'cover'>('avatar');
  readonly initials = input('');
  readonly imageUrl = input<string | null>();
  readonly busy = input(false);
  readonly errorKey = input('');
  readonly selected = output<File>();
  readonly removed = output<void>();
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.selected.emit(file);
  }
}
````

## libs/shared/ui/molecules/language-switcher/language-switcher.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
@Component({
  selector: 'kx-language-switcher',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    class="language-switcher"
    [class.touch-controls]="touch()"
    *transloco="let t"
    role="group"
    [attr.aria-label]="t('common.language.label')"
  >
    @for (language of ['tr', 'en']; track language) {
      <button
        type="button"
        [attr.lang]="language"
        [attr.aria-label]="t('common.language.' + language)"
        [attr.aria-pressed]="active() === language"
        [class.active]="active() === language"
        (click)="changed.emit(language)"
      >
        {{ t('common.languageCode.' + language) }}
      </button>
    }
  </div>`,
  styles: `
    .touch-controls button {
      min-width: 44px;
      min-height: 44px;
    }
  `,
})
export class LanguageSwitcherComponent {
  readonly touch = input(false);
  readonly active = input('tr');
  readonly changed = output<string>();
}
````

## libs/shared/ui/molecules/tab-strip/tab-strip.component.css (değişti)

````css
:host {
  display: block;
}
.tab-scroll.scrollable {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
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
````

## libs/shared/ui/molecules/tab-strip/tab-strip.component.ts (değişti)

````typescript
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
  template: `<div class="tab-scroll" [class.scrollable]="scrollable()">
    <div
      class="tab-strip"
      *transloco="let t"
      role="tablist"
      [attr.aria-label]="t(labelKey())"
      [style.min-width.px]="scrollable() ? items().length * 140 : null"
    >
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
          (click)="select(index)"
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
    </div>
  </div>`,
  styleUrl: './tab-strip.component.css',
})
export class TabStripComponent {
  readonly items = input.required<readonly TabStripItem[]>();
  readonly active = input(0);
  readonly baseId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly selected = output<number>();
  readonly scrollable = input(false);
  private readonly tabs = viewChildren<ElementRef<HTMLButtonElement>>('tab');
  select(index: number): void {
    this.selected.emit(index);
    if (!this.scrollable()) return;
    const tab = this.tabs()[index]?.nativeElement;
    const scroll = tab?.parentElement?.parentElement;
    if (!tab || !scroll) return;
    if (tab.offsetLeft < scroll.scrollLeft) scroll.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > scroll.scrollLeft + scroll.clientWidth)
      scroll.scrollLeft = tab.offsetLeft + tab.offsetWidth - scroll.clientWidth;
  }

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
    this.select(next);
    this.tabs()[next]?.nativeElement.focus({ preventScroll: true });
  }
}
````

## libs/shared/ui/molecules/theme-toggle/theme-toggle.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ToggleComponent } from '../../atoms/toggle/toggle.component';
@Component({
  selector: 'kx-theme-toggle',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, ToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    kxToggle
    [class.touch-control]="touch()"
    type="button"
    *transloco="let t"
    [pressed]="dark()"
    (toggled)="changed.emit()"
    [attr.aria-label]="t(dark() ? 'common.lightTheme' : 'common.darkTheme')"
    [title]="t(dark() ? 'common.lightTheme' : 'common.darkTheme')"
  >
    <kx-icon [name]="dark() ? 'light_mode' : 'dark_mode'" />
  </button>`,
  styles: `
    .touch-control {
      min-width: 44px;
      min-height: 44px;
    }
  `,
})
export class ThemeToggleComponent {
  readonly touch = input(false);
  readonly dark = input(false);
  readonly changed = output<void>();
}
````

## libs/shared/ui/molecules/toast/toast.component.css (eklendi)

````css
:host {
  position: fixed;
  z-index: 60;
  bottom: calc(96px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: min(440px, calc(100% - 32px));
}
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-panel);
}
.toast > kx-icon {
  color: var(--color-success);
}
.toast p {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
}
````

## libs/shared/ui/molecules/toast/toast.component.ts (eklendi)

````typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
@Component({
  selector: 'kx-toast',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="toast" *transloco="let t" role="status" aria-live="polite">
    <kx-icon name="check_circle" />
    <p>{{ t(messageKey()) }}</p>
    <button kxIconButton type="button" [attr.aria-label]="t('common.close')" (click)="dismissed.emit()">
      <kx-icon name="close" />
    </button>
  </div>`,
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  readonly messageKey = input.required<string>();
  readonly dismissed = output<void>();
}
````

## libs/shared/ui/organisms/confirm-dialog/confirm-dialog.component.css (eklendi)

````css
dialog {
  margin: auto;
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-panel);
}
dialog::backdrop {
  background: color-mix(in srgb, var(--color-ink) 48%, transparent);
}
h2 {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 12px;
}
p {
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.7;
}
.actions {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}
.discard {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
````

## libs/shared/ui/organisms/confirm-dialog/confirm-dialog.component.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent } from '../../atoms/button/button.component';
@Component({
  selector: 'kx-confirm-dialog',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './confirm-dialog.component.css',
  template: `<dialog
    #dialog
    *transloco="let t"
    [attr.aria-labelledby]="dialogId() + '-title'"
    [attr.aria-describedby]="dialogId() + '-body'"
    (cancel)="cancel($event)"
  >
    <h2 [id]="dialogId() + '-title'">{{ t(titleKey()) }}</h2>
    <p [id]="dialogId() + '-body'">{{ t(bodyKey()) }}</p>
    <div class="actions">
      <button #keep kxButton type="button" emphasis="outline" (click)="finish(false)">
        {{ t(cancelKey()) }}</button
      ><button kxButton type="button" emphasis="outline" class="discard" (click)="finish(true)">
        {{ t(confirmKey()) }}
      </button>
    </div>
  </dialog>`,
})
export class ConfirmDialogComponent {
  readonly dialogId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly bodyKey = input.required<string>();
  readonly cancelKey = input.required<string>();
  readonly confirmKey = input.required<string>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly keep = viewChild.required<unknown, ElementRef<HTMLButtonElement>>('keep', {
    read: ElementRef,
  });
  private readonly document = inject(DOCUMENT);
  private resolver: ((value: boolean) => void) | undefined;
  private opener: HTMLElement | null = null;
  private overflow: string | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.resolver?.(false);
      this.resolver = undefined;
      this.restoreScroll();
      if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
    });
  }
  ask(): Promise<boolean> {
    if (this.resolver) return Promise.resolve(false);
    this.opener = this.document.activeElement as HTMLElement;
    this.dialog().nativeElement.showModal();
    this.overflow = this.document.documentElement.style.overflow;
    this.document.documentElement.style.overflow = 'hidden';
    this.keep().nativeElement.focus();
    return new Promise((resolve) => (this.resolver = resolve));
  }
  cancel(event: Event): void {
    event.preventDefault();
    this.finish(false);
  }
  finish(value: boolean): void {
    this.dialog().nativeElement.close();
    this.restoreScroll();
    const resolve = this.resolver;
    this.resolver = undefined;
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    resolve?.(value);
  }
  private restoreScroll(): void {
    if (this.overflow !== undefined) this.document.documentElement.style.overflow = this.overflow;
    this.overflow = undefined;
  }
}
````

## libs/shared/ui/organisms/social-post-card/social-post-card.component.css (eklendi)

````css
:host {
  display: block;
}
.social-post {
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.post-kind {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 11px;
  color: var(--color-muted);
}
.post-header {
  display: flex;
  gap: 12px;
  align-items: center;
}
.post-author {
  min-width: 0;
  flex: 1;
}
.post-author strong {
  display: block;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.post-author p {
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.post-header > kx-icon {
  color: var(--color-muted);
}
.post-text {
  margin: 14px 0;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.post-media {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: var(--radius-control);
}
.post-actions {
  display: grid;
  grid-template-columns: repeat(6, minmax(44px, 1fr));
  margin-top: 8px;
}
video.post-media {
  object-fit: contain;
  background: var(--color-surface-alt);
}
.post-actions button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 52px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-muted);
  cursor: default;
}
.post-actions button:hover {
  background: var(--color-surface-alt);
}
.post-actions span {
  font-size: 10px;
}
@media (max-width: 640px) {
  .social-post {
    padding-inline: 16px;
  }
}
````

## libs/shared/ui/organisms/social-post-card/social-post-card.component.ts (eklendi)

````typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocalizedNumberPipe, profileInitials, type PostAuthor, type SocialPost } from '@kampusx/shared/util';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-social-post-card',
  standalone: true,
  imports: [TranslocoDirective, LocalizedNumberPipe, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-post-card.component.css',
  template: `<article class="social-post" *transloco="let t" [attr.data-kind]="post().kind">
    @if (post().kind !== 'post') {
      <p class="post-kind">
        <kx-icon [name]="post().kind === 'reply' ? 'reply' : 'repeat'" />{{
          t(post().kind === 'reply' ? 'profile.content.reply' : 'profile.content.retweet')
        }}
      </p>
    }
    <div class="post-header">
      <kx-avatar [initials]="initials()" [src]="author().avatarUrl" />
      <div class="post-author">
        <strong>{{ author().fullName }}</strong>
        <p>
          @if (author().username) {
            <span>{{ '@' + author().username }}</span>
          }
          @if (post().createdAt) {
            <time [attr.datetime]="post().createdAt">{{ date() }}</time>
          }
        </p>
      </div>
      <kx-icon name="more_horiz" />
    </div>
    <p class="post-text">{{ post().text }}</p>
    @if (post().mediaUrl && post().mediaType === 'video') {
      <video
        class="post-media"
        [src]="post().mediaUrl"
        controls
        playsinline
        preload="metadata"
        [attr.aria-label]="t('media.video')"
      ></video>
    } @else if (post().mediaUrl) {
      <img
        class="post-media"
        [src]="post().mediaUrl"
        [alt]="t('profile.content.mediaAlt')"
        width="640"
        height="360"
        loading="lazy"
      />
    }
    <div class="post-actions">
      @for (action of actions; track action.id) {
        <button
          type="button"
          aria-disabled="true"
          [attr.aria-label]="t(action.labelKey)"
          [attr.aria-describedby]="'profile-post-note-' + post().id"
        >
          <kx-icon [name]="action.icon" />
          @if (action.stat) {
            <span>{{ post().stats[action.stat] | kxNumber }}</span>
          }
        </button>
      }
    </div>
    <p class="sr-only" [id]="'profile-post-note-' + post().id">{{ t('profile.content.visualOnly') }}</p>
  </article>`,
})
export class SocialPostCardComponent {
  readonly post = input.required<SocialPost>();
  readonly author = input.required<PostAuthor>();
  readonly language = input('tr');
  readonly initials = computed(() => profileInitials(this.author().fullName));
  readonly date = computed(() =>
    this.post().createdAt
      ? new Intl.DateTimeFormat(this.language() === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric',
          month: 'short',
          timeZone: 'UTC',
        }).format(new Date(this.post().createdAt))
      : '',
  );
  readonly actions: readonly {
    id: string;
    icon: string;
    labelKey: string;
    stat?: keyof SocialPost['stats'];
  }[] = [
    { id: 'reply', icon: 'chat_bubble', labelKey: 'profile.actions.reply', stat: 'replies' },
    { id: 'retweet', icon: 'repeat', labelKey: 'profile.actions.retweet', stat: 'retweets' },
    { id: 'like', icon: 'favorite', labelKey: 'profile.actions.like', stat: 'likes' },
    { id: 'views', icon: 'bar_chart', labelKey: 'profile.actions.views', stat: 'views' },
    { id: 'bookmark', icon: 'bookmark', labelKey: 'profile.actions.bookmark' },
    { id: 'share', icon: 'ios_share', labelKey: 'profile.actions.share' },
  ];
}
````

## libs/shared/util/image-header.ts (eklendi)

````typescript
export interface ImageDimensions {
  width: number;
  height: number;
}

/** Read dimensions before decoding; a browser decoder still verifies the image. */
export function imageDimensions(bytes: Uint8Array, mime: string): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, length = 4) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (mime === 'image/png') {
    if (
      bytes.length < 33 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value) ||
      view.getUint32(8) !== 13 ||
      text(12) !== 'IHDR'
    )
      return null;
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (mime === 'image/jpeg') {
    if (bytes[0] !== 255 || bytes[1] !== 216) return null;
    let offset = 2;
    while (offset + 1 < bytes.length) {
      if (bytes[offset++] !== 255) return null;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0 || marker === 218 || marker === 217) return null;
      if (marker === 1 || (marker >= 208 && marker <= 216)) continue;
      if (offset + 2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
        if (length < 8) return null;
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      }
      offset += length;
    }
    return null;
  }
  if (mime === 'image/webp') {
    if (
      bytes.length < 20 ||
      text(0) !== 'RIFF' ||
      text(8) !== 'WEBP' ||
      view.getUint32(4, true) + 8 !== bytes.length
    )
      return null;
    const size = view.getUint32(16, true);
    if (20 + size + (size % 2) > bytes.length) return null;
    switch (text(12)) {
      case 'VP8X':
        if (size !== 10) return null;
        return {
          width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
          height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
        };
      case 'VP8L': {
        if (size < 5 || bytes[20] !== 47) return null;
        const bits = view.getUint32(21, true);
        if (bits >>> 29) return null;
        return { width: 1 + (bits & 16383), height: 1 + ((bits >>> 14) & 16383) };
      }
      case 'VP8 ':
        if (size < 10 || bytes[20] & 1 || text(23, 3) !== '\x9d\x01\x2a') return null;
        return { width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 };
      default:
        return null;
    }
  }
  return null;
}
````

## libs/shared/util/index.ts (değişti)

````typescript
export * from './validators';
export * from './form-helpers';
export * from './localized-number.pipe';
export * from './reveal.directive';
export * from './mock-data';
export * from './horizontal-swipe';
export * from './social-post';
export * from './image-header';
````
