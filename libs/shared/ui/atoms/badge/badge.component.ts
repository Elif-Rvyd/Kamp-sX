import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'kx-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'kx-badge', '[class.badge-live]': 'live()' },
})
export class BadgeComponent {
  readonly live = input(false);
}
