import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, FollowPersonComponent, FormFieldComponent } from '@kampusx/shared/ui';
import { LocalizedNumberPipe } from '@kampusx/shared/util';
import { AuthService } from '../../core/auth.service';
import { FollowsService, FollowError } from '../../core/follows.service';
import type { FollowAction, FollowList, FollowPerson } from '../../core/follow.model';
import { NoticeService } from '../../core/notice.service';
import { SocialPageFrameComponent } from '../social/social-page-frame.component';
import { bindProfilePage } from './profile-page-context';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    ButtonComponent,
    FollowPersonComponent,
    FormFieldComponent,
    LocalizedNumberPipe,
    SocialPageFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './follow-connections.page.html',
  styleUrl: './follow-connections.page.css',
})
export class FollowConnectionsPage {
  readonly follows = inject(FollowsService);
  private readonly auth = inject(AuthService);
  private readonly destroy = inject(DestroyRef);
  private readonly notice = inject(NoticeService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly pageEpoch = this.auth.sessionEpoch();
  readonly kind: FollowList = inject(ActivatedRoute).snapshot.data['followList'];
  readonly tabs = ['followers', 'following', 'requests'] as const;
  readonly rows = signal<readonly FollowPerson[]>([]);
  readonly loading = signal(false);
  readonly readHeight = signal(180);
  readonly error = signal('');
  readonly more = signal(false);
  readonly busy = signal<{ userId: string; action: FollowAction } | null>(null);
  readonly username = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(50)],
  });
  readonly searchForm = new FormGroup({ username: this.username });
  readonly searchResult = signal<FollowPerson | null>(null);
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly searchError = signal('');
  private offset = 0;
  private revision = 0;
  private searchRevision = 0;
  private read?: AbortController;
  private searchRead?: AbortController;
  private lastSearch = '';

  constructor() {
    bindProfilePage('follows.titles.' + this.kind);
    effect(() => {
      const epoch = this.auth.sessionEpoch();
      this.follows.privacyRevision();
      untracked(() => {
        if (!this.ownsSession(epoch)) {
          this.clearSessionData();
          return;
        }
        void this.load(false, epoch);
        if (this.lastSearch) void this.lookup(this.lastSearch);
      });
    });
    this.username.valueChanges.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      this.searchRevision++;
      this.searchRead?.abort();
      this.searching.set(false);
      this.searchResult.set(null);
      this.searched.set(false);
      this.searchError.set('');
      this.lastSearch = '';
    });
    this.destroy.onDestroy(() => this.clearSessionData());
  }

  private ownsSession(epoch = this.pageEpoch): boolean {
    return (
      !this.destroy.destroyed &&
      !!this.auth.session() &&
      epoch === this.pageEpoch &&
      this.auth.sessionEpoch() === epoch
    );
  }

  private clearSessionData(): void {
    this.revision++;
    this.searchRevision++;
    this.read?.abort();
    this.searchRead?.abort();
    this.read = undefined;
    this.searchRead = undefined;
    this.rows.set([]);
    this.searchResult.set(null);
    this.username.setValue('', { emitEvent: false });
    this.lastSearch = '';
    this.offset = 0;
    this.more.set(false);
    this.busy.set(null);
    this.loading.set(false);
    this.searching.set(false);
    this.searched.set(false);
    this.error.set('');
    this.searchError.set('');
  }

  async load(append: boolean, epoch = this.auth.sessionEpoch()): Promise<void> {
    if (!this.ownsSession(epoch)) return;
    if (append && this.loading()) return;
    this.read?.abort();
    const request = new AbortController(),
      revision = ++this.revision;
    this.read = request;
    const offset = append ? this.offset : 0;
    const focused = this.document.activeElement;
    const focusedInPage = !!focused && this.host.nativeElement.contains(focused);
    this.readHeight.set(
      this.host.nativeElement.querySelector('.people-list')?.getBoundingClientRect().height || 180,
    );
    if (!append) {
      this.rows.set([]);
      this.more.set(false);
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.follows.people(this.kind, offset, request.signal);
      if (!this.ownsSession(epoch) || revision !== this.revision) return;
      this.rows.update((old) =>
        append ? [...new Map([...old, ...result.people].map((p) => [p.userId, p])).values()] : result.people,
      );
      this.offset = result.nextOffset;
      this.more.set(result.more);
    } catch (error) {
      if (this.ownsSession(epoch) && revision === this.revision)
        this.error.set(error instanceof FollowError ? error.key : 'follows.listError');
    } finally {
      if (this.ownsSession(epoch) && revision === this.revision) {
        this.loading.set(false);
        if (focusedInPage)
          afterNextRender(
            () => {
              if (focused && !focused.isConnected && this.document.activeElement === this.document.body)
                this.host.nativeElement
                  .querySelector<HTMLElement>('.connections-nav a[aria-current="page"]')
                  ?.focus({ preventScroll: true });
            },
            { injector: this.injector },
          );
      }
    }
  }

  search(): void {
    if (!this.ownsSession()) return;
    this.username.markAsTouched();
    if (this.username.invalid) return;
    this.lastSearch = this.username.value.trim();
    void this.lookup(this.lastSearch);
  }
  private async lookup(username: string): Promise<void> {
    if (!this.ownsSession()) return;
    this.searchRead?.abort();
    const request = new AbortController(),
      revision = ++this.searchRevision,
      epoch = this.auth.sessionEpoch();
    this.searchRead = request;
    this.searching.set(true);
    this.searchError.set('');
    this.searched.set(false);
    this.searchResult.set(null);
    try {
      const person = await this.follows.findPerson(username, request.signal);
      if (!this.ownsSession(epoch) || revision !== this.searchRevision) return;
      this.searchResult.set(person);
      this.searched.set(true);
    } catch (error) {
      if (this.ownsSession(epoch) && revision === this.searchRevision)
        this.searchError.set(error instanceof FollowError ? error.key : 'follows.listError');
    } finally {
      if (this.ownsSession(epoch) && revision === this.searchRevision) this.searching.set(false);
    }
  }

  async act(person: FollowPerson, action: FollowAction): Promise<void> {
    if (!this.ownsSession() || this.busy()) return;
    const focused = this.document.activeElement;
    const epoch = this.auth.sessionEpoch();
    this.busy.set({ userId: person.userId, action });
    this.error.set('');
    try {
      switch (action) {
        case 'follow':
          await this.follows.follow(person.userId);
          break;
        case 'cancel':
          await this.follows.cancelRequest(person.userId);
          break;
        case 'unfollow':
          await this.follows.unfollow(person.userId);
          break;
        case 'accept':
          await this.follows.acceptRequest(person.userId);
          break;
        case 'reject':
          await this.follows.rejectRequest(person.userId);
          break;
        case 'remove':
          await this.follows.removeFollower(person.userId);
          break;
      }
      if (this.ownsSession(epoch)) this.notice.show('follows.saved');
    } catch (error) {
      if (this.ownsSession(epoch))
        this.error.set(error instanceof FollowError ? error.key : 'follows.saveError');
    } finally {
      if (this.ownsSession(epoch)) {
        this.busy.set(null);
        afterNextRender(
          () => {
            if (focused && !focused.isConnected && this.document.activeElement === this.document.body)
              this.host.nativeElement
                .querySelector<HTMLElement>('.connections-nav a[aria-current="page"]')
                ?.focus({ preventScroll: true });
          },
          { injector: this.injector },
        );
      }
    }
  }
}
