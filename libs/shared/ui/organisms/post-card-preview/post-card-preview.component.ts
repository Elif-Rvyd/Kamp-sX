import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocalizedNumberPipe, PostPreview } from '@kampusx/shared/util';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BadgeComponent } from '../../atoms/badge/badge.component';
@Component({
  selector: 'kx-post-card-preview',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, BadgeComponent, LocalizedNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'post-card', '[class.post-anonymous]': 'post().type === "anonymous"' },
  template: `<article *transloco="let t" [attr.aria-label]="t('posts.sample')">
    <div class="post-header">
      <div class="post-avatar" [class.avatar-anonymous]="post().type === 'anonymous'" aria-hidden="true">
        {{ post().avatar }}
      </div>
      <div class="post-identity">
        <strong
          >{{ t(post().nameKey) }}
          @if (post().type !== 'anonymous') {
            <kx-icon name="verified" />
          }</strong
        ><span>{{ post().handle }} <span aria-hidden="true">·</span> {{ t('posts.time') }}</span>
      </div>
      @if (post().type === 'anonymous') {
        <kx-badge>{{ t('posts.anonymousTag') }}</kx-badge>
      } @else {
        <kx-icon name="more_horiz" />
      }
    </div>
    <p class="post-copy">{{ t(post().textKey) }}</p>
    @if (post().type === 'photo') {
      <figure class="campus-art" role="img" [attr.aria-label]="t('posts.photo.alt')">
        <svg viewBox="0 0 480 200" aria-hidden="true">
          <defs>
            <linearGradient id="sunset" x2="0" y2="1">
              <stop stop-color="#a5cff0" />
              <stop offset="1" stop-color="#f8cf9f" />
            </linearGradient>
          </defs>
          <rect width="480" height="200" fill="url(#sunset)" />
          <circle cx="360" cy="61" r="28" fill="#ffe7b3" />
          <path d="M0 152Q100 125 225 151T480 140V200H0Z" fill="#648e82" />
          <path d="M0 180Q130 150 260 178T480 165V200H0Z" fill="#426d65" />
          <path d="M107 85H310V159H107Z" fill="#e9d5bc" />
          <path d="M98 85L207 43L319 85Z" fill="#766957" />
          <path
            d="M123 106H142V137H123ZM155 106H174V137H155ZM238 106H257V137H238ZM270 106H289V137H270Z"
            fill="#6c8890"
          />
          <path d="M191 95H223V159H191Z" fill="#817569" />
          <path d="M85 96H100V167H85ZM339 103H352V173H339Z" fill="#625c45" />
          <g fill="#38655c">
            <circle cx="91" cy="70" r="36" />
            <circle cx="69" cy="84" r="27" />
            <circle cx="347" cy="82" r="37" />
            <circle cx="375" cy="100" r="26" />
          </g>
          <path d="M178 200L200 163H216L260 200" fill="#c9ba9d" />
          <g fill="#334c55">
            <circle cx="256" cy="163" r="5" />
            <path d="M251 169H261L264 186H249Z" />
            <circle cx="279" cy="173" r="4" />
            <path d="M275 179H283L286 192H273Z" />
          </g>
        </svg>
        <figcaption>{{ t('posts.photo.caption') }}</figcaption>
      </figure>
    }
    @if (post().type === 'poll') {
      <div class="poll-preview">
        <div class="poll-row">
          <span class="poll-fill first"></span><span>{{ t('posts.poll.one') }}</span
          ><strong>{{ t('posts.poll.firstPercent') }}</strong>
        </div>
        <div class="poll-row">
          <span class="poll-fill second"></span><span>{{ t('posts.poll.two') }}</span
          ><strong>{{ t('posts.poll.secondPercent') }}</strong>
        </div>
        <small>{{ 128 | kxNumber }} {{ t('posts.poll.votes') }}</small>
      </div>
    }
    @if (post().type === 'video') {
      <figure class="video-art" [attr.aria-label]="t('posts.video.preview')">
        <div class="stage-bars" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="video-play" aria-hidden="true"><kx-icon name="play_arrow" /></span>
        <figcaption>
          {{ t('posts.video.caption') }}<span>{{ t('posts.video.duration') }}</span>
        </figcaption>
      </figure>
    }
    <div class="post-footer">
      <button
        type="button"
        [attr.aria-label]="t(liked() ? 'posts.unlike' : 'posts.like')"
        [attr.aria-pressed]="liked()"
        [class.liked]="liked()"
        (click)="liked.set(!liked())"
      >
        <kx-icon name="favorite" /><span>{{ post().likes + (liked() ? 1 : 0) | kxNumber }}</span></button
      ><span [attr.aria-label]="t('posts.comments')"
        ><kx-icon name="chat_bubble" />{{ post().comments | kxNumber }}</span
      ><span [attr.aria-label]="t('posts.share')"><kx-icon name="repeat" />{{ 8 | kxNumber }}</span
      ><kx-icon name="bookmark" />
    </div>
  </article>`,
})
export class PostCardPreviewComponent {
  readonly post = input.required<PostPreview>();
  readonly liked = signal(false);
}
