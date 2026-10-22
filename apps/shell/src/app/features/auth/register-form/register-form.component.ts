import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicService, type AcademicOption } from '../../../core/academic.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  FormFieldComponent,
  PasswordFieldComponent,
  IconComponent,
  LegalDialogComponent,
  AcademicPickerComponent,
} from '@kampusx/shared/ui';
import { universityEmail, username, validateAndFocus } from '@kampusx/shared/util';
@Component({
  selector: 'kx-register-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    FormFieldComponent,
    PasswordFieldComponent,
    IconComponent,
    LegalDialogComponent,
    AcademicPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *transloco="let t"
    ><button
      kxButton
      emphasis="outline"
      type="button"
      class="full-width google-button"
      (click)="googleNotice.set(true)"
    >
      <span class="google-g" aria-hidden="true">G</span>{{ t('auth.google') }}
    </button>
    @if (googleNotice()) {
      <p class="info-message" role="status">{{ t('auth.googleDemo') }}</p>
    }
    <div class="form-divider">
      <span>{{ t('auth.divider') }}</span>
    </div>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate [attr.aria-busy]="busy()">
      <kx-form-field
        fieldId="register-name"
        icon="person"
        autocomplete="name"
        labelKey="auth.register.fullName"
        placeholderKey="auth.register.fullNamePlaceholder"
        [control]="form.controls.fullName"
        [maxLength]="50"
      /><kx-form-field
        fieldId="register-username"
        icon="person"
        autocomplete="username"
        labelKey="auth.register.username"
        placeholderKey="auth.register.usernamePlaceholder"
        hintKey="auth.register.usernameHint"
        [control]="form.controls.username"
      />
      <p class="field-message" role="status">{{ t('academic.username.' + usernameState()) }}</p>
      <kx-form-field
        fieldId="register-bio"
        icon="notes"
        labelKey="auth.register.bio"
        placeholderKey="auth.register.bioPlaceholder"
        [control]="form.controls.bio"
        [maxLength]="160"
      />
      @for (kind of academicKinds; track kind) {
        <kx-academic-picker
          [fieldId]="'register-' + kind"
          [labelKey]="'auth.register.' + kind"
          [control]="form.controls[kind]"
          [options]="options()[kind]"
          [loading]="lookupLoading()[kind]"
          [failed]="lookupFailed()[kind]"
          (queryChanged)="academicChanged(kind, $event)"
          (retried)="searchAcademic(kind, '')"
        />
      }
      <kx-form-field
        fieldId="register-email"
        type="email"
        autocomplete="email"
        labelKey="auth.register.email"
        placeholderKey="auth.register.emailPlaceholder"
        hintKey="auth.register.emailHint"
        [control]="form.controls.email"
      /><kx-password-field
        fieldId="register-password"
        [control]="form.controls.password"
        [newPassword]="true"
      /><label class="checkbox-label consent-label"
        ><input
          id="register-consent"
          type="checkbox"
          formControlName="consent"
          [attr.aria-invalid]="form.controls.consent.touched && form.controls.consent.invalid"
          aria-describedby="consent-message"
        />{{ t('auth.termsPrefix') }}</label
      >
      <p id="consent-message" class="field-message error-text" aria-live="polite">
        {{ form.controls.consent.touched && form.controls.consent.invalid ? t('validation.required') : '' }}
      </p>
      <div class="legal-links">
        <button type="button" class="text-button" (click)="legal.open('legal.terms')">
          {{ t('auth.termsLink') }}</button
        ><span aria-hidden="true">·</span
        ><button type="button" class="text-button" (click)="legal.open('legal.privacy')">
          {{ t('auth.privacyLink') }}
        </button>
      </div>
      <button kxButton type="submit" class="full-width" [busy]="busy()" [disabled]="done()">
        {{ t('auth.register.submit') }}<kx-icon name="arrow_forward" />
      </button>
      <div class="form-status" role="status">
        @if (done()) {
          <p class="success-message"><kx-icon name="check_circle" />{{ t('auth.register.success') }}</p>
        }
        @if (done() && assignedUsername()) {
          <p>{{ t('academic.assigned', { username: assignedUsername() }) }}</p>
        }
        @if (done() && !assignedUsername()) {
          <p>{{ t('academic.assignedAfterLogin') }}</p>
        }
        @if (done() && api.session()) {
          <button kxButton type="button" (click)="continue()">{{ t('academic.continue') }}</button>
        }
        @if (errorKey()) {
          <p class="field-message error-text" role="alert">{{ t(errorKey()) }}</p>
        }
      </div>
    </form>
    <kx-legal-dialog #legal
  /></ng-container>`,
})
export class RegisterFormComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly googleNotice = signal(false);
  readonly api = inject(AuthService);
  private readonly academic = inject(AcademicService);
  private readonly router = inject(Router);
  readonly errorKey = signal('');
  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
    bio: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
    campus: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, universityEmail],
    }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, username] }),
    university: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
    department: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(150),
        (c) => (c.value.trim() ? null : { required: true }),
      ],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    consent: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  readonly academicKinds = ['university', 'campus', 'department'] as const;
  readonly options = signal<Record<'university' | 'campus' | 'department', AcademicOption[]>>({
    university: [],
    campus: [],
    department: [],
  });
  readonly lookupLoading = signal({ university: false, campus: false, department: false });
  readonly lookupFailed = signal({ university: false, campus: false, department: false });
  readonly usernameState = signal<'idle' | 'checking' | 'available' | 'taken' | 'unavailable'>('idle');
  readonly assignedUsername = signal<string | null>(null);
  private universityId: string | null = null;
  private readonly requests = new Map<string, AbortController>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  constructor() {
    this.form.controls.username.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.requests.get('username')?.abort();
      clearTimeout(this.timers.get('username'));
      this.usernameState.set('idle');
      if (this.form.controls.username.valid)
        this.timers.set(
          'username',
          setTimeout(() => void this.checkUsername(), 350),
        );
    });
    this.searchAcademic('university', '');
    this.destroyRef.onDestroy(() => {
      this.requests.forEach((r) => r.abort());
      this.timers.forEach(clearTimeout);
    });
  }
  academicChanged(kind: 'university' | 'campus' | 'department', text: string) {
    if (kind !== 'university') return;
    this.universityId = this.options().university.find((o) => o.name === text)?.id ?? null;
    for (const child of ['campus', 'department'] as const) {
      this.form.controls[child].reset('');
      this.searchAcademic(child, '');
    }
  }
  searchAcademic(kind: 'university' | 'campus' | 'department', text: string) {
    void text;
    this.requests.get(kind)?.abort();
    this.options.update((v) => ({ ...v, [kind]: [] }));
    this.lookupFailed.update((v) => ({ ...v, [kind]: false }));
    const universityId = this.universityId;
    if (kind !== 'university' && !universityId) {
      this.lookupLoading.update((v) => ({ ...v, [kind]: false }));
      return;
    }
    const request = new AbortController();
    this.requests.set(kind, request);
    this.lookupLoading.update((v) => ({ ...v, [kind]: true }));
    void this.academic
      .search(
        kind === 'university' ? 'universities' : kind === 'campus' ? 'campuses' : 'departments',
        '',
        universityId,
        AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
      )
      .then((rows) => {
        if (!request.signal.aborted && !this.destroyRef.destroyed)
          this.options.update((v) => ({ ...v, [kind]: rows }));
      })
      .catch(() => {
        if (!request.signal.aborted && !this.destroyRef.destroyed)
          this.lookupFailed.update((v) => ({ ...v, [kind]: true }));
      })
      .finally(() => {
        if (!request.signal.aborted && !this.destroyRef.destroyed)
          this.lookupLoading.update((v) => ({ ...v, [kind]: false }));
      });
  }
  private async checkUsername(): Promise<boolean> {
    this.requests.get('username')?.abort();
    clearTimeout(this.timers.get('username'));
    const request = new AbortController();
    this.requests.set('username', request);
    const value = this.form.controls.username.value;
    this.usernameState.set('checking');
    try {
      const available = await this.academic.usernameAvailable(
        value,
        AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
      );
      if (request.signal.aborted || this.destroyRef.destroyed || this.form.controls.username.value !== value)
        return false;
      this.usernameState.set(available ? 'available' : 'taken');
      return available;
    } catch {
      if (!request.signal.aborted && !this.destroyRef.destroyed) this.usernameState.set('unavailable');
      return false;
    }
  }
  async continue() {
    await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }
  async submit() {
    if (this.busy() || !validateAndFocus(this.form, this.host)) return;
    if (
      this.academicKinds.some(
        (kind) => !this.options()[kind].some((option) => option.name === this.form.controls[kind].value),
      )
    ) {
      this.errorKey.set('academic.invalidSelection');
      return;
    }
    this.done.set(false);
    this.errorKey.set('');
    this.busy.set(true);
    const v = this.form.getRawValue();
    try {
      if (!(await this.checkUsername())) return;
      if (this.destroyRef.destroyed || JSON.stringify(v) !== JSON.stringify(this.form.getRawValue())) return;
      const { data, error } = await this.api.signUp(v.email.trim(), v.password, v.username.trim(), {
        university: v.university.trim(),
        department: v.department.trim(),
        campus: v.campus.trim(),
        fullName: v.fullName.trim(),
        bio: v.bio.trim(),
        consent: v.consent,
      });
      if (this.destroyRef.destroyed) return;
      if (error) this.errorKey.set(this.api.errorKey(error));
      else {
        this.form.controls.password.reset();
        this.done.set(true);
        if (data.session)
          this.assignedUsername.set(
            await this.academic.assignedUsername(data.session.user.id, AbortSignal.timeout(15000)),
          );
      }
    } catch (error) {
      if (!this.destroyRef.destroyed) this.errorKey.set(this.api.errorKey(error));
    } finally {
      if (!this.destroyRef.destroyed) this.busy.set(false);
    }
  }
}
