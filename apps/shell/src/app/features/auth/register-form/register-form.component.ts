import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
      </div>
    </form>
    <kx-legal-dialog #legal
  /></ng-container>`,
})
export class RegisterFormComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly googleNotice = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
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
