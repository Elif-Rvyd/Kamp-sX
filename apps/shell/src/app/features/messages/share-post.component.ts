import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, ModalDrawerComponent } from '@kampusx/shared/ui';
import { AuthService } from '../../core/auth.service';
import { MessagingApiService, MessagingError } from '../../core/messaging-api.service';
import type { InboxRow } from '../../core/messaging.contract';
import { NoticeService } from '../../core/notice.service';

let instance = 0;
@Component({
  selector: 'kx-share-post',
  standalone: true,
  imports: [TranslocoDirective, RouterLink, ButtonComponent, ModalDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-modal-drawer
    #drawer
    position="bottom"
    [drawerId]="id"
    [labelledBy]="id + '-title'"
    (changed)="changed($event)"
  >
    <section *transloco="let t" class="share-sheet">
      <div class="sheet-top">
        <h2 [id]="id + '-title'">{{ t('messaging.shareTitle') }}</h2>
        <button kxButton type="button" emphasis="ghost" data-drawer-close (click)="drawer.close()">
          {{ t('common.close') }}
        </button>
      </div>
      <p>{{ t('messaging.shareBody') }}</p>
      @if (loading()) {
        <p role="status">{{ t('messaging.loading') }}</p>
      }
      @if (error()) {
        <p class="error-text" role="alert">{{ t(error()) }}</p>
      }
      @if (uncertain()) {
        <a [routerLink]="'/messages/' + selected()" (click)="drawer.close()">{{
          t('messaging.checkConversation')
        }}</a>
      }
      @for (row of rows(); track row.conversation_id) {
        <button
          kxButton
          type="button"
          emphasis="outline"
          class="recipient"
          [disabled]="!row.can_send || sending() || uncertain()"
          [busy]="sending() && selected() === row.conversation_id"
          (click)="share(row)"
        >
          <span
            ><strong>{{ row.peer_full_name || row.peer_username || t('messaging.student') }}</strong
            ><span>{{ '@' + (row.peer_username || '') }}</span></span
          >
          <span>{{ t(row.can_send ? 'messaging.send' : 'messaging.readOnlyShort') }}</span>
        </button>
      } @empty {
        @if (!loading() && !error()) {
          <p role="status">{{ t('messaging.emptyBody') }}</p>
        }
      }
      @if (error() && !sending() && !uncertain()) {
        <button kxButton type="button" emphasis="ghost" (click)="load()">{{ t('media.retry') }}</button>
      }
      <a routerLink="/search" (click)="drawer.close()">{{ t('messaging.findFriend') }}</a>
    </section>
  </kx-modal-drawer>`,
  styles: `
    .share-sheet {
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .sheet-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    h2 {
      font-size: 1.125rem;
    }
    p {
      font-size: 0.875rem;
      line-height: 1.7;
    }
    a {
      min-height: 44px;
      display: flex;
      align-items: center;
      color: var(--color-primary);
      text-decoration: underline;
    }
    .recipient {
      width: 100%;
      text-align: start;
    }
    .recipient .button-content {
      width: 100%;
    }
    .recipient span {
      display: grid;
      gap: 4px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .recipient span span {
      font-size: 0.75rem;
    }
  `,
})
export class SharePostComponent {
  readonly postId = input.required<string>();
  readonly id = 'share-post-' + ++instance;
  private readonly drawer = viewChild.required<ModalDrawerComponent>('drawer');
  private readonly auth = inject(AuthService);
  private readonly api = inject(MessagingApiService);
  private readonly notice = inject(NoticeService);
  private readonly destroy = inject(DestroyRef);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly uncertain = signal(false);
  readonly selected = signal('');
  readonly error = signal('');
  readonly rows = signal<InboxRow[]>([]);
  private lifetime = new AbortController();
  constructor() {
    effect(() => {
      this.postId();
      this.auth.sessionEpoch();
      this.lifetime.abort();
      this.lifetime = new AbortController();
      this.rows.set([]);
      this.error.set('');
      this.loading.set(false);
      this.uncertain.set(false);
      this.sending.set(false);
      this.drawer().close();
    });
    this.destroy.onDestroy(() => this.lifetime.abort());
  }
  open() {
    this.drawer().open();
    if (!this.sending() && !this.uncertain()) void this.load();
  }
  changed(open: boolean) {
    if (!open) this.rows.set([]);
  }
  async load() {
    if (this.loading() || this.sending()) return;
    const epoch = this.auth.sessionEpoch(),
      lifetime = this.lifetime;
    this.loading.set(true);
    this.error.set('');
    try {
      const rows = await this.api.inbox(AbortSignal.any([lifetime.signal, AbortSignal.timeout(15000)]));
      if (!lifetime.signal.aborted && epoch === this.auth.sessionEpoch()) this.rows.set(rows);
    } catch (error) {
      if (!lifetime.signal.aborted && epoch === this.auth.sessionEpoch())
        this.error.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
    } finally {
      if (!lifetime.signal.aborted) this.loading.set(false);
    }
  }
  async share(row: InboxRow) {
    if (!row.can_send || this.sending() || this.uncertain()) return;
    const lifetime = this.lifetime,
      epoch = this.auth.sessionEpoch();
    this.sending.set(true);
    this.selected.set(row.conversation_id);
    this.error.set('');
    try {
      await this.api.sharePost(
        row.conversation_id,
        this.postId(),
        AbortSignal.any([lifetime.signal, AbortSignal.timeout(20000)]),
      );
      if (lifetime.signal.aborted || epoch !== this.auth.sessionEpoch()) return;
      this.notice.show('messaging.shared');
      this.drawer().close();
    } catch (error) {
      if (!lifetime.signal.aborted && epoch === this.auth.sessionEpoch()) {
        this.uncertain.set(error instanceof MessagingError && error.uncertain);
        this.error.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
      }
    } finally {
      if (!lifetime.signal.aborted) this.sending.set(false);
    }
  }
}
