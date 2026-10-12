import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent, ButtonComponent, IconComponent, ModalDrawerComponent } from '@kampusx/shared/ui';
import { PROFILE_MENU } from '../mock-data';
import type { DashboardProfile } from '../dashboard-profile';

@Component({
  selector: 'kx-dashboard-profile-drawer',
  standalone: true,
  imports: [TranslocoDirective, AvatarComponent, ButtonComponent, IconComponent, ModalDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-modal-drawer
    #drawer
    drawerId="dashboard-profile-drawer"
    labelledBy="dashboard-profile-name"
    describedBy="dashboard-profile-school dashboard-profile-department"
    (changed)="changed.emit($event)"
  >
    <div class="profile-content" *transloco="let t">
      <div class="drawer-top">
        <kx-avatar [initials]="profile().initials" size="large" />
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
        <h2 id="dashboard-profile-name">{{ profile().handle || t('dashboard.profile.unnamed') }}</h2>
        <p id="dashboard-profile-school">{{ profile().school || t('dashboard.profile.schoolMissing') }}</p>
        <p id="dashboard-profile-department">
          {{ profile().department || t('dashboard.profile.departmentMissing') }}
        </p>
      </div>
      <nav class="profile-menu" [attr.aria-label]="t('dashboard.profileMenu')">
        @for (item of menu; track item.id) {
          <button
            type="button"
            class="profile-menu-item"
            aria-disabled="true"
            aria-describedby="dashboard-menu-note"
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
  readonly logoutBusy = input(false);
  readonly logoutErrorKey = input('');
  readonly logoutRequested = output<void>();
  readonly menu = PROFILE_MENU;
  readonly changed = output<boolean>();
  private readonly drawer = viewChild.required<ModalDrawerComponent>('drawer');
  open(): void {
    this.drawer().open();
  }
  close(): void {
    this.drawer().close();
  }
}
