import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  imageDimensions,
  preparePostImage,
  ProfileImageError,
  preparePostVideo,
  PostVideoError,
  type PostVideoOptions,
} from '@kampusx/shared/util';
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
  private readonly preparedPosts = new WeakMap<File, File>();

  /** Local preparation only. Storage receives a File; database writes receive its public URL. */
  async preparePost(file: File, options: PostVideoOptions = {}): Promise<File> {
    options.signal?.throwIfAborted();
    const cached = this.preparedPosts.get(file);
    if (cached) return cached;
    let prepared = file;
    try {
      if (file.type.startsWith('image/')) prepared = await preparePostImage(file, this.document);
      else {
        const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
        const valid =
          file.type === 'video/mp4'
            ? bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp'
            : file.type === 'video/webm' &&
              [26, 69, 223, 163].every((value, index) => bytes[index] === value);
        if (!valid) throw new MediaError('media.errors.invalidVideo');
        prepared = await preparePostVideo(file, options);
        await this.validate(prepared, 'post');
      }
      options.signal?.throwIfAborted();
    } catch (error) {
      if (error instanceof MediaError || (error instanceof DOMException && error.name === 'AbortError'))
        throw error;
      throw new MediaError(
        error instanceof ProfileImageError || error instanceof PostVideoError
          ? error.key
          : 'media.errors.upload',
      );
    }
    this.preparedPosts.set(file, prepared);
    this.preparedPosts.set(prepared, prepared);
    return prepared;
  }

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
    let response;
    try {
      response = await bucket.upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    } catch (error) {
      throw new MediaError(this.uploadErrorKey(error));
    }
    if (response.error) throw new MediaError(this.uploadErrorKey(response.error));
    this.assertOwner(owner, epoch);
    const result = { path, url: bucket.getPublicUrl(path).data.publicUrl, type };
    if (!this.isPublicUrl(result.url, owner, purpose)) throw new MediaError('media.errors.upload');
    const cache = this.completed.get(file) ?? new Map<string, UploadedMedia>();
    cache.set(cacheKey, result);
    this.completed.set(file, cache);
    this.assertOwner(owner, epoch);
    return result;
  }
  private uploadErrorKey(error: unknown): string {
    const value = error as {
      code?: string;
      statusCode?: string | number;
      status?: number;
      message?: string;
      originalError?: unknown;
    } | null;
    const code = value?.code;
    const status = Number(value?.status) || Number(value?.statusCode);
    if (['InvalidJWT', 'JWTExpired'].includes(code ?? '') || status === 401) return 'media.errors.session';
    if (code === 'NoSuchBucket') return 'media.errors.bucket';
    if (
      code === 'AccessDenied' ||
      status === 403 ||
      /row.level.security|permission denied|policy/i.test(value?.message ?? '')
    )
      return 'media.errors.uploadDenied';
    if (code === 'EntityTooLarge' || status === 413) return 'media.errors.bucketSize';
    if (code === 'InvalidMimeType' || status === 415) return 'media.errors.bucketType';
    if (status === 429 || code === 'SlowDown') return 'media.errors.uploadRateLimit';
    if (error instanceof TypeError || value?.originalError instanceof TypeError || status === 0)
      return 'media.errors.uploadNetwork';
    return 'media.errors.upload';
  }
  /** Only a server-reserved post path may be removed. Final DB deletion also verifies Storage absence. */
  async removePostMedia(path: string, owner: string): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    if (!this.connection.client || !(await this.auth.hasVerifiedSession()))
      throw new MediaError('media.errors.session');
    this.assertOwner(owner, epoch);
    if (
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(owner) ||
      typeof path !== 'string' ||
      !new RegExp(
        '^' + owner + '/post/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\\.(jpg|png|webp|mp4|webm)$',
      ).test(path)
    )
      throw new MediaError('social.errors.cleanup');
    const result = await this.connection.client.storage.from('uploads').remove([path]);
    this.assertOwner(owner, epoch);
    if (result.error) throw new MediaError('social.errors.cleanup');
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
