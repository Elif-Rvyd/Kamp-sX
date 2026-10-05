import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-marquee-strip',
  standalone: true,
  imports: [TranslocoDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="marquee-strip" *transloco="let t">
    <span class="trend-label"><kx-icon name="trending_up" />{{ t('hero.trends.label') }}</span>
    <div class="marquee-window">
      <div class="marquee-track" [class.marquee-paused]="paused()">
        @for (copy of [0, 1]; track copy) {
          <div class="marquee-copy" [attr.aria-hidden]="copy === 1 ? 'true' : null">
            @for (key of trendKeys; track key) {
              <span>{{ t(key) }}<span class="trend-star" aria-hidden="true">✳</span></span>
            }
          </div>
        }
      </div>
    </div>
    <button
      class="marquee-control icon-button"
      type="button"
      (click)="paused.set(!paused())"
      [attr.aria-label]="t(paused() ? 'hero.trends.resume' : 'hero.trends.pause')"
      [attr.aria-pressed]="paused()"
    >
      <kx-icon [name]="paused() ? 'play_arrow' : 'pause'" />
    </button>
  </div>`,
})
export class MarqueeStripComponent {
  readonly paused = signal(false);
  readonly trendKeys = [
    'hero.trends.one',
    'hero.trends.two',
    'hero.trends.three',
    'hero.trends.four',
    'hero.trends.five',
  ];
}
