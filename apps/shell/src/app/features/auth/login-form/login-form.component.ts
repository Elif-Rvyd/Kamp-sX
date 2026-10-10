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
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }
}
