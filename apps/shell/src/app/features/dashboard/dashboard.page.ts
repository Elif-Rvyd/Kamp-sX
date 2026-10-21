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
import { IconComponent, ButtonComponent } from '@kampusx/shared/ui';
import { PostsService, type StoredPost } from '../../core/posts.service';
import { PostEntryComponent } from '../posts/post-entry.component';
import type { PostAuthor } from '@kampusx/shared/util';
import { horizontalSwipe, SwipeClickGuard, swipePoint, type SwipePoint } from '@kampusx/shared/util';
import { ThemeService } from '../../core/theme.service';
import { LanguageService } from '../../core/language.service';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { dashboardProfile } from './dashboard-profile';
import { DashboardTopBarComponent } from './top-bar/top-bar.component';
import { DashboardDiscoverTabsComponent } from './discover-tabs/discover-tabs.component';
import { DISCOVER_FEEDS } from './mock-data';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ButtonComponent,
    PostEntryComponent,
    IconComponent,
    DashboardTopBarComponent,
    DashboardDiscoverTabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  readonly posts = inject(PostsService);
  private readonly i18n = inject(TranslocoService);
  authorFor(post: StoredPost): PostAuthor {
    return post.userId === this.auth.session()?.user.id
      ? this.profiles.profile()
      : { fullName: this.i18n.translate('posts.author') };
  }
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profiles = inject(ProfileService);
  readonly profile = computed(() => dashboardProfile(this.profiles.profile()));
  openProfile(): void {
    void this.router.navigateByUrl('/profile');
  }
  readonly feeds = DISCOVER_FEEDS;
  readonly active = signal(0);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private swipe: SwipePoint | null = null;
  private readonly swipeClick = new SwipeClickGuard();

  constructor() {
    this.posts.selectScope('explore');
    effect(() => {
      if (this.auth.initialized() && !this.auth.session()) {
        void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      }
    });
    const document = inject(DOCUMENT);
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.swipeClick.reset();
      document.title = i18n.translate('common.title');
    });
    i18n
      .selectTranslate('dashboard.title')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((title) => {
        document.title = title;
      });
  }

  select(index: number): void {
    const selected = Math.max(0, Math.min(this.feeds.length - 1, index));
    this.active.set(selected);
    this.posts.selectScope((['explore', 'university', 'campus', 'department'] as const)[selected]);
  }
  onPointerDown(event: PointerEvent): void {
    this.swipeClick.reset();
    if ((event.target as Element).closest('input,textarea,video,[role="menu"]')) {
      this.swipe = null;
      return;
    }
    if (!event.isPrimary) {
      this.swipe = null;
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    this.swipe = swipePoint(event);
  }
  onPointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction) {
      this.swipeClick.block(this.viewport().nativeElement);
      this.select(this.active() + direction);
    }
  }
  cancelSwipe(): void {
    this.swipe = null;
  }
}
