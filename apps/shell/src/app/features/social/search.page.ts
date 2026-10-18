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
import { ButtonComponent, FormFieldComponent } from '@kampusx/shared/ui';
import { PostActionsService } from '../../core/post-actions.service';
import { FollowsService } from '../../core/follows.service';
import { MediaError } from '../../core/media.service';
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
    PostEntryComponent,
    SocialPageFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-pages.css',
  template: `<kx-social-page-frame titleKey="social.search.title" back="/dashboard"
    ><ng-container *transloco="let t">
      <form
        novalidate
        (submit)="submit($event)"
        (compositionstart)="composing = true"
        (compositionend)="compositionEnd()"
      >
        <kx-form-field
          fieldId="post-search"
          labelKey="social.search.label"
          placeholderKey="social.search.placeholder"
          icon="search"
          [control]="query"
          [maxLength]="120"
        />
        <div class="form-actions">
          @if (query.value) {
            <button kxButton type="button" emphasis="ghost" (click)="clear()">
              {{ t('social.search.clear') }}
            </button>
          }
          <button kxButton type="submit" [busy]="loading()">{{ t('social.search.submit') }}</button>
        </div>
      </form>
      @if (loading()) {
        <p class="status" role="status">{{ t('posts.loading') }}</p>
      }
      @if (error()) {
        <p class="status error-text" role="alert">{{ t(error()) }}</p>
        <div class="more">
          <button kxButton type="button" emphasis="outline" (click)="load()">{{ t('media.retry') }}</button>
        </div>
      }
      @for (post of rows(); track post.id) {
        <kx-post-entry [post]="post" />
      }
      @if (!loading() && !error() && !rows().length) {
        <div class="empty">
          <h2>{{ t(committed().length < 2 ? 'social.search.hint' : 'social.search.empty') }}</h2>
        </div>
      }
      @if (rows().length === 30) {
        <p class="status">{{ t('social.search.limit') }}</p>
      }
    </ng-container></kx-social-page-frame
  >`,
})
export class SearchPage {
  private readonly actions = inject(PostActionsService);
  private readonly follows = inject(FollowsService);
  private readonly destroy = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  readonly query = new FormControl('', { nonNullable: true });
  readonly committed = signal('');
  readonly rows = signal<StoredPost[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  composing = false;
  private timer?: ReturnType<typeof setTimeout>;
  private request?: AbortController;
  private revision = 0;
  constructor() {
    bindProfilePage('social.search.title');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const value = (params.get('q') ?? '').slice(0, 120).trim();
      this.committed.set(value);
      this.query.setValue(value, { emitEvent: false });
      void this.load();
    });
    this.query.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.schedule());
    effect(() => {
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => void this.load());
    });
    this.destroy.onDestroy(() => {
      clearTimeout(this.timer);
      this.request?.abort();
      this.revision++;
    });
  }
  private schedule(): void {
    clearTimeout(this.timer);
    if (!this.composing) this.timer = setTimeout(() => this.commit(), 300);
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
    const value = this.query.value.slice(0, 120).trim();
    if (value === this.committed()) {
      void this.load();
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      replaceUrl: true,
    });
  }
  clear(): void {
    this.query.setValue('', { emitEvent: false });
    this.request?.abort();
    this.rows.set([]);
    this.commit();
    this.document.getElementById('post-search')?.focus();
  }
  async load(): Promise<void> {
    this.request?.abort();
    const revision = ++this.revision,
      term = this.committed();
    this.rows.set([]);
    this.error.set('');
    this.loading.set(false);
    if (term.length < 2) return;
    const request = (this.request = new AbortController()),
      timeout = setTimeout(() => request.abort(), 20000);
    this.loading.set(true);
    try {
      const rows = await this.actions.search(term, request.signal);
      if (!this.destroy.destroyed && revision === this.revision) this.rows.set(rows);
    } catch (error) {
      if (!this.destroy.destroyed && revision === this.revision)
        this.error.set(error instanceof MediaError ? error.key : 'social.errors.read');
    } finally {
      clearTimeout(timeout);
      if (!this.destroy.destroyed && revision === this.revision) this.loading.set(false);
    }
  }
}
