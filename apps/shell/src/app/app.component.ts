import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
    ><a class="skip-link" href="#main">{{ t('common.skip') }}</a>
    @if (!dashboardLayout()) {
      <kx-header />
    }
    <main id="main" tabindex="-1"><router-outlet /></main>
    @if (!dashboardLayout()) {
      <kx-footer />
    }
  </ng-container>`,
})
export class AppComponent {
  readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly path = signal(this.document.location.pathname);
  readonly dashboardLayout = computed(() => this.path().replace(/\/$/, '') === '/dashboard');
  constructor() {
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    inject(Router)
      .events.pipe(takeUntilDestroyed(destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.path.set(event.urlAfterRedirects.split(/[?#]/)[0]);
        }
      });
    i18n
      .selectTranslate('common.title')
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((title) => {
        if (!this.dashboardLayout()) this.document.title = title;
      });
  }
}
