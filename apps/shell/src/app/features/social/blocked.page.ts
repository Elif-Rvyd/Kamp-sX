import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, ConfirmDialogComponent } from '@kampusx/shared/ui';
import { PostActionsService, type BlockedPerson } from '../../core/post-actions.service';
import { MediaError } from '../../core/media.service';
import { NoticeService } from '../../core/notice.service';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';
@Component({
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, ConfirmDialogComponent, SocialPageFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-pages.css',
  template: `<kx-social-page-frame titleKey="social.blocked.title"
    ><ng-container *transloco="let t">
      @if (loading()) {
        <p class="status" role="status">{{ t('posts.loading') }}</p>
      }
      @if (error()) {
        <p class="status error-text" role="alert">{{ t(error()) }}</p>
        <div class="more">
          <button kxButton type="button" emphasis="outline" (click)="load(false)">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @for (person of rows(); track person.blocked_id) {
        <div class="person">
          <span>{{ person.blocked_label || t('posts.author') }}</span
          ><button
            kxButton
            type="button"
            emphasis="outline"
            [busy]="busy() === person.blocked_id"
            [disabled]="!!busy() || loading()"
            (click)="unblock(person)"
          >
            {{ t('social.blocked.unblock') }}
          </button>
        </div>
      }
      @if (!loading() && !error() && !rows().length) {
        <div class="empty">
          <h2>{{ t('social.blocked.empty') }}</h2>
        </div>
      }
      @if (more()) {
        <div class="more">
          <button
            kxButton
            type="button"
            emphasis="outline"
            [busy]="loading()"
            [disabled]="!!busy()"
            (click)="load(true)"
          >
            {{ t('social.loadMore') }}
          </button>
        </div>
      }
      <kx-confirm-dialog
        #confirmation
        dialogId="unblock-person"
        titleKey="social.blocked.unblockTitle"
        bodyKey="social.blocked.unblockBody"
        cancelKey="social.cancel"
        confirmKey="social.blocked.unblock"
      /> </ng-container
  ></kx-social-page-frame>`,
})
export class BlockedPage {
  private readonly actions = inject(PostActionsService);
  private readonly destroy = inject(DestroyRef);
  private readonly notice = inject(NoticeService);
  private readonly confirmation = viewChild.required<ConfirmDialogComponent>('confirmation');
  readonly rows = signal<BlockedPerson[]>([]);
  readonly loading = signal(false);
  readonly busy = signal('');
  readonly error = signal('');
  readonly more = signal(false);
  private revision = 0;
  constructor() {
    bindProfilePage('social.blocked.title');
    void this.load(false);
    this.destroy.onDestroy(() => this.revision++);
  }
  async load(append: boolean): Promise<void> {
    if (this.loading()) return;
    const revision = ++this.revision,
      offset = append ? this.rows().length : 0;
    this.loading.set(true);
    this.error.set('');
    try {
      const rows = await this.actions.blocks(offset);
      if (this.destroy.destroyed || revision !== this.revision) return;
      this.rows.update((previous) => (append ? [...previous, ...rows] : rows));
      this.more.set(rows.length === 30);
    } catch (error) {
      if (!this.destroy.destroyed && revision === this.revision)
        this.error.set(error instanceof MediaError ? error.key : 'social.errors.read');
    } finally {
      if (!this.destroy.destroyed && revision === this.revision) this.loading.set(false);
    }
  }
  async unblock(person: BlockedPerson): Promise<void> {
    if (this.busy() || !(await this.confirmation().ask()) || this.destroy.destroyed) return;
    this.busy.set(person.blocked_id);
    this.error.set('');
    try {
      await this.actions.unblock(person.blocked_id);
      if (!this.destroy.destroyed) {
        this.notice.show('social.notice.unblocked');
        await this.load(false);
      }
    } catch (error) {
      if (!this.destroy.destroyed)
        this.error.set(error instanceof MediaError ? error.key : 'social.errors.save');
    } finally {
      if (!this.destroy.destroyed) this.busy.set('');
    }
  }
}
