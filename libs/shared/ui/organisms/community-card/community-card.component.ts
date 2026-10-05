import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommunityPreview, LocalizedNumberPipe } from '@kampusx/shared/util';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { ButtonComponent } from '../../atoms/button/button.component';
@Component({
  selector: 'kx-community-card',
  standalone: true,
  imports: [TranslocoDirective, LocalizedNumberPipe, IconComponent, BadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'community-card', '[attr.data-tone]': 'community().tone' },
  template: `<article *transloco="let t">
    <div class="community-cover">
      <div class="cover-orbit" aria-hidden="true"></div>
      <span class="club-icon"><kx-icon [name]="community().icon" /></span
      ><kx-badge>{{ t(community().tagKey) }}</kx-badge>
    </div>
    <div class="community-body">
      <h3>{{ t(community().nameKey) }}</h3>
      <p>{{ t(community().universityKey) }}</p>
      <div class="community-bottom">
        <span
          ><kx-icon name="group" />{{ community().members | kxNumber }} {{ t('communities.members') }}</span
        ><button
          kxButton
          emphasis="outline"
          type="button"
          (click)="joinRequested.emit(community().id)"
          [attr.aria-label]="t('communities.join') + ': ' + t(community().nameKey)"
        >
          {{ t('communities.join') }}<kx-icon name="add" />
        </button>
      </div>
    </div>
  </article>`,
})
export class CommunityCardComponent {
  readonly community = input.required<CommunityPreview>();
  readonly joinRequested = output<string>();
}
