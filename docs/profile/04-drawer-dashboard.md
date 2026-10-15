# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## apps/shell/src/app/app.component.ts (değişti)

````typescript
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LanguageService } from './core/language.service';
import { NoticeService } from './core/notice.service';
import { ToastComponent } from '@kampusx/shared/ui';
@Component({
  selector: 'kx-root',
  standalone: true,
  imports: [RouterOutlet, TranslocoDirective, HeaderComponent, FooterComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t"
    ><a class="skip-link" href="#main">{{ t('common.skip') }}</a>
    @if (!dashboardLayout()) {
      <kx-header />
    }
    <main id="main" tabindex="-1"><router-outlet /></main>
    @if (!dashboardLayout()) {
      <kx-footer />
    }
    @if (notices.message()) {
      <kx-toast [messageKey]="notices.message()" (dismissed)="notices.clear()" />
    }
  </ng-container>`,
})
export class AppComponent {
  readonly language = inject(LanguageService);
  readonly notices = inject(NoticeService);
  private readonly document = inject(DOCUMENT);
  private readonly path = signal(this.document.location.pathname);
  readonly dashboardLayout = computed(() =>
    ['/dashboard', '/profile', '/profile/edit', '/compose'].includes(this.path().replace(/\/$/, '')),
  );
  constructor() {
    const i18n = inject(TranslocoService);
    const destroyRef = inject(DestroyRef);
    inject(Router)
      .events.pipe(takeUntilDestroyed(destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.path.set(event.urlAfterRedirects.split(/[?#]/)[0]);
        }
      });
    i18n
      .selectTranslate('common.title')
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((title) => {
        if (!this.dashboardLayout()) this.document.title = title;
      });
  }
}
````

## apps/shell/src/app/features/dashboard/bottom-nav/bottom-nav.component.ts (değişti)

````typescript
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
````

## apps/shell/src/app/features/dashboard/dashboard-profile.ts (değişti)

````typescript
import { profileInitials } from '@kampusx/shared/util';
import type { Profile } from '../../core/profile.model';

export interface DashboardProfile {
  handle: string;
  initials: string;
  school: string | null;
  department: string | null;
  fullName: string;
  avatarUrl?: string;
  followingCount: number;
  followersCount: number;
}

/** Metadata is display content only; it never grants permissions. */
export function dashboardProfile(profile: Profile): DashboardProfile {
  return {
    handle: `@${profile.username}`,
    initials: profileInitials(profile.fullName),
    school: profile.university || null,
    department: profile.department || null,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    followingCount: profile.followingCount,
    followersCount: profile.followersCount,
  };
}
````

## apps/shell/src/app/features/dashboard/dashboard.page.css (değişti)

````css
:host {
  display: block;
}
.dashboard-page {
  min-height: 100dvh;
  background: var(--color-bg);
}
.dashboard-shell {
  width: min(100%, 760px);
  margin-inline: auto;
  min-height: 100dvh;
  border-inline: 1px solid var(--color-border);
  background: var(--color-surface);
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
.dashboard-sticky {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  backdrop-filter: blur(18px);
}
.discover-viewport {
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
}
.discover-track {
  display: flex;
  transition: transform var(--motion-fast) ease-out;
}
.discover-panel {
  flex: 0 0 100%;
  min-width: 0;
  padding: 36px 28px 28px;
  outline-offset: -5px;
}
.feed-heading {
  min-height: 204px;
  padding-bottom: 32px;
}
.feed-emblem {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  background: var(--color-soft-primary);
  color: var(--color-primary);
  margin-bottom: 16px;
}
.feed-scope {
  color: var(--color-muted);
  font-size: 11px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.feed-heading h1 {
  font-size: clamp(24px, 4vw, 30px);
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.04em;
  margin-bottom: 12px;
}
.feed-description {
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.8;
  max-width: 54ch;
}
.feed-placeholder-list {
  display: grid;
  gap: 16px;
}
.compose-fab {
  position: fixed;
  z-index: 35;
  bottom: calc(100px + env(safe-area-inset-bottom));
  right: max(20px, calc((100vw - 760px) / 2 + 20px));
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-panel);
}
@media (max-width: 640px) {
  .discover-panel {
    padding: 28px 16px 20px;
  }
  .feed-heading {
    min-height: 220px;
    padding-bottom: 28px;
  }
  .feed-scope {
    font-size: 10px;
  }
  .feed-description {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .discover-track {
    transition: none;
  }
}
````

## apps/shell/src/app/features/dashboard/dashboard.page.html (değişti)

````html
<div class="dashboard-page" *transloco="let t">
  <div class="dashboard-shell">
    <div class="dashboard-sticky">
      <kx-dashboard-top-bar
        [initials]="profile().initials"
        [avatarUrl]="profile().avatarUrl"
        [drawerOpen]="drawerOpen()"
        [dark]="theme.dark()"
        [language]="language.language()"
        (profileOpened)="profileDrawer().open()"
        (themeChanged)="theme.toggle()"
        (languageChanged)="language.set($event)"
      />
      <kx-dashboard-discover-tabs [active]="active()" (selected)="select($event)" />
    </div>
    <div
      #viewport
      class="discover-viewport"
      (pointerdown)="onPointerDown($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="cancelSwipe()"
    >
      <div class="discover-track" [style.transform]="'translateX(-' + active() * 100 + '%)'">
        @for (feed of feeds; track feed.id; let index = $index) {
        <section
          class="discover-panel"
          role="tabpanel"
          [id]="'dashboard-discover-panel-' + feed.id"
          [attr.aria-labelledby]="'dashboard-discover-tab-' + feed.id"
          [attr.aria-hidden]="active() !== index"
          [inert]="active() !== index"
          [tabIndex]="active() === index ? 0 : -1"
        >
          <div class="feed-heading">
            <span class="feed-emblem" aria-hidden="true"><kx-icon [name]="feed.icon" /></span>
            <p class="feed-scope">{{ t(feed.scopeKey) }}</p>
            <h1>{{ t(feed.headingKey) }}</h1>
            <p class="feed-description">{{ t(feed.descriptionKey) }}</p>
          </div>
          @if (feed.id === 'explore') { @if (posts.loading()) {
          <p role="status">{{t('posts.loading')}}</p>
          } @if (posts.error()) {
          <p class="error-text" role="alert">{{t(posts.error())}}</p>
          <button kxButton type="button" emphasis="outline" (click)="posts.load()">
            {{t('media.retry')}}</button
          >} @for (post of posts.feed(); track post.id) {<kx-social-post-card
            [post]="post"
            [author]="authorFor(post)"
            [language]="language.language()"
          />} @if (!posts.loading() && !posts.error() && !posts.feed().length) {
          <p class="feed-description">{{t('posts.empty')}}</p>
          } } @else {
          <div class="feed-placeholder-list" aria-hidden="true">
            @for (card of skeletons; track card) { <kx-feed-skeleton /> }
          </div>
          }
        </section>
        }
      </div>
    </div>
    <kx-dashboard-bottom-nav />
    <button
      kxIconButton
      type="button"
      class="compose-fab"
      [attr.aria-label]="t('profile.compose')"
      (click)="compose()"
    >
      <kx-icon name="add" />
    </button>
  </div>
  <kx-dashboard-profile-drawer
    #profileDrawerView
    [profile]="profile()"
    [logoutBusy]="logoutBusy()"
    [logoutErrorKey]="logoutErrorKey()"
    (logoutRequested)="logout()"
    (profileRequested)="openProfile()"
    (changed)="drawerOpen.set($event)"
  />
</div>
````

## apps/shell/src/app/features/dashboard/dashboard.page.ts (değişti)

````typescript
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
````

## apps/shell/src/app/features/dashboard/discover-tabs/discover-tabs.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TabStripComponent } from '@kampusx/shared/ui';
import { DISCOVER_FEEDS } from '../mock-data';

@Component({
  selector: 'kx-dashboard-discover-tabs',
  standalone: true,
  imports: [TabStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-tab-strip
    [items]="feeds"
    [active]="active()"
    [scrollable]="true"
    baseId="dashboard-discover"
    labelKey="dashboard.discoverLabel"
    (selected)="selected.emit($event)"
  />`,
})
export class DashboardDiscoverTabsComponent {
  readonly feeds = DISCOVER_FEEDS;
  readonly active = input(0);
  readonly selected = output<number>();
}
````

## apps/shell/src/app/features/dashboard/mock-data.ts (değişti)

````typescript
import type { TabStripItem } from '@kampusx/shared/ui';

export interface DiscoverFeed extends TabStripItem {
  headingKey: string;
  descriptionKey: string;
  scopeKey: string;
  icon: string;
}

export const DISCOVER_FEEDS: readonly DiscoverFeed[] = [
  {
    id: 'explore',
    labelKey: 'dashboard.tabs.explore',
    headingKey: 'dashboard.feeds.explore.title',
    descriptionKey: 'dashboard.feeds.explore.description',
    scopeKey: 'dashboard.mock.explore',
    icon: 'explore',
  },
  {
    id: 'university',
    labelKey: 'dashboard.tabs.university',
    headingKey: 'dashboard.feeds.university.title',
    descriptionKey: 'dashboard.feeds.university.description',
    scopeKey: 'dashboard.mock.school',
    icon: 'school',
  },
  {
    id: 'campus',
    labelKey: 'dashboard.tabs.campus',
    headingKey: 'dashboard.feeds.campus.title',
    descriptionKey: 'dashboard.feeds.campus.description',
    scopeKey: 'dashboard.mock.campus',
    icon: 'apartment',
  },
  {
    id: 'department',
    labelKey: 'dashboard.tabs.department',
    headingKey: 'dashboard.feeds.department.title',
    descriptionKey: 'dashboard.feeds.department.description',
    scopeKey: 'dashboard.mock.department',
    icon: 'code',
  },
];

export const PROFILE_MENU = [
  { id: 'profile', key: 'profile.drawer.profile', icon: 'person' },
  { id: 'history', key: 'profile.drawer.history', icon: 'history' },
  { id: 'community', key: 'profile.drawer.community', icon: 'groups' },
  { id: 'settings', key: 'profile.drawer.settings', icon: 'settings' },
  { id: 'help', key: 'profile.drawer.help', icon: 'help_outline' },
] as const;

export const BOTTOM_NAV = [
  { id: 'home', key: 'dashboard.nav.home', icon: null },
  { id: 'messages', key: 'dashboard.nav.messages', icon: 'chat_bubble' },
  { id: 'search', key: 'dashboard.nav.search', icon: 'search' },
] as const;

export const SKELETON_CARDS = ['first', 'second', 'third'] as const;
````

## apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.css (değişti)

````css
:host {
  display: contents;
}
.profile-content {
  padding: max(28px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
}
.drawer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.close-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  transition: transform var(--motion-fast) ease-out;
  cursor: pointer;
}
.close-button:hover {
  background: var(--color-surface-alt);
}
.close-button:active {
  transform: scale(0.94);
}
.profile-details {
  padding-block: 20px 28px;
}
.profile-details h2 {
  overflow-wrap: anywhere;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin-bottom: 4px;
}
.profile-avatar-link,
.profile-name-link {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: inherit;
  text-align: left;
}
.profile-avatar-link {
  border-radius: 50%;
  min-width: 72px;
  min-height: 72px;
}
.profile-name-link {
  min-height: 52px;
  width: 100%;
  margin-bottom: 10px;
}
.profile-handle {
  color: var(--color-muted);
  font-size: 12px;
}
.drawer-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--color-muted);
}
.drawer-counts strong {
  color: var(--color-text);
}
.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin-block: 8px;
}
.profile-menu-item:not([aria-disabled]) {
  cursor: pointer;
}
.logout-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.logout-button {
  transition: transform var(--motion-fast) ease-out;
}
.profile-details p {
  color: var(--color-muted);
  line-height: 1.65;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.profile-details p + p {
  margin-top: 6px;
}
.profile-menu {
  display: grid;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}
.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 52px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  font-weight: 700;
  font-size: 14px;
  cursor: default;
}
.profile-menu-item:hover {
  background: var(--color-surface-alt);
}
.profile-menu-item:focus-visible {
  outline-offset: -3px;
}
.profile-menu-item kx-icon:last-child {
  margin-left: auto;
  color: var(--color-muted);
}
@media (prefers-reduced-motion: reduce) {
  .close-button {
    transition: none;
  }
}
````

## apps/shell/src/app/features/dashboard/profile-drawer/profile-drawer.component.ts (değişti)

````typescript
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent, ButtonComponent, IconComponent, ModalDrawerComponent } from '@kampusx/shared/ui';
import { PROFILE_MENU } from '../mock-data';
import type { DashboardProfile } from '../dashboard-profile';
import { LocalizedNumberPipe } from '@kampusx/shared/util';

@Component({
  selector: 'kx-dashboard-profile-drawer',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    ButtonComponent,
    IconComponent,
    ModalDrawerComponent,
    LocalizedNumberPipe,
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
        <div class="drawer-counts">
          <span
            ><strong>{{ profile().followingCount | kxNumber }}</strong> {{ t('profile.following') }}</span
          ><span
            ><strong>{{ profile().followersCount | kxNumber }}</strong> {{ t('profile.followers') }}</span
          >
        </div>
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
````

## apps/shell/src/app/features/dashboard/top-bar/top-bar.component.ts (değişti)

````typescript
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
        aria-controls="dashboard-profile-drawer"
        [attr.aria-label]="t('dashboard.openProfile')"
        [attr.aria-expanded]="drawerOpen()"
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
  readonly drawerOpen = input(false);
  readonly language = input('tr');
  readonly dark = input(false);
  readonly profileOpened = output<void>();
  readonly languageChanged = output<string>();
  readonly themeChanged = output<void>();
}
````
