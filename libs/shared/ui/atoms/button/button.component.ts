import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'button[kxButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="button-content" [class.button-busy]="busy()"><ng-content /></span>
    @if (busy()) {
      <span class="spinner" aria-hidden="true"></span>
    }`,
  host: {
    class: 'kx-button',
    '[class.button-outline]': 'emphasis() === "outline"',
    '[class.button-ghost]': 'emphasis() === "ghost"',
    '[disabled]': 'disabled() || busy()',
    '[attr.aria-busy]': 'busy()',
  },
})
export class ButtonComponent {
  readonly emphasis = input<'solid' | 'outline' | 'ghost'>('solid');
  readonly disabled = input(false);
  readonly busy = input(false);
}
