import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ActionMenuComponent, type ActionMenuItem } from '../action-menu/action-menu.component';

@Component({
  selector: 'kx-message-bubble',
  standalone: true,
  imports: [TranslocoDirective, ActionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<article *transloco="let t" [class.own]="own()">
    <div class="bubble" [class.deleted]="deleted()">
      <p>{{ deleted() ? t('messaging.deleted') : shared() ? t('messaging.sharedPost') : content() }}</p>
      @if (!deleted()) {
        <ng-content />
      }
      <time [attr.datetime]="createdAt()" [title]="dateLabel()">{{ timeLabel() }}</time>
    </div>
    @if (own() && !deleted()) {
      <kx-action-menu
        labelKey="messaging.menu"
        [items]="menu"
        [disabled]="busy()"
        (selected)="removeRequested.emit()"
      />
    }
  </article>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    article {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-block: 8px;
    }
    article.own {
      flex-direction: row-reverse;
    }
    .bubble {
      max-width: min(78%, 640px);
      min-width: 64px;
      padding: 12px 16px;
      border-radius: 16px;
      background: var(--color-surface-alt);
      color: var(--color-text);
    }
    .own .bubble {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
    p {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.6;
    }
    time {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      text-align: end;
    }
    .deleted p {
      font-style: italic;
    }
  `,
})
export class MessageBubbleComponent {
  readonly content = input.required<string>();
  readonly createdAt = input.required<string>();
  readonly timeLabel = input.required<string>();
  readonly dateLabel = input.required<string>();
  readonly own = input(false);
  readonly deleted = input(false);
  readonly shared = input(false);
  readonly busy = input(false);
  readonly removeRequested = output<void>();
  readonly menu: readonly ActionMenuItem[] = [
    { id: 'delete', labelKey: 'messaging.delete', icon: 'delete', danger: true },
  ];
}
