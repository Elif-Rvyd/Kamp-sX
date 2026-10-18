import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MediaError, MediaService } from './media.service';
import type { SocialPost } from '@kampusx/shared/util';
export interface StoredPost extends SocialPost {
  userId: string;
}
export const POST_COLUMNS =
  'id,user_id,content,media_url,media_type,created_at,archived_at,deletion_started_at,pin_slot,likes_count,comments_count';
export type PublicationStage = 'preparing' | 'uploading' | 'saving';
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
  invalidateRead(): void {
    this.revision++;
    this.loading.set(false);
  }
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
          .select(POST_COLUMNS)
          .is('archived_at', null)
          .is('deletion_started_at', null)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(AbortSignal.timeout(20000)),
        this.client
          .schema('public')
          .from('posts')
          .select(POST_COLUMNS, { count: 'exact' })
          .eq('user_id', owner)
          .is('archived_at', null)
          .is('deletion_started_at', null)
          .order('pin_slot', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(AbortSignal.timeout(20000)),
      ]);
      this.media.assertOwner(owner, epoch);
      if (revision !== this.revision) return;
      if (feed.error || mine.error) throw new MediaError('media.errors.postsRead');
      this.feed.set((feed.data ?? []).map((row) => this.mapRow(row)));
      this.mine.set((mine.data ?? []).map((row) => this.mapRow(row)));
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
  async publish(content: string, file?: File, onStage?: (stage: PublicationStage) => void): Promise<void> {
    const epoch = this.auth.sessionEpoch();
    const owner = this.auth.session()?.user.id;
    if (!owner || !this.client || !(await this.auth.hasVerifiedSession()))
      throw new MediaError('media.errors.session');
    this.media.assertOwner(owner, epoch);
    if (typeof content !== 'string') throw new MediaError('media.errors.content');
    const text = content.trim();
    if (content.length > 2000 || (!text && !file)) throw new MediaError('media.errors.content');
    let upload = null;
    if (file) {
      onStage?.('preparing');
      const prepared = await this.media.preparePost(file);
      this.media.assertOwner(owner, epoch);
      onStage?.('uploading');
      upload = await this.media.upload(prepared, 'post', owner);
    }
    this.media.assertOwner(owner, epoch);
    onStage?.('saving');
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
        .select(POST_COLUMNS)
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
    if (
      !result.data ||
      !['string', 'number'].includes(typeof result.data.id) ||
      !String(result.data.id) ||
      result.data.user_id !== owner ||
      result.data.content !== text ||
      result.data.media_url !== (upload?.url ?? null) ||
      result.data.media_type !== (upload?.type ?? null)
    )
      throw new MediaError('media.errors.uncertain');
    this.revision++;
    this.loading.set(false);
    const post = this.mapRow(result.data);
    this.feed.update((rows) => [post, ...rows.filter((row) => row.id !== post.id)].slice(0, 30));
    this.mine.update((rows) => [post, ...rows.filter((row) => row.id !== post.id)].slice(0, 30));
    this.ownCount.update((count) => count + 1);
    void this.load();
  }
  mapRow(row: Record<string, unknown>): StoredPost {
    const mediaUrl =
      this.media.isPublicUrl(row['media_url'], String(row['user_id']), 'post') &&
      (row['media_type'] === 'image'
        ? /\.(?:jpg|png|webp)$/.test(row['media_url'])
        : row['media_type'] === 'video' && /\.(?:mp4|webm)$/.test(row['media_url']))
        ? row['media_url']
        : undefined;
    return {
      id: String(row['id']),
      userId: String(row['user_id']),
      kind: 'post',
      text: typeof row['content'] === 'string' ? row['content'] : '',
      createdAt:
        typeof row['created_at'] === 'string' && Number.isFinite(Date.parse(row['created_at']))
          ? row['created_at']
          : '',
      mediaUrl,
      mediaType: row['media_type'] === 'video' ? 'video' : 'image',
      pinSlot: [1, 2, 3].includes(Number(row['pin_slot'])) ? Number(row['pin_slot']) : null,
      archivedAt: typeof row['archived_at'] === 'string' ? row['archived_at'] : null,
      deletionPending: typeof row['deletion_started_at'] === 'string',
      stats: {
        replies:
          Number.isSafeInteger(row['comments_count']) && Number(row['comments_count']) >= 0
            ? Number(row['comments_count'])
            : 0,
        retweets: 0,
        likes:
          Number.isSafeInteger(row['likes_count']) && Number(row['likes_count']) >= 0
            ? Number(row['likes_count'])
            : 0,
        views: 0,
      },
    };
  }
}
