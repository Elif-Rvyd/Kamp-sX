import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { FollowsService } from '../../core/follows.service';
import { PostsService } from '../../core/posts.service';
import { dashboardProfile } from '../dashboard/dashboard-profile';
import { DashboardProfileDrawerComponent } from '../dashboard/profile-drawer/profile-drawer.component';

@Component({
  standalone: true,
  imports: [RouterOutlet, DashboardProfileDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="social-layout">
    <kx-dashboard-profile-drawer
      [profile]="profile()"
      [followError]="follows.error()"
      [followLoading]="follows.loading()"
      (followRetry)="follows.retry()"
      [logoutBusy]="logoutBusy()"
      [logoutErrorKey]="logoutErrorKey()"
      (logoutRequested)="logout()"
      (profileRequested)="openProfile()"
      (composeRequested)="compose()"
    />
    <div id="social-content" class="social-content" tabindex="-1"><router-outlet /></div>
  </div>`,
  styleUrl: './social-layout.component.css',
})
export class SocialLayoutComponent {
  readonly follows = inject(FollowsService);
  private readonly profiles = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly profile = computed(() => dashboardProfile(this.profiles.profile()));
  readonly logoutBusy = signal(false);
  readonly logoutErrorKey = signal('');
  constructor() {
    const posts = inject(PostsService);
    effect(() => {
      this.follows.privacyRevision();
      untracked(() => void posts.load());
    });
  }
  openProfile(): void {
    void this.router.navigateByUrl('/profile');
  }
  compose(): void {
    void this.router.navigateByUrl('/compose');
  }
  async logout(): Promise<void> {
    if (this.logoutBusy()) return;
    this.logoutBusy.set(true);
    this.logoutErrorKey.set('');
    try {
      const { error } = await this.auth.signOut();
      if (this.destroyRef.destroyed) return;
      if (error && this.auth.session()) this.logoutErrorKey.set(this.auth.errorKey(error));
      else await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    } finally {
      if (!this.destroyRef.destroyed) this.logoutBusy.set(false);
    }
  }
}
