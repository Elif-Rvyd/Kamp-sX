import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
import { PostEntryComponent } from '../../posts/post-entry.component';
import type { Profile, ProfilePost } from '../../../core/profile.model';
import { PostActionsService } from '../../../core/post-actions.service';
@Component({
  selector: 'kx-profile-post-list',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, PostEntryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @if (featured().length) {
      <section class="featured-posts" [attr.aria-label]="t('profile.featured')">
        <h2 class="featured-title">{{ t('profile.featured') }}</h2>
        @for (post of featured(); track post.id) {
          <kx-post-entry [post]="post" [author]="profile()" />
        }
      </section>
    }
    @for (post of remaining(); track post.id) {
      <kx-post-entry [post]="post" [author]="profile()" />
    } @empty {
      @if (!featured().length) {
        <div class="empty-state">
          <kx-icon name="forum" />
          <h2>{{ t('profile.empty.title') }}</h2>
          <p>{{ t('profile.empty.text') }}</p>
        </div>
      }
    }
  </ng-container>`,
  styles: `
    .featured-title {
      font-size: 14px;
      font-weight: 800;
      padding: 16px 20px;
      margin: 0;
      color: var(--color-text);
      border-bottom: 1px solid var(--color-border);
    }
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
  private readonly actions = inject(PostActionsService);
  readonly posts = input.required<readonly ProfilePost[]>();
  readonly profile = input.required<Profile>();
  readonly language = input('tr');
  readonly featured = computed(() =>
    this.posts().filter((post) => {
      const current = this.actions.view(post);
      return (
        current && current.kind === 'post' && !current.parentId && !current.archivedAt && !!current.pinnedAt
      );
    }),
  );
  readonly remaining = computed(() => {
    const featured = new Set(this.featured().map((post) => post.id));
    return this.posts().filter((post) => !featured.has(post.id));
  });
}
