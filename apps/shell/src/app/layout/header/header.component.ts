import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  LogoComponent,
  IconComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';
import { ThemeService } from '../../core/theme.service';
import { LanguageService } from '../../core/language.service';
@Component({
  selector: 'kx-header',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    LogoComponent,
    IconComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="site-header" *transloco="let t">
    <div class="header-inner page-container">
      <a routerLink="/" [attr.aria-label]="t('common.brand')"><kx-logo /></a>
      <nav class="desktop-nav" [attr.aria-label]="t('nav.explore')">
        @for (link of links; track link.id) {
          <a routerLink="/" [fragment]="link.id">{{ t(link.key) }}</a>
        }
      </nav>
      <div class="header-actions">
        <div class="desktop-settings">
          <kx-language-switcher [active]="language.language()" (changed)="language.set($event)" /><span
            class="header-rule"
          ></span
          ><kx-theme-toggle [dark]="theme.dark()" (changed)="theme.toggle()" />
        </div>
        <button
          type="button"
          class="icon-button menu-button"
          aria-controls="mobile-menu"
          [attr.aria-expanded]="menuOpen()"
          [attr.aria-label]="t(menuOpen() ? 'common.closeMenu' : 'common.menu')"
          (click)="menuOpen.set(!menuOpen())"
        >
          <kx-icon [name]="menuOpen() ? 'close' : 'menu'" />
        </button>
      </div>
    </div>
    @if (menuOpen()) {
      <div id="mobile-menu" class="mobile-menu" (keydown.escape)="menuOpen.set(false)">
        <nav>
          @for (link of links; track link.id) {
            <a routerLink="/" [fragment]="link.id" (click)="menuOpen.set(false)">{{ t(link.key) }}</a>
          }
        </nav>
        <div class="mobile-settings">
          <kx-language-switcher
            [active]="language.language()"
            (changed)="language.set($event)"
          /><kx-theme-toggle [dark]="theme.dark()" (changed)="theme.toggle()" />
        </div>
      </div>
    }
  </header>`,
})
export class HeaderComponent {
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
  readonly menuOpen = signal(false);
  readonly links = [
    { id: 'kesfet', key: 'nav.explore' },
    { id: 'topluluklar', key: 'nav.communities' },
    { id: 'akademik-ag', key: 'nav.academic' },
  ];
}
