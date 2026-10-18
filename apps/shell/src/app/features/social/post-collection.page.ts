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
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent } from '@kampusx/shared/ui';
import { PostActionsService } from '../../core/post-actions.service';
import type { StoredPost } from '../../core/posts.service';
import { FollowsService } from '../../core/follows.service';
import { MediaError } from '../../core/media.service';
import { PostEntryComponent } from '../posts/post-entry.component';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';
@Component({
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, PostEntryComponent, SocialPageFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-pages.css',
  template: `<kx-social-page-frame [titleKey]="prefix + '.title'"
    ><ng-container *transloco="let t">
      @if (error()) {
        <p class="status error-text" role="alert">{{ t(error()) }}</p>
        <div class="more">
          <button kxButton emphasis="outline" type="button" (click)="load(false)">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @if (loading()) {
        <p class="status" role="status">{{ t('posts.loading') }}</p>
      }
      @for (post of rows(); track post.id) {
        <kx-post-entry [post]="post" [mode]="mode === 'archive' ? 'archive' : 'active'" />
      }
      @if (!loading() && !error() && !visibleCount()) {
        <div class="empty">
          <h2>{{ t(prefix + '.empty') }}</h2>
          <p>{{ t(prefix + '.description') }}</p>
        </div>
      }
      @if (more() && rows().length) {
        <div class="more">
          <button kxButton type="button" emphasis="outline" [busy]="loading()" (click)="load(true)">
            {{ t('social.loadMore') }}
          </button>
        </div>
      }
    </ng-container></kx-social-page-frame
  >`,
})
export class PostCollectionPage {
  readonly mode: 'archive' | 'bookmarks' =
    inject(ActivatedRoute).snapshot.data['collection'] === 'archive' ? 'archive' : 'bookmarks';
  readonly prefix = 'social.' + this.mode;
  private readonly actions = inject(PostActionsService);
  private readonly follows = inject(FollowsService);
  private readonly destroy = inject(DestroyRef);
  readonly rows = signal<StoredPost[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly more = signal(false);
  readonly visibleCount = computed(
    () =>
      this.rows().filter((post) => {
        const value = this.actions.view(post);
        return (
          value &&
          (this.mode === 'archive'
            ? !!value.archivedAt || value.deletionPending
            : !value.archivedAt && !value.deletionPending)
        );
      }).length,
  );
  private revision = 0;
  constructor() {
    bindProfilePage(this.prefix + '.title');
    effect(() => {
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => void this.load(false));
    });
    this.destroy.onDestroy(() => this.revision++);
  }
  async load(append: boolean): Promise<void> {
    if (append && this.loading()) return;
    const revision = ++this.revision,
      offset = append ? this.rows().length : 0;
    this.loading.set(true);
    this.error.set('');
    if (!append) this.rows.set([]);
    try {
      const rows = await this.actions.collection(this.mode, offset);
      if (this.destroy.destroyed || revision !== this.revision) return;
      this.rows.update((old) => [...old, ...rows.filter((p) => !old.some((v) => v.id === p.id))]);
      this.more.set(rows.length === 30);
    } catch (error) {
      if (!this.destroy.destroyed && revision === this.revision)
        this.error.set(error instanceof MediaError ? error.key : 'social.errors.read');
    } finally {
      if (!this.destroy.destroyed && revision === this.revision) this.loading.set(false);
    }
  }
}
