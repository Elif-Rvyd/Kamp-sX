import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  LogoComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';

@Component({
  selector: 'kx-dashboard-top-bar',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    LogoComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<header class="top-bar" *transloco="let t">
    <div class="profile-trigger">
      <button
        type="button"
        class="avatar-button"
        [attr.aria-label]="t('dashboard.openProfile')"
        (click)="profileOpened.emit()"
      >
        <kx-avatar [initials]="initials()" [src]="avatarUrl()" />
      </button>
    </div>
    <div class="top-bar-brand" role="img" [attr.aria-label]="t('common.brand')">
      <kx-logo class="wordmark" />
      <img class="logomark" src="assets/logo.svg" width="38" height="38" alt="" />
    </div>
    <div class="top-bar-settings">
      <kx-language-switcher [active]="language()" (changed)="languageChanged.emit($event)" />
      <kx-theme-toggle [dark]="dark()" (changed)="themeChanged.emit()" />
    </div>
  </header>`,
  styleUrl: './top-bar.component.css',
})
export class DashboardTopBarComponent {
  readonly initials = input.required<string>();
  readonly avatarUrl = input<string>();
  readonly language = input('tr');
  readonly dark = input(false);
  readonly profileOpened = output<void>();
  readonly languageChanged = output<string>();
  readonly themeChanged = output<void>();
}
