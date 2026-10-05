import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LocalizedNumberPipe } from '@kampusx/shared/util';
@Component({
  selector: 'kx-stat-card',
  standalone: true,
  imports: [TranslocoDirective, LocalizedNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<strong
      >{{ value() | kxNumber }}<span aria-hidden="true">{{ suffix() }}</span></strong
    ><span *transloco="let t">{{ t(labelKey()) }}</span>`,
  host: { class: 'stat-card' },
})
export class StatCardComponent {
  readonly value = input.required<number>();
  readonly suffix = input('');
  readonly labelKey = input.required<string>();
}
