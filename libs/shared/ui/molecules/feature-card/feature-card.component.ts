import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-feature-card',
  standalone: true,
  imports: [IconComponent, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="feature-icon"><kx-icon [name]="icon()" /></div>
    <div *transloco="let t">
      <h3>{{ t(titleKey()) }}</h3>
      <p>{{ t(textKey()) }}</p>
    </div>`,
  host: { class: 'micro-feature' },
})
export class FeatureCardComponent {
  readonly icon = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly textKey = input.required<string>();
}
