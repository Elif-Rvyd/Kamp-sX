import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocalizedNumberPipe, profileInitials, type PostAuthor, type SocialPost } from '@kampusx/shared/util';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-social-post-card',
  standalone: true,
  imports: [TranslocoDirective, LocalizedNumberPipe, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-post-card.component.css',
  template: `<article class="social-post" *transloco="let t" [attr.data-kind]="post().kind">
    @if (post().kind !== 'post') {
      <p class="post-kind">
        <kx-icon [name]="post().kind === 'reply' ? 'reply' : 'repeat'" />{{
          t(post().kind === 'reply' ? 'profile.content.reply' : 'profile.content.retweet')
        }}
      </p>
    }
    <div class="post-header">
      <kx-avatar [initials]="initials()" [src]="author().avatarUrl" />
      <div class="post-author">
        <strong>{{ author().fullName }}</strong>
        <p>
          @if (author().username) {
            <span>{{ '@' + author().username }}</span>
          }
          @if (post().createdAt) {
            <time [attr.datetime]="post().createdAt">{{ date() }}</time>
          }
        </p>
      </div>
      <kx-icon name="more_horiz" />
    </div>
    <p class="post-text">{{ post().text }}</p>
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
    <div class="post-actions">
      @for (action of actions; track action.id) {
        <button
          type="button"
          aria-disabled="true"
          [attr.aria-label]="t(action.labelKey)"
          [attr.aria-describedby]="'profile-post-note-' + post().id"
        >
          <kx-icon [name]="action.icon" />
          @if (action.stat) {
            <span>{{ post().stats[action.stat] | kxNumber }}</span>
          }
        </button>
      }
    </div>
    <p class="sr-only" [id]="'profile-post-note-' + post().id">{{ t('profile.content.visualOnly') }}</p>
  </article>`,
})
export class SocialPostCardComponent {
  readonly post = input.required<SocialPost>();
  readonly author = input.required<PostAuthor>();
  readonly language = input('tr');
  readonly initials = computed(() => profileInitials(this.author().fullName));
  readonly date = computed(() =>
    this.post().createdAt
      ? new Intl.DateTimeFormat(this.language() === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric',
          month: 'short',
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
