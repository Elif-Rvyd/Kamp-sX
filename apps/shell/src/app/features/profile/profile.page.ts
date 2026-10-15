import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, IconButtonComponent, IconComponent, TabStripComponent } from '@kampusx/shared/ui';
import { PostsService } from '../../core/posts.service';
import { filterProfilePosts, horizontalSwipe, swipePoint, type SwipePoint } from '@kampusx/shared/util';
import { ProfileService } from '../../core/profile.service';
import { LanguageService } from '../../core/language.service';
import { ThemeService } from '../../core/theme.service';
import { DashboardBottomNavComponent } from '../dashboard/bottom-nav/bottom-nav.component';
import { ProfileHeaderComponent } from './components/profile-header.component';
import { ProfilePostListComponent } from './components/profile-post-list.component';
import { bindProfilePage } from './profile-page-context';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ButtonComponent,
    IconButtonComponent,
    IconComponent,
    TabStripComponent,
    DashboardBottomNavComponent,
    ProfileHeaderComponent,
    ProfilePostListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage {
  readonly profiles = inject(ProfileService);
  readonly postsApi = inject(PostsService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly active = signal(0);
  readonly posts = computed(() => filterProfilePosts(this.profiles.posts(), this.active()));
  readonly tabs = [
    { id: 'posts', labelKey: 'profile.tabs.posts' },
    { id: 'replies', labelKey: 'profile.tabs.replies' },
    { id: 'retweets', labelKey: 'profile.tabs.retweets' },
  ];
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private swipe: SwipePoint | null = null;
  constructor() {
    bindProfilePage('profile.title');
  }
  edit(): void {
    void this.router.navigateByUrl('/profile/edit');
  }
  compose(): void {
    void this.router.navigateByUrl('/compose');
  }
  back(): void {
    void this.router.navigateByUrl('/dashboard');
  }
  pointerDown(event: PointerEvent): void {
    if (!event.isPrimary || !['touch', 'pen'].includes(event.pointerType)) {
      this.swipe = null;
      return;
    }
    this.swipe = swipePoint(event);
    this.viewport().nativeElement.setPointerCapture(event.pointerId);
  }
  pointerUp(event: PointerEvent): void {
    const direction = horizontalSwipe(this.swipe, swipePoint(event));
    this.swipe = null;
    if (direction) this.active.set(Math.max(0, Math.min(2, this.active() + direction)));
  }
  cancelSwipe(): void {
    this.swipe = null;
  }
}
