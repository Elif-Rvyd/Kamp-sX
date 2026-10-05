import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  FormFieldComponent,
  PasswordFieldComponent,
  IconComponent,
} from '@kampusx/shared/ui';
import { validateAndFocus } from '@kampusx/shared/util';
import { AuthUiService } from '../../../core/auth-ui.service';
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
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly busy = signal(false);
  readonly done = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
  readonly form = new FormGroup({
    identity: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(false, { nonNullable: true }),
  });
  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }
  submit() {
    if (this.busy() || !validateAndFocus(this.form, this.host)) return;
    this.done.set(false);
    this.busy.set(true);
    this.timer = setTimeout(() => {
      this.busy.set(false);
      this.done.set(true);
    }, 650);
  }
}
