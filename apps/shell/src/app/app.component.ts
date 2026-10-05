import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LanguageService } from './core/language.service';
@Component({
  selector: 'kx-root',
  standalone: true,
  imports: [RouterOutlet, TranslocoDirective, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t"
    ><a class="skip-link" href="#main">{{ t('common.skip') }}</a
    ><kx-header />
    <main id="main" tabindex="-1"><router-outlet /></main>
    <kx-footer
  /></ng-container>`,
})
export class AppComponent {
  readonly language = inject(LanguageService);
  constructor() {
    const i18n = inject(TranslocoService);
    i18n
      .selectTranslate('common.title')
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((title) => (document.title = title));
  }
}
