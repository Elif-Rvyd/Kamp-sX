import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  ImagePickerComponent,
  LanguageSwitcherComponent,
  ThemeToggleComponent,
} from '@kampusx/shared/ui';
import { profileInitials, validateAndFocus } from '@kampusx/shared/util';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { ProfileError } from '../../core/profile.model';
import { MediaError } from '../../core/media.service';
import { NoticeService } from '../../core/notice.service';
import { LanguageService } from '../../core/language.service';
import { ThemeService } from '../../core/theme.service';
import { bindProfilePage } from './profile-page-context';
@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    ImagePickerComponent,
    LanguageSwitcherComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-edit.page.html',
  styleUrl: './profile-edit.page.css',
})
export class ProfileEditPage {
  readonly profiles = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeService);
  private readonly auth = inject(AuthService);
  private readonly epoch = this.auth.sessionEpoch();
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly baseline = signal(this.profiles.profile());
  readonly initials = computed(() => profileInitials(this.values()?.fullName || this.baseline().fullName));
  readonly form = new FormGroup({
    fullName: new FormControl(this.baseline().fullName, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(50),
        (control) => (String(control.value).trim() ? null : { required: true }),
      ],
    }),
    bio: new FormControl(this.baseline().bio || '', {
      nonNullable: true,
      validators: [Validators.maxLength(160)],
    }),
    username: new FormControl('@' + this.baseline().username, { nonNullable: true }),
    campus: new FormControl(this.baseline().campus || this.baseline().faculty, { nonNullable: true }),
    university: new FormControl(this.baseline().university, {
      nonNullable: true,
    }),
    department: new FormControl(this.baseline().department, {
      nonNullable: true,
    }),
  });
  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly avatar = signal<string | null>(this.baseline().avatarUrl || null);
  readonly cover = signal<string | null>(this.baseline().coverUrl || null);
  readonly avatarBusy = signal(false);
  readonly coverBusy = signal(false);
  readonly avatarError = signal('');
  readonly coverError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  private revision = { avatar: 0, cover: 0 };
  readonly hasChanges = computed(
    () =>
      this.values()?.fullName?.trim() !== this.baseline().fullName ||
      this.values()?.bio?.trim() !== (this.baseline().bio || '') ||
      this.avatar() !== (this.baseline().avatarUrl || null) ||
      this.cover() !== (this.baseline().coverUrl || null),
  );
  readonly uploading = computed(() => this.avatarBusy() || this.coverBusy());
  private readonly confirmation = viewChild.required<ConfirmDialogComponent>('confirmation');
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');
  constructor() {
    bindProfilePage('profile.edit.title');
    const document = inject(DOCUMENT);
    afterNextRender(() => {
      document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
      this.title().nativeElement.focus({ preventScroll: true });
    });
    this.destroyRef.onDestroy(() => {
      this.profiles.releaseUpload(this.avatar());
      this.profiles.releaseUpload(this.cover());
    });
  }
  async selectImage(kind: 'avatar' | 'cover', file: File): Promise<void> {
    const revision = ++this.revision[kind];
    const busy = kind === 'avatar' ? this.avatarBusy : this.coverBusy,
      error = kind === 'avatar' ? this.avatarError : this.coverError,
      image = kind === 'avatar' ? this.avatar : this.cover;
    busy.set(true);
    error.set('');
    try {
      const url = await (kind === 'avatar'
        ? this.profiles.uploadAvatar(file)
        : this.profiles.uploadCover(file));
      if (this.destroyRef.destroyed || revision !== this.revision[kind]) {
        this.profiles.releaseUpload(url);
        return;
      }
      this.profiles.releaseUpload(image());
      image.set(url);
    } catch (reason) {
      if (!this.destroyRef.destroyed && revision === this.revision[kind])
        error.set(reason instanceof ProfileError ? reason.key : 'profile.errors.upload');
    } finally {
      if (!this.destroyRef.destroyed && revision === this.revision[kind]) busy.set(false);
    }
  }
  removeImage(kind: 'avatar' | 'cover'): void {
    const image = kind === 'avatar' ? this.avatar : this.cover,
      error = kind === 'avatar' ? this.avatarError : this.coverError;
    this.revision[kind]++;
    this.profiles.releaseUpload(image());
    image.set(null);
    error.set('');
  }
  async save(): Promise<void> {
    if (this.auth.sessionEpoch() !== this.epoch) return;
    if (this.saving() || this.uploading() || !this.hasChanges() || !validateAndFocus(this.form, this.host))
      return;
    this.saving.set(true);
    this.form.disable({ emitEvent: false });
    this.error.set('');
    try {
      const next = await this.profiles.updateProfile({
        fullName: this.form.controls.fullName.value,
        bio: this.form.controls.bio.value,
        avatarUrl: this.avatar(),
        coverUrl: this.cover(),
      });
      if (this.destroyRef.destroyed) return;
      this.baseline.set(next);
      this.avatar.set(next.avatarUrl || null);
      this.cover.set(next.coverUrl || null);
      this.form.setValue({
        fullName: next.fullName,
        bio: next.bio || '',
        university: next.university,
        department: next.department,
        username: '@' + next.username,
        campus: next.campus || next.faculty,
      });
      this.notices.show('profile.saved');
      if (!(await this.router.navigateByUrl('/profile'))) this.error.set('profile.errors.navigation');
    } catch (reason) {
      if (!this.destroyRef.destroyed)
        this.error.set(
          reason instanceof ProfileError || reason instanceof MediaError ? reason.key : 'profile.errors.save',
        );
    } finally {
      if (!this.destroyRef.destroyed) {
        this.form.enable({ emitEvent: false });
        this.saving.set(false);
      }
    }
  }
  async retryRead(): Promise<void> {
    const before = this.baseline();
    await this.profiles.reload();
    if (this.destroyRef.destroyed || this.profiles.readError()) return;
    const next = this.profiles.profile();
    if (this.avatar() === (before.avatarUrl || null)) this.avatar.set(next.avatarUrl || null);
    if (this.cover() === (before.coverUrl || null)) this.cover.set(next.coverUrl || null);
    this.baseline.set(next);
  }
  cancel(): void {
    if (!this.saving()) void this.router.navigateByUrl('/profile');
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || this.auth.sessionEpoch() !== this.epoch) return true;
    if (this.saving() && this.hasChanges()) return false;
    return this.hasChanges() || this.uploading() ? this.confirmation().ask() : true;
  }
}
