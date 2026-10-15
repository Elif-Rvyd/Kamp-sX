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
