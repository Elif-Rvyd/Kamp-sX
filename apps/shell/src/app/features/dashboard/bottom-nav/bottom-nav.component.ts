import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
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
        [class.active]="item.id === 'home' && currentHome()"
        [attr.aria-current]="item.id === 'home' && currentHome() ? 'page' : null"
        [attr.aria-disabled]="item.id === 'home' && homeEnabled() ? null : true"
        (click)="item.id === 'home' && goHome()"
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
  readonly homeEnabled = input(false);
  readonly currentHome = input(true);
  private readonly router = inject(Router);
  goHome(): void {
    if (this.homeEnabled()) void this.router.navigateByUrl('/dashboard');
  }
  readonly items = BOTTOM_NAV;
}
