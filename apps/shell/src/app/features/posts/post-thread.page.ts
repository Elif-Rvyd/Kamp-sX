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
interface ReplyGroup {
  rows: PostComment[];
  offset: number;
  more: boolean;
  loading: boolean;
  error: string;
}
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
        @if (depth() < 2 && !value.archivedAt) {
          @if (replyTo(); as parent) {
            <div class="reply-target">
              <p>{{ t('social.thread.replying') }}: {{ parent.content }}</p>
              <button
                kxButton
                type="button"
                emphasis="ghost"
                [disabled]="sending() || uncertain()"
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
              @if (uncertain()) {
                <button kxButton type="button" emphasis="outline" (click)="load(false)">
                  {{ t('social.thread.refresh') }}
                </button>
                <button kxButton type="button" emphasis="ghost" (click)="discardUncertain()">
                  {{ t('social.thread.clearDraft') }}
                </button>
              }
              <button kxButton type="submit" [busy]="sending()" [disabled]="uncertain() || loading()">
                {{ t(replyTo() ? 'social.thread.reply' : 'social.thread.send') }}
              </button>
            </div>
          </form>
        } @else {
          <p class="status">{{ t('social.thread.closed') }}</p>
        }
        @for (comment of comments(); track comment.id) {
          <article class="comment">
            <strong>{{ t(comment.user_id === owner() ? 'social.thread.you' : 'posts.author') }}</strong
            ><time [attr.datetime]="comment.created_at"> · {{ date(comment.created_at) }}</time>
            <p>{{ comment.content }}</p>
            @if (depth() === 0 && !value.archivedAt) {
              <button
                kxButton
                type="button"
                emphasis="ghost"
                [disabled]="sending() || uncertain()"
                (click)="changeReply(comment)"
              >
                {{ t('social.thread.reply') }}
              </button>
            }
            @if (depth() === 0 && comment.replies_count > 0 && !groups().has(comment.id)) {
              <button kxButton type="button" emphasis="ghost" (click)="loadChildren(comment.id, false)">
                {{ t('social.thread.showReplies') }}
              </button>
            }
          </article>
          @if (groups().get(comment.id); as group) {
            @for (child of group.rows; track child.id) {
              <article class="comment reply">
                <strong>{{ t(child.user_id === owner() ? 'social.thread.you' : 'posts.author') }}</strong
                ><time [attr.datetime]="child.created_at"> · {{ date(child.created_at) }}</time>
                <p>{{ child.content }}</p>
              </article>
            }
            @if (group.loading) {
              <p class="status" role="status">{{ t('posts.loading') }}</p>
            }
            @if (group.error) {
              <p class="status error-text" role="alert">{{ t(group.error) }}</p>
            }
            @if (group.more || group.error) {
              <div class="more">
                <button
                  kxButton
                  type="button"
                  emphasis="outline"
                  [busy]="group.loading"
                  (click)="loadChildren(comment.id, true)"
                >
                  {{ t(group.error ? 'media.retry' : 'social.thread.moreReplies') }}
                </button>
              </div>
            }
          }
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
  readonly groups = signal<ReadonlyMap<string, ReplyGroup>>(new Map());
  readonly depth = signal(2);
  readonly uncertain = signal(false);
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
    // PostEntry owns the optimistic view. Keep its input identity stable.
    return value ? post : null;
  });
  composing = false;
  private revision = 0;
  private request?: AbortController;
  private offset = 0;
  private groupRevision = 0;
  private readonly childRequests = new Map<string, AbortController>();
  private generation = `${this.owner()}:${this.auth.sessionEpoch()}`;
  constructor() {
    bindProfilePage('social.thread.title');
    effect(() => {
      const generation = `${this.owner()}:${this.auth.sessionEpoch()}`;
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => {
        if (generation !== this.generation) {
          this.generation = generation;
          this.content.reset('');
          this.replyTo.set(null);
          this.uncertain.set(false);
          this.saveError.set('');
          this.sending.set(false);
          this.content.enable({ emitEvent: false });
        }
        if (this.owner()) void this.load(false);
        else {
          this.cancelReads();
          this.post.set(null);
          this.comments.set([]);
          this.groups.set(new Map());
        }
      });
    });
    this.destroy.onDestroy(() => {
      this.cancelReads();
    });
  }
  private cancelReads(): void {
    this.request?.abort();
    this.revision++;
    this.groupRevision++;
    for (const request of this.childRequests.values()) request.abort();
    this.childRequests.clear();
  }
  private ownsGeneration(generation: string): boolean {
    return (
      !this.destroy.destroyed &&
      generation === this.generation &&
      generation === `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`
    );
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
    if (!this.owner() || (append && this.loading())) return;
    if (!append) this.cancelReads();
    else this.request?.abort();
    const revision = ++this.revision,
      request = (this.request = new AbortController()),
      generation = this.generation;
    const timeout = setTimeout(() => request.abort(), 20000),
      offset = append ? this.offset : 0;
    this.loading.set(true);
    this.readError.set('');
    if (!append) {
      this.post.set(null);
      this.comments.set([]);
      this.groups.set(new Map());
      this.offset = 0;
    }
    try {
      const post = await this.actions.find(this.id, request.signal);
      const depth = post ? await this.actions.replyDepth(post, request.signal) : 2;
      const comments = post ? await this.actions.comments(this.id, offset, request.signal) : [];
      if (!this.ownsGeneration(generation) || revision !== this.revision) return;
      this.post.set(post);
      this.depth.set(depth);
      this.offset = offset + comments.length;
      this.comments.update((old) => [...old, ...comments.filter((c) => !old.some((v) => v.id === c.id))]);
      this.more.set(comments.length === 50);
      if (!post || (this.replyTo() && !this.comments().some((c) => c.id === this.replyTo()?.id)))
        this.replyTo.set(null);
    } catch (error) {
      if (this.ownsGeneration(generation) && revision === this.revision)
        this.readError.set(error instanceof MediaError ? error.key : 'social.errors.read');
    } finally {
      clearTimeout(timeout);
      if (this.ownsGeneration(generation) && revision === this.revision) this.loading.set(false);
    }
  }
  changeReply(value: PostComment | null): void {
    if (!this.sending() && !this.uncertain()) this.replyTo.set(value);
  }
  async loadChildren(id: string, append: boolean): Promise<void> {
    const previous = this.groups().get(id);
    if (!this.owner() || previous?.loading || !this.comments().some((row) => row.id === id)) return;
    const generation = this.generation,
      revision = this.groupRevision;
    const request = new AbortController();
    this.childRequests.set(id, request);
    const timeout = setTimeout(() => request.abort(), 20000);
    const group: ReplyGroup = {
      rows: append ? (previous?.rows ?? []) : [],
      offset: append ? (previous?.offset ?? 0) : 0,
      more: true,
      loading: true,
      error: '',
    };
    this.groups.update((old) => new Map(old).set(id, group));
    try {
      const rows = await this.actions.comments(id, group.offset, request.signal);
      if (
        !this.ownsGeneration(generation) ||
        revision !== this.groupRevision ||
        this.childRequests.get(id) !== request
      )
        return;
      this.groups.update((old) =>
        new Map(old).set(id, {
          rows: [...group.rows, ...rows.filter((r) => !group.rows.some((v) => v.id === r.id))],
          offset: group.offset + rows.length,
          more: rows.length === 50,
          loading: false,
          error: '',
        }),
      );
    } catch (error) {
      if (
        this.ownsGeneration(generation) &&
        revision === this.groupRevision &&
        this.childRequests.get(id) === request
      )
        this.groups.update((old) =>
          new Map(old).set(id, {
            ...group,
            loading: false,
            error: error instanceof MediaError ? error.key : 'social.errors.read',
          }),
        );
    } finally {
      clearTimeout(timeout);
      if (this.childRequests.get(id) === request) this.childRequests.delete(id);
    }
  }
  async discardUncertain(): Promise<void> {
    const generation = this.generation;
    if ((await this.discard().ask()) && this.ownsGeneration(generation)) {
      this.content.reset('');
      this.replyTo.set(null);
      this.uncertain.set(false);
      this.saveError.set('');
    }
  }
  async send(event: Event): Promise<void> {
    event.preventDefault();
    const post = this.visiblePost(),
      text = this.content.value.trim();
    if (
      !post ||
      this.sending() ||
      this.composing ||
      this.uncertain() ||
      this.loading() ||
      this.depth() >= 2 ||
      post.archivedAt
    )
      return;
    if (!text || text.length > 2000) {
      this.saveError.set('social.errors.comment');
      return;
    }
    const parent = this.replyTo()?.id ?? null,
      generation = this.generation;
    this.sending.set(true);
    this.saveError.set('');
    this.content.disable({ emitEvent: false });
    try {
      const comment = await this.actions.comment(post, text, parent);
      if (!this.ownsGeneration(generation)) return;
      if (!parent) this.comments.update((old) => [...old, comment]);
      else {
        this.childRequests.get(parent)?.abort();
        this.childRequests.delete(parent);
        this.groups.update((old) => {
          const group = old.get(parent);
          return new Map(old).set(parent, {
            rows: [...(group?.rows ?? []), comment],
            offset: group?.offset ?? 0,
            more: group?.more ?? true,
            loading: false,
            error: '',
          });
        });
      }
      this.content.setValue('');
      this.replyTo.set(null);
      this.notice.show('social.notice.commented');
    } catch (error) {
      if (this.ownsGeneration(generation)) {
        const key = error instanceof MediaError ? error.key : 'social.errors.comment';
        this.saveError.set(key);
        this.uncertain.set(key === 'social.errors.commentUncertain');
      }
    } finally {
      if (this.ownsGeneration(generation)) {
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
