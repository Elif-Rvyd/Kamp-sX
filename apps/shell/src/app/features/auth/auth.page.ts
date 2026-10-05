import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { StickerComponent, IconComponent } from '@kampusx/shared/ui';
import { AuthUiService, AuthMode } from '../../core/auth-ui.service';
import { AuthPanelComponent } from './auth-panel/auth-panel.component';
@Component({
  standalone: true,
  imports: [TranslocoDirective, AuthPanelComponent, StickerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="standalone-auth page-container" *transloco="let t">
    <aside class="auth-poster">
      <kx-icon name="school" />
      <h1>{{ t('cta.title') }}</h1>
      <p>{{ t('cta.text') }}</p>
      <kx-sticker>{{ t('cta.sticker') }}</kx-sticker>
    </aside>
    <kx-auth-panel />
  </div>`,
})
export class AuthPage {
  constructor() {
    const auth = inject(AuthUiService);
    inject(ActivatedRoute)
      .data.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((data) => {
        auth.mode.set(data['mode'] as AuthMode);
        auth.contextKey.set('');
      });
  }
}
