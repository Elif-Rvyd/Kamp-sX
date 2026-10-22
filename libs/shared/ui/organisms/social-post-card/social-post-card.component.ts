import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { LocalizedNumberPipe, profileInitials, type PostAuthor, type SocialPost } from '@kampusx/shared/util';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ActionMenuComponent, type ActionMenuItem } from '../../molecules/action-menu/action-menu.component';
import { ActionSheetComponent } from '../../molecules/action-sheet/action-sheet.component';
export type PostAction =
  | 'share'
  | 'views'
  | 'repost'
  | 'quote'
  | 'like'
  | 'bookmark'
  | 'comments'
  | 'delete'
  | 'pin'
  | 'archive'
  | 'restore'
  | 'report'
  | 'block';
@Component({
  selector: 'kx-social-post-card',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    LocalizedNumberPipe,
    AvatarComponent,
    IconComponent,
    ActionMenuComponent,
    ActionSheetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-post-card.component.css',
  template: `<article class="social-post" *transloco="let t" [attr.data-kind]="post().kind">
    @if (post().pinnedAt || post().pinSlot) {
      <p class="post-kind"><kx-icon name="push_pin" />{{ t('social.pinned') }}</p>
    }
    @if (post().deletionPending) {
      <p class="post-kind">{{ t('social.pendingDelete') }}</p>
    }
    @if (post().kind !== 'post') {
      <p class="post-kind">
        <kx-icon [name]="post().kind === 'reply' ? 'reply' : 'repeat'" />{{
          t(post().kind === 'reply' ? 'profile.content.reply' : 'profile.content.retweet')
        }}
      </p>
    }
    <div class="post-header">
      <a [routerLink]="authorLink()" [attr.aria-label]="t('social.openProfile', { name: author().fullName })">
        <kx-avatar [initials]="initials()" [src]="author().avatarUrl" />
      </a>
      <div class="post-author">
        <a [routerLink]="authorLink()"
          ><strong>{{ author().fullName }}</strong></a
        >
        <p>
          @if (author().username) {
            <span>{{ '@' + author().username }}</span>
          }
        </p>
      </div>
      <kx-action-menu
        [items]="menuItems()"
        [disabled]="busy() || !post().userId"
        (selected)="menuSelected($event)"
      />
    </div>
    <a class="post-text" [routerLink]="postLink()" [attr.aria-label]="post().text || t('social.openPost')">{{
      post().text
    }}</a>
    @if (post().mediaUrl && post().mediaType === 'video') {
      <video
        class="post-media"
        [src]="post().mediaUrl"
        controls
        playsinline
        preload="metadata"
        [attr.aria-label]="t('media.video')"
      ></video>
    } @else if (post().mediaUrl) {
      <img
        class="post-media"
        [src]="post().mediaUrl"
        [alt]="t('profile.content.mediaAlt')"
        width="640"
        height="360"
        loading="lazy"
      />
    }
    <ng-content select="[postEmbed]" />
    @if (post().createdAt) {
      <a class="post-date" [routerLink]="postLink()">
        <time [attr.datetime]="post().createdAt">{{ date() }}</time>
      </a>
    }
    <div class="post-actions">
      @for (action of actions; track action.id) {
        @if (action.id === 'retweet') {
          <kx-action-sheet
            icon="repeat"
            labelKey="profile.actions.retweet"
            [items]="repostMenu()"
            [count]="post().stats.retweets"
            [disabled]="busy() || !reactionsReady() || !!post().archivedAt || !repostsEnabled()"
            (selected)="this.action.emit($event === 'quote' ? 'quote' : 'repost')"
          />
        } @else {
          <button
            type="button"
            [disabled]="
              busy() ||
              !interactive(action.id) ||
              ((action.id === 'like' || action.id === 'bookmark') && !reactionsReady()) ||
              !!post().archivedAt ||
              post().deletionPending
            "
            [class.selected]="
              action.id === 'like' ? post().liked : action.id === 'bookmark' && post().bookmarked
            "
            [attr.aria-pressed]="
              action.id === 'like' ? !!post().liked : action.id === 'bookmark' ? !!post().bookmarked : null
            "
            [attr.aria-label]="t(action.labelKey)"
            (click)="activate(action.id)"
          >
            <kx-icon [name]="action.icon" />
            @if (action.stat) {
              <span>{{ (action.id === 'views' ? viewsCount() : post().stats[action.stat]) | kxNumber }}</span>
            }
          </button>
        }
      }
    </div>
  </article>`,
})
export class SocialPostCardComponent {
  readonly post = input.required<SocialPost>();
  readonly author = input.required<PostAuthor>();
  readonly language = input('tr');
  readonly ownerId = input('');
  readonly busy = input(false);
  readonly reactionsReady = input(false);
  readonly repostsEnabled = input(true);
  readonly viewsCount = input<number | null>(null);
  readonly action = output<PostAction>();
  readonly own = computed(() => !!this.ownerId() && this.post().userId === this.ownerId());
  readonly menuItems = computed<readonly ActionMenuItem[]>(() =>
    this.own()
      ? this.post().deletionPending
        ? [{ id: 'delete', labelKey: 'social.menu.retryDelete', icon: 'delete', danger: true }]
        : [
            ...(!this.post().archivedAt && !this.post().parentId && this.post().kind === 'post'
              ? [
                  {
                    id: 'pin',
                    labelKey:
                      this.post().pinnedAt || this.post().pinSlot ? 'social.menu.unpin' : 'social.menu.pin',
                    icon: 'push_pin',
                  },
                ]
              : []),
            {
              id: this.post().archivedAt ? 'restore' : 'archive',
              labelKey: this.post().archivedAt ? 'social.menu.restore' : 'social.menu.archive',
              icon: 'archive',
            },
            { id: 'delete', labelKey: 'social.menu.delete', icon: 'delete', danger: true },
          ]
      : [
          {
            id: 'bookmark',
            labelKey: this.post().bookmarked ? 'social.menu.unbookmark' : 'social.menu.bookmark',
            icon: 'bookmark',
            disabled: !this.reactionsReady(),
          },
          { id: 'report', labelKey: 'social.menu.report', icon: 'flag' },
          { id: 'block', labelKey: 'social.menu.block', icon: 'block', danger: true },
        ],
  );
  readonly repostMenu = computed<readonly ActionMenuItem[]>(() => [
    {
      id: 'repost',
      labelKey: this.post().ownRepostId ? 'social.repost.undo' : 'social.repost.create',
      icon: 'repeat',
    },
    { id: 'quote', labelKey: 'social.repost.quote', icon: 'format_quote' },
  ]);
  interactive(id: string): boolean {
    return ['reply', 'like', 'bookmark', 'views', 'share'].includes(id);
  }
  activate(id: string): void {
    if (!this.busy() && this.interactive(id))
      this.action.emit(id === 'reply' ? 'comments' : (id as PostAction));
  }
  menuSelected(id: string): void {
    if (!this.busy() && this.menuItems().some((item) => item.id === id)) this.action.emit(id as PostAction);
  }
  readonly initials = computed(() => profileInitials(this.author().fullName));
  readonly postLink = input<string | null>(null);
  readonly authorLink = input<string | null>(null);
  readonly date = computed(() =>
    this.post().createdAt
      ? new Intl.DateTimeFormat(this.language() === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        }).format(new Date(this.post().createdAt))
      : '',
  );
  readonly actions: readonly {
    id: string;
    icon: string;
    labelKey: string;
    stat?: keyof SocialPost['stats'];
  }[] = [
    { id: 'reply', icon: 'chat_bubble', labelKey: 'profile.actions.reply', stat: 'replies' },
    { id: 'retweet', icon: 'repeat', labelKey: 'profile.actions.retweet', stat: 'retweets' },
    { id: 'like', icon: 'favorite', labelKey: 'profile.actions.like', stat: 'likes' },
    { id: 'views', icon: 'bar_chart', labelKey: 'profile.actions.views', stat: 'views' },
    { id: 'bookmark', icon: 'bookmark', labelKey: 'profile.actions.bookmark' },
    { id: 'share', icon: 'ios_share', labelKey: 'profile.actions.share' },
  ];
}
