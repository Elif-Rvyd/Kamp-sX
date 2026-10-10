import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, FormFieldComponent, IconComponent } from '@kampusx/shared/ui';
import { universityEmail, validateAndFocus } from '@kampusx/shared/util';
import { AuthUiService } from '../../../core/auth-ui.service';
import { AuthService } from '../../../core/auth.service';
@Component({
  selector: 'kx-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, ButtonComponent, FormFieldComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div *transloco="let t">
    <button class="text-button back-button" type="button" (click)="auth.mode.set('login')">
      <kx-icon name="arrow_back" />{{ t('common.back') }}
    </button>
    @if (!done()) {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
        <kx-form-field
          fieldId="reset-email"
          type="email"
          autocomplete="email"
          labelKey="auth.reset.email"
          placeholderKey="auth.reset.placeholder"
          [control]="form.controls.email"
        /><button kxButton type="submit" class="full-width" [busy]="busy()">
          {{ t('auth.reset.submit') }}<kx-icon name="arrow_forward" />
        </button>
        @if (errorKey()) {
          <p class="field-message error-text" role="alert">{{ t(errorKey()) }}</p>
        }
      </form>
    } @else {
      <div class="reset-success" role="status" tabindex="-1" #success>
        <div class="success-icon"><kx-icon name="mark_email_read" /></div>
        <h3>{{ t('auth.reset.successTitle') }}</h3>
        <strong class="reset-address">{{ submittedEmail() }}</strong>
        <p>{{ t('auth.reset.success') }}</p>
        <button kxButton emphasis="outline" type="button" class="full-width" (click)="done.set(false)">
          {{ t('auth.reset.retry') }}
        </button>
      </div>
    }
  </div>`,
})
export class ForgotPasswordComponent {
  readonly auth = inject(AuthUiService);
  private readonly api = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly errorKey = signal('');
  readonly submittedEmail = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, universityEmail],
    }),
  });

  async submit() {
    if (this.busy() || !validateAndFocus(this.form, this.host)) return;
    this.errorKey.set('');
    this.busy.set(true);
    const email = this.form.controls.email.value.trim();
    try {
      const { error } = await this.api.resetPassword(email);
      if (this.destroyRef.destroyed) return;
      if (error) {
        this.errorKey.set(this.api.errorKey(error));
      } else {
        this.submittedEmail.set(email);
        this.done.set(true);
        requestAnimationFrame(() => {
          if (!this.destroyRef.destroyed) {
            this.host.nativeElement.querySelector<HTMLElement>('.reset-success')?.focus();
          }
        });
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }
}
