import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.generated';
import { AccountService, type AccountDatabase } from './account.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MediaError, MediaService } from './media.service';
import type { SocialPost } from '@kampusx/shared/util';
export interface StoredPost extends SocialPost {
  userId: string;
}
export const POST_COLUMNS =
  'id,user_id,content,media_url,media_type,created_at,archived_at,deleted_at,pinned_at,likes_count,replies_count,reposts_count,parent_id,repost_of_id';
// Keep the publication receipt within the existing basic SELECT grants.
const POST_RECEIPT_COLUMNS = 'id,user_id,content,media_url,media_type,created_at';
export type PublicationStage = 'preparing' | 'uploading' | 'saving';
@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly client = inject(SupabaseService).client as SupabaseClient<AccountDatabase> | null;
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly media = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);
  readonly feed = signal<readonly StoredPost[]>([]);
  readonly mine = signal<readonly StoredPost[]>([]);
  readonly ownCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly scope = signal<'explore' | 'university' | 'campus' | 'department'>('explore');
  selectScope(scope: 'explore' | 'university' | 'campus' | 'department'): void {
    if (this.scope() === scope) return;
    this.scope.set(scope);
    this.feed.set([]);
    void this.load();
  }
  private owner: string | undefined;
  private epoch = -1;
  private revision = 0;
  private request?: AbortController;
  invalidateRead(): void {
    this.request?.abort();
    this.request = undefined;
    this.revision++;
    this.loading.set(false);
  }
  constructor() {
    this.destroyRef.onDestroy(() => this.invalidateRead());
    effect(() => {
      const id = this.auth.session()?.user.id;
      const epoch = this.auth.sessionEpoch();
      if (id === this.owner && epoch === this.epoch) return;
      this.owner = id;
      this.epoch = epoch;
      this.invalidateRead();
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
    this.request?.abort();
    this.request = undefined;
    if (!owner || !this.client || this.destroyRef.destroyed) return;
    const request = (this.request = new AbortController());
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20000)]);
    this.loading.set(true);
    this.error.set('');
    try {
      const [feed, mine] = await Promise.all([
        this.readFeed(owner, signal),
        this.client
          .schema('public')
          .from('posts')
          .select(POST_COLUMNS, { count: 'exact' })
          .eq('user_id', owner)
          .is('archived_at', null)
          .is('deleted_at', null)
          .order('pinned_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(30)
          .abortSignal(signal),
      ]);
      this.media.assertOwner(owner, epoch);
      if (revision !== this.revision || this.destroyRef.destroyed) return;
      if (signal.aborted || feed.error || mine.error) throw new MediaError('media.errors.postsRead');
      this.feed.set((feed.data ?? []).map((row) => this.mapRow(row)));
      this.mine.set((mine.data ?? []).map((row) => this.mapRow(row)));
      this.ownCount.set(mine.count ?? mine.data?.length ?? 0);
    } catch (error) {
      if (
        revision === this.revision &&
        this.auth.session()?.user.id === owner &&
        this.auth.sessionEpoch() === epoch &&
        !this.destroyRef.destroyed
      )
        this.error.set(error instanceof MediaError ? error.key : 'media.errors.postsRead');
    } finally {
      if (revision === this.revision) this.loading.set(false);
      if (this.request === request) this.request = undefined;
    }
  }
  private async readFeed(owner: string, signal: AbortSignal) {
    const scope = this.scope();
    if (scope === 'explore')
      return this.client!.schema('public')
        .from('posts')
        .select(POST_COLUMNS)
        .is('archived_at', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(30)
        .abortSignal(signal);
    if (!(await this.account.installed(signal))) throw new MediaError('accountStatus.setup');
    const academic = await this.account.profile(owner, signal);
    if (
      !academic?.university_id ||
      (scope === 'campus' && !academic.campus_id) ||
      (scope === 'department' && !academic.department_id)
    )
      throw new MediaError('posts.academicMissing');
    let query = this.client!.schema('public')
      .from('posts')
      .select(
        'id,user_id,content,media_url,media_type,created_at,archived_at,deleted_at,pinned_at,likes_count,replies_count,reposts_count,parent_id,repost_of_id,profiles!inner(university_id,campus_id,department_id)',
      )
      .is('archived_at', null)
      .is('deleted_at', null)
      .eq('profiles.university_id', academic.university_id);
    if (scope === 'campus') query = query.eq('profiles.campus_id', academic.campus_id!);
    if (scope === 'department') query = query.eq('profiles.department_id', academic.department_id!);
    return query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(30)
      .abortSignal(signal);
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
        .select(POST_RECEIPT_COLUMNS)
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
    this.invalidateRead();
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
      parentId: typeof row['parent_id'] === 'string' ? row['parent_id'] : undefined,
      repostOfId: typeof row['repost_of_id'] === 'string' ? row['repost_of_id'] : undefined,
      kind: row['parent_id'] ? 'reply' : row['repost_of_id'] ? 'retweet' : 'post',
      text: typeof row['content'] === 'string' ? row['content'] : '',
      createdAt:
        typeof row['created_at'] === 'string' && Number.isFinite(Date.parse(row['created_at']))
          ? row['created_at']
          : '',
      mediaUrl,
      mediaType: row['media_type'] === 'video' ? 'video' : 'image',
      pinSlot: [1, 2, 3].includes(Number(row['pin_slot'])) ? Number(row['pin_slot']) : null,
      pinnedAt:
        typeof row['pinned_at'] === 'string' && Number.isFinite(Date.parse(row['pinned_at']))
          ? row['pinned_at']
          : null,
      archivedAt: typeof row['archived_at'] === 'string' ? row['archived_at'] : null,
      deletionPending: typeof row['deletion_started_at'] === 'string',
      stats: {
        replies:
          Number.isSafeInteger(row['replies_count']) && Number(row['replies_count']) >= 0
            ? Number(row['replies_count'])
            : 0,
        retweets:
          Number.isSafeInteger(row['reposts_count']) && Number(row['reposts_count']) >= 0
            ? Number(row['reposts_count'])
            : 0,
        likes:
          Number.isSafeInteger(row['likes_count']) && Number(row['likes_count']) >= 0
            ? Number(row['likes_count'])
            : 0,
        views: 0,
      },
    };
  }
}
