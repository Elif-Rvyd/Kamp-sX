import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
@Component({
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="not-found page-container" *transloco="let t">
    <h1>{{ t('common.notFound') }}</h1>
    <a routerLink="/">{{ t('common.home') }}</a>
  </section>`,
})
export class NotFoundPage {}
