import { ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
/** Validation is shared by all auth forms; focus the actual native field inside a molecule. */
export function validateAndFocus(form: FormGroup, host: ElementRef<HTMLElement>): boolean {
  form.markAllAsTouched();
  if (form.valid) return true;
  // Invalid classes already reflect control validity. aria-invalid can still be false
  // until Angular renders the newly touched state on the next frame.
  requestAnimationFrame(() =>
    host.nativeElement
      .querySelector<HTMLElement>(
        'input.ng-invalid:not(:disabled),textarea.ng-invalid:not(:disabled),select.ng-invalid:not(:disabled)',
      )
      ?.focus(),
  );
  return false;
}
