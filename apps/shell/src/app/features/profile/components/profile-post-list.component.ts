import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent, SocialPostCardComponent } from '@kampusx/shared/ui';
import type { Profile, ProfilePost } from '../../../core/profile.model';
@Component({
  selector: 'kx-profile-post-list',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, SocialPostCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @for (post of posts(); track post.id) {
      <kx-social-post-card [post]="post" [author]="profile()" [language]="language()" />
    } @empty {
      <div class="empty-state">
        <kx-icon name="forum" />
        <h2>{{ t('profile.empty.title') }}</h2>
        <p>{{ t('profile.empty.text') }}</p>
      </div>
    }
  </ng-container>`,
  styles: `
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: var(--color-muted);
    }
    .empty-state kx-icon {
      color: var(--color-primary);
      margin-bottom: 16px;
    }
    h2 {
      font-size: 18px;
      font-weight: 800;
      color: var(--color-text);
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      line-height: 1.8;
    }
  `,
})
export class ProfilePostListComponent {
  readonly posts = input.required<readonly ProfilePost[]>();
  readonly profile = input.required<Profile>();
  readonly language = input('tr');
}
