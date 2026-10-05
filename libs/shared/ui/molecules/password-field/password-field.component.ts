import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { passwordStrength, validationKey } from '@kampusx/shared/util';
import { InputDirective } from '../../atoms/input/input.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-password-field',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, InputDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="form-field" *transloco="let t">
    <label [for]="fieldId()">{{ t('auth.password') }}</label>
    <div class="input-wrap password-wrap">
      <kx-icon name="lock" /><input
        kxInput
        [id]="fieldId()"
        [type]="revealed() ? 'text' : 'password'"
        [formControl]="control()"
        [placeholder]="t('auth.passwordPlaceholder')"
        [autocomplete]="newPassword() ? 'new-password' : 'current-password'"
        [attr.aria-invalid]="control().touched && control().invalid"
        [attr.aria-describedby]="fieldId() + '-message'"
      /><button
        type="button"
        class="reveal-button"
        (click)="revealed.set(!revealed())"
        [attr.aria-label]="t(revealed() ? 'auth.hidePassword' : 'auth.showPassword')"
        [attr.aria-pressed]="revealed()"
      >
        <kx-icon [name]="revealed() ? 'visibility_off' : 'visibility'" />
      </button>
    </div>
    <p
      class="field-message"
      [class.error-text]="!!errorKey()"
      [id]="fieldId() + '-message'"
      aria-live="polite"
    >
      {{ errorKey() ? t(errorKey()) : newPassword() ? t('auth.passwordHint') : '' }}
    </p>
    @if (newPassword()) {
      <div class="strength-bars" aria-hidden="true">
        @for (part of [1, 2, 3, 4]; track part) {
          <span [class.filled]="strength() >= part"></span>
        }
      </div>
      <p class="strength-label">{{ t('auth.strength.' + strength()) }}</p>
    }
  </div>`,
})
export class PasswordFieldComponent {
  readonly fieldId = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly newPassword = input(false);
  readonly revealed = signal(false);
  errorKey() {
    return validationKey(this.control());
  }
  strength() {
    return passwordStrength(this.control().value);
  }
}
