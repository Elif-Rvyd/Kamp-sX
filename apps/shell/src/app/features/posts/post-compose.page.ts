import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  FormFieldComponent,
  IconComponent,
} from '@kampusx/shared/ui';
import { MediaError, MediaService } from '../../core/media.service';
import { PostsService } from '../../core/posts.service';
import { NoticeService } from '../../core/notice.service';
import { AuthService } from '../../core/auth.service';
import { bindProfilePage } from '../profile/profile-page-context';

@Component({
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    FormFieldComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-compose.page.html',
  styleUrl: './post-compose.page.css',
})
export class PostComposePage {
  private readonly media = inject(MediaService);
  private readonly posts = inject(PostsService);
  private readonly notices = inject(NoticeService);
  private readonly auth = inject(AuthService);
  private readonly epoch = this.auth.sessionEpoch();
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly content = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] });
  private readonly value = toSignal(this.content.valueChanges, { initialValue: '' });
  readonly file = signal<File | undefined>(undefined);
  readonly preview = signal('');
  readonly type = signal<'image' | 'video'>('image');
  readonly busy = signal(false);
  readonly checking = signal(false);
  readonly error = signal('');
  readonly uncertain = signal(false);
  readonly published = signal(false);
  readonly dirty = computed(() => !!this.value() || !!this.file());
  readonly canPublish = computed(
    () =>
      !!(this.value().trim() || this.file()) &&
      !this.busy() &&
      !this.checking() &&
      !this.uncertain() &&
      !this.published(),
  );
  private readonly confirmation = viewChild.required<ConfirmDialogComponent>('confirmation');
  private revision = 0;
  constructor() {
    bindProfilePage('posts.title');
    afterNextRender(() => this.document.getElementById('compose-title')?.focus());
    this.destroyRef.onDestroy(() => this.clearPreview());
  }
  async selected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    input.value = '';
    if (!file || this.busy() || this.uncertain() || this.published()) return;
    const revision = ++this.revision;
    this.checking.set(true);
    this.error.set('');
    try {
      const type = await this.media.validate(file, 'post');
      if (this.destroyRef.destroyed || revision !== this.revision || this.auth.sessionEpoch() !== this.epoch)
        return;
      this.clearPreview();
      this.file.set(file);
      this.type.set(type);
      this.preview.set(this.document.defaultView!.URL.createObjectURL(file));
    } catch (error) {
      if (!this.destroyRef.destroyed && revision === this.revision)
        this.error.set(error instanceof MediaError ? error.key : 'media.errors.upload');
    } finally {
      if (!this.destroyRef.destroyed && revision === this.revision) this.checking.set(false);
    }
  }
  remove(): void {
    if (!this.busy() && !this.uncertain() && !this.published()) {
      this.revision++;
      this.checking.set(false);
      this.clearPreview();
      this.file.set(undefined);
      this.error.set('');
    }
  }
  async publish(): Promise<void> {
    if (!this.canPublish() || this.auth.sessionEpoch() !== this.epoch) return;
    this.content.markAsTouched();
    if (this.content.invalid) {
      this.document.getElementById('post-content')?.focus();
      return;
    }
    this.busy.set(true);
    this.content.disable();
    this.error.set('');
    try {
      await this.posts.publish(this.content.value, this.file());
      if (this.destroyRef.destroyed) return;
      this.published.set(true);
      this.notices.show('posts.saved');
      if (!(await this.router.navigateByUrl('/dashboard'))) this.error.set('posts.navigation');
    } catch (error) {
      if (!this.destroyRef.destroyed && !this.published()) {
        const key = error instanceof MediaError ? error.key : 'media.errors.uncertain';
        this.uncertain.set(key === 'media.errors.uncertain');
        this.error.set(key);
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.busy.set(false);
        if (!this.published()) this.content.enable();
      }
    }
  }
  cancel(): void {
    if (!this.busy()) void this.router.navigateByUrl('/dashboard');
  }
  canLeave(): boolean | Promise<boolean> {
    if (!this.auth.session() || this.published() || this.auth.sessionEpoch() !== this.epoch) return true;
    if (this.busy()) return false;
    return this.dirty() || this.checking() ? this.confirmation().ask() : true;
  }
  private clearPreview(): void {
    if (this.preview()) this.document.defaultView?.URL.revokeObjectURL(this.preview());
    this.preview.set('');
  }
}
