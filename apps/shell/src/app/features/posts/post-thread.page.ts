import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, ConfirmDialogComponent, FormFieldComponent } from '@kampusx/shared/ui';
import type { PostComment } from '@kampusx/shared/util';
import { PostActionsService } from '../../core/post-actions.service';
import { AuthService } from '../../core/auth.service';
import { FollowsService } from '../../core/follows.service';
import { MediaError } from '../../core/media.service';
import { LanguageService } from '../../core/language.service';
import { NoticeService } from '../../core/notice.service';
import type { StoredPost } from '../../core/posts.service';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from '../social/social-page-frame.component';
import { PostEntryComponent } from './post-entry.component';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    SocialPageFrameComponent,
    PostEntryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../social/social-pages.css',
  template: `<kx-social-page-frame titleKey="social.thread.title" back="/dashboard"
    ><ng-container *transloco="let t">
      @if (loading()) {
        <p class="status" role="status">{{ t('posts.loading') }}</p>
      }
      @if (readError()) {
        <p class="status error-text" role="alert">{{ t(readError()) }}</p>
        <div class="more">
          <button kxButton type="button" emphasis="outline" (click)="load(false)">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @if (visiblePost(); as value) {
        <kx-post-entry [post]="value" />
        @if (replyTo(); as parent) {
          <div class="reply-target">
            <p>{{ t('social.thread.replying') }}: {{ parent.content }}</p>
            <button
              kxButton
              type="button"
              emphasis="ghost"
              [disabled]="sending()"
              (click)="changeReply(null)"
            >
              {{ t('social.cancel') }}
            </button>
          </div>
        }
        <form
          novalidate
          (submit)="send($event)"
          (compositionstart)="composing = true"
          (compositionend)="composing = false"
        >
          <kx-form-field
            fieldId="comment-content"
            labelKey="social.thread.label"
            placeholderKey="social.thread.label"
            [control]="content"
            [multiline]="true"
            [maxLength]="2000"
          />
          @if (saveError()) {
            <p class="status error-text" role="alert">{{ t(saveError()) }}</p>
          }
          <div class="form-actions">
            <button kxButton type="submit" [busy]="sending()">
              {{ t(replyTo() ? 'social.thread.reply' : 'social.thread.send') }}
            </button>
          </div>
        </form>
        @for (comment of ordered(); track comment.id) {
          <article class="comment" [class.reply]="!!comment.parent_id">
            <strong>{{ t(comment.user_id === owner() ? 'social.thread.you' : 'posts.author') }}</strong
            ><time [attr.datetime]="comment.created_at"> · {{ date(comment.created_at) }}</time>
            <p>{{ comment.content }}</p>
            @if (!comment.parent_id) {
              <button
                kxButton
                type="button"
                emphasis="ghost"
                [disabled]="sending()"
                (click)="changeReply(comment)"
              >
                {{ t('social.thread.reply') }}
              </button>
            }
          </article>
        }
        @if (!loading() && !comments().length) {
          <p class="empty">{{ t('social.thread.empty') }}</p>
        }
        @if (more()) {
          <div class="more">
            <button kxButton type="button" emphasis="outline" [busy]="loading()" (click)="load(true)">
              {{ t('social.loadMore') }}
            </button>
          </div>
        }
      } @else if (!loading() && !readError()) {
        <div class="empty">
          <h2>{{ t('social.errors.unavailable') }}</h2>
        </div>
      }
      <kx-confirm-dialog
        #discard
        dialogId="discard-comment"
        titleKey="social.thread.discardTitle"
        bodyKey="social.thread.discardBody"
        cancelKey="social.thread.keep"
        confirmKey="social.thread.discard"
      /> </ng-container
  ></kx-social-page-frame>`,
})
export class PostThreadPage {
  private readonly actions = inject(PostActionsService);
  private readonly auth = inject(AuthService);
  private readonly follows = inject(FollowsService);
  private readonly destroy = inject(DestroyRef);
  private readonly language = inject(LanguageService);
  private readonly notice = inject(NoticeService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private readonly discard = viewChild.required<ConfirmDialogComponent>('discard');
  readonly content = new FormControl('', { nonNullable: true });
  readonly post = signal<StoredPost | null>(null);
  readonly comments = signal<PostComment[]>([]);
  readonly replyTo = signal<PostComment | null>(null);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly more = signal(false);
  readonly readError = signal('');
  readonly saveError = signal('');
  readonly owner = computed(() => this.auth.session()?.user.id);
  readonly visiblePost = computed(() => {
    const post = this.post();
    if (!post) return null;
    const value = this.actions.view(post);
    return value && !value.archivedAt && !value.deletionPending ? post : null;
  });
  readonly ordered = computed(() => {
    const rows = this.comments(),
      roots = rows.filter((c) => !c.parent_id);
    return [
      ...roots.flatMap((c) => [c, ...rows.filter((r) => r.parent_id === c.id)]),
      ...rows.filter((c) => c.parent_id && !roots.some((r) => r.id === c.parent_id)),
    ];
  });
  composing = false;
  private revision = 0;
  private request?: AbortController;
  private draftId = '';
  private draftSignature = '';
  constructor() {
    bindProfilePage('social.thread.title');
    effect(() => {
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => void this.load(false));
    });
    this.destroy.onDestroy(() => {
      this.request?.abort();
      this.revision++;
    });
  }
  date(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf())
      ? ''
      : new Intl.DateTimeFormat(this.language.language() === 'tr' ? 'tr-TR' : 'en-US', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(date);
  }
  async load(append: boolean): Promise<void> {
    if (append && this.loading()) return;
    this.request?.abort();
    const revision = ++this.revision,
      request = (this.request = new AbortController());
    const timeout = setTimeout(() => request.abort(), 20000),
      offset = append ? this.comments().length : 0;
    this.loading.set(true);
    this.readError.set('');
    if (!append) {
      this.post.set(null);
      this.comments.set([]);
    }
    try {
      const [post, comments] = await Promise.all([
        this.actions.find(this.id, request.signal),
        this.actions.comments(this.id, offset, request.signal),
      ]);
      if (this.destroy.destroyed || revision !== this.revision) return;
      this.post.set(post);
      this.comments.update((old) => [...old, ...comments.filter((c) => !old.some((v) => v.id === c.id))]);
      this.more.set(comments.length === 50);
      if (!post || (this.replyTo() && !this.comments().some((c) => c.id === this.replyTo()?.id)))
        this.replyTo.set(null);
    } catch (error) {
      if (!this.destroy.destroyed && revision === this.revision)
        this.readError.set(error instanceof MediaError ? error.key : 'social.errors.read');
    } finally {
      clearTimeout(timeout);
      if (!this.destroy.destroyed && revision === this.revision) this.loading.set(false);
    }
  }
  changeReply(value: PostComment | null): void {
    if (!this.sending()) this.replyTo.set(value);
  }
  async send(event: Event): Promise<void> {
    event.preventDefault();
    const post = this.visiblePost(),
      text = this.content.value.trim();
    if (!post || this.sending() || this.composing) return;
    if (!text || text.length > 2000) {
      this.saveError.set('social.errors.comment');
      return;
    }
    const parent = this.replyTo()?.id ?? null,
      signature = JSON.stringify([text, parent]);
    if (signature !== this.draftSignature) {
      this.draftSignature = signature;
      this.draftId = crypto.randomUUID();
    }
    this.sending.set(true);
    this.saveError.set('');
    this.content.disable({ emitEvent: false });
    try {
      const comment = await this.actions.comment(post, this.draftId, text, parent);
      if (this.destroy.destroyed) return;
      this.comments.update((old) => (old.some((c) => c.id === comment.id) ? old : [...old, comment]));
      this.content.setValue('');
      this.replyTo.set(null);
      this.draftSignature = '';
      this.notice.show('social.notice.commented');
    } catch (error) {
      if (!this.destroy.destroyed)
        this.saveError.set(error instanceof MediaError ? error.key : 'social.errors.comment');
    } finally {
      if (!this.destroy.destroyed) {
        this.sending.set(false);
        this.content.enable({ emitEvent: false });
      }
    }
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || !this.content.value.trim()) return true;
    if (this.sending()) return false;
    return this.discard().ask();
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void {
    if (this.auth.session() && this.content.value.trim()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
