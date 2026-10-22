import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { validationKey } from '@kampusx/shared/util';
import { ButtonComponent } from '../../atoms/button/button.component';
/** Native selection-only combobox: no arbitrary academic names can be entered. */
@Component({
  selector: 'kx-academic-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="form-field" *transloco="let t">
    <label [for]="fieldId()">{{ t(labelKey()) }}</label>
    <select
      class="kx-input"
      [id]="fieldId()"
      [formControl]="control()"
      [attr.aria-invalid]="control().touched && control().invalid"
      [attr.aria-describedby]="fieldId() + '-message'"
      (change)="queryChanged.emit(control().value)"
    >
      <option value="" disabled>{{ t(loading() ? 'academic.loading' : 'academic.select') }}</option>
      @for (option of options(); track option.id) {
        <option [value]="option.name">{{ option.name }}</option>
      }
    </select>
    <p class="field-message" [class.error-text]="!!error()" [id]="fieldId() + '-message'" aria-live="polite">
      {{
        error()
          ? t(error(), { max: 150 })
          : failed()
            ? t('academic.failed')
            : !loading() && !options().length
              ? t('academic.unavailableOptions')
              : t('academic.selectionOnly')
      }}
    </p>
    @if (failed()) {
      <button kxButton type="button" emphasis="ghost" (click)="retried.emit()">{{ t('media.retry') }}</button>
    }
  </div>`,
  styles: `
    :host {
      display: block;
    }
    select {
      width: 100%;
      min-height: 48px;
      padding-inline: 12px;
      appearance: auto;
      background: var(--color-surface);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-control);
      font: inherit;
    }
    option {
      background: var(--color-surface);
      color: var(--color-text);
    }
  `,
})
export class AcademicPickerComponent {
  readonly fieldId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly options = input<readonly { id: string; name: string }[]>([]);
  readonly loading = input(false);
  readonly failed = input(false);
  readonly queryChanged = output<string>();
  readonly retried = output<void>();
  private readonly revision = signal(0);
  readonly error = computed(() => {
    this.revision();
    return validationKey(this.control());
  });
  constructor() {
    effect((cleanup) => {
      const sub = this.control().events.subscribe(() => this.revision.update((v) => v + 1));
      cleanup(() => sub.unsubscribe());
    });
  }
}
