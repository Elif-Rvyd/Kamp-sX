import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  SocialPostCardComponent,
  ReportReasonComponent,
  FormFieldComponent,
  EmbeddedPostComponent,
  ModalDrawerComponent,
} from '@kampusx/shared/ui';
import type { PostAction } from '@kampusx/shared/ui';
import type { PostAuthor, SocialPost } from '@kampusx/shared/util';
import { PostActionsService, type ReportReason } from '../../core/post-actions.service';
import { ProfileService } from '../../core/profile.service';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { NoticeService } from '../../core/notice.service';
import { MediaError } from '../../core/media.service';
import { PostViewsService } from '../../core/post-views.service';
import { PostViewDirective } from './post-view.directive';
import { SharePostComponent } from '../messages/share-post.component';

let instance = 0;
@Component({
  selector: 'kx-post-entry',
  standalone: true,
  imports: [
    TranslocoDirective,
    RouterLink,
    SocialPostCardComponent,
    ConfirmDialogComponent,
    ButtonComponent,
    ReportReasonComponent,
    FormFieldComponent,
    EmbeddedPostComponent,
    ModalDrawerComponent,
    PostViewDirective,
    SharePostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @if (visible(); as value) {
      <kx-social-post-card
        [kxPostView]="value.id"
        [viewsCount]="views.totals()[value.id] ?? null"
        [post]="value"
        [author]="displayAuthor()"
        [ownerId]="owner()"
        [language]="language.language()"
        [postLink]="'/posts/' + value.id"
        [authorLink]="value.userId === owner() ? '/profile' : '/people/' + value.userId"
        [busy]="actions.busy(value.id)"
        [reactionsReady]="actions.reactionsReady(value.id)"
        [repostsEnabled]="!repostUncertain()"
        (action)="run($event, value)"
      >
        @if (value.repostOfId) {
          <kx-embedded-post
            postEmbed
            [post]="original()?.post ?? null"
            [author]="original()?.author ?? null"
            [loading]="originalLoading()"
            [failed]="originalFailed()"
          />
        }
      </kx-social-post-card>
      @if (repostUncertain()) {
        <p class="entry-error error-text" role="alert">
          {{ t('social.repost.uncertain') }} <a routerLink="/profile">{{ t('profile.title') }}</a>
        </p>
      }
      @if (actions.reactionsFailed(value.id)) {
        <div class="entry-error">
          <p class="error-text" role="alert">{{ t(error() || 'social.errors.read') }}</p>
          <button kxButton type="button" emphasis="ghost" (click)="retryReactions(value.id)">
            {{ t('media.retry') }}
          </button>
        </div>
      }
    }
    <kx-share-post #shareSheet [postId]="post().id" />
    <kx-modal-drawer
      #viewsSheet
      position="bottom"
      [drawerId]="id + '-views'"
      [labelledBy]="id + '-views-title'"
    >
      <div class="views-info">
        <h2 [id]="id + '-views-title'">{{ t('social.views.title') }}</h2>
        <p>{{ t('social.views.body') }}</p>
        @if (views.failed()) {
          <p class="error-text" role="status">{{ t('social.views.failed') }}</p>
        }
        <button kxButton type="button" emphasis="ghost" data-drawer-close (click)="viewsSheet.close()">
          {{ t('common.close') }}
        </button>
      </div>
    </kx-modal-drawer>
    @if (error() && !actions.reactionsFailed(post().id)) {
      <p class="entry-error error-text" role="alert">
        {{ t(error()) }}
        @if (current()?.deletionPending) {
          <a routerLink="/settings/archive">{{ t('social.archive.title') }}</a>
        }
      </p>
    }
    <kx-confirm-dialog
      #quoteDialog
      [dialogId]="id + '-quote'"
      titleKey="social.repost.quote"
      bodyKey="social.repost.quoteBody"
      cancelKey="social.cancel"
      confirmKey="social.repost.publish"
      [destructive]="false"
      [confirmDisabled]="quoteInvalid() || repostUncertain()"
    >
      <kx-form-field
        [fieldId]="id + '-quote-content'"
        labelKey="social.repost.quoteLabel"
        placeholderKey="social.repost.quoteLabel"
        [control]="quoteContent"
        [multiline]="true"
        [maxLength]="2000"
      />
    </kx-confirm-dialog>
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
      <kx-report-reason
        [name]="id + '-reason'"
        [value]="reportReason()"
        (changed)="reportReason.set($event)"
      />
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
    .views-info {
      padding: 24px;
      display: grid;
      gap: 16px;
      line-height: 1.7;
    }
    .views-info h2 {
      font-size: 1.125rem;
    }
  `,
})
export class PostEntryComponent {
  readonly post = input.required<SocialPost>();
  readonly author = input<PostAuthor>();
  readonly mode = input<'active' | 'archive'>('active');
  readonly actions = inject(PostActionsService);
  readonly views = inject(PostViewsService);
  private readonly shareSheet = viewChild.required<SharePostComponent>('shareSheet');
  private readonly viewsSheet = viewChild.required<ModalDrawerComponent>('viewsSheet');
  readonly language = inject(LanguageService);
  private readonly auth = inject(AuthService);
  private readonly destroy = inject(DestroyRef);
  private readonly quoteDialog = viewChild.required<ConfirmDialogComponent>('quoteDialog');
  readonly quoteContent = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(2000)],
  });
  private readonly quoteValue = toSignal(this.quoteContent.valueChanges, { initialValue: '' });
  readonly quoteInvalid = computed(() => !this.quoteValue().trim() || this.quoteValue().length > 2000);
  readonly repostUncertain = computed(() => this.actions.repostUncertain(this.post().id));
  readonly original = signal<{ post: SocialPost; author: PostAuthor } | null>(null);
  readonly originalLoading = signal(false);
  readonly originalFailed = signal(false);
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
    effect((cleanup) => {
      const post = this.post();
      this.auth.sessionEpoch();
      this.actions.readRevision();
      this.original.set(null);
      this.originalFailed.set(false);
      this.originalLoading.set(false);
      if (!post.repostOfId) return;
      const request = new AbortController();
      cleanup(() => request.abort());
      this.originalLoading.set(true);
      void this.actions
        .embedded(post.repostOfId, AbortSignal.any([request.signal, AbortSignal.timeout(15000)]))
        .then((value) => {
          if (!request.signal.aborted && !this.destroy.destroyed) this.original.set(value);
        })
        .catch(() => {
          if (!request.signal.aborted && !this.destroy.destroyed) this.originalFailed.set(true);
        })
        .finally(() => {
          if (!request.signal.aborted && !this.destroy.destroyed) this.originalLoading.set(false);
        });
    });
  }
  retryReactions(id: string): void {
    this.error.set('');
    this.actions.retryReactions(id);
  }
  async run(action: PostAction, post: SocialPost): Promise<void> {
    if (this.actions.busy(post.id)) return;
    this.error.set('');
    const owner = this.owner(),
      epoch = this.auth.sessionEpoch();
    const current = () =>
      !this.destroy.destroyed &&
      this.owner() === owner &&
      this.auth.sessionEpoch() === epoch &&
      this.post().id === post.id;
    try {
      if (action === 'share') {
        this.shareSheet().open();
        return;
      }
      if (action === 'views') {
        this.views.load(post.id, true);
        this.viewsSheet().open();
        return;
      }
      if (action === 'comments') {
        await this.router.navigate(['/posts', post.id]);
        return;
      }
      if (action === 'repost' || action === 'quote') {
        if (this.repostUncertain()) return;
        if (action === 'quote') {
          if (!(await this.quoteDialog().ask()) || !current()) return;
          await this.actions.quote(post, this.quoteContent.value);
          if (!current()) return;
          this.quoteContent.reset();
          this.notice.show('social.repost.quoted');
        } else {
          await this.actions.repost(post, !post.ownRepostId);
          if (!current()) return;
          this.notice.show(post.ownRepostId ? 'social.repost.removed' : 'social.repost.created');
        }
      } else if (action === 'like' || action === 'bookmark') await this.actions.react(post, action);
      else if (action === 'delete') {
        if (!(await this.deleteDialog().ask()) || !current()) return;
        await this.actions.remove(post);
        this.notice.show('social.notice.deleted');
      } else if (action === 'pin') {
        await this.actions.pin(post);
        this.notice.show(post.pinnedAt || post.pinSlot ? 'social.notice.unpinned' : 'social.notice.pinned');
      } else if (action === 'archive' || action === 'restore') {
        await this.actions.archive(post, action === 'archive');
        this.notice.show(action === 'archive' ? 'social.notice.archived' : 'social.notice.restored');
      } else if (action === 'block') {
        if (!(await this.blockDialog().ask()) || !current()) return;
        await this.actions.block(post, this.displayAuthor().fullName);
        this.notice.show('social.notice.blocked');
      } else if (action === 'report') {
        if (!(await this.reportDialog().ask()) || !current()) return;
        const created = await this.actions.report(post, this.reportReason());
        this.notice.show(created ? 'social.notice.reported' : 'social.notice.alreadyReported');
      }
    } catch (error) {
      if (!current()) return;
      this.error.set(error instanceof MediaError ? error.key : 'social.errors.save');
    }
  }
}
