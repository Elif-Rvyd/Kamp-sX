import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import type { ReportReason } from '@kampusx/shared/util';

@Component({
  selector: 'kx-report-reason',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<fieldset *transloco="let t">
    <legend>{{ t('social.report.reason') }}</legend>
    @for (reason of reasons; track reason) {
      <label
        ><input
          type="radio"
          [name]="name()"
          [value]="reason"
          [checked]="value() === reason"
          (change)="changed.emit(reason)"
        />{{ t('social.report.' + reason) }}</label
      >
    }
  </fieldset>`,
  styles: `
    fieldset {
      border: 0;
      padding: 0;
      margin: 16px 0;
    }
    legend {
      font-weight: 700;
      margin-bottom: 8px;
    }
    label {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      cursor: pointer;
    }
    input {
      accent-color: var(--color-primary);
      width: 18px;
      height: 18px;
    }
  `,
})
export class ReportReasonComponent {
  readonly name = input.required<string>();
  readonly value = input<ReportReason>('spam');
  readonly changed = output<ReportReason>();
  readonly reasons: readonly ReportReason[] = [
    'spam',
    'harassment',
    'inappropriate',
    'impersonation',
    'other',
  ];
}
