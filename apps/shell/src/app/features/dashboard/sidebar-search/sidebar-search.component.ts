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
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent, FormFieldComponent } from '@kampusx/shared/ui';
import { profileInitials } from '@kampusx/shared/util';
import { AuthService } from '../../../core/auth.service';
import { FollowsService } from '../../../core/follows.service';
import type { FollowPerson } from '../../../core/follow.model';
import { PostActionsService } from '../../../core/post-actions.service';
import type { StoredPost } from '../../../core/posts.service';

@Component({
  selector: 'kx-dashboard-search',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoDirective, FormFieldComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    class="sidebar-search"
    *transloco="let t"
    (focusin)="focus()"
    (focusout)="blur($event)"
    (keydown.escape)="open.set(false)"
  >
    <form
      role="search"
      [attr.aria-label]="t('social.search.title')"
      (submit)="submit($event)"
      (compositionstart)="compositionStart()"
      (compositionend)="compositionEnd()"
    >
      <kx-form-field
        fieldId="dashboard-search"
        variant="sidebar-search"
        labelKey="social.search.title"
        placeholderKey="social.search.title"
        icon="search"
        [control]="query"
        [maxLength]="120"
        [clearable]="true"
        clearLabelKey="social.search.clear"
        (cleared)="clear()"
      />
    </form>
    @if (open() && term().length >= 2) {
      <div class="search-preview" [attr.aria-busy]="loading()">
        @if (loading()) {
          <p class="search-status" role="status">{{ t('social.search.waiting') }}</p>
        }
        @if (peopleError()) {
          <p class="search-status" role="status">{{ t('social.search.peopleError') }}</p>
        }
        @if (people().length) {
          <h2>{{ t('social.search.people') }}</h2>
          @for (person of people(); track person.userId) {
            <a class="search-result person-result" [routerLink]="['/people', person.userId]">
              <kx-avatar [initials]="initials(person.fullName || person.username)" [src]="person.avatarUrl" />
              <span
                ><strong>{{ person.fullName || person.username }}</strong
                ><span>{{ '@' + person.username }}</span></span
              >
            </a>
          }
        }
        @if (postsError()) {
          <p class="search-status" role="status">{{ t('social.errors.read') }}</p>
        }
        @if (posts().length) {
          <h2>{{ t('social.search.posts') }}</h2>
          @for (post of posts(); track post.id) {
            <a class="search-result post-result" [routerLink]="['/posts', post.id]">{{
              post.text || t('dashboardSidebar.mediaPost')
            }}</a>
          }
        }
        @if (!loading() && !peopleError() && !postsError() && !people().length && !posts().length) {
          <p class="search-status" role="status">{{ t('dashboardSidebar.searchEmpty') }}</p>
        }
        <a class="all-results" [routerLink]="['/search']" [queryParams]="{ q: term() }">{{
          t('dashboardSidebar.allResults')
        }}</a>
      </div>
    }
  </section>`,
  styleUrl: './sidebar-search.component.css',
})
export class SidebarSearchComponent {
  private readonly auth = inject(AuthService);
  private readonly follows = inject(FollowsService);
  private readonly actions = inject(PostActionsService);
  private readonly destroy = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly query = new FormControl('', { nonNullable: true });
  readonly term = signal('');
  readonly open = signal(false);
  readonly people = signal<FollowPerson[]>([]);
  readonly posts = signal<StoredPost[]>([]);
  readonly peopleError = signal(false);
  readonly postsError = signal(false);
  readonly loading = signal(false);
  readonly initials = profileInitials;
  private request?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private revision = 0;
  private composing = false;
  private identity = '';
  constructor() {
    this.query.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.schedule());
    effect(() => {
      const identity = this.auth.session()?.user.id + ':' + this.auth.sessionEpoch();
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => {
        if (identity !== this.identity) {
          this.identity = identity;
          this.invalidate();
          this.query.setValue('', { emitEvent: false });
          this.term.set('');
          this.open.set(false);
        } else if (this.open()) this.schedule();
      });
    });
    this.destroy.onDestroy(() => this.invalidate());
  }
  private invalidate(): void {
    clearTimeout(this.timer);
    this.request?.abort();
    this.revision++;
    this.people.set([]);
    this.posts.set([]);
    this.peopleError.set(false);
    this.postsError.set(false);
    this.loading.set(false);
  }
  private schedule(): void {
    this.invalidate();
    this.term.set(this.query.value.slice(0, 120).trim());
    this.open.set(true);
    if (!this.composing && this.term().length >= 2 && this.auth.session()) {
      this.loading.set(true);
      this.timer = setTimeout(() => void this.load(), 300);
    }
  }
  focus(): void {
    if (!this.open()) this.schedule();
  }
  blur(event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
      this.open.set(false);
  }
  compositionStart(): void {
    this.composing = true;
    this.invalidate();
  }
  compositionEnd(): void {
    this.composing = false;
    this.schedule();
  }
  clear(): void {
    this.query.setValue('');
    this.document.getElementById('dashboard-search')?.focus();
  }
  submit(event: Event): void {
    event.preventDefault();
    if (!this.composing && this.term().length >= 2)
      void this.router.navigate(['/search'], { queryParams: { q: this.term() } });
  }
  private async load(): Promise<void> {
    const term = this.term(),
      epoch = this.auth.sessionEpoch(),
      revision = this.revision;
    if (this.composing || term.length < 2 || !this.auth.session()) return;
    const request = (this.request = new AbortController());
    const current = () =>
      !this.destroy.destroyed &&
      !request.signal.aborted &&
      revision === this.revision &&
      epoch === this.auth.sessionEpoch();
    await Promise.all([
      (async () => {
        try {
          const people = await this.follows.searchPeople(term, request.signal);
          if (current()) this.people.set(people.slice(0, 3));
        } catch {
          if (current()) this.peopleError.set(true);
        }
      })(),
      (async () => {
        try {
          const posts = await this.actions.search(term, request.signal);
          if (current()) this.posts.set(posts.slice(0, 3));
        } catch {
          if (current()) this.postsError.set(true);
        }
      })(),
    ]);
    if (current()) this.loading.set(false);
  }
}
