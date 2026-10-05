import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent, BadgeComponent, StatCardComponent } from '@kampusx/shared/ui';
import { RevealDirective } from '@kampusx/shared/util';
@Component({
  selector: 'kx-about-section',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, BadgeComponent, StatCardComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    id="hakkinda"
    class="about-section section-space page-container"
    kxReveal
    *transloco="let t"
    aria-labelledby="about-title"
  >
    <div class="section-kicker">
      <span>{{ t('about.number') }}</span
      ><span>{{ t('about.kicker') }}</span
      ><span class="section-line"></span>
    </div>
    <div class="about-intro">
      <h2 id="about-title">{{ t('about.title') }}</h2>
      <div>
        <p>{{ t('about.description') }}</p>
        <blockquote>{{ t('about.quote') }}<span aria-hidden="true">✳</span></blockquote>
      </div>
    </div>
    <div class="sharing-grid">
      <article class="share-block share-photo">
        <div class="share-visual photo-visual" aria-hidden="true">
          <span class="photo-frame"><kx-icon name="landscape" /></span><span class="photo-heart">♡</span>
        </div>
        <kx-icon name="photo_camera" />
        <h3>{{ t('about.photo') }}</h3>
        <p>{{ t('about.photoText') }}</p>
      </article>
      <article class="share-block share-video">
        <div class="share-visual reel-visual" aria-hidden="true">
          <span class="reel-screen"><kx-icon name="play_circle" /></span><span class="reel-star">✧</span>
        </div>
        <kx-icon name="movie" />
        <h3>{{ t('about.video') }}</h3>
        <p>{{ t('about.videoText') }}</p>
      </article>
      <article class="share-block share-text">
        <div class="share-visual text-visual" aria-hidden="true">
          <span class="chat-bubble">“</span><span class="small-chat">✎</span>
        </div>
        <kx-icon name="edit_note" />
        <h3>{{ t('about.text') }}</h3>
        <p>{{ t('about.textText') }}</p>
      </article>
    </div>
    <p class="interaction-note"><kx-icon name="forum" />{{ t('about.interactions') }}</p>
    <div id="kesfet" class="feed-showcase">
      <div class="feed-explanation">
        <kx-badge>{{ t('nav.explore') }}</kx-badge>
        <h3>{{ t('about.feeds.title') }}</h3>
        <p>{{ t('about.feeds.' + active() + 'Text') }}</p>
        <div class="feed-trust">
          <kx-icon name="verified" /><span>{{ t('about.trustText') }}</span>
        </div>
      </div>
      <div class="feed-preview">
        <div class="feed-tabs" role="tablist" [attr.aria-label]="t('about.feeds.tabs')">
          @for (feed of feeds; track feed; let index = $index) {
            <button
              type="button"
              role="tab"
              [id]="'feed-tab-' + feed"
              [attr.aria-controls]="'feed-panel'"
              [attr.aria-selected]="active() === feed"
              [attr.tabindex]="active() === feed ? 0 : -1"
              [class.active]="active() === feed"
              (click)="active.set(feed)"
              (keydown)="onTabKey($event, index)"
            >
              {{ t('about.feeds.' + feed) }}
            </button>
          }
        </div>
        <div
          class="sample-feed"
          id="feed-panel"
          role="tabpanel"
          [attr.aria-labelledby]="'feed-tab-' + active()"
          tabindex="0"
        >
          <div class="feed-meta">
            <span class="post-avatar" aria-hidden="true">{{
              active() === 'university' ? '🎬' : active() === 'department' ? '💻' : '🎉'
            }}</span>
            <div>
              <strong>{{ t('about.feeds.' + active()) }}</strong
              ><span>{{ t('about.feeds.context') }}</span>
            </div>
            <kx-icon name="verified" />
          </div>
          <p>{{ t('about.feeds.' + active() + 'Post') }}</p>
          <div class="feed-footer">
            <span><kx-icon name="favorite" />{{ t('posts.like') }}</span
            ><kx-icon name="chat_bubble" /><kx-icon name="repeat" /><kx-icon name="send" />
          </div>
        </div>
      </div>
    </div>
    <div class="stats-strip">
      <kx-stat-card
        [value]="24500"
        [suffix]="t('common.plus')"
        labelKey="about.stats.students"
      /><kx-stat-card [value]="81" labelKey="about.stats.universities" /><kx-stat-card
        [value]="12000"
        [suffix]="t('common.plus')"
        labelKey="about.stats.posts"
      /><span class="sample-label">{{ t('common.sample') }}</span>
    </div>
  </section>`,
})
export class AboutSectionComponent {
  readonly feeds = ['university', 'department', 'explore'] as const;
  readonly active = signal<(typeof this.feeds)[number]>('university');
  onTabKey(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    this.active.set(this.feeds[next]);
    document.getElementById('feed-tab-' + this.feeds[next])?.focus();
  }
}
