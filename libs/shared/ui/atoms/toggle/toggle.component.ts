import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
@Component({
  selector: 'button[kxToggle]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'icon-button', '[attr.aria-pressed]': 'pressed()', '(click)': 'toggled.emit()' },
})
export class ToggleComponent {
  readonly pressed = input(false);
  readonly toggled = output<void>();
}
