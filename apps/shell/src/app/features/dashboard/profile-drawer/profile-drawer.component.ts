import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  ButtonComponent,
  IconComponent,
  ModalDrawerComponent,
  FollowCountsComponent,
} from '@kampusx/shared/ui';
import { PROFILE_MENU } from '../mock-data';
import type { DashboardProfile } from '../dashboard-profile';

@Component({
  selector: 'kx-dashboard-profile-drawer',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    ButtonComponent,
    IconComponent,
    ModalDrawerComponent,
    FollowCountsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-modal-drawer
    #drawer
    drawerId="dashboard-profile-drawer"
    labelledBy="dashboard-profile-name"
    describedBy="dashboard-profile-school dashboard-profile-department"
    (changed)="onChanged($event)"
  >
    <div class="profile-content" *transloco="let t">
      <div class="drawer-top">
        <button
          type="button"
          class="profile-avatar-link"
          [attr.aria-label]="t('profile.drawer.open', { name: profile().fullName })"
          (click)="goToProfile()"
        >
          <kx-avatar [initials]="profile().initials" [src]="profile().avatarUrl" size="large" />
        </button>
        <button
          type="button"
          data-drawer-close
          class="close-button"
          [attr.aria-label]="t('dashboard.closeProfile')"
          (click)="drawer.close()"
        >
          <kx-icon name="close" />
        </button>
      </div>
      <div class="profile-details">
        <button type="button" class="profile-name-link" (click)="goToProfile()">
          <h2 id="dashboard-profile-name">{{ profile().fullName }}</h2>
          <span class="profile-handle">{{ profile().handle }}</span>
        </button>
        <p id="dashboard-profile-school">{{ profile().school || t('dashboard.profile.schoolMissing') }}</p>
        <p id="dashboard-profile-department">
          {{ profile().department || t('dashboard.profile.departmentMissing') }}
        </p>
        <kx-follow-counts
          class="drawer-counts"
          [following]="profile().followingCount"
          [followers]="profile().followersCount"
          [loading]="followLoading()"
          [errorKey]="followError()"
          (retried)="followRetry.emit()"
        />
      </div>
      <nav class="profile-menu" [attr.aria-label]="t('dashboard.profileMenu')">
        @for (item of menu; track item.id) {
          @if (item.id === 'settings') {
            <div class="menu-divider" aria-hidden="true"></div>
          }
          <button
            type="button"
            class="profile-menu-item"
            [attr.aria-disabled]="item.id === 'profile' ? null : true"
            [attr.aria-describedby]="item.id === 'profile' ? null : 'dashboard-menu-note'"
            (click)="item.id === 'profile' && goToProfile()"
          >
            <kx-icon [name]="item.icon" /><span>{{ t(item.key) }}</span
            ><kx-icon name="chevron_right" />
          </button>
        }
      </nav>
      <p class="sr-only" id="dashboard-menu-note">{{ t('dashboard.visualOnly') }}</p>
      <div class="logout-section">
        <button
          kxButton
          type="button"
          emphasis="outline"
          class="full-width logout-button"
          [busy]="logoutBusy()"
          (click)="logoutRequested.emit()"
        >
          <kx-icon name="logout" />{{ t('dashboard.logout') }}
        </button>
        @if (logoutErrorKey()) {
          <p class="field-message error-text" role="alert">{{ t(logoutErrorKey()) }}</p>
        }
      </div>
    </div>
  </kx-modal-drawer>`,
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
  readonly menu = PROFILE_MENU;
  readonly changed = output<boolean>();
  private readonly drawer = viewChild.required<ModalDrawerComponent>('drawer');
  private pendingProfile = false;
  goToProfile(): void {
    this.pendingProfile = true;
    this.drawer().close();
  }
  onChanged(open: boolean): void {
    this.changed.emit(open);
    if (!open && this.pendingProfile) {
      this.pendingProfile = false;
      this.profileRequested.emit();
    }
  }
  open(): void {
    this.drawer().open();
  }
  close(): void {
    this.drawer().close();
  }
}
