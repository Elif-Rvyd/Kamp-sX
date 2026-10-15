import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { validationKey } from '@kampusx/shared/util';
import { InputDirective } from '../../atoms/input/input.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
@Component({
  selector: 'kx-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective, InputDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-field.component.css',
  template: `<div class="form-field" *transloco="let t" [class.field-floating]="floating()">
    <label [for]="fieldId()">{{ t(labelKey()) }}</label>
    <div class="input-wrap">
      @if (!floating()) {
        <kx-icon [name]="icon()" />
      }
      @if (multiline()) {
        <textarea
          class="kx-input"
          [id]="fieldId()"
          [formControl]="control()"
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
          [placeholder]="floating() ? ' ' : t(placeholderKey())"
          [attr.maxlength]="maxLength() || null"
          [autocomplete]="autocomplete()"
          [attr.aria-invalid]="control().touched && control().invalid"
          [attr.aria-describedby]="fieldId() + '-message' + (maxLength() ? ' ' + fieldId() + '-counter' : '')"
          [class.input-valid]="control().touched && control().valid"
        />
      }
    </div>
    <p
      class="field-message"
      [class.error-text]="!!errorKey()"
      [id]="fieldId() + '-message'"
      aria-live="polite"
    >
      {{ errorKey() ? t(errorKey(), { max: maxLength() }) : hintKey() ? t(hintKey()) : '' }}
    </p>
    @if (maxLength()) {
      <p
        class="field-counter"
        [id]="fieldId() + '-counter'"
        [attr.aria-label]="t('common.characterCount', { count: count(), max: maxLength() })"
      >
        {{ count() }} / {{ maxLength() }}
      </p>
    }
  </div>`,
})
export class FormFieldComponent {
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
  readonly maxLength = input(0);
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
