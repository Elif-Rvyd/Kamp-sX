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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, FollowPersonComponent, FormFieldComponent } from '@kampusx/shared/ui';
import { AuthService } from '../../core/auth.service';
import { PostActionsService } from '../../core/post-actions.service';
import { FollowsService } from '../../core/follows.service';
import type { FollowAction, FollowPerson } from '../../core/follow.model';
import { MediaError } from '../../core/media.service';
import { NoticeService } from '../../core/notice.service';
import type { StoredPost } from '../../core/posts.service';
import { PostEntryComponent } from '../posts/post-entry.component';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    FormFieldComponent,
    FollowPersonComponent,
    PostEntryComponent,
    SocialPageFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./social-pages.css', './search.page.css'],
  template: `<kx-social-page-frame titleKey="social.search.title" back="/dashboard"
    ><ng-container *transloco="let t">
      <form
        class="search-form"
        role="search"
        [attr.aria-label]="t('social.search.title')"
        novalidate
        (submit)="submit($event)"
        (compositionstart)="compositionStart()"
        (compositionend)="compositionEnd()"
      >
        <kx-form-field
          fieldId="post-search"
          labelKey="social.search.label"
          placeholderKey="social.search.placeholder"
          icon="search"
          [control]="query"
          [maxLength]="120"
          [clearable]="true"
          clearLabelKey="social.search.clear"
          (cleared)="clear()"
        />
      </form>
      @if (composing || pending()) {
        <p class="status" role="status">{{ t('social.search.waiting') }}</p>
      } @else if (committed().length < 2) {
        <div class="empty" role="status">
          <h2>{{ t('social.search.hint') }}</h2>
        </div>
      } @else {
        <section
          class="search-results"
          aria-labelledby="search-people-title"
          [attr.aria-busy]="peopleLoading()"
        >
          <h2 class="results-title" id="search-people-title">{{ t('social.search.people') }}</h2>
          @if (peopleLoading()) {
            <p class="status" role="status">{{ t('social.search.peopleLoading') }}</p>
          }
          @if (peopleError()) {
            <div class="status error-text" role="alert">
              {{ t('social.search.peopleError') }}
              <button kxButton type="button" emphasis="ghost" (click)="load()">{{ t('media.retry') }}</button>
            </div>
          }
          @if (people().length && follows.setupError()) {
            <div class="status" role="status">
              {{ t(follows.setupError()) }}
              <button kxButton type="button" emphasis="ghost" (click)="follows.retry()">
                {{ t('media.retry') }}
              </button>
            </div>
          }
          @if (actionError()) {
            <p class="status error-text" role="alert">{{ t(actionError()) }}</p>
          }
          @for (person of people(); track person.userId) {
            <kx-follow-person
              [person]="person"
              [disabled]="!!busy() || !follows.ready()"
              [busy]="busy()?.userId === person.userId"
              [activeAction]="busy()?.action ?? null"
              (acted)="act(person, $event)"
            />
          }
          @if (!peopleLoading() && !peopleError() && !people().length) {
            <div class="empty" role="status">
              <h3>{{ t('social.search.peopleEmpty') }}</h3>
            </div>
          }
          @if (people().length === 20) {
            <p class="status">{{ t('social.search.peopleLimit') }}</p>
          }
        </section>
        <section class="search-results" aria-labelledby="search-posts-title" [attr.aria-busy]="loading()">
          <h2 class="results-title" id="search-posts-title">{{ t('social.search.posts') }}</h2>
          @if (loading()) {
            <p class="status" role="status">{{ t('posts.loading') }}</p>
          }
          @if (error()) {
            <div class="status error-text" role="alert">
              {{ t(error()) }}
              <button kxButton type="button" emphasis="ghost" (click)="load()">{{ t('media.retry') }}</button>
            </div>
          }
          @for (post of rows(); track post.id) {
            <kx-post-entry [post]="post" />
          }
          @if (!loading() && !error() && !rows().length) {
            <div class="empty" role="status">
              <h3>{{ t('social.search.empty') }}</h3>
            </div>
          }
          @if (rows().length === 30) {
            <p class="status">{{ t('social.search.limit') }}</p>
          }
        </section>
      }
    </ng-container></kx-social-page-frame
  >`,
})
export class SearchPage {
  private readonly auth = inject(AuthService);
  private readonly actions = inject(PostActionsService);
  readonly follows = inject(FollowsService);
  private readonly notice = inject(NoticeService);
  private readonly destroy = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly pageEpoch = this.auth.sessionEpoch();
  readonly query = new FormControl('', { nonNullable: true });
  readonly committed = signal('');
  readonly rows = signal<StoredPost[]>([]);
  readonly people = signal<FollowPerson[]>([]);
  readonly peopleLoading = signal(false);
  readonly peopleError = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly busy = signal<{ userId: string; action: FollowAction } | null>(null);
  readonly pending = signal(false);
  composing = false;
  private timer?: ReturnType<typeof setTimeout>;
  private request?: AbortController;
  private revision = 0;
  private navigatingQuery?: string;
  constructor() {
    bindProfilePage('social.search.title');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const value = (params.get('q') ?? '').slice(0, 120).trim();
      // A delayed URL update must not replace characters entered during navigation.
      if (value === this.navigatingQuery) {
        this.navigatingQuery = undefined;
        if (this.composing || value !== this.normalized()) {
          this.committed.set(value);
          return;
        }
      }
      this.invalidate();
      this.pending.set(false);
      this.composing = false;
      this.committed.set(value);
      this.query.setValue(value, { emitEvent: false });
    });
    this.query.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.schedule());
    effect(() => {
      const epoch = this.auth.sessionEpoch(),
        owner = this.auth.session()?.user.id;
      this.committed();
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => {
        if (!owner || epoch !== this.pageEpoch) {
          this.invalidate();
          this.query.setValue('', { emitEvent: false });
          this.busy.set(null);
          this.pending.set(false);
          return;
        }
        if (!this.composing && !this.pending() && this.normalized() === this.committed()) void this.load();
      });
    });
    this.destroy.onDestroy(() => {
      this.invalidate();
    });
  }
  private ownsSession(): boolean {
    return !this.destroy.destroyed && !!this.auth.session() && this.auth.sessionEpoch() === this.pageEpoch;
  }
  private normalized(): string {
    return this.query.value.slice(0, 120).trim();
  }
  private invalidate(): void {
    clearTimeout(this.timer);
    this.request?.abort();
    this.request = undefined;
    this.revision++;
    this.rows.set([]);
    this.people.set([]);
    this.error.set('');
    this.peopleError.set(false);
    this.actionError.set('');
    this.loading.set(false);
    this.peopleLoading.set(false);
  }
  private schedule(): void {
    this.invalidate();
    this.pending.set(true);
    if (!this.ownsSession() || this.composing) return;
    if (this.normalized().length < 2) this.commit();
    else this.timer = setTimeout(() => this.commit(), 300);
  }
  compositionStart(): void {
    this.composing = true;
    this.invalidate();
    this.pending.set(true);
  }
  compositionEnd(): void {
    this.composing = false;
    this.schedule();
  }
  submit(event: Event): void {
    event.preventDefault();
    if (!this.composing) this.commit();
  }
  private commit(): void {
    clearTimeout(this.timer);
    if (!this.ownsSession() || this.composing) return;
    const value = this.normalized();
    this.pending.set(false);
    if (value === this.committed()) {
      void this.load();
      return;
    }
    this.navigatingQuery = value;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      replaceUrl: true,
    });
  }
  clear(): void {
    this.query.setValue('', { emitEvent: false });
    this.composing = false;
    this.invalidate();
    this.commit();
    this.document.getElementById('post-search')?.focus();
  }
  async load(): Promise<void> {
    if (!this.ownsSession() || this.composing || this.pending() || this.normalized() !== this.committed())
      return;
    this.invalidate();
    const revision = this.revision,
      term = this.committed();
    if (term.length < 2) return;
    const request = (this.request = new AbortController()),
      timeout = setTimeout(() => request.abort(), 20000);
    this.loading.set(true);
    this.peopleLoading.set(true);
    const current = () => this.ownsSession() && revision === this.revision;
    try {
      await Promise.all([
        (async () => {
          try {
            const people = await this.follows.searchPeople(term, request.signal);
            if (current()) this.people.set(people);
          } catch {
            if (current()) this.peopleError.set(true);
          } finally {
            if (current()) this.peopleLoading.set(false);
          }
        })(),
        (async () => {
          try {
            const rows = await this.actions.search(term, request.signal);
            if (current()) this.rows.set(rows);
          } catch (error) {
            if (current()) this.error.set(error instanceof MediaError ? error.key : 'social.errors.read');
          } finally {
            if (current()) this.loading.set(false);
          }
        })(),
      ]);
    } finally {
      clearTimeout(timeout);
      if (current()) this.request = undefined;
    }
  }
  async act(person: FollowPerson, action: FollowAction): Promise<void> {
    if (!this.ownsSession() || this.busy() || !['follow', 'cancel', 'unfollow'].includes(action)) return;
    this.busy.set({ userId: person.userId, action });
    this.actionError.set('');
    try {
      if (action === 'follow') await this.follows.follow(person.userId);
      else if (action === 'cancel') await this.follows.cancelRequest(person.userId);
      else await this.follows.unfollow(person.userId);
      if (this.ownsSession()) this.notice.show('follows.saved');
    } catch {
      if (this.ownsSession()) this.actionError.set('follows.saveError');
    } finally {
      if (this.ownsSession()) this.busy.set(null);
    }
  }
}
