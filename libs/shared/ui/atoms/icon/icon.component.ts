import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'kx-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="material-symbols-outlined" aria-hidden="true">{{ name() }}</span>`,
  host: { 'aria-hidden': 'true', class: 'kx-icon' },
})
export class IconComponent {
  readonly name = input.required<string>();
}
