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
