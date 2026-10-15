# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## apps/shell/src/app/app.routes.ts (değişti)

````typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/welcome/welcome.page').then((m) => m.WelcomePage) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'compose',
    canActivate: [authGuard],
    canDeactivate: [
      (component: import('./features/posts/post-compose.page').PostComposePage) => component.canLeave(),
    ],
    loadComponent: () =>
      import('./features/posts/post-compose.page').then((module) => module.PostComposePage),
  },
  {
    path: 'profile',
    canActivateChild: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then((module) => module.profileRoutes),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
````

## apps/shell/src/app/core/auth.service.ts (değişti)

````typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { AuthError, isAuthError, type Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly connection = inject(SupabaseService);
  private readonly supabase = this.connection.client;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentSession = signal<Session | null>(null);
  readonly session = this.currentSession.asReadonly();
  private readonly epoch = signal(0);
  /** Changes on account/session replacement; token refresh alone keeps pending work valid. */
  readonly sessionEpoch = this.epoch.asReadonly();
  readonly initialized = signal(false);
  readonly recovery = signal(false);
  readonly initializationError = signal<AuthError | null>(null);
  readonly ready: Promise<void>;
  private revision = 0;

  constructor() {
    if (!this.supabase) {
      this.initializationError.set(this.failure('auth_not_configured'));
      this.initialized.set(true);
      this.ready = Promise.resolve();
      return;
    }
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (this.destroyRef.destroyed) return;
      const previous = this.session();
      if (
        previous?.user.id !== session?.user.id ||
        event === 'SIGNED_OUT' ||
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && previous?.access_token !== session?.access_token)
      )
        this.epoch.update((value) => value + 1);
      this.revision++;
      this.currentSession.set(session);
      if (event === 'PASSWORD_RECOVERY') this.recovery.set(!!session);
      else if (event === 'SIGNED_OUT' || !session) this.recovery.set(false);
      else if (event === 'SIGNED_IN') this.recovery.set(false);
      // Synchronous callback: nested SDK auth calls can deadlock.
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
    this.ready = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const revision = this.revision;
    try {
      const initialized = await this.supabase!.auth.initialize();
      if (this.destroyRef.destroyed) return;
      if (initialized.error) {
        this.initializationError.set(initialized.error);
        this.currentSession.set(null);
        this.recovery.set(false);
        return;
      }
      const { data, error } = await this.supabase!.auth.getSession();
      if (this.destroyRef.destroyed) return;
      if (error) {
        this.initializationError.set(error);
        if (revision === this.revision) this.currentSession.set(null);
      } else if (revision === this.revision) this.currentSession.set(data.session);
    } catch (error) {
      if (!this.destroyRef.destroyed) {
        this.initializationError.set(this.normalizeError(error));
        if (revision === this.revision) this.currentSession.set(null);
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.initialized.set(true);
        this.scrubCallbackUrl();
      }
    }
  }

  async signUp(
    email: string,
    password: string,
    username: string,
    academic?: { university: string; department: string },
  ) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim().replace(/^@/, ''),
            ...(academic
              ? {
                  university_name: academic.university.trim(),
                  department_name: academic.department.trim(),
                }
              : {}),
          },
          emailRedirectTo: this.callbackUrl('/auth/login'),
        },
      });
      // Metadata is user-editable; profile/role creation belongs in DB/server rules.
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  async signIn(email: string, password: string, remember = false) {
    if (!this.supabase)
      return { data: { user: null, session: null }, error: this.failure('auth_not_configured') };
    await this.ready;
    this.connection.setRemember(remember);
    try {
      const result = await this.supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (!result.error) this.initializationError.set(null);
      return result;
    } catch (error) {
      return { data: { user: null, session: null }, error: this.normalizeError(error) };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    if (!this.supabase) return { error: this.failure('auth_not_configured') };
    const owner = this.session()?.user.id;
    const epoch = this.sessionEpoch();
    try {
      const result = await this.supabase.auth.signOut({ scope: 'local' });
      if (
        !result.error &&
        (!this.session() || (this.session()?.user.id === owner && this.sessionEpoch() === epoch))
      ) {
        this.epoch.update((value) => value + 1);
        this.currentSession.set(null);
        this.recovery.set(false);
      }
      return result;
    } catch (error) {
      return { error: this.normalizeError(error) };
    }
  }

  async resetPassword(email: string): Promise<{ data: unknown; error: AuthError | null }> {
    if (!this.supabase) return { data: null, error: this.failure('auth_not_configured') };
    try {
      return await this.supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: this.callbackUrl('/auth/update-password'),
      });
    } catch (error) {
      return { data: null, error: this.normalizeError(error) };
    }
  }

  async updatePassword(password: string): Promise<{ error: AuthError | null; passwordUpdated: boolean }> {
    await this.ready;
    if (!this.supabase) return { error: this.failure('auth_not_configured'), passwordUpdated: false };
    if (!this.recovery() || !this.session() || this.initializationError()) {
      return { error: this.failure('recovery_required'), passwordUpdated: false };
    }
    if (password.length < 8) return { error: this.failure('weak_password'), passwordUpdated: false };
    const epoch = this.sessionEpoch();
    const owner = this.session()!.user.id;
    try {
      const { error } = await this.supabase.auth.updateUser({ password });
      if (error) return { error, passwordUpdated: false };
      // A completed request must never sign out an account that replaced its owner.
      if (this.sessionEpoch() !== epoch || this.session()?.user.id !== owner || this.destroyRef.destroyed)
        return { error: this.failure('password_updated_signout_failed'), passwordUpdated: true };
      this.recovery.set(false);
      const signedOut = await this.signOut();
      return {
        error: signedOut.error ? this.failure('password_updated_signout_failed') : null,
        passwordUpdated: true,
      };
    } catch (error) {
      return { error: this.normalizeError(error), passwordUpdated: false };
    }
  }

  /** Navigation only: data authorization remains in RLS/the server. */
  async hasVerifiedSession(): Promise<boolean> {
    await this.ready;
    if (!this.supabase || !this.session() || this.initializationError()) return false;
    const revision = this.revision;
    const userId = this.session()!.user.id;
    try {
      const { data, error } = await this.supabase.auth.getUser();
      return (
        !this.destroyRef.destroyed &&
        !error &&
        data.user?.id === userId &&
        this.session()?.user.id === userId &&
        revision === this.revision
      );
    } catch {
      return false;
    }
  }

  errorKey(error: unknown): string {
    const value = error as { code?: string; status?: number; name?: string } | null;
    if (value?.code === 'auth_not_configured') return 'auth.errors.config';
    if (value?.code === 'recovery_required' || value?.code === 'otp_expired')
      return 'auth.errors.recoveryInvalid';
    if (value?.code === 'password_updated_signout_failed') return 'auth.errors.signOut';
    if (['invalid_credentials', 'user_not_found', 'login_user_not_found'].includes(value?.code ?? ''))
      return 'auth.errors.credentials';
    if (value?.code === 'email_not_confirmed') return 'auth.errors.unconfirmed';
    if (value?.code === 'weak_password') return 'auth.errors.weakPassword';
    if (value?.code === 'over_email_send_rate_limit') return 'auth.errors.emailRateLimit';
    if (value?.status === 429 || value?.code === 'over_request_rate_limit') return 'auth.errors.rateLimit';
    if (value?.code === 'network_error' || value?.name === 'AuthRetryableFetchError')
      return 'auth.errors.network';
    return 'auth.errors.generic';
  }

  private failure(code: string): AuthError {
    return new AuthError('Authentication could not be completed.', undefined, code);
  }
  private normalizeError(error: unknown): AuthError {
    return isAuthError(error)
      ? error
      : this.failure(error instanceof TypeError ? 'network_error' : 'unexpected_failure');
  }
  private callbackUrl(path: string): string {
    return new URL(path, this.document.location.origin).href;
  }

  private scrubCallbackUrl(): void {
    const window = this.document.defaultView;
    if (
      !window ||
      !['/auth/login', '/auth/update-password'].includes(window.location.pathname.replace(/\/$/, ''))
    )
      return;
    const url = new URL(window.location.href);
    const keys = [
      'code',
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
      'expires_at',
      'type',
      'error',
      'error_code',
      'error_description',
    ];
    const hash = new URLSearchParams(url.hash.slice(1));
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
      if (hash.has(key)) {
        hash.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    url.hash = hash.toString();
    try {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* History can be restricted by the host. */
    }
  }
}
````

## apps/shell/src/app/core/media.service.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { imageDimensions } from '@kampusx/shared/util';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export type MediaPurpose = 'avatar' | 'banner' | 'post';
export interface UploadedMedia {
  path: string;
  url: string;
  type: 'image' | 'video';
}
export class MediaError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly connection = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly completed = new WeakMap<File, Map<string, UploadedMedia>>();

  async validate(file: File, purpose: MediaPurpose): Promise<'image' | 'video'> {
    const image = file.type.startsWith('image/');
    if (
      !['avatar', 'banner', 'post'].includes(purpose) ||
      !Object.hasOwn(EXTENSIONS, file.type) ||
      (!image && purpose !== 'post')
    )
      throw new MediaError('media.errors.type');
    if (!file.size || file.size > (image ? 5 : 50) * 1024 * 1024)
      throw new MediaError(image ? 'media.errors.imageSize' : 'media.errors.videoSize');
    if (image) {
      const dimensions = imageDimensions(new Uint8Array(await file.arrayBuffer()), file.type);
      if (!dimensions?.width || !dimensions.height) throw new MediaError('profile.errors.image');
      if (dimensions.width * dimensions.height > 32_000_000)
        throw new MediaError('profile.errors.resolution');
      let bitmap: ImageBitmap;
      try {
        bitmap = await this.document.defaultView!.createImageBitmap(file);
      } catch {
        throw new MediaError('profile.errors.image');
      }
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (!pixels || pixels > 32_000_000) throw new MediaError('profile.errors.resolution');
    } else {
      const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const valid =
        file.type === 'video/mp4'
          ? bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp'
          : [26, 69, 223, 163].every((v, i) => bytes[i] === v);
      if (!valid) throw new MediaError('media.errors.invalidVideo');
      await this.validateVideo(file);
    }
    return image ? 'image' : 'video';
  }
  private async validateVideo(file: File): Promise<void> {
    const window = this.document.defaultView;
    if (!window) throw new MediaError('media.errors.invalidVideo');
    const video = this.document.createElement('video');
    const url = window.URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const finish = (valid: boolean) => {
          clearTimeout(timer);
          video.onloadedmetadata = null;
          video.onerror = null;
          valid ? resolve() : reject(new MediaError('media.errors.invalidVideo'));
        };
        const timer = setTimeout(() => finish(false), 10000);
        video.onloadedmetadata = () =>
          finish(
            video.videoWidth > 0 &&
              video.videoHeight > 0 &&
              video.videoWidth * video.videoHeight <= 32_000_000,
          );
        video.onerror = () => finish(false);
        video.preload = 'metadata';
        video.src = url;
      });
    } finally {
      video.removeAttribute('src');
      video.load();
      window.URL.revokeObjectURL(url);
    }
  }
  async upload(file: File, purpose: MediaPurpose, owner: string): Promise<UploadedMedia> {
    const epoch = this.auth.sessionEpoch();
    if (!this.connection.client || !(await this.auth.hasVerifiedSession()))
      throw new MediaError('media.errors.session');
    this.assertOwner(owner, epoch);
    const cacheKey = `${owner}:${epoch}:${purpose}`;
    const cached = this.completed.get(file)?.get(cacheKey);
    if (cached) return cached;
    const type = await this.validate(file, purpose);
    this.assertOwner(owner, epoch);
    const path = `${owner}/${purpose}/${this.document.defaultView!.crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
    const bucket = this.connection.client.storage.from('uploads');
    const { error } = await bucket.upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw new MediaError('media.errors.upload');
    this.assertOwner(owner, epoch);
    const result = { path, url: bucket.getPublicUrl(path).data.publicUrl, type };
    if (!this.isPublicUrl(result.url, owner, purpose)) throw new MediaError('media.errors.upload');
    const cache = this.completed.get(file) ?? new Map<string, UploadedMedia>();
    cache.set(cacheKey, result);
    this.completed.set(file, cache);
    this.assertOwner(owner, epoch);
    return result;
  }
  assertOwner(owner: string, epoch = this.auth.sessionEpoch()): void {
    if (
      this.destroyRef.destroyed ||
      !owner ||
      this.auth.session()?.user.id !== owner ||
      this.auth.sessionEpoch() !== epoch
    )
      throw new MediaError('media.errors.session');
  }
  isPublicUrl(value: unknown, owner?: string, purpose?: MediaPurpose): value is string {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      const base = this.connection.client?.storage.from('uploads').getPublicUrl('validation').data.publicUrl;
      const prefix = '/storage/v1/object/public/uploads/';
      const segments = url.pathname.slice(prefix.length).split('/');
      const [userId, area, fileName] = segments;
      return (
        !!base &&
        !url.username &&
        !url.password &&
        !url.hash &&
        !url.search &&
        url.origin === new URL(base).origin &&
        value === url.href &&
        url.pathname.startsWith(prefix) &&
        segments.length === 3 &&
        /^[A-Za-z0-9_-]+$/.test(userId) &&
        ['avatar', 'banner', 'post'].includes(area) &&
        /^[A-Za-z0-9_-]+\.(?:jpg|png|webp|mp4|webm)$/.test(fileName) &&
        (area === 'post' || /\.(?:jpg|png|webp)$/.test(fileName)) &&
        (!owner || userId === owner) &&
        (!purpose || area === purpose)
      );
    } catch {
      return false;
    }
  }
}
````

## apps/shell/src/app/core/notice.service.ts (eklendi)

````typescript
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NoticeService {
  readonly message = signal('');
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }
  show(key: string): void {
    this.clear();
    this.message.set(key);
    this.timer = setTimeout(() => this.clear(), 6000);
  }
  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.message.set('');
  }
}
````

## apps/shell/src/app/core/posts.service.ts (eklendi)

````typescript
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MediaError, MediaService } from './media.service';
import type { SocialPost } from '@kampusx/shared/util';
export interface StoredPost extends SocialPost {
  userId: string;
}
const COLUMNS = 'id,user_id,content,media_url,media_type';
@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly client = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaService);
  readonly feed = signal<readonly StoredPost[]>([]);
  readonly mine = signal<readonly StoredPost[]>([]);
  readonly ownCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  private owner: string | undefined;
  private epoch = -1;
  private revision = 0;
  constructor() {
    effect(() => {
      const id = this.auth.session()?.user.id;
      const epoch = this.auth.sessionEpoch();
      if (id === this.owner && epoch === this.epoch) return;
      this.owner = id;
      this.epoch = epoch;
      this.revision++;
      this.feed.set([]);
      this.mine.set([]);
      this.ownCount.set(0);
      this.loading.set(false);
      this.error.set('');
      if (id) void this.load();
    });
  }
  async load(): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    const owner = this.auth.session()?.user.id,
      revision = ++this.revision;
    if (!owner || !this.client) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const [feed, mine] = await Promise.all([
        this.client
          .schema('public')
          .from('posts')
          .select(COLUMNS)
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(AbortSignal.timeout(20000)),
        this.client
          .schema('public')
          .from('posts')
          .select(COLUMNS, { count: 'exact' })
          .eq('user_id', owner)
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(AbortSignal.timeout(20000)),
      ]);
      this.media.assertOwner(owner, epoch);
      if (revision !== this.revision) return;
      if (feed.error || mine.error) throw new MediaError('media.errors.postsRead');
      this.feed.set((feed.data ?? []).map((row) => this.map(row)));
      this.mine.set((mine.data ?? []).map((row) => this.map(row)));
      this.ownCount.set(mine.count ?? mine.data?.length ?? 0);
    } catch {
      if (
        revision === this.revision &&
        this.auth.session()?.user.id === owner &&
        this.auth.sessionEpoch() === epoch
      )
        this.error.set('media.errors.postsRead');
    } finally {
      if (revision === this.revision) this.loading.set(false);
    }
  }
  async publish(content: string, file?: File): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    const owner = this.auth.session()?.user.id;
    if (!owner || !this.client || !(await this.auth.hasVerifiedSession()))
      throw new MediaError('media.errors.session');
    this.media.assertOwner(owner, epoch);
    if (typeof content !== 'string') throw new MediaError('media.errors.content');
    const text = content.trim();
    if (content.length > 2000 || (!text && !file)) throw new MediaError('media.errors.content');
    const upload = file ? await this.media.upload(file, 'post', owner) : null;
    this.media.assertOwner(owner, epoch);
    let result;
    try {
      result = await this.client
        .schema('public')
        .from('posts')
        .insert({
          user_id: owner,
          content: text,
          media_url: upload?.url ?? null,
          media_type: upload?.type ?? null,
        })
        .select(COLUMNS)
        .abortSignal(AbortSignal.timeout(20000))
        .single();
    } catch {
      throw new MediaError('media.errors.uncertain');
    }
    this.media.assertOwner(owner, epoch);
    if (result.error) {
      if (!result.status || result.status >= 500) throw new MediaError('media.errors.uncertain');
      throw new MediaError('media.errors.postSave');
    }
    if (!result.data) throw new MediaError('media.errors.uncertain');
    this.revision++;
    this.loading.set(false);
    const post = this.map(result.data);
    this.feed.update((rows) => [post, ...rows.filter((row) => row.id !== post.id)].slice(0, 30));
    this.mine.update((rows) => [post, ...rows.filter((row) => row.id !== post.id)].slice(0, 30));
    this.ownCount.update((count) => count + 1);
    void this.load();
  }
  private map(row: Record<string, unknown>): StoredPost {
    return {
      id: String(row['id']),
      userId: String(row['user_id']),
      kind: 'post',
      text: typeof row['content'] === 'string' ? row['content'] : '',
      createdAt: '',
      mediaUrl: this.media.isPublicUrl(row['media_url']) ? row['media_url'] : undefined,
      mediaType: row['media_type'] === 'video' ? 'video' : 'image',
      stats: { replies: 0, retweets: 0, likes: 0, views: 0 },
    };
  }
}
````

## apps/shell/src/app/core/profile-repository.service.ts (eklendi)

````typescript
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MediaError, MediaService } from './media.service';
export interface ProfileMedia {
  avatar_url: string | null;
  banner_url: string | null;
}
@Injectable({ providedIn: 'root' })
export class ProfileRepository {
  private readonly client = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaService);
  async read(owner: string): Promise<ProfileMedia | null> {
    const epoch = this.auth.sessionEpoch();
    this.media.assertOwner(owner, epoch);
    if (!this.client) throw new MediaError('media.errors.session');
    const { data, error } = await this.client
      .schema('public')
      .from('profiles')
      .select('user_id,avatar_url,banner_url')
      .eq('user_id', owner)
      .abortSignal(AbortSignal.timeout(20000))
      .maybeSingle();
    this.media.assertOwner(owner, epoch);
    if (error) throw new MediaError('media.errors.profileRead');
    if (
      data &&
      (data.user_id !== owner ||
        (data.avatar_url !== null && !this.media.isPublicUrl(data.avatar_url, owner, 'avatar')) ||
        (data.banner_url !== null && !this.media.isPublicUrl(data.banner_url, owner, 'banner')))
    )
      throw new MediaError('media.errors.profileRead');
    return data
      ? {
          avatar_url: this.media.isPublicUrl(data.avatar_url) ? data.avatar_url : null,
          banner_url: this.media.isPublicUrl(data.banner_url) ? data.banner_url : null,
        }
      : null;
  }
  async save(owner: string, value: ProfileMedia): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    // TypeScript types disappear at runtime. Copy only the two allowed columns.
    const payload = { avatar_url: value?.avatar_url, banner_url: value?.banner_url };
    if (
      (payload.avatar_url !== null && !this.media.isPublicUrl(payload.avatar_url, owner, 'avatar')) ||
      (payload.banner_url !== null && !this.media.isPublicUrl(payload.banner_url, owner, 'banner'))
    )
      throw new MediaError('media.errors.upload');
    if (!this.client || !(await this.auth.hasVerifiedSession())) throw new MediaError('media.errors.session');
    this.media.assertOwner(owner, epoch);
    try {
      const result = await this.client
        .schema('public')
        .from('profiles')
        .update(payload)
        .eq('user_id', owner)
        .select('user_id')
        .abortSignal(AbortSignal.timeout(20000))
        .maybeSingle();
      this.media.assertOwner(owner, epoch);
      if (result.error) throw new MediaError('media.errors.profileSave');
      if (!result.data) {
        const inserted = await this.client
          .schema('public')
          .from('profiles')
          .insert({ user_id: owner, ...payload })
          .select('user_id')
          .abortSignal(AbortSignal.timeout(20000))
          .single();
        if (inserted.error || inserted.data?.user_id !== owner)
          throw new MediaError('media.errors.profileSave');
      }
      if (result.data && result.data.user_id !== owner) throw new MediaError('media.errors.profileSave');
      this.media.assertOwner(owner, epoch);
    } catch {
      this.media.assertOwner(owner, epoch);
      const actual = await this.read(owner).catch(() => null);
      this.media.assertOwner(owner, epoch);
      if (actual?.avatar_url === payload.avatar_url && actual?.banner_url === payload.banner_url) return;
      throw new MediaError('media.errors.profileSave');
    }
  }
}
````

## apps/shell/src/app/core/profile.model.ts (eklendi)

````typescript
import type { SocialPost } from '@kampusx/shared/util';
export interface Profile {
  id: string;
  fullName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  university: string;
  faculty: string;
  department: string;
  joinedAt: string;
  followingCount: number;
  followersCount: number;
  postCount: number;
}
export type ProfilePost = SocialPost;
export interface ProfileUpdate {
  fullName: string;
  bio: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}
export class ProfileError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}
````

## apps/shell/src/app/core/profile.service.ts (eklendi)

````typescript
import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { imageDimensions } from '@kampusx/shared/util';
import { MediaService } from './media.service';
import { ProfileRepository } from './profile-repository.service';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { ProfileError, type Profile, type ProfilePost, type ProfileUpdate } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly media = inject(MediaService);
  private readonly repository = inject(ProfileRepository);
  private readonly postsApi = inject(PostsService);
  readonly loading = signal(false);
  readonly readError = signal('');
  private readVersion = 0;
  private readonly files = new Map<string, File>();
  private readonly state = signal<Profile>(this.seed());
  readonly profile = computed(() => ({ ...this.state(), postCount: this.postsApi.ownCount() }));
  private ownerId = this.auth.session()?.user.id;
  private ownerEpoch = this.auth.sessionEpoch();
  private readonly objectUrls = new Set<string>();
  readonly posts = computed<readonly ProfilePost[]>(() => this.postsApi.mine());

  constructor() {
    if (this.ownerId) void this.reload();
    effect(() => {
      const id = this.auth.session()?.user.id;
      const epoch = this.auth.sessionEpoch();
      if (id === this.ownerId && epoch === this.ownerEpoch) return;
      this.readVersion++;
      this.releaseAll();
      this.ownerId = id;
      this.ownerEpoch = epoch;
      this.state.set(this.seed());
      this.loading.set(false);
      this.readError.set('');
      if (id) void this.reload();
    });
    this.destroyRef.onDestroy(() => this.releaseAll());
  }
  private seed(): Profile {
    const user = this.auth.session()?.user;
    const metadata = user?.user_metadata ?? {};
    const value = (key: string) => (typeof metadata[key] === 'string' ? metadata[key].trim() : '');
    const username = (value('username') || user?.email?.split('@')[0] || 'elif').replace(/^@+/, '');
    return {
      id: user?.id || 'mock-student',
      username,
      fullName: value('full_name') || (user ? username : 'Elif Yılmaz'),
      bio: '',
      avatarUrl: undefined,
      coverUrl: undefined,
      university:
        value('university_name') || value('school') || (user ? '' : 'Kırşehir Ahi Evran Üniversitesi'),
      faculty: value('faculty_name') || (user ? '' : 'Teknik Bilimler Meslek Yüksekokulu'),
      department: value('department_name') || value('department') || (user ? '' : 'Bilgisayar Programcılığı'),
      joinedAt: '2024-01-12T12:00:00Z',
      followingCount: 28,
      followersCount: 4,
      postCount: 0,
    };
  }
  async updateProfile(payload: ProfileUpdate): Promise<Profile> {
    // Never replace an unknown server photo with null after a failed initial read.
    if (this.loading() || this.readError()) throw new ProfileError('media.errors.profileRead');
    const current = this.state();
    const epoch = this.ownerEpoch;
    this.assertOwner(current.id, 'profile.errors.save', epoch);
    if (typeof payload?.fullName !== 'string' || payload.fullName.length > 50)
      throw new ProfileError('profile.errors.name');
    if (typeof payload.bio !== 'string' || payload.bio.length > 160)
      throw new ProfileError('profile.errors.bio');
    const fullName = payload.fullName.trim();
    if (!fullName || fullName.length > 50) throw new ProfileError('profile.errors.name');
    if (payload.bio.length > 160) throw new ProfileError('profile.errors.bio');
    const image = (value: string | null | undefined, previous: string | undefined) => {
      if (value === undefined) return previous;
      if (value === null) return undefined;
      if (value !== previous && !this.objectUrls.has(value)) throw new ProfileError('profile.errors.image');
      return value;
    };
    const avatar = image(payload.avatarUrl, current.avatarUrl);
    const cover = image(payload.coverUrl, current.coverUrl);
    const uploadedAvatar =
      avatar && this.files.has(avatar)
        ? (await this.media.upload(this.files.get(avatar)!, 'avatar', current.id)).url
        : avatar;
    const uploadedCover =
      cover && this.files.has(cover)
        ? (await this.media.upload(this.files.get(cover)!, 'banner', current.id)).url
        : cover;
    this.assertOwner(current.id, 'profile.errors.save', epoch);
    if (avatar !== current.avatarUrl || cover !== current.coverUrl) {
      await this.repository.save(current.id, {
        avatar_url: uploadedAvatar ?? null,
        banner_url: uploadedCover ?? null,
      });
      this.assertOwner(current.id, 'profile.errors.save', epoch);
    }
    this.readVersion++;
    this.loading.set(false);
    this.readError.set('');
    const next: Profile = {
      ...current,
      fullName,
      bio: payload.bio.trim(),
      avatarUrl: uploadedAvatar,
      coverUrl: uploadedCover,
    };
    this.state.set(next);
    this.releaseUpload(current.avatarUrl);
    this.releaseUpload(current.coverUrl);
    this.releaseUpload(avatar);
    this.releaseUpload(cover);
    return next;
  }
  async uploadAvatar(file: File): Promise<string> {
    return this.prepareImage(file);
  }
  async uploadCover(file: File): Promise<string> {
    return this.prepareImage(file);
  }
  private async prepareImage(file: File): Promise<string> {
    const owner = this.state().id;
    const epoch = this.ownerEpoch;
    this.assertOwner(owner, 'profile.errors.upload', epoch);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      throw new ProfileError('profile.errors.type');
    if (!file.size || file.size > 5 * 1024 * 1024) throw new ProfileError('profile.errors.size');
    const bytes = new Uint8Array(await file.arrayBuffer());
    this.assertOwner(owner, 'profile.errors.upload', epoch);
    const dimensions = imageDimensions(bytes, file.type);
    if (!dimensions || !dimensions.width || !dimensions.height)
      throw new ProfileError('profile.errors.image');
    if (dimensions.width * dimensions.height > 32_000_000)
      throw new ProfileError('profile.errors.resolution');
    const window = this.document.defaultView;
    if (!window) throw new ProfileError('profile.errors.upload');
    let bitmap: ImageBitmap;
    try {
      bitmap = await window.createImageBitmap(file);
    } catch {
      throw new ProfileError('profile.errors.image');
    }
    const pixels = bitmap.width * bitmap.height;
    bitmap.close();
    if (!pixels || pixels > 32_000_000) throw new ProfileError('profile.errors.resolution');
    this.assertOwner(owner, 'profile.errors.upload', epoch);
    const url = window.URL.createObjectURL(file);
    this.objectUrls.add(url);
    this.files.set(url, file);
    return url;
  }
  private assertOwner(id: string, key: string, epoch = this.ownerEpoch): void {
    if (
      this.destroyRef.destroyed ||
      !this.auth.session() ||
      this.auth.session()!.user.id !== id ||
      this.auth.sessionEpoch() !== epoch ||
      this.state().id !== id
    )
      throw new ProfileError(key);
  }
  releaseUpload(url: string | null | undefined): void {
    if (
      !url ||
      url === this.state().avatarUrl ||
      url === this.state().coverUrl ||
      !this.objectUrls.delete(url)
    )
      return;
    this.files.delete(url);
    this.document.defaultView?.URL.revokeObjectURL(url);
  }
  private releaseAll(): void {
    for (const url of this.objectUrls) this.document.defaultView?.URL.revokeObjectURL(url);
    this.objectUrls.clear();
    this.files.clear();
  }
  async reload(): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    const owner = this.auth.session()?.user.id,
      version = ++this.readVersion;
    if (!owner) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.readError.set('');
    try {
      const value = await this.repository.read(owner);
      if (
        version !== this.readVersion ||
        this.auth.session()?.user.id !== owner ||
        this.auth.sessionEpoch() !== epoch ||
        this.destroyRef.destroyed
      )
        return;
      this.state.set({
        ...this.state(),
        avatarUrl: value?.avatar_url || undefined,
        coverUrl: value?.banner_url || undefined,
      });
    } catch {
      if (version === this.readVersion && this.auth.sessionEpoch() === epoch && !this.destroyRef.destroyed)
        this.readError.set('media.errors.profileRead');
    } finally {
      if (version === this.readVersion && !this.destroyRef.destroyed) this.loading.set(false);
    }
  }
}
````

## apps/shell/src/app/features/profile/profile.routes.ts (eklendi)

````typescript
import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileService } from '../../core/profile.service';
import type { ProfileEditPage } from './profile-edit.page';
export const profileRoutes: Routes = [
  {
    path: 'edit',
    resolve: { profileMedia: () => inject(ProfileService).reload() },
    loadComponent: () => import('./profile-edit.page').then((module) => module.ProfileEditPage),
    canDeactivate: [(component: ProfileEditPage) => component.canLeave()],
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./profile.page').then((module) => module.ProfilePage),
  },
];
````

## libs/shared/util/social-post.ts (eklendi)

````typescript
export type PostKind = 'post' | 'reply' | 'retweet';
export interface SocialPost {
  id: string;
  kind: PostKind;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  stats: { replies: number; retweets: number; likes: number; views: number };
}
export interface PostAuthor {
  fullName: string;
  username?: string;
  avatarUrl?: string;
}
export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return [words[0], words.length > 1 ? words.at(-1) : '']
    .map((word) => Array.from(word || '')[0] || '')
    .join('')
    .toLocaleUpperCase('tr-TR');
}
export function filterProfilePosts(posts: readonly SocialPost[], tab: number): readonly SocialPost[] {
  return tab === 1
    ? posts.filter((post) => post.kind === 'reply')
    : tab === 2
      ? posts.filter((post) => post.kind === 'retweet')
      : posts;
}
````
