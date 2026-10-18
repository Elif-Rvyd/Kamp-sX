import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  ButtonComponent,
  IconComponent,
  FollowCountsComponent,
  LogoComponent,
} from '@kampusx/shared/ui';
import { PROFILE_MENU, BOTTOM_NAV } from '../mock-data';
import type { DashboardProfile } from '../dashboard-profile';

/** Permanent navigation for authenticated routes; retained at its existing feature path. */
@Component({
  selector: 'kx-dashboard-profile-drawer',
  standalone: true,
  imports: [
    TranslocoDirective,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    ButtonComponent,
    IconComponent,
    FollowCountsComponent,
    LogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<aside class="profile-content" *transloco="let t" [attr.aria-label]="t('dashboard.profileMenu')">
    <a class="sidebar-brand" routerLink="/dashboard" [attr.aria-label]="t('dashboard.nav.home')">
      <kx-logo class="sidebar-wordmark" />
      <img class="sidebar-mark" src="assets/logo.svg" width="36" height="36" alt="" />
    </a>
    <button
      type="button"
      class="profile-avatar-link"
      [attr.aria-label]="t('profile.drawer.open', { name: profile().fullName })"
      [title]="t('profile.drawer.profile')"
      (click)="profileRequested.emit()"
    >
      <kx-avatar [initials]="profile().initials" [src]="profile().avatarUrl" />
      <span class="profile-identity"
        ><strong>{{ profile().fullName }}</strong
        ><span>{{ profile().handle }}</span></span
      >
    </button>
    <div class="profile-details">
      <p>{{ profile().school || t('dashboard.profile.schoolMissing') }}</p>
      <p>{{ profile().department || t('dashboard.profile.departmentMissing') }}</p>
      <kx-follow-counts
        followingLink="/profile/following"
        followersLink="/profile/followers"
        class="drawer-counts"
        [following]="profile().followingCount"
        [followers]="profile().followersCount"
        [loading]="followLoading()"
        [errorKey]="followError()"
        (retried)="followRetry.emit()"
      />
    </div>
    <nav class="profile-menu" [attr.aria-label]="t('dashboard.navigationLabel')">
      @for (item of primary; track item.id) {
        @if (item.id === 'home' || item.id === 'search') {
          <a
            class="profile-menu-item"
            [routerLink]="item.id === 'home' ? '/dashboard' : '/search'"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            [attr.aria-label]="t(item.key)"
            [title]="t(item.key)"
          >
            <kx-icon [name]="item.icon || 'home'" /><span class="menu-label">{{ t(item.key) }}</span>
          </a>
        } @else {
          <button
            type="button"
            class="profile-menu-item"
            disabled
            [attr.aria-label]="t(item.key)"
            [title]="t(item.key)"
          >
            <kx-icon [name]="item.icon || 'home'" /><span class="menu-label">{{ t(item.key) }}</span>
          </button>
        }
      }
      <div class="menu-divider" aria-hidden="true"></div>
      @for (item of menu; track item.id) {
        @if (item.id === 'profile' || item.id === 'settings') {
          <a
            class="profile-menu-item"
            [routerLink]="item.id === 'profile' ? '/profile' : '/settings'"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            [attr.aria-label]="t(item.key)"
            [title]="t(item.key)"
          >
            <kx-icon [name]="item.icon" /><span class="menu-label">{{ t(item.key) }}</span>
          </a>
        } @else {
          <button
            type="button"
            class="profile-menu-item"
            disabled
            [attr.aria-label]="t(item.key)"
            [title]="t(item.key)"
          >
            <kx-icon [name]="item.icon" /><span class="menu-label">{{ t(item.key) }}</span>
          </button>
        }
      }
      <button
        kxButton
        type="button"
        class="compose-link"
        (click)="composeRequested.emit()"
        [attr.aria-label]="t('posts.publish')"
        [title]="t('posts.publish')"
      >
        <kx-icon name="add" /><span class="menu-label">{{ t('posts.publish') }}</span>
      </button>
    </nav>
    <div class="logout-section">
      <button
        kxButton
        type="button"
        emphasis="ghost"
        class="logout-button"
        [busy]="logoutBusy()"
        [attr.aria-label]="t('dashboard.logout')"
        [title]="t('dashboard.logout')"
        (click)="logoutRequested.emit()"
      >
        <kx-icon name="logout" /><span class="menu-label">{{ t('dashboard.logout') }}</span>
      </button>
      @if (logoutErrorKey()) {
        <p class="field-message error-text" role="alert">{{ t(logoutErrorKey()) }}</p>
      }
    </div>
  </aside>`,
  styleUrl: './profile-drawer.component.css',
})
export class DashboardProfileDrawerComponent {
  readonly profile = input.required<DashboardProfile>();
  readonly followError = input('');
  readonly followLoading = input(false);
  readonly followRetry = output<void>();
  readonly logoutBusy = input(false);
  readonly logoutErrorKey = input('');
  readonly logoutRequested = output<void>();
  readonly profileRequested = output<void>();
  readonly composeRequested = output<void>();
  readonly menu = PROFILE_MENU;
  readonly primary = BOTTOM_NAV;
}
