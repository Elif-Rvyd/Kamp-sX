import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
@Component({
  selector: 'button[kxSwitch]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>',
  host: {
    type: 'button',
    role: 'switch',
    '[attr.aria-checked]': 'checked()',
    '[class.is-checked]': 'checked()',
    '(click)': 'changed.emit(!checked())',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      min-width: 52px;
      min-height: 44px;
      border: 0;
      padding: 4px;
      background: transparent;
      cursor: pointer;
    }
    .switch-track {
      display: block;
      width: 44px;
      height: 26px;
      border-radius: var(--radius-panel);
      background: var(--color-muted);
      padding: 3px;
    }
    .switch-thumb {
      display: block;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-panel);
      background: var(--color-surface);
      transition: transform 150ms ease;
    }
    :host(.is-checked) .switch-track {
      background: var(--color-primary);
    }
    :host(.is-checked) .switch-thumb {
      background: var(--color-on-primary);
      transform: translateX(18px);
    }
    :host(:disabled) {
      opacity: 0.55;
      cursor: default;
    }
    @media (prefers-reduced-motion: reduce) {
      .switch-thumb {
        transition: none;
      }
    }
  `,
})
export class SwitchComponent {
  readonly checked = input(false);
  readonly changed = output<boolean>();
}
