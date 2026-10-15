import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'button[kxIconButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './icon-button.component.css',
  host: { class: 'kx-icon-button', '[class.icon-button-surface]': 'surface()', '[disabled]': 'disabled()' },
})
export class IconButtonComponent {
  readonly surface = input(false);
  readonly disabled = input(false);
}
