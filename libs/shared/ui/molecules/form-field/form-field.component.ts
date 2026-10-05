import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  template: `<div class="form-field" *transloco="let t">
    <label [for]="fieldId()">{{ t(labelKey()) }}</label>
    <div class="input-wrap">
      <kx-icon [name]="icon()" /><input
        kxInput
        [id]="fieldId()"
        [type]="type()"
        [formControl]="control()"
        [placeholder]="t(placeholderKey())"
        [autocomplete]="autocomplete()"
        [attr.aria-invalid]="control().touched && control().invalid"
        [attr.aria-describedby]="fieldId() + '-message'"
        [class.input-valid]="control().touched && control().valid"
      />
    </div>
    <p
      class="field-message"
      [class.error-text]="!!errorKey()"
      [id]="fieldId() + '-message'"
      aria-live="polite"
    >
      {{ errorKey() ? t(errorKey()) : hintKey() ? t(hintKey()) : '' }}
    </p>
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
  errorKey() {
    return validationKey(this.control());
  }
}
