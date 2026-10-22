import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
@Component({
  selector: 'kx-inbox-item',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a *transloco="let t" [routerLink]="link()" [class.unread]="unread() > 0">
    <kx-avatar [initials]="name().slice(0, 1).toLocaleUpperCase()" [src]="avatar()" />
    <span class="body"
      ><strong>{{ name() }}</strong
      ><span class="handle">{{ '@' + username() }}</span
      ><span class="preview">{{ preview() }}</span></span
    >
    <span class="meta">
      @if (dateLabel()) {
        <time [attr.datetime]="date()">{{ dateLabel() }}</time>
      }
      @if (unread() > 0) {
        <span class="unread-count" [attr.aria-label]="t('messaging.unread', { count: unread() })">{{
          unread()
        }}</span>
      }
    </span>
  </a>`,
  styles: `
    :host {
      display: block;
    }
    a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      min-height: 88px;
      color: var(--color-text);
      text-decoration: none;
      border-bottom: 1px solid var(--color-border);
    }
    a:hover,
    a:focus-visible {
      background: var(--color-surface-alt);
    }
    .body {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 4px;
    }
    strong,
    .preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .handle,
    .preview,
    time {
      color: var(--color-muted);
      font-size: 0.875rem;
    }
    .unread .preview {
      color: var(--color-text);
      font-weight: 600;
    }
    .meta {
      display: grid;
      gap: 8px;
      justify-items: end;
    }
    .unread-count {
      min-width: 24px;
      padding: 2px 6px;
      border-radius: 99px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      text-align: center;
      font-size: 0.75rem;
    }
  `,
})
export class InboxItemComponent {
  readonly link = input.required<string>();
  readonly name = input.required<string>();
  readonly username = input.required<string>();
  readonly preview = input.required<string>();
  readonly avatar = input<string>();
  readonly unread = input(0);
  readonly date = input('');
  readonly dateLabel = input('');
}
