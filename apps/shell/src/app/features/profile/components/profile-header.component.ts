import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AvatarComponent,
  ButtonComponent,
  IconButtonComponent,
  IconComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
  FollowCountsComponent,
} from '@kampusx/shared/ui';
import { profileInitials } from '@kampusx/shared/util';
import type { Profile } from '../../../core/profile.model';
@Component({
  selector: 'kx-profile-header',
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    ButtonComponent,
    IconButtonComponent,
    IconComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
    FollowCountsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css',
})
export class ProfileHeaderComponent {
  readonly profile = input.required<Profile>();
  readonly editable = input(true);
  readonly language = input('tr');
  readonly dark = input(false);
  readonly backRequested = output<void>();
  readonly editRequested = output<void>();
  readonly languageChanged = output<string>();
  readonly themeChanged = output<void>();
  readonly followError = input('');
  readonly followLoading = input(false);
  readonly followRetry = output<void>();
  readonly collapsed = signal(false);
  readonly initials = computed(() => profileInitials(this.profile().fullName));
  readonly joined = computed(() =>
    Number.isFinite(Date.parse(this.profile().joinedAt))
      ? new Intl.DateTimeFormat(this.language() === 'tr' ? 'tr-TR' : 'en-US', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(this.profile().joinedAt))
      : '',
  );
  private readonly name = viewChild.required<ElementRef<HTMLElement>>('name');
  constructor() {
    const document = inject(DOCUMENT),
      destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.collapsed.set(!entry.isIntersecting && entry.boundingClientRect.top < 64);
        },
        { rootMargin: '-64px 0px 0px 0px' },
      );
      observer.observe(this.name().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
      document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
}
