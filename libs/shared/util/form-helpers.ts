import { ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
/** Validation is shared by all auth forms; focus the actual native field inside a molecule. */
export function validateAndFocus(form: FormGroup, host: ElementRef<HTMLElement>): boolean {
  form.markAllAsTouched();
  if (form.valid) return true;
  requestAnimationFrame(() =>
    host.nativeElement.querySelector<HTMLElement>('input[aria-invalid="true"]')?.focus(),
  );
  return false;
}
