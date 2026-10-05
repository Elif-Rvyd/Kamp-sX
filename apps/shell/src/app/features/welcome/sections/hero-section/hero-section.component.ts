import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  BadgeComponent,
  StickerComponent,
  FeatureCardComponent,
  PostCardPreviewComponent,
  IconComponent,
  MarqueeStripComponent,
} from '@kampusx/shared/ui';
import { HERO_POSTS, LocalizedNumberPipe } from '@kampusx/shared/util';
import { AuthPanelComponent } from '../../../auth/auth-panel/auth-panel.component';
@Component({
  selector: 'kx-hero-section',
  standalone: true,
  imports: [
    TranslocoDirective,
    BadgeComponent,
    StickerComponent,
    FeatureCardComponent,
    PostCardPreviewComponent,
    IconComponent,
    MarqueeStripComponent,
    LocalizedNumberPipe,
    AuthPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="hero-section page-container" *transloco="let t" aria-labelledby="hero-title">
      <div class="hero-grid">
        <div class="hero-poster">
          <div class="poster-orbit" aria-hidden="true"></div>
          <div class="poster-grain" aria-hidden="true"></div>
          <div class="hero-content">
            <div class="hero-live">
              <kx-badge [live]="true"
                ><span class="live-dot" aria-hidden="true"></span>{{ t('hero.live') }}</kx-badge
              ><span class="live-count"
                >{{ 24500 | kxNumber }}{{ t('common.plus') }} {{ t('hero.active') }}</span
              >
            </div>
            <h1 id="hero-title">
              <span>{{ t('hero.titleTop') }}</span
              ><span class="headline-gradient">{{ t('hero.titleMiddle') }}</span
              ><span>{{ t('hero.titleBottom') }}</span>
            </h1>
            <p class="hero-description">
              <strong>{{ t('hero.welcome') }}</strong> {{ t('hero.description') }}
            </p>
            <div class="poster-scene" [attr.aria-label]="t('hero.posterLabel')">
              <kx-sticker class="scene-sticker"
                >{{ t('hero.sticker') }}<span aria-hidden="true"> ✳</span></kx-sticker
              ><kx-post-card-preview [post]="posts[0]" class="scene-photo" /><kx-post-card-preview
                [post]="posts[1]"
                class="scene-anonymous"
              /><kx-post-card-preview [post]="posts[2]" class="scene-poll" /><kx-post-card-preview
                [post]="posts[3]"
                class="scene-video"
              /><kx-sticker [round]="true" tone="coral" class="scene-round">{{
                t('hero.roundSticker')
              }}</kx-sticker
              ><span class="scene-doodle" aria-hidden="true">✷</span>
            </div>
            <div class="poster-footnote">
              <span><kx-icon name="public" />{{ 81 | kxNumber }} {{ t('hero.universities') }}</span
              ><span>{{ t('hero.sample') }}</span>
            </div>
          </div>
        </div>
        <div class="hero-auth">
          <kx-auth-panel>
            <div class="auth-side-note">
              <span class="tiny-avatars" aria-hidden="true"
                ><span>👩🏽</span><span>👨🏻</span><span>👩🏼</span><span>👨🏾</span></span
              >
              <p>{{ t('about.trust') }}</p>
            </div>
          </kx-auth-panel>
        </div>
      </div>
      <div class="micro-features">
        <kx-feature-card
          icon="verified_user"
          titleKey="hero.verified.title"
          textKey="hero.verified.text"
        /><kx-feature-card
          icon="trending_up"
          titleKey="hero.trending.title"
          textKey="hero.trending.text"
        /><kx-feature-card icon="masks" titleKey="hero.anonymous.title" textKey="hero.anonymous.text" /><a
          href="#hakkinda"
          class="discover-link"
          >{{ t('hero.scroll') }}<kx-icon name="south"
        /></a>
      </div>
    </section>
    <kx-marquee-strip />`,
})
export class HeroSectionComponent {
  readonly posts = HERO_POSTS;
}
