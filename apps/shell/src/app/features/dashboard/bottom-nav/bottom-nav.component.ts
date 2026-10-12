import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
import { BOTTOM_NAV } from '../mock-data';

@Component({
  selector: 'kx-dashboard-bottom-nav',
  standalone: true,
  imports: [TranslocoDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav class="bottom-nav" *transloco="let t" [attr.aria-label]="t('dashboard.navigationLabel')">
    @for (item of items; track item.id) {
      <button
        type="button"
        class="nav-item"
        [class.active]="item.id === 'home'"
        [attr.aria-current]="item.id === 'home' ? 'page' : null"
        aria-disabled="true"
        [attr.aria-label]="t(item.key)"
        aria-describedby="dashboard-nav-note"
      >
        <span class="nav-icon">
          @if (item.icon) {
            <kx-icon [name]="item.icon" />
          } @else {
            <img src="assets/logo.svg" width="24" height="24" alt="" />
          }
        </span>
        <span class="nav-label">{{ t(item.key) }}</span>
      </button>
    }
    <p class="sr-only" id="dashboard-nav-note">{{ t('dashboard.visualOnly') }}</p>
  </nav>`,
  styleUrl: './bottom-nav.component.css',
})
export class DashboardBottomNavComponent {
  readonly items = BOTTOM_NAV;
}
