import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  CommunityCardComponent,
  StickerComponent,
  IconComponent,
  ButtonComponent,
  FeatureCardComponent,
} from '@kampusx/shared/ui';
import { COMMUNITIES, RevealDirective } from '@kampusx/shared/util';
import { AuthUiService } from '../../../../core/auth-ui.service';
@Component({
  selector: 'kx-communities-section',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommunityCardComponent,
    StickerComponent,
    IconComponent,
    ButtonComponent,
    FeatureCardComponent,
    RevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section
    id="topluluklar"
    class="communities-section section-space"
    kxReveal
    *transloco="let t"
    aria-labelledby="communities-title"
  >
    <div class="page-container">
      <div class="section-kicker">
        <span>{{ t('communities.number') }}</span
        ><span>{{ t('communities.kicker') }}</span
        ><span class="section-line"></span>
      </div>
      <div class="communities-heading">
        <div>
          <h2 id="communities-title">{{ t('communities.title') }}</h2>
          <p>{{ t('communities.description') }}</p>
        </div>
        <kx-sticker tone="coral">{{ t('communities.sticker') }}<span aria-hidden="true"> ↗</span></kx-sticker>
      </div>
      <div class="community-grid">
        @for (community of communities; track community.id) {
          <kx-community-card
            [community]="community"
            (joinRequested)="auth.open('register', 'communities.joinDemo')"
          />
        }
      </div>
      <p class="collection-note">{{ t('communities.all') }}</p>
      <div id="akademik-ag" class="academic-panel">
        <div class="academic-intro">
          <p class="mono-label">{{ t('academic.kicker') }}</p>
          <h3>{{ t('academic.title') }}</h3>
          <p>{{ t('academic.description') }}</p>
          <button kxButton type="button" emphasis="outline" (click)="auth.open('register')">
            {{ t('academic.cta') }}<kx-icon name="north_east" />
          </button>
        </div>
        <div class="academic-features">
          @for (feature of academicFeatures; track feature.key) {
            <kx-feature-card
              [icon]="feature.icon"
              [titleKey]="'academic.' + feature.key"
              [textKey]="'academic.' + feature.key + 'Text'"
            />
          }
        </div>
        <span class="academic-asterisk" aria-hidden="true">✳</span>
      </div>
    </div>
  </section>`,
})
export class CommunitiesSectionComponent {
  readonly auth = inject(AuthUiService);
  readonly communities = COMMUNITIES;
  readonly academicFeatures = [
    { key: 'research', icon: 'biotech' },
    { key: 'notes', icon: 'auto_stories' },
    { key: 'projects', icon: 'hub' },
    { key: 'events', icon: 'event' },
  ];
}
