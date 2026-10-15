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
