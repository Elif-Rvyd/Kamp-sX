import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { EmbeddedPostComponent } from '@kampusx/shared/ui';
import type { SocialPost, PostAuthor } from '@kampusx/shared/util';
import { AuthService } from '../../core/auth.service';
import { PostActionsService } from '../../core/post-actions.service';
@Component({
  selector: 'kx-shared-message-post',
  standalone: true,
  imports: [EmbeddedPostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-embedded-post
    [post]="value()?.post ?? null"
    [author]="value()?.author ?? null"
    [loading]="loading()"
    [failed]="failed()"
  />`,
})
export class SharedMessagePostComponent {
  readonly postId = input.required<string>();
  readonly refresh = input(0);
  readonly value = signal<{ post: SocialPost; author: PostAuthor } | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);
  private readonly auth = inject(AuthService);
  private readonly actions = inject(PostActionsService);
  constructor() {
    effect((cleanup) => {
      const id = this.postId();
      this.refresh();
      this.auth.sessionEpoch();
      this.actions.readRevision();
      const request = new AbortController();
      cleanup(() => request.abort());
      this.value.set(null);
      this.loading.set(true);
      this.failed.set(false);
      void this.actions
        .embedded(id, AbortSignal.any([request.signal, AbortSignal.timeout(15000)]))
        .then((value) => {
          if (!request.signal.aborted) this.value.set(value?.post.archivedAt ? null : value);
        })
        .catch(() => {
          if (!request.signal.aborted) this.failed.set(true);
        })
        .finally(() => {
          if (!request.signal.aborted) this.loading.set(false);
        });
    });
  }
}
