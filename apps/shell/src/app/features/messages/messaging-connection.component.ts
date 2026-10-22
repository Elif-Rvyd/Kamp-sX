import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonComponent } from '@kampusx/shared/ui';
import { MessagesStore } from './messages.store';
@Component({
  selector: 'kx-messaging-connection',
  standalone: true,
  imports: [TranslocoDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t">
    @if (!store.connected()) {
      <div class="connection" role="status">
        {{ t(store.connecting() ? 'messaging.connecting' : 'messaging.offline') }}
        @if (!store.connecting()) {
          <button kxButton type="button" emphasis="ghost" (click)="store.reconnect()">
            {{ t('media.retry') }}
          </button>
        }
      </div>
    }
  </ng-container>`,
  styles: `
    .connection {
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-muted);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
  `,
})
export class MessagingConnectionComponent {
  readonly store = inject(MessagesStore);
}
