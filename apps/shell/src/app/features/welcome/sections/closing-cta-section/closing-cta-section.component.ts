import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, IconComponent, StickerComponent } from '@kampusx/shared/ui';
import { RevealDirective } from '@kampusx/shared/util';
import { AuthUiService } from '../../../../core/auth-ui.service';
@Component({
  selector: 'kx-closing-cta-section',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, IconComponent, StickerComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    class="closing-cta page-container"
    kxReveal
    *transloco="let t"
    aria-labelledby="cta-title"
  >
    <div class="cta-orbit" aria-hidden="true"></div>
    <div class="cta-content">
      <p class="mono-label">{{ t('cta.kicker') }}</p>
      <h2 id="cta-title">{{ t('cta.title') }}</h2>
      <p>{{ t('cta.text') }}</p>
    </div>
    <div class="cta-action">
      <kx-sticker>{{ t('cta.sticker') }}<span aria-hidden="true"> ✌</span></kx-sticker
      ><button kxButton type="button" (click)="auth.open('register')">
        {{ t('cta.button') }}<kx-icon name="north_east" /></button
      ><span>{{ t('cta.note') }}</span>
    </div>
  </section>`,
})
export class ClosingCtaSectionComponent {
  readonly auth = inject(AuthUiService);
}
