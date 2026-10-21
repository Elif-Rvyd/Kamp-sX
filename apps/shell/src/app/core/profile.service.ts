import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { prepareProfileImage, ProfileImageError } from '@kampusx/shared/util';
import { MediaService } from './media.service';
import { ProfileRepository } from './profile-repository.service';
import { PostsService } from './posts.service';
import { AuthService } from './auth.service';
import { FollowsService } from './follows.service';
import { AccountService } from './account.service';
import { ProfileError, type Profile, type ProfilePost, type ProfileUpdate } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly media = inject(MediaService);
  private readonly repository = inject(ProfileRepository);
  private readonly postsApi = inject(PostsService);
  private readonly follows = inject(FollowsService);
  private readonly account = inject(AccountService);
  readonly loading = signal(false);
  readonly readError = signal('');
  private readVersion = 0;
  private readonly files = new Map<string, File>();
  private readonly state = signal<Profile>(this.seed());
  readonly profile = computed(() => ({
    ...this.state(),
    postCount: this.postsApi.ownCount(),
    followingCount: this.follows.counts().following,
    followersCount: this.follows.counts().followers,
  }));
  private ownerId = this.auth.session()?.user.id;
  private ownerEpoch = this.auth.sessionEpoch();
  private readonly objectUrls = new Set<string>();
  readonly posts = computed<readonly ProfilePost[]>(() => this.postsApi.mine());

  constructor() {
    if (this.ownerId) void this.reload();
    effect(() => {
      const id = this.auth.session()?.user.id;
      const epoch = this.auth.sessionEpoch();
      if (id === this.ownerId && epoch === this.ownerEpoch) {
        const identity = this.seed();
        this.state.update((value) => ({
          ...value,
          fullName: identity.fullName,
          bio: identity.bio,
        }));
        return;
      }
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
      bio: value('bio'),
      avatarUrl: undefined,
      coverUrl: undefined,
      university:
        value('university_name') || value('school') || (user ? '' : 'Kırşehir Ahi Evran Üniversitesi'),
      faculty: value('faculty_name') || (user ? '' : 'Teknik Bilimler Meslek Yüksekokulu'),
      campus: value('campus_name') || value('faculty_name'),
      department: value('department_name') || value('department') || (user ? '' : 'Bilgisayar Programcılığı'),
      joinedAt: user?.created_at || '',
      followingCount: null,
      followersCount: null,
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
    const bio = payload.bio.trim();
    for (const field of ['university', 'department'] as const) {
      if (payload[field] !== undefined && payload[field] !== current[field])
        throw new ProfileError('accountStatus.academicLocked');
    }
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
    const detailsChanged = fullName !== current.fullName || bio !== (current.bio || '');
    if (detailsChanged) {
      const { error } = await this.auth.updateProfileDetails({ fullName, bio });
      this.assertOwner(current.id, 'profile.errors.save', epoch);
      if (error) throw new ProfileError('profile.errors.detailsSave');
      this.state.update((value) => ({
        ...value,
        fullName,
        bio,
      }));
    }
    if (avatar !== current.avatarUrl || cover !== current.coverUrl) {
      try {
        await this.repository.save(current.id, {
          avatar_url: uploadedAvatar ?? null,
          banner_url: uploadedCover ?? null,
        });
      } catch (error) {
        if (detailsChanged) throw new ProfileError('profile.errors.partialSave');
        throw error;
      }
      this.assertOwner(current.id, 'profile.errors.save', epoch);
    }
    this.readVersion++;
    this.loading.set(false);
    this.readError.set('');
    const next: Profile = {
      ...this.state(),
      fullName,
      bio,
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
    return this.prepareImage(file, 'avatar');
  }
  async uploadCover(file: File): Promise<string> {
    return this.prepareImage(file, 'banner');
  }
  private async prepareImage(file: File, purpose: 'avatar' | 'banner'): Promise<string> {
    const owner = this.state().id;
    const epoch = this.ownerEpoch;
    this.assertOwner(owner, 'profile.errors.upload', epoch);
    let prepared: File;
    try {
      prepared = await prepareProfileImage(file, purpose, this.document);
    } catch (error) {
      throw new ProfileError(error instanceof ProfileImageError ? error.key : 'profile.errors.upload');
    }
    this.assertOwner(owner, 'profile.errors.upload', epoch);
    const url = this.document.defaultView!.URL.createObjectURL(prepared);
    this.objectUrls.add(url);
    this.files.set(url, prepared);
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
      const [value, details] = await Promise.all([this.repository.read(owner), this.account.profile(owner)]);
      if (
        version !== this.readVersion ||
        this.auth.session()?.user.id !== owner ||
        this.auth.sessionEpoch() !== epoch ||
        this.destroyRef.destroyed
      )
        return;
      this.state.set({
        ...this.state(),
        ...(details
          ? {
              username: details.username ?? this.state().username,
              fullName: details.full_name ?? this.state().fullName,
              bio: details.bio ?? this.state().bio,
              university: details.university ?? '',
              department: details.studying ?? '',
              campus: details.campus,
              faculty: details.campus,
              joinedAt: details.created_at,
            }
          : {}),
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
