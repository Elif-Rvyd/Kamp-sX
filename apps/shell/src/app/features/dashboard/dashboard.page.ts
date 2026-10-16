import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  computed,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import {
  FeedSkeletonComponent,
  IconComponent,
  IconButtonComponent,
  ButtonComponent,
  SocialPostCardComponent,
} from '@kampusx/shared/ui';
import { PostsService, type StoredPost } from '../../core/posts.service';
import type { PostAuthor } from '@kampusx/shared/util';
import { horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';
import { ThemeService } from '../../core/theme.service';
import { LanguageService } from '../../core/language.service';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { FollowsService } from '../../core/follows.service';
import { dashboardProfile } from './dashboard-profile';
import { DashboardTopBarComponent } from './top-bar/top-bar.component';
import { DashboardProfileDrawerComponent } from './profile-drawer/profile-drawer.component';
import { DashboardDiscoverTabsComponent } from './discover-tabs/discover-tabs.component';
import { DashboardBottomNavComponent } from './bottom-nav/bottom-nav.component';
import { DISCOVER_FEEDS, SKELETON_CARDS } from './mock-data';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    FeedSkeletonComponent,
    IconButtonComponent,
    ButtonComponent,
    SocialPostCardComponent,
    IconComponent,
    DashboardTopBarComponent,
    DashboardProfileDrawerComponent,
    DashboardDiscoverTabsComponent,
    DashboardBottomNavComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  readonly follows = inject(FollowsService);
  readonly posts = inject(PostsService);
  private readonly i18n = inject(TranslocoService);
  compose(): void {
    void this.router.navigateByUrl('/compose');
  }
  authorFor(post: StoredPost): PostAuthor {
    return post.userId === this.auth.session()?.user.id
      ? this.profiles.profile()
      : { fullName: this.i18n.translate('posts.author') };
  }
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profiles = inject(ProfileService);
  readonly profile = computed(() => dashboardProfile(this.profiles.profile()));
  openProfile(): void {
    void this.router.navigateByUrl('/profile');
  }
  readonly logoutBusy = signal(false);
  readonly logoutErrorKey = signal('');
  readonly feeds = DISCOVER_FEEDS;
  readonly skeletons = SKELETON_CARDS;
  readonly active = signal(0);
  readonly drawerOpen = signal(false);
  readonly profileDrawer = viewChild.required<DashboardProfileDrawerComponent>('profileDrawerView');
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private swipe: SwipePoint | null = null;

  constructor() {
    effect(() => {
      if (this.auth.initialized() && !this.auth.session()) {
        void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      }
    });
    const document = inject(DOCUMENT);
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      document.title = i18n.translate('common.title');
    });
    i18n
      .selectTranslate('dashboard.title')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((title) => {
        document.title = title;
      });
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

  select(index: number): void {
    this.active.set(Math.max(0, Math.min(this.feeds.length - 1, index)));
  }
  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary) {
      this.swipe = null;
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.swipe = swipePoint(event);
    this.viewport().nativeElement.setPointerCapture(event.pointerId);
  }
  onPointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction) this.select(this.active() + direction);
  }
  cancelSwipe(): void {
    this.swipe = null;
  }
}
