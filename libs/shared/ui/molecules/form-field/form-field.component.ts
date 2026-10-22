import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { validationKey } from '@kampusx/shared/util';
import { InputDirective } from '../../atoms/input/input.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
@Component({
  selector: 'kx-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, InputDirective, IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-field.component.css',
  template: `<div
    class="form-field"
    *transloco="let t"
    [class.field-floating]="floating()"
    [class.field-readonly]="readonly()"
    [class.field-sidebar-search]="variant() === 'sidebar-search'"
  >
    <label [for]="fieldId()" [class.sr-only]="variant() === 'sidebar-search'">{{ t(labelKey()) }}</label>
    <div class="input-wrap" [class.has-clear]="clearable() && !readonly() && count() > 0">
      @if (!floating()) {
        <kx-icon [name]="icon()" />
      }
      @if (multiline()) {
        <textarea
          class="kx-input"
          [id]="fieldId()"
          [formControl]="control()"
          [readOnly]="readonly()"
          [attr.maxlength]="maxLength() || null"
          [attr.aria-invalid]="control().touched && control().invalid"
          [attr.aria-describedby]="fieldId() + '-message ' + fieldId() + '-counter'"
          rows="4"
        ></textarea>
      } @else {
        <input
          kxInput
          [id]="fieldId()"
          [type]="type()"
          [formControl]="control()"
          [readOnly]="readonly()"
          [placeholder]="floating() ? ' ' : t(placeholderKey())"
          [attr.maxlength]="maxLength() || null"
          [autocomplete]="autocomplete()"
          [attr.aria-invalid]="control().touched && control().invalid"
          [attr.aria-describedby]="fieldId() + '-message' + (maxLength() ? ' ' + fieldId() + '-counter' : '')"
          [class.input-valid]="control().touched && control().valid"
        />
      }
      @if (clearable() && !readonly() && count() > 0) {
        <button
          kxIconButton
          class="field-clear"
          type="button"
          [disabled]="control().disabled"
          [attr.aria-label]="t(clearLabelKey())"
          (click)="cleared.emit()"
        >
          <kx-icon name="close" />
        </button>
      }
    </div>
    <p
      class="field-message"
      [class.sr-only]="variant() === 'sidebar-search' && !errorKey() && !hintKey()"
      [class.error-text]="!!errorKey()"
      [id]="fieldId() + '-message'"
      aria-live="polite"
    >
      {{ errorKey() ? t(errorKey(), { max: maxLength() }) : hintKey() ? t(hintKey()) : '' }}
    </p>
    @if (maxLength()) {
      <p
        class="field-counter"
        [class.sr-only]="variant() === 'sidebar-search'"
        [id]="fieldId() + '-counter'"
        [attr.aria-label]="t('common.characterCount', { count: count(), max: maxLength() })"
      >
        {{ count() }} / {{ maxLength() }}
      </p>
    }
  </div>`,
})
export class FormFieldComponent {
  readonly variant = input<'default' | 'sidebar-search'>('default');
  readonly fieldId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly placeholderKey = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly icon = input('alternate_email');
  readonly hintKey = input('');
  readonly floating = input(false);
  readonly multiline = input(false);
  readonly readonly = input(false);
  readonly maxLength = input(0);
  readonly clearable = input(false);
  readonly clearLabelKey = input('common.clear');
  readonly cleared = output<void>();
  private readonly revision = signal(0);
  constructor() {
    effect((onCleanup) => {
      const subscription = this.control().events.subscribe(() => this.revision.update((value) => value + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }
  count(): number {
    this.revision();
    return this.control().value.length;
  }
  errorKey() {
    this.revision();
    return validationKey(this.control());
  }
}
