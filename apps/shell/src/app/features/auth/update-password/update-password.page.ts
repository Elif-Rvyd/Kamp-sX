import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent, IconComponent, PasswordFieldComponent, StickerComponent } from '@kampusx/shared/ui';
import { validateAndFocus } from '@kampusx/shared/util';
import { AuthService } from '../../../core/auth.service';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoDirective,
    ButtonComponent,
    IconComponent,
    PasswordFieldComponent,
    StickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="standalone-auth page-container" *transloco="let t">
    <aside class="auth-poster">
      <kx-icon name="school" />
      <h1>{{ t('cta.title') }}</h1>
      <p>{{ t('cta.text') }}</p>
      <kx-sticker>{{ t('cta.sticker') }}</kx-sticker>
    </aside>
    <section class="auth-panel" aria-labelledby="update-password-title">
      <div class="auth-heading">
        <div class="auth-mark" aria-hidden="true"><kx-icon name="lock_reset" /></div>
        <h2 id="update-password-title" tabindex="-1">{{ t('auth.update.title') }}</h2>
        <p>{{ t('auth.update.description') }}</p>
      </div>
      @if (!linkReady()) {
        <p class="info-message" role="status">{{ t('auth.update.checking') }}</p>
      } @else if (done()) {
        <div class="reset-success" role="status" tabindex="-1" data-recovery-result>
          <div class="success-icon"><kx-icon name="check_circle" /></div>
          <h3>{{ t('auth.update.successTitle') }}</h3>
          <p>{{ t('auth.update.success') }}</p>
          <a class="text-button" routerLink="/auth/login">{{ t('common.back') }}</a>
        </div>
      } @else if (passwordSaved()) {
        <div class="reset-success" tabindex="-1" data-recovery-result>
          <p class="error-text" role="alert">{{ t('auth.errors.signOut') }}</p>
          <button kxButton type="button" class="full-width" [busy]="busy()" (click)="finishSignOut()">
            {{ t('auth.update.retrySignOut') }}
          </button>
        </div>
      } @else if (!canUpdate() && !busy()) {
        <p class="info-message" role="alert">{{ t('auth.errors.recoveryInvalid') }}</p>
        <a class="text-button" routerLink="/auth/forgot-password">{{ t('auth.update.requestLink') }}</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
          <kx-password-field
            fieldId="update-password"
            labelKey="auth.update.password"
            [control]="passwordControl"
            [newPassword]="true"
          />
          <kx-password-field
            fieldId="update-confirm-password"
            labelKey="auth.update.confirmPassword"
            [control]="confirmControl"
            [newPassword]="true"
          />
          <button kxButton type="submit" class="full-width" [busy]="busy()">
            {{ t('auth.update.submit') }}<kx-icon name="arrow_forward" />
          </button>
          <div class="form-status">
            @if (errorKey()) {
              <p class="field-message error-text" role="alert">{{ t(errorKey()) }}</p>
            }
          </div>
        </form>
      }
    </section>
  </div>`,
})
export class UpdatePasswordPage {
  private readonly api = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly linkReady = signal(false);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly passwordSaved = signal(false);
  readonly errorKey = signal('');
  readonly canUpdate = computed(() => this.linkReady() && this.api.recovery() && !!this.api.session());
  readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(8)],
  });
  readonly confirmControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      (control) =>
        !control.value || control.value === this.passwordControl.value ? null : { passwordMismatch: true },
    ],
  });
  readonly form = new FormGroup({
    password: this.passwordControl,
    confirmPassword: this.confirmControl,
  });

  constructor() {
    const title = inject(Title);
    inject(TranslocoService)
      .selectTranslate('auth.update.title')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translated) => title.setTitle(`${translated} | KampüsX`));
    this.passwordControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.confirmControl.updateValueAndValidity({ emitEvent: false });
    });
    const showLinkState = () => {
      if (!this.destroyRef.destroyed) {
        this.linkReady.set(true);
        this.focus('#update-password-title');
      }
    };
    void this.api.ready.then(showLinkState, showLinkState);
  }

  async submit() {
    if (this.busy() || !this.canUpdate() || !validateAndFocus(this.form, this.host)) return;
    this.errorKey.set('');
    this.busy.set(true);
    try {
      const { error, passwordUpdated } = await this.api.updatePassword(this.passwordControl.value);
      if (this.destroyRef.destroyed) return;
      if (error) {
        const key = this.api.errorKey(error);
        this.errorKey.set(key);
        if (passwordUpdated) {
          this.form.reset();
          this.passwordSaved.set(true);
          this.focus('[data-recovery-result]');
        }
      } else {
        this.form.reset();
        this.done.set(true);
        this.focus('[data-recovery-result]');
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }

  async finishSignOut() {
    if (this.busy() || !this.passwordSaved()) return;
    this.busy.set(true);
    try {
      const { error } = await this.api.signOut();
      if (!this.destroyRef.destroyed && !error) {
        this.done.set(true);
        this.focus('[data-recovery-result]');
      }
    } catch {
      // Keep the saved-password notice and retry action; never claim sign-out succeeded.
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }

  private focus(selector: string) {
    requestAnimationFrame(() => {
      if (!this.destroyRef.destroyed) this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
    });
  }
}
