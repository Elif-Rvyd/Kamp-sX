import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  LegalDialogComponent,
} from '@kampusx/shared/ui';
import { validateAndFocus } from '@kampusx/shared/util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { SupportApiService, SupportError } from '../../core/support-api.service';
import { bindProfilePage } from '../profile/profile-page-context';
import { SocialPageFrameComponent } from './social-page-frame.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    LegalDialogComponent,
    SocialPageFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kx-social-page-frame titleKey="support.title" back="/dashboard"
    ><ng-container *transloco="let t">
      <div class="support-body">
        <p>{{ t('support.intro') }}</p>
        <button
          kxButton
          type="button"
          emphasis="ghost"
          (click)="privacy.open('support.privacyBody', 'support.privacyTitle')"
        >
          {{ t('support.privacyTitle') }}
        </button>
        @if (loading()) {
          <p role="status">{{ t('support.loading') }}</p>
        }
        @if (error()) {
          <p class="error-text" role="alert">{{ t(error()) }}</p>
        }
        @if (!loading() && !ready() && !uncertain()) {
          <button kxButton type="button" emphasis="ghost" (click)="load()">{{ t('media.retry') }}</button>
        }
        @if (receipt()) {
          <div class="receipt" role="status">
            <strong>{{ t('support.sent') }}</strong>
            <p>
              {{ t('support.reference') }} <code>{{ receipt() }}</code>
            </p>
          </div>
        }
        <form [formGroup]="form" novalidate (ngSubmit)="submit()" [attr.aria-busy]="sending() || checking()">
          <kx-form-field
            fieldId="support-username"
            labelKey="support.username"
            placeholderKey="support.username"
            icon="person"
            [control]="form.controls.username"
            [readonly]="true"
          />
          <kx-form-field
            fieldId="support-email"
            labelKey="support.email"
            placeholderKey="support.email"
            type="email"
            [control]="form.controls.email"
            [readonly]="true"
          />
          <kx-form-field
            fieldId="support-description"
            labelKey="support.description"
            placeholderKey="support.descriptionHint"
            hintKey="support.descriptionHint"
            icon="help_outline"
            [control]="form.controls.description"
            [multiline]="true"
            [maxLength]="4000"
            [readonly]="sending() || uncertain() || replaying()"
          />
          @if (sending()) {
            <p class="request-status" role="status">{{ t('support.sending') }}</p>
          }
          @if (uncertain()) {
            <p role="status">{{ t('support.pending') }}</p>
            <button
              kxButton
              type="button"
              emphasis="outline"
              [busy]="checking()"
              [disabled]="sending() || checking()"
              (click)="check()"
            >
              {{ t('support.checkStatus') }}
            </button>
          } @else {
            <button kxButton type="submit" [busy]="sending()" [disabled]="!ready() || loading() || sending()">
              {{ t('support.send') }}
            </button>
          }
        </form>
      </div>
      <kx-confirm-dialog
        #discard
        dialogId="support-discard"
        titleKey="support.discardTitle"
        bodyKey="support.discardBody"
        cancelKey="profile.edit.keepEditing"
        confirmKey="profile.edit.discard"
      /> </ng-container
    ><kx-legal-dialog #privacy
  /></kx-social-page-frame>`,
  styles: `
    .support-body {
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    p {
      margin: 0;
      line-height: 1.7;
      font-size: 0.875rem;
    }
    form {
      display: grid;
      gap: 12px;
    }
    form > button {
      justify-self: start;
    }
    code {
      overflow-wrap: anywhere;
    }
    .receipt {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-control);
      padding: 16px;
      color: var(--color-text);
    }
    .request-status {
      min-height: 24px;
    }
  `,
})
export class SupportPage {
  private readonly api = inject(SupportApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly auth = inject(AuthService);
  private readonly destroy = inject(DestroyRef);
  private readonly epoch = this.auth.sessionEpoch();
  private readonly request = new AbortController();
  private readonly discard = viewChild.required<ConfirmDialogComponent>('discard');
  private requestId = crypto.randomUUID();
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(4000)],
    }),
  });
  readonly loading = signal(false);
  readonly ready = signal(false);
  readonly sending = signal(false);
  readonly checking = signal(false);
  readonly uncertain = signal(false);
  readonly error = signal('');
  readonly receipt = signal('');
  readonly replaying = signal(false);
  constructor() {
    bindProfilePage('support.title');
    void this.load();
    this.destroy.onDestroy(() => this.request.abort());
    this.form.controls.description.valueChanges.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      if (!this.sending() && !this.uncertain()) this.receipt.set('');
    });
  }
  private current() {
    return !this.destroy.destroyed && this.epoch === this.auth.sessionEpoch() && !!this.auth.session();
  }
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.current() && (this.form.controls.description.value || this.sending() || this.uncertain())) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.current()) return true;
    if (this.sending()) return false;
    return !this.form.controls.description.value && !this.uncertain() ? true : this.discard().ask();
  }
  async load() {
    if (!this.current() || this.loading() || this.sending() || this.uncertain()) return;
    this.loading.set(true);
    this.error.set('');
    this.ready.set(false);
    try {
      const identity = await this.api.identity(this.request.signal);
      if (!this.current()) return;
      this.form.controls.username.setValue('@' + identity.username);
      this.form.controls.email.setValue(identity.email);
      this.ready.set(identity.ready);
      if (!identity.ready) this.error.set('support.errors.unavailable');
    } catch (error) {
      if (this.current())
        this.error.set(error instanceof SupportError ? error.key : 'support.errors.unavailable');
    } finally {
      if (this.current()) this.loading.set(false);
    }
  }
  async submit() {
    if (
      !this.current() ||
      !this.ready() ||
      this.loading() ||
      this.sending() ||
      this.uncertain() ||
      !validateAndFocus(this.form, this.host)
    )
      return;
    this.sending.set(true);
    this.error.set('');
    this.receipt.set('');
    const id = this.requestId;
    try {
      const state = await this.api.send(id, this.form.controls.description.value, this.request.signal);
      if (!this.current()) return;
      if (state === 'sent') this.complete(id);
      else this.uncertain.set(true);
    } catch (error) {
      if (this.current()) {
        this.uncertain.set(!(error instanceof SupportError) || error.uncertain);
        this.error.set(error instanceof SupportError ? error.key : 'support.errors.uncertain');
        if (error instanceof SupportError && error.key === 'support.errors.rejected') {
          this.requestId = crypto.randomUUID();
          this.replaying.set(false);
          this.ready.set(false);
        }
      }
    } finally {
      if (this.current()) this.sending.set(false);
    }
  }
  async check() {
    if (!this.current() || this.checking() || this.sending() || !this.uncertain()) return;
    this.checking.set(true);
    this.error.set('');
    const id = this.requestId;
    try {
      const state = await this.api.status(id, this.request.signal);
      if (!this.current()) return;
      if (state === 'sent') this.complete(id);
      else if (state === 'retryable' || state === 'unknown') {
        this.uncertain.set(false);
        this.replaying.set(true);
        this.error.set('support.retrySame');
      } else if (state === 'rejected') {
        this.requestId = crypto.randomUUID();
        this.replaying.set(false);
        this.uncertain.set(false);
        this.ready.set(false);
        this.error.set('support.errors.rejected');
      } else if (state === 'expired') this.error.set('support.errors.expired');
    } catch (error) {
      if (this.current()) this.error.set(error instanceof SupportError ? error.key : 'support.errors.status');
    } finally {
      if (this.current()) this.checking.set(false);
    }
  }
  private complete(id: string) {
    this.uncertain.set(false);
    this.replaying.set(false);
    this.form.controls.description.reset('');
    this.requestId = crypto.randomUUID();
    this.receipt.set(id);
    this.error.set('');
  }
}
