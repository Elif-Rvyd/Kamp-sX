import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, FollowPersonComponent, IconComponent } from '@kampusx/shared/ui';
import { AuthService } from '../../../core/auth.service';
import { FollowsService } from '../../../core/follows.service';
import type { FollowAction, FollowPerson } from '../../../core/follow.model';
import { NoticeService } from '../../../core/notice.service';
import { PostActionsService } from '../../../core/post-actions.service';

@Component({
  selector: 'kx-dashboard-recommendations',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, FollowPersonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="recommendations" *transloco="let t" aria-labelledby="recommendations-title">
    <h2 id="recommendations-title">
      <button
        type="button"
        class="recommendations-toggle"
        (click)="expanded.set(!expanded())"
        [attr.aria-expanded]="expanded()"
        aria-controls="recommendations-content"
      >
        {{ t('dashboardSidebar.recommendations')
        }}<kx-icon [name]="expanded() ? 'expand_less' : 'expand_more'" />
      </button>
    </h2>
    @if (expanded()) {
      <div id="recommendations-content" [attr.aria-busy]="loading()">
        <p class="recommendations-description">{{ t('dashboardSidebar.departmentPeople') }}</p>
        @if (loading()) {
          <p class="recommendations-status" role="status">{{ t('social.search.peopleLoading') }}</p>
        }
        @if (error()) {
          <div class="recommendations-status" role="status">
            {{ t('dashboardSidebar.peopleError')
            }}<button kxButton type="button" emphasis="ghost" [disabled]="loading()" (click)="refresh()">
              {{ t('media.retry') }}
            </button>
          </div>
        }
        @if (actionError()) {
          <p class="recommendations-status" role="alert">{{ t(actionError()) }}</p>
        }
        @if (people().length && follows.setupError()) {
          <div class="recommendations-status" role="status">
            {{ t(follows.setupError())
            }}<button kxButton type="button" emphasis="ghost" (click)="follows.retry()">
              {{ t('media.retry') }}
            </button>
          </div>
        }
        @for (person of people(); track person.userId) {
          <kx-follow-person
            variant="suggestion"
            [person]="person"
            [disabled]="!!busy() || !follows.ready()"
            [busy]="busy() === person.userId"
            activeAction="follow"
            (acted)="act(person, $event)"
          />
        }
        @if (!loading() && !error() && !people().length) {
          <p class="recommendations-status" role="status">{{ t('dashboardSidebar.peopleEmpty') }}</p>
        }
      </div>
    }
  </section>`,
  styleUrl: './recommendations.component.css',
})
export class RecommendationsComponent {
  readonly follows = inject(FollowsService);
  private readonly actions = inject(PostActionsService);
  private readonly auth = inject(AuthService);
  private readonly notice = inject(NoticeService);
  private readonly destroy = inject(DestroyRef);
  private readonly wide = inject(DOCUMENT).defaultView?.matchMedia('(min-width: 1024px)');
  readonly expanded = signal(this.wide?.matches ?? false);
  readonly people = signal<FollowPerson[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly actionError = signal('');
  readonly busy = signal<string | null>(null);
  private request?: AbortController;
  private revision = 0;
  private identity = '';
  constructor() {
    const resize = (event: MediaQueryListEvent) => this.expanded.set(event.matches);
    this.wide?.addEventListener('change', resize);
    effect(() => {
      const identity = this.auth.session()?.user.id + ':' + this.auth.sessionEpoch();
      this.follows.privacyRevision();
      this.actions.readRevision();
      const expanded = this.expanded();
      untracked(() => {
        if (identity !== this.identity) {
          this.identity = identity;
          this.busy.set(null);
        }
        this.request?.abort();
        this.revision++;
        this.people.set([]);
        this.loading.set(false);
        this.error.set(false);
        this.actionError.set('');
        if (expanded && this.auth.session()) void this.refresh();
      });
    });
    this.destroy.onDestroy(() => {
      this.request?.abort();
      this.wide?.removeEventListener('change', resize);
    });
  }
  async refresh(): Promise<void> {
    this.request?.abort();
    const request = (this.request = new AbortController()),
      revision = ++this.revision,
      epoch = this.auth.sessionEpoch();
    const current = () =>
      !this.destroy.destroyed &&
      !request.signal.aborted &&
      revision === this.revision &&
      epoch === this.auth.sessionEpoch();
    this.loading.set(true);
    this.error.set(false);
    try {
      const people = await this.follows.departmentSuggestions(request.signal);
      if (current()) this.people.set(people);
    } catch {
      if (current()) this.error.set(true);
    } finally {
      if (current()) this.loading.set(false);
    }
  }
  async act(person: FollowPerson, action: FollowAction): Promise<void> {
    if (action !== 'follow' || this.busy() || !this.follows.ready()) return;
    const epoch = this.auth.sessionEpoch();
    this.busy.set(person.userId);
    this.actionError.set('');
    try {
      await this.follows.follow(person.userId);
      if (!this.destroy.destroyed && epoch === this.auth.sessionEpoch()) {
        this.people.update((rows) => rows.filter((row) => row.userId !== person.userId));
        this.notice.show('follows.saved');
      }
    } catch {
      if (!this.destroy.destroyed && epoch === this.auth.sessionEpoch())
        this.actionError.set('follows.saveError');
    } finally {
      if (!this.destroy.destroyed && epoch === this.auth.sessionEpoch()) this.busy.set(null);
    }
  }
}
