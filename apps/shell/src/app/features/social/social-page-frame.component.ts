import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
@Component({
  selector: 'kx-social-page-frame',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="page" *transloco="let t">
    <header>
      <a [routerLink]="back()" [attr.aria-label]="t('social.back')"><kx-icon name="arrow_back" /></a>
      <h1>{{ t(titleKey()) }}</h1>
    </header>
    <ng-content />
  </section>`,
  styleUrl: './social-pages.css',
})
export class SocialPageFrameComponent {
  readonly titleKey = input.required<string>();
  readonly back = input('/settings');
}
