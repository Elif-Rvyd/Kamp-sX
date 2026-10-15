import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
@Component({
  selector: 'kx-toast',
  standalone: true,
  imports: [TranslocoDirective, IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="toast" *transloco="let t" role="status" aria-live="polite">
    <kx-icon name="check_circle" />
    <p>{{ t(messageKey()) }}</p>
    <button kxIconButton type="button" [attr.aria-label]="t('common.close')" (click)="dismissed.emit()">
      <kx-icon name="close" />
    </button>
  </div>`,
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  readonly messageKey = input.required<string>();
  readonly dismissed = output<void>();
}
