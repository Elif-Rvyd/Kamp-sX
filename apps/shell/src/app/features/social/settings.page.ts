import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '@kampusx/shared/ui';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';
@Component({
  standalone: true,
  imports: [RouterLink, TranslocoDirective, IconComponent, SocialPageFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './social-pages.css',
  template: `<kx-social-page-frame titleKey="social.settings" back="/dashboard"
    ><nav *transloco="let t" [attr.aria-label]="t('social.settings')">
      @for (item of links; track item.path) {
        <a class="list-link" [routerLink]="item.path"
          ><kx-icon [name]="item.icon" /><span>{{ t(item.key) }}</span
          ><kx-icon name="chevron_right"
        /></a>
      }</nav
  ></kx-social-page-frame>`,
})
export class SettingsPage {
  readonly links = [
    { path: '/profile/requests', key: 'follows.titles.requests', icon: 'person_add' },
    { path: '/settings/archive', key: 'social.archive.title', icon: 'archive' },
    { path: '/settings/bookmarks', key: 'social.bookmarks.title', icon: 'bookmark' },
    { path: '/settings/blocked', key: 'social.blocked.title', icon: 'block' },
  ];
  constructor() {
    bindProfilePage('social.settings');
  }
}
