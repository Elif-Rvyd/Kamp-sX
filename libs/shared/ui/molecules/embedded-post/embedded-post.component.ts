import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import type { PostAuthor, SocialPost } from '@kampusx/shared/util';
@Component({
  selector: 'kx-embedded-post',
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="embedded" *transloco="let t">
    @if (loading()) {
      <p role="status">{{ t('posts.loading') }}</p>
    } @else if (post(); as value) {
      <a [routerLink]="'/posts/' + value.id" class="embedded-link">
        <strong>{{ author()?.fullName || t('posts.author') }}</strong>
        @if (author()?.username) {
          <span>{{ '@' + author()!.username }}</span>
        }
        <p>{{ value.text || t('social.openPost') }}</p>
      </a>
      @if (value.mediaUrl && value.mediaType === 'image') {
        <img
          [src]="value.mediaUrl"
          [alt]="t('profile.content.mediaAlt')"
          width="640"
          height="360"
          loading="lazy"
        />
      }
      @if (value.mediaUrl && value.mediaType === 'video') {
        <video
          [src]="value.mediaUrl"
          controls
          playsinline
          preload="metadata"
          [attr.aria-label]="t('media.video')"
        ></video>
      }
    } @else {
      <p role="status">{{ t(failed() ? 'social.repost.readError' : 'social.repost.hidden') }}</p>
    }
  </div>`,
  styles: `
    .embedded {
      margin: 16px 0;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-control);
      overflow: hidden;
      font-size: 13px;
    }
    .embedded-link {
      display: block;
      padding: 16px;
      color: var(--color-text);
      overflow-wrap: anywhere;
    }
    .embedded-link span {
      margin-inline-start: 8px;
      color: var(--color-muted);
    }
    p {
      padding: 12px 16px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .embedded-link p {
      padding: 10px 0 0;
    }
    img,
    video {
      width: 100%;
      max-height: 360px;
      object-fit: contain;
      background: var(--color-surface-alt);
    }
  `,
})
export class EmbeddedPostComponent {
  readonly post = input<SocialPost | null>(null);
  readonly author = input<PostAuthor | null>(null);
  readonly loading = input(false);
  readonly failed = input(false);
}
