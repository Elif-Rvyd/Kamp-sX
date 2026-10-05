import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const universityEmail: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return !value || /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+edu\.tr$/i.test(value)
    ? null
    : { universityEmail: true };
};
export const username: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  return !value || /^@?[a-zA-Z0-9_]{3,20}$/.test(value) ? null : { username: true };
};
export function passwordStrength(value: string): number {
  if (!value) return 0;
  return (
    Number(value.length >= 8) +
    Number(value.length >= 12) +
    Number(/[a-z]/.test(value) && /[A-Z]/.test(value)) +
    Number(/\d/.test(value) && /[^\w\s]/.test(value))
  );
}
export function validationKey(control: AbstractControl): string {
  if (!control.touched || !control.errors) return '';
  const key = Object.keys(control.errors)[0];
  return `validation.${key === 'minlength' ? 'passwordLength' : key}`;
}
