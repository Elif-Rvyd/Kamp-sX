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
