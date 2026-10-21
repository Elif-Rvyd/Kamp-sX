import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonComponent, ConfirmDialogComponent, SocialPostCardComponent } from '@kampusx/shared/ui';
import type { PostAction } from '@kampusx/shared/ui';
import type { PostAuthor, SocialPost } from '@kampusx/shared/util';
import { PostActionsService, type ReportReason } from '../../core/post-actions.service';
import { ProfileService } from '../../core/profile.service';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { NoticeService } from '../../core/notice.service';
import { MediaError } from '../../core/media.service';

let instance = 0;
@Component({
  selector: 'kx-post-entry',
  standalone: true,
  imports: [TranslocoDirective, RouterLink, SocialPostCardComponent, ConfirmDialogComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @if (visible(); as value) {
      <kx-social-post-card
        [post]="value"
        [author]="displayAuthor()"
        [ownerId]="owner()"
        [language]="language.language()"
        [postLink]="'/posts/' + value.id"
        [authorLink]="value.userId === owner() ? '/profile' : '/people/' + value.userId"
        [busy]="actions.busy(value.id)"
        [reactionsReady]="actions.reactionsReady(value.id)"
        (action)="run($event, value)"
      />
      @if (actions.reactionsFailed(value.id)) {
        <div class="entry-error">
          <p class="error-text" role="alert">{{ t(error() || 'social.errors.read') }}</p>
          <button kxButton type="button" emphasis="ghost" (click)="retryReactions(value.id)">
            {{ t('media.retry') }}
          </button>
        </div>
      }
    }
    @if (error() && !actions.reactionsFailed(post().id)) {
      <p class="entry-error error-text" role="alert">
        {{ t(error()) }}
        @if (current()?.deletionPending) {
          <a routerLink="/settings/archive">{{ t('social.archive.title') }}</a>
        }
      </p>
    }
    <kx-confirm-dialog
      #deleteDialog
      [dialogId]="id + '-delete'"
      titleKey="social.delete.title"
      bodyKey="social.delete.body"
      cancelKey="social.cancel"
      confirmKey="social.menu.delete"
    />
    <kx-confirm-dialog
      #blockDialog
      [dialogId]="id + '-block'"
      titleKey="social.block.title"
      bodyKey="social.block.body"
      cancelKey="social.cancel"
      confirmKey="social.menu.block"
    />
    <kx-confirm-dialog
      #reportDialog
      [dialogId]="id + '-report'"
      titleKey="social.report.title"
      bodyKey="social.report.body"
      cancelKey="social.cancel"
      confirmKey="social.menu.report"
    >
      <fieldset>
        <legend>{{ t('social.report.reason') }}</legend>
        @for (reason of reasons; track reason) {
          <label
            ><input
              type="radio"
              [name]="id + '-reason'"
              [value]="reason"
              [checked]="reportReason() === reason"
              (change)="reportReason.set(reason)"
            />{{ t('social.report.' + reason) }}</label
          >
        }
      </fieldset>
    </kx-confirm-dialog>
  </ng-container>`,
  styles: `
    :host {
      display: block;
    }
    .entry-error {
      padding: 12px 20px;
      font-size: 13px;
    }
    .entry-error a {
      display: inline-block;
      padding: 12px;
      text-decoration: underline;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 16px 0;
    }
    legend {
      font-weight: 700;
      margin-bottom: 8px;
    }
    label {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      cursor: pointer;
    }
    input {
      accent-color: var(--color-primary);
      width: 18px;
      height: 18px;
    }
  `,
})
export class PostEntryComponent {
  readonly post = input.required<SocialPost>();
  readonly author = input<PostAuthor>();
  readonly mode = input<'active' | 'archive'>('active');
  readonly actions = inject(PostActionsService);
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly profiles = inject(ProfileService);
  private readonly i18n = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly notice = inject(NoticeService);
  private readonly deleteDialog = viewChild.required<ConfirmDialogComponent>('deleteDialog');
  private readonly blockDialog = viewChild.required<ConfirmDialogComponent>('blockDialog');
  private readonly reportDialog = viewChild.required<ConfirmDialogComponent>('reportDialog');
  readonly id = 'post-entry-' + ++instance;
  readonly error = signal('');
  readonly reportReason = signal<ReportReason>('spam');
  readonly reasons: readonly ReportReason[] = ['spam', 'harassment', 'inappropriate', 'other'];
  readonly owner = computed(() => this.auth.session()?.user.id ?? '');
  readonly current = computed(() => this.actions.view(this.post()));
  readonly visible = computed(() => {
    const value = this.current();
    if (!value) return null;
    const archived = !!value.archivedAt || !!value.deletionPending;
    return (this.mode() === 'archive' ? archived : !archived) ? value : null;
  });
  readonly displayAuthor = computed(() => {
    this.language.language();
    return (
      this.author() ??
      (this.post().userId === this.owner()
        ? this.profiles.profile()
        : { fullName: this.i18n.translate('posts.author') })
    );
  });
  constructor() {
    effect(() => {
      const post = this.post();
      untracked(() => this.actions.observe(post));
    });
  }
  retryReactions(id: string): void {
    this.error.set('');
    this.actions.retryReactions(id);
  }
  async run(action: PostAction, post: SocialPost): Promise<void> {
    if (this.actions.busy(post.id)) return;
    this.error.set('');
    try {
      if (action === 'comments') {
        await this.router.navigate(['/posts', post.id]);
        return;
      }
      if (action === 'like' || action === 'bookmark') await this.actions.react(post, action);
      else if (action === 'delete') {
        if (!(await this.deleteDialog().ask())) return;
        await this.actions.remove(post);
        this.notice.show('social.notice.deleted');
      } else if (action === 'pin') {
        await this.actions.pin(post);
        this.notice.show(post.pinnedAt || post.pinSlot ? 'social.notice.unpinned' : 'social.notice.pinned');
      } else if (action === 'archive' || action === 'restore') {
        await this.actions.archive(post, action === 'archive');
        this.notice.show(action === 'archive' ? 'social.notice.archived' : 'social.notice.restored');
      } else if (action === 'block') {
        if (!(await this.blockDialog().ask())) return;
        await this.actions.block(post, this.displayAuthor().fullName);
        this.notice.show('social.notice.blocked');
      } else if (action === 'report') {
        if (!(await this.reportDialog().ask())) return;
        const created = await this.actions.report(post, this.reportReason());
        this.notice.show(created ? 'social.notice.reported' : 'social.notice.alreadyReported');
      }
    } catch (error) {
      this.error.set(error instanceof MediaError ? error.key : 'social.errors.save');
    }
  }
}
