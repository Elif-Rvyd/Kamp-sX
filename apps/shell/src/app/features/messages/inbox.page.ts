import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent, InboxItemComponent } from '@kampusx/shared/ui';
import { LanguageService } from '../../core/language.service';
import { MediaService } from '../../core/media.service';
import type { InboxRow } from '../../core/messaging.contract';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from '../social/social-page-frame.component';
import { MessagesStore } from './messages.store';
import { MessagingConnectionComponent } from './messaging-connection.component';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ButtonComponent,
    InboxItemComponent,
    SocialPageFrameComponent,
    MessagingConnectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../social/social-pages.css',
  template: `<kx-social-page-frame titleKey="messaging.title" back="/dashboard"
    ><ng-container *transloco="let t">
      <kx-messaging-connection />
      @if (store.error()) {
        <div class="status error-text" role="alert">
          {{ t(store.error()) }}
          <button kxButton type="button" emphasis="ghost" (click)="store.refresh()">
            {{ t('media.retry') }}
          </button>
        </div>
      }
      @if (store.loading() && !store.inbox().length) {
        <p class="status" role="status">{{ t('messaging.loading') }}</p>
      }
      @for (row of store.inbox(); track row.conversation_id) {
        <kx-inbox-item
          [link]="'/messages/' + row.conversation_id"
          [name]="row.peer_full_name || row.peer_username || t('messaging.student')"
          [username]="row.peer_username || ''"
          [avatar]="avatar(row)"
          [preview]="
            row.last_deleted_at
              ? t('messaging.deleted')
              : row.last_shared_post_id
                ? t('messaging.sharedPost')
                : row.last_content || t('messaging.noMessages')
          "
          [unread]="row.unread_count"
          [date]="row.last_created_at || ''"
          [dateLabel]="date(row.last_created_at)"
        />
      } @empty {
        @if (!store.loading() && !store.error()) {
          <div class="empty" role="status">
            <h2>{{ t('messaging.emptyTitle') }}</h2>
            <p>{{ t('messaging.emptyBody') }}</p>
          </div>
        }
      }
    </ng-container></kx-social-page-frame
  >`,
})
export class InboxPage {
  readonly store = inject(MessagesStore);
  readonly language = inject(LanguageService);
  private readonly media = inject(MediaService);
  constructor() {
    bindProfilePage('messaging.title');
    this.store.select('');
  }
  avatar(row: InboxRow) {
    return this.media.isPublicUrl(row.peer_avatar_url, row.peer_id, 'avatar')
      ? row.peer_avatar_url!
      : undefined;
  }
  date(value: string | null) {
    return value
      ? new Intl.DateTimeFormat(this.language.language(), { day: 'numeric', month: 'short' }).format(
          new Date(value),
        )
      : '';
  }
}
