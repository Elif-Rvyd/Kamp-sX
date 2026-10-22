import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ActionMenuComponent,
  ButtonComponent,
  ConfirmDialogComponent,
  ReportReasonComponent,
  type ActionMenuItem,
} from '@kampusx/shared/ui';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AccountService } from '../../core/account.service';
import { SupabaseService } from '../../core/supabase.service';
import type { Database } from '../../core/database.generated';
import { AuthService } from '../../core/auth.service';
import { FollowsService } from '../../core/follows.service';
import { PostActionsService, type ReportReason } from '../../core/post-actions.service';
import { NoticeService } from '../../core/notice.service';
import { PostsService, POST_COLUMNS, type StoredPost } from '../../core/posts.service';
import { MediaError, MediaService } from '../../core/media.service';
import { LanguageService } from '../../core/language.service';
import { ThemeService } from '../../core/theme.service';
import { MessagingApiService, MessagingError } from '../../core/messaging-api.service';
import type { Profile } from '../../core/profile.model';
import { ProfileHeaderComponent } from './components/profile-header.component';
import { ProfilePostListComponent } from './components/profile-post-list.component';
import { bindProfilePage } from './profile-page-context';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ButtonComponent,
    ProfileHeaderComponent,
    ProfilePostListComponent,
    ActionMenuComponent,
    ConfirmDialogComponent,
    ReportReasonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../social/social-pages.css',
  template: `<section class="social-page" *transloco="let t">
    @if (loading()) {
      <p class="status" role="status">{{ t('posts.loading') }}</p>
    }
    @if (error()) {
      <div class="status error-text" role="alert">
        {{ t('accountStatus.readError') }}
        <button kxButton type="button" emphasis="ghost" (click)="load()">{{ t('media.retry') }}</button>
      </div>
    }
    @if (profile(); as value) {
      <kx-profile-header
        [profile]="value"
        [editable]="false"
        [language]="language.language()"
        [dark]="theme.dark()"
        (backRequested)="back()"
        (languageChanged)="language.set($event)"
        (themeChanged)="theme.toggle()"
      >
        <kx-action-menu
          profileMenu
          labelKey="social.profileMenu"
          [surface]="true"
          [items]="menu"
          [disabled]="saving() || moderating()"
          (selected)="moderate($event)"
        />
        <div profileAction class="profile-action">
          @if (follows.setupError()) {
            <p class="error-text" role="status">{{ t(follows.setupError()) }}</p>
          }
          <button
            kxButton
            type="button"
            [busy]="saving()"
            [disabled]="!follows.ready() || moderating()"
            (click)="follow()"
          >
            {{
              t(
                'follows.actions.' +
                  (status() === 'accepted' ? 'unfollow' : status() === 'pending' ? 'cancel' : 'follow')
              )
            }}
          </button>
          <button
            kxButton
            type="button"
            emphasis="outline"
            [busy]="messageBusy()"
            [disabled]="!canMessage() || saving() || moderating()"
            (click)="message()"
          >
            {{ t('messaging.action') }}
          </button>
          @if (messageError()) {
            <p class="error-text" role="status">{{ t(messageError()) }}</p>
          } @else if (!canMessage()) {
            <p role="status">{{ t(messageChecking() ? 'messaging.checking' : 'messaging.notEligible') }}</p>
          }
          @if (actionError()) {
            <p class="error-text" role="alert">{{ t('follows.saveError') }}</p>
          }
          @if (moderationError()) {
            <p class="error-text" role="alert">{{ t(moderationError()) }}</p>
          }
        </div>
      </kx-profile-header>
      <kx-profile-post-list [posts]="posts()" [profile]="value" [language]="language.language()" />
    } @else if (!loading() && !error()) {
      <div class="empty" role="status">
        <h1>{{ t('social.profileUnavailable') }}</h1>
      </div>
    }
    <kx-confirm-dialog
      #blockDialog
      dialogId="profile-block"
      titleKey="social.block.title"
      bodyKey="social.block.body"
      cancelKey="social.cancel"
      confirmKey="social.menu.block"
    />
    <kx-confirm-dialog
      #reportDialog
      dialogId="profile-report"
      titleKey="social.report.userTitle"
      bodyKey="social.report.userBody"
      cancelKey="social.cancel"
      confirmKey="social.menu.report"
    >
      <kx-report-reason
        name="profile-report-reason"
        [value]="reportReason()"
        (changed)="reportReason.set($event)"
      />
    </kx-confirm-dialog>
  </section>`,
  styles: `
    .profile-action {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .profile-action p {
      flex-basis: 100%;
      font-size: 0.875rem;
      margin: 0;
    }
  `,
})
export class PublicProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly account = inject(AccountService);
  private readonly actions = inject(PostActionsService);
  private readonly api = inject(PostsService);
  private readonly media = inject(MediaService);
  private readonly destroy = inject(DestroyRef);
  private readonly notice = inject(NoticeService);
  private readonly messaging = inject(MessagingApiService);
  private readonly blockDialog = viewChild.required<ConfirmDialogComponent>('blockDialog');
  private readonly reportDialog = viewChild.required<ConfirmDialogComponent>('reportDialog');
  private readonly client = inject(SupabaseService).client as SupabaseClient<Database> | null;
  readonly follows = inject(FollowsService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly profile = signal<Profile | null>(null);
  readonly posts = signal<StoredPost[]>([]);
  readonly status = signal<'none' | 'pending' | 'accepted'>('none');
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly actionError = signal(false);
  readonly moderating = signal(false);
  readonly moderationError = signal('');
  readonly reportReason = signal<ReportReason>('spam');
  readonly canMessage = signal(false);
  readonly messageChecking = signal(false);
  readonly messageBusy = signal(false);
  readonly messageError = signal('');
  readonly menu: readonly ActionMenuItem[] = [
    { id: 'report', labelKey: 'social.menu.report', icon: 'flag' },
    { id: 'block', labelKey: 'social.menu.block', icon: 'block', danger: true },
  ];
  private moderationTicket?: symbol;
  private readonly id = signal('');
  private request?: AbortController;
  private revision = 0;
  constructor() {
    bindProfilePage('profile.title');
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id') ?? '';
      if (id !== this.id()) {
        this.moderationTicket = undefined;
        this.moderating.set(false);
        this.moderationError.set('');
      }
      this.id.set(id);
    });
    effect(() => {
      this.id();
      this.auth.sessionEpoch();
      this.account.revision();
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => void this.load());
    });
    this.destroy.onDestroy(() => this.request?.abort());
  }
  back() {
    void this.router.navigateByUrl('/search');
  }
  async moderate(action: string): Promise<void> {
    if (!['report', 'block'].includes(action) || this.moderating() || this.saving()) return;
    const target = this.id(),
      epoch = this.auth.sessionEpoch(),
      owner = this.auth.session()?.user.id;
    if (!owner || target === owner || this.profile()?.id !== target) return;
    const ticket = (this.moderationTicket = Symbol());
    const current = () =>
      !this.destroy.destroyed &&
      this.id() === target &&
      this.auth.session()?.user.id === owner &&
      this.auth.sessionEpoch() === epoch &&
      this.moderationTicket === ticket;
    this.moderating.set(true);
    this.moderationError.set('');
    try {
      if (!(await (action === 'block' ? this.blockDialog() : this.reportDialog()).ask()) || !current())
        return;
      if (action === 'block') {
        await this.actions.blockUser(target);
        if (!current()) return;
        this.notice.show('social.notice.blocked');
        await this.router.navigateByUrl('/search', { replaceUrl: true });
      } else {
        const created = await this.actions.reportUser(target, this.reportReason());
        if (current())
          this.notice.show(created ? 'social.report.userReported' : 'social.report.userDuplicate');
      }
    } catch (error) {
      if (current()) this.moderationError.set(error instanceof MediaError ? error.key : 'social.errors.save');
    } finally {
      if (current()) this.moderating.set(false);
    }
  }
  async load() {
    this.request?.abort();
    const controller = (this.request = new AbortController());
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]);
    const revision = ++this.revision;
    const id = this.id(),
      owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    this.profile.set(null);
    this.posts.set([]);
    this.error.set(false);
    this.status.set('none');
    this.canMessage.set(false);
    this.messageError.set('');
    this.messageChecking.set(false);
    this.messageBusy.set(false);
    this.loading.set(false);
    if (id === owner) {
      await this.router.navigateByUrl('/profile', { replaceUrl: true });
      return;
    }
    if (!owner || !this.client || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return;
    this.loading.set(true);
    const current = () =>
      !this.destroy.destroyed &&
      revision === this.revision &&
      this.auth.session()?.user.id === owner &&
      this.auth.sessionEpoch() === epoch;
    try {
      const row = await this.account.profile(id, signal);
      if (!current() || !row) return;
      const [posts, following, followers, outgoing] = await Promise.all([
        this.client
          .from('posts')
          .select(POST_COLUMNS, { count: 'exact' })
          .eq('user_id', id)
          .is('deleted_at', null)
          .is('archived_at', null)
          .order('pinned_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(signal),
        this.client
          .from('follows')
          .select('following_id', { count: 'exact', head: true })
          .eq('follower_id', id)
          .eq('status', 'accepted')
          .abortSignal(signal),
        this.client
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', id)
          .eq('status', 'accepted')
          .abortSignal(signal),
        this.client
          .from('follows')
          .select('status')
          .eq('follower_id', owner)
          .eq('following_id', id)
          .abortSignal(signal)
          .maybeSingle(),
      ]);
      if (!current()) return;
      if (posts.error || outgoing.error) throw new Error('profile_read');
      this.posts.set((posts.data ?? []).map((row) => this.api.mapRow(row)));
      this.status.set(
        outgoing.data?.status === 'accepted'
          ? 'accepted'
          : outgoing.data?.status === 'pending'
            ? 'pending'
            : 'none',
      );
      this.profile.set({
        id,
        fullName: row.full_name || row.username || '',
        username: row.username || '',
        bio: row.bio ?? '',
        university: row.university ?? '',
        department: row.studying ?? '',
        campus: row.campus,
        faculty: row.campus,
        joinedAt: row.created_at,
        avatarUrl: this.media.isPublicUrl(row.avatar_url, id, 'avatar') ? row.avatar_url : undefined,
        coverUrl: this.media.isPublicUrl(row.banner_url, id, 'banner') ? row.banner_url : undefined,
        followingCount: following.error ? null : following.count,
        followersCount: followers.error ? null : followers.count,
        postCount: posts.count ?? posts.data?.length ?? 0,
      });
      this.messageChecking.set(true);
      void this.messaging
        .canMessage(id, signal)
        .then((allowed) => {
          if (current()) this.canMessage.set(allowed);
        })
        .catch((error) => {
          if (current())
            this.messageError.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
        })
        .finally(() => {
          if (current()) this.messageChecking.set(false);
        });
    } catch {
      if (current()) this.error.set(true);
    } finally {
      if (current()) this.loading.set(false);
    }
  }
  async message(): Promise<void> {
    if (!this.canMessage() || this.messageBusy() || !this.request) return;
    const id = this.id(),
      epoch = this.auth.sessionEpoch(),
      revision = this.revision;
    const current = () =>
      !this.destroy.destroyed &&
      id === this.id() &&
      epoch === this.auth.sessionEpoch() &&
      revision === this.revision;
    this.messageBusy.set(true);
    this.messageError.set('');
    try {
      const conv = await this.messaging.start(
        id,
        AbortSignal.any([this.request.signal, AbortSignal.timeout(20000)]),
      );
      if (current()) await this.router.navigate(['/messages', conv]);
    } catch (error) {
      if (current()) {
        this.canMessage.set(false);
        this.messageError.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
      }
    } finally {
      if (current()) this.messageBusy.set(false);
    }
  }
  async follow() {
    if (this.saving() || !this.follows.ready()) return;
    this.saving.set(true);
    this.actionError.set(false);
    const id = this.id(),
      epoch = this.auth.sessionEpoch();
    try {
      if (this.status() === 'accepted') await this.follows.unfollow(id);
      else if (this.status() === 'pending') await this.follows.cancelRequest(id);
      else await this.follows.follow(id);
      if (this.id() === id && this.auth.sessionEpoch() === epoch) await this.load();
    } catch {
      if (!this.destroy.destroyed && this.auth.sessionEpoch() === epoch) this.actionError.set(true);
    } finally {
      if (!this.destroy.destroyed && this.auth.sessionEpoch() === epoch) this.saving.set(false);
    }
  }
}
