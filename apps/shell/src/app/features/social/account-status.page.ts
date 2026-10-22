import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, ConfirmDialogComponent } from '@kampusx/shared/ui';
import {
  AccountService,
  AUDIENCE_KEYS,
  audienceFlags,
  audienceLevel,
  type AudienceLevel,
  type AccountPreferences,
  type Audience,
} from '../../core/account.service';
import { AuthService } from '../../core/auth.service';
import { PostsService } from '../../core/posts.service';
import { FollowsService } from '../../core/follows.service';
import { MediaError } from '../../core/media.service';
import { NoticeService } from '../../core/notice.service';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';
@Component({
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent, ConfirmDialogComponent, SocialPageFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-pages.css',
  template: `<kx-social-page-frame titleKey="accountStatus.title" back="/settings"
    ><ng-container *transloco="let t">
      <p class="status">{{ t('accountStatus.description') }}</p>
      @if (loading()) {
        <p class="status" role="status">{{ t('posts.loading') }}</p>
      }
      @if (error()) {
        <div class="status error-text" role="alert">
          {{ t(error()) }}
          <button kxButton emphasis="ghost" type="button" [disabled]="saving()" (click)="load()">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @if (baseline(); as current) {
        <form novalidate (submit)="save($event)" [attr.aria-busy]="saving()">
          <fieldset>
            <legend class="status">{{ t('accountStatus.chooseLevel') }}</legend>
            @for (level of levels; track level) {
              <label class="audience-row">
                <div>
                  <strong>{{ t('accountStatus.levels.' + level + '.title') }}</strong>
                  <p>{{ t('accountStatus.levels.' + level + '.description') }}</p>
                  @if (disabledLevel(level)) {
                    <p>{{ t('accountStatus.missingAcademic') }}</p>
                  }
                </div>
                <input
                  type="radio"
                  name="audience"
                  [value]="level"
                  [checked]="selected() === level"
                  [disabled]="saving() || loading() || uncertain() || disabledLevel(level)"
                  (change)="change(level)"
                />
              </label>
            }
          </fieldset>
          <p class="status">{{ t('accountStatus.followersAlways') }}</p>
          <div class="more">
            <button
              kxButton
              type="submit"
              [busy]="saving()"
              [disabled]="!canSave() || loading() || uncertain()"
            >
              {{ t('profile.edit.save') }}
            </button>
          </div>
        </form>
      }
      <kx-confirm-dialog
        #discard
        dialogId="account-status-discard"
        titleKey="accountStatus.discardTitle"
        bodyKey="accountStatus.discardBody"
        cancelKey="profile.edit.keepEditing"
        confirmKey="profile.edit.discard"
      /> </ng-container
  ></kx-social-page-frame>`,
  styles: `
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
    }
    input[type='radio'] {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      accent-color: var(--color-primary);
    }
    .audience-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
    }
    .audience-row h2 {
      margin: 0 0 6px;
      font-size: 15px;
    }
    .audience-row p {
      margin: 0;
      color: var(--color-muted);
      font-size: 13px;
      line-height: 1.7;
    }
  `,
})
export class AccountStatusPage {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly posts = inject(PostsService);
  private readonly follows = inject(FollowsService);
  private readonly notice = inject(NoticeService);
  private readonly destroy = inject(DestroyRef);
  private readonly epoch = this.auth.sessionEpoch();
  private request = new AbortController();
  private loadVersion = 0;
  readonly uncertain = signal(false);
  readonly keys = AUDIENCE_KEYS;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly baseline = signal<AccountPreferences | null>(null);
  readonly values = signal<Audience>({
    visible_department: false,
    visible_campus: false,
    visible_university: false,
    visible_explore: false,
  });
  readonly levels: readonly AudienceLevel[] = ['followers', 'department', 'campus', 'university', 'explore'];
  readonly selected = computed(() => audienceLevel(this.values()));
  disabledLevel(level: AudienceLevel): boolean {
    return (
      (level === 'campus' && !this.baseline()?.campus_id) ||
      (level === 'department' && !this.baseline()?.department_id)
    );
  }
  readonly dirty = computed(
    () => !!this.baseline() && this.keys.some((key) => this.baseline()![key] !== this.values()[key]),
  );
  readonly canSave = computed(() => !!this.baseline() && this.dirty());
  private readonly discard = viewChild.required<ConfirmDialogComponent>('discard');
  canLeave(): boolean | Promise<boolean> {
    return !this.current() || (!this.dirty() && !this.saving())
      ? true
      : this.saving()
        ? false
        : this.discard().ask();
  }
  constructor() {
    bindProfilePage('accountStatus.title');
    void this.load();
    this.destroy.onDestroy(() => this.request.abort());
  }
  private current() {
    return !this.destroy.destroyed && this.auth.sessionEpoch() === this.epoch && !!this.auth.session();
  }
  change(level: AudienceLevel) {
    if (!this.disabledLevel(level)) this.values.set(audienceFlags(level));
  }
  async load() {
    this.request.abort();
    this.request = new AbortController();
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set('');
    try {
      const value = await this.account.preferences(this.request.signal);
      if (this.current() && version === this.loadVersion) {
        this.baseline.set(value);
        this.values.set(audienceFlags(audienceLevel(value)));
        this.uncertain.set(false);
      }
    } catch (error) {
      if (this.current() && version === this.loadVersion)
        this.error.set(error instanceof MediaError ? error.key : 'accountStatus.readError');
    } finally {
      if (this.current() && version === this.loadVersion) this.loading.set(false);
    }
  }
  async save(event: Event) {
    event.preventDefault();
    if (!this.current() || this.saving() || this.loading() || this.uncertain() || !this.canSave()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const value = await this.account.save(this.values());
      if (!this.current()) return;
      this.baseline.set(value);
      this.values.set(audienceFlags(audienceLevel(value)));
      this.notice.show('accountStatus.saved');
      await Promise.all([this.posts.load(), this.follows.refresh()]);
    } catch (error) {
      if (this.current()) {
        this.uncertain.set(true);
        this.error.set(error instanceof MediaError ? error.key : 'accountStatus.saveError');
      }
    } finally {
      if (this.current()) this.saving.set(false);
    }
  }
}
