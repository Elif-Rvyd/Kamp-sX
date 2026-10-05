import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
import { AuthUiService } from '../../../core/auth-ui.service';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterFormComponent } from '../register-form/register-form.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
@Component({
  selector: 'kx-auth-panel',
  standalone: true,
  imports: [
    TranslocoDirective,
    IconComponent,
    LoginFormComponent,
    RegisterFormComponent,
    ForgotPasswordComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section id="auth-panel" class="auth-panel" *transloco="let t" aria-labelledby="auth-title">
    <div class="auth-heading">
      <div class="auth-mark" aria-hidden="true"><kx-icon name="school" /></div>
      <p class="mono-label">{{ t('auth.kicker') }}</p>
      <h2 id="auth-title" tabindex="-1" data-panel-heading>
        {{
          t(
            auth.mode() === 'register'
              ? 'auth.register.title'
              : auth.mode() === 'reset'
                ? 'auth.reset.title'
                : 'auth.title'
          )
        }}
      </h2>
      <p>
        {{
          t(
            auth.mode() === 'register'
              ? 'auth.register.description'
              : auth.mode() === 'reset'
                ? 'auth.reset.description'
                : 'auth.description'
          )
        }}
      </p>
    </div>
    @if (auth.contextKey()) {
      <p class="info-message" role="status">{{ t(auth.contextKey()) }}</p>
    }
    @if (auth.mode() !== 'reset') {
      <div class="auth-tabs" role="group" [attr.aria-label]="t('auth.tabs')">
        <button
          type="button"
          [class.active]="auth.mode() === 'login'"
          [attr.aria-pressed]="auth.mode() === 'login'"
          (click)="auth.mode.set('login')"
        >
          {{ t('auth.loginTab') }}</button
        ><button
          type="button"
          [class.active]="auth.mode() === 'register'"
          [attr.aria-pressed]="auth.mode() === 'register'"
          (click)="auth.mode.set('register')"
        >
          {{ t('auth.registerTab') }}
        </button>
      </div>
    }
    @switch (auth.mode()) {
      @case ('login') {
        <kx-login-form />
      }
      @case ('register') {
        <kx-register-form />
      }
      @case ('reset') {
        <kx-forgot-password />
      }
    }
    <div class="auth-trust">
      <kx-icon name="verified_user" /><span>{{ t('auth.secure') }}</span>
    </div>
    <p class="demo-note">{{ t('auth.demoHint') }}</p>
    <ng-content />
  </section>`,
})
export class AuthPanelComponent {
  readonly auth = inject(AuthUiService);
}
