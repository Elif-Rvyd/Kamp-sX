import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { SocialPost, PostComment } from '@kampusx/shared/util';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MediaError, MediaService } from './media.service';
import { PostsService, POST_COLUMNS, type StoredPost } from './posts.service';
import { FollowsService } from './follows.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.generated';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export interface BlockedPerson {
  blocked_id: string;
  blocked_label: string;
  created_at: string;
}
const uuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
type Context = { owner: string; epoch: number };
const REPLY_COLUMNS = 'id,user_id,parent_id,content,created_at,replies_count';

/** One session-bound action state for feed, profile, search, bookmarks and archive. */
@Injectable({ providedIn: 'root' })
export class PostActionsService {
  readonly readRevision = signal(0);
  private readonly auth = inject(AuthService);
  private readonly client = inject(SupabaseService).client;
  private readonly database = this.client as SupabaseClient<Database> | null;
  private readonly media = inject(MediaService);
  private readonly posts = inject(PostsService);
  private readonly follows = inject(FollowsService);
  private readonly destroy = inject(DestroyRef);
  private readonly changes = signal<ReadonlyMap<string, Partial<SocialPost> | null>>(new Map());
  private readonly hidden = signal<ReadonlySet<string>>(new Set());
  private readonly pending = signal<ReadonlySet<string>>(new Set());
  private readonly reactionReady = signal<ReadonlySet<string>>(new Set());
  private readonly reactionFailed = signal<ReadonlySet<string>>(new Set());
  private readonly tickets = new Map<string, symbol>();
  private readonly versions = new Map<string, number>();
  private readonly seen = new Map<string, SocialPost>();
  private readonly queued = new Set<string>();
  private hydrationTimer?: ReturnType<typeof setTimeout>;
  private replyLifetime = new AbortController();
  private generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
  constructor() {
    effect(() => {
      const generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
      if (generation === this.generation) return;
      this.generation = generation;
      this.replyLifetime.abort();
      this.replyLifetime = new AbortController();
      this.changes.set(new Map());
      this.hidden.set(new Set());
      this.pending.set(new Set());
      this.reactionReady.set(new Set());
      this.reactionFailed.set(new Set());
      this.tickets.clear();
      this.versions.clear();
      this.seen.clear();
      this.queued.clear();
      clearTimeout(this.hydrationTimer);
    });
    this.destroy.onDestroy(() => {
      clearTimeout(this.hydrationTimer);
      this.replyLifetime.abort();
    });
  }
  busy(id: string): boolean {
    return this.pending().has(id);
  }
  reactionsReady(id: string): boolean {
    return this.reactionReady().has(id);
  }
  reactionsFailed(id: string): boolean {
    return this.reactionFailed().has(id);
  }
  retryReactions(id: string): void {
    if (!uuid(id)) return;
    this.reactionFailed.update((old) => {
      const next = new Set(old);
      next.delete(id);
      return next;
    });
    this.queued.add(id);
    clearTimeout(this.hydrationTimer);
    this.hydrationTimer = setTimeout(() => void this.hydrate(), 0);
  }
  view(post: SocialPost): SocialPost | null {
    const change = this.changes().get(post.id);
    if (change === null || (post.userId && this.hidden().has(post.userId))) return null;
    return { ...post, ...change, stats: { ...post.stats, ...change?.stats } };
  }
  observe(post: SocialPost): void {
    if (!uuid(post.id) || this.seen.get(post.id) === post) return;
    this.seen.set(post.id, post);
    if (!this.busy(post.id))
      this.reactionReady.update((old) => {
        const next = new Set(old);
        next.delete(post.id);
        return next;
      });
    if (!this.busy(post.id))
      this.changes.update((previous) => {
        const next = new Map(previous);
        // A fresh server row can become visible again after follow/privacy changes.
        next.delete(post.id);
        return next;
      });
    if (this.seen.size > 500) {
      const oldest = [...this.seen.keys()].find((id) => !this.busy(id));
      if (oldest) {
        this.seen.delete(oldest);
        this.versions.delete(oldest);
        this.changes.update((old) => {
          const next = new Map(old);
          next.delete(oldest);
          return next;
        });
        this.reactionReady.update((old) => {
          const next = new Set(old);
          next.delete(oldest);
          return next;
        });
        this.reactionFailed.update((old) => {
          const next = new Set(old);
          next.delete(oldest);
          return next;
        });
      }
    }
    this.queued.add(post.id);
    clearTimeout(this.hydrationTimer);
    this.hydrationTimer = setTimeout(() => void this.hydrate(), 0);
  }
  private async hydrate(): Promise<void> {
    const ids = [...this.queued].slice(0, 100);
    for (const id of ids) this.queued.delete(id);
    if (this.queued.size) this.hydrationTimer = setTimeout(() => void this.hydrate(), 0);
    if (!ids.length || !this.client || !this.auth.session()) return;
    const context = this.context(),
      versions = new Map(ids.map((id) => [id, this.versions.get(id) ?? 0]));
    try {
      const results = await Promise.all([
        this.database!.schema('public')
          .from('likes')
          .select('post_id')
          .eq('user_id', context.owner)
          .in('post_id', ids)
          .abortSignal(AbortSignal.timeout(15000)),
        this.database!.schema('public')
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', context.owner)
          .in('post_id', ids)
          .abortSignal(AbortSignal.timeout(15000)),
        this.database!.schema('public')
          .from('posts')
          .select('id,likes_count,replies_count,reposts_count')
          .in('id', ids)
          .abortSignal(AbortSignal.timeout(15000)),
      ]);
      if (!this.owns(context)) return;
      if (results.some((r) => r.error)) throw new Error('reaction_read');
      const liked = new Set((results[0].data ?? []).map((r) => String(r['post_id'])));
      const saved = new Set((results[1].data ?? []).map((r) => String(r['post_id'])));
      const counters = new Map((results[2].data ?? []).map((row) => [row['id'], row]));
      for (const id of ids)
        if (!this.busy(id) && versions.get(id) === (this.versions.get(id) ?? 0)) {
          const row = counters.get(id),
            post = this.seen.get(id);
          if (!row) {
            this.changes.update((old) => new Map(old).set(id, null));
            continue;
          }
          if (
            ![row['likes_count'], row['replies_count'], row['reposts_count']].every(
              (n) => Number.isSafeInteger(n) && Number(n) >= 0,
            )
          )
            throw new MediaError('social.errors.read');
          this.patch(id, {
            liked: liked.has(id),
            bookmarked: saved.has(id),
            ...(post
              ? {
                  stats: {
                    ...post.stats,
                    likes: Number(row['likes_count']),
                    replies: Number(row['replies_count']),
                    retweets: Number(row['reposts_count']),
                  },
                }
              : {}),
          });
          this.reactionReady.update((old) => new Set(old).add(id));
          this.reactionFailed.update((old) => {
            const next = new Set(old);
            next.delete(id);
            return next;
          });
        }
    } catch {
      if (this.owns(context))
        this.reactionFailed.update(
          (old) =>
            new Set([
              ...old,
              ...ids.filter((id) => !this.busy(id) && versions.get(id) === (this.versions.get(id) ?? 0)),
            ]),
        );
    }
  }
  async react(post: SocialPost, kind: 'like' | 'bookmark'): Promise<void> {
    const context = this.context();
    this.postId(post);
    const before = this.view(post);
    if (!before) throw new MediaError('social.errors.unavailable');
    const enabled = kind === 'like' ? !before.liked : !before.bookmarked;
    await this.action(post.id, context, async () => {
      this.patch(
        post.id,
        kind === 'like'
          ? {
              liked: enabled,
              stats: { ...before.stats, likes: Math.max(0, before.stats.likes + (enabled ? 1 : -1)) },
            }
          : { bookmarked: enabled },
      );
      try {
        await this.verify(context);
        const table = this.database!.schema('public').from(kind === 'like' ? 'likes' : 'bookmarks');
        const mutation = enabled
          ? table.insert({ user_id: context.owner, post_id: post.id })
          : table.delete().eq('user_id', context.owner).eq('post_id', post.id);
        const result = await mutation.abortSignal(AbortSignal.timeout(20000));
        this.assert(context);
        // Duplicate insert is already the requested state, never another increment.
        if (!(enabled && result.error?.code === '23505')) this.check(result.error);
        await this.refreshReaction(post, context, kind, enabled);
        if (kind === 'bookmark') this.readRevision.update((v) => v + 1);
      } catch (error) {
        if (this.owns(context)) {
          this.patch(
            post.id,
            kind === 'like'
              ? { liked: before.liked, stats: before.stats }
              : { bookmarked: before.bookmarked },
          );
          // A response can be lost after commit. Retry reads state; it never repeats the write.
          this.reactionReady.update((old) => {
            const next = new Set(old);
            next.delete(post.id);
            return next;
          });
          this.reactionFailed.update((old) => new Set(old).add(post.id));
        }
        throw error;
      }
    });
  }
  private async refreshReaction(
    post: SocialPost,
    context: Context,
    kind: 'like' | 'bookmark',
    enabled: boolean,
  ): Promise<void> {
    const [relation, counters] = await Promise.all([
      this.database!.schema('public')
        .from(kind === 'like' ? 'likes' : 'bookmarks')
        .select('post_id')
        .eq('user_id', context.owner)
        .eq('post_id', post.id)
        .abortSignal(AbortSignal.timeout(15000)),
      this.database!.schema('public')
        .from('posts')
        .select('id,likes_count,replies_count,reposts_count')
        .eq('id', post.id)
        .abortSignal(AbortSignal.timeout(15000))
        .maybeSingle(),
    ]);
    this.assert(context);
    this.check(relation.error);
    this.check(counters.error);
    if (!counters.data) throw new MediaError('social.errors.unavailable');
    const actual = (relation.data ?? []).some((row) => row.post_id === post.id);
    if (actual !== enabled) throw new MediaError('social.errors.save');
    const row = counters.data;
    if (
      ![row.likes_count, row.replies_count, row.reposts_count].every((n) => Number.isSafeInteger(n) && n >= 0)
    )
      throw new MediaError('social.errors.read');
    this.patch(post.id, {
      ...(kind === 'like' ? { liked: actual } : { bookmarked: actual }),
      stats: {
        ...post.stats,
        likes: row.likes_count,
        replies: row.replies_count,
        retweets: row.reposts_count,
      },
    });
  }
  async pin(post: SocialPost): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      const current = await this.ownerRow(post.id, context);
      if (current.archived_at || current.parent_id) throw new MediaError('social.errors.pinReply');
      await this.ownerUpdate(post.id, context, {
        pinned_at: current.pinned_at ? null : new Date().toISOString(),
      });
      const actual = await this.ownerRow(post.id, context);
      this.patch(post.id, { pinnedAt: actual.pinned_at, pinSlot: null });
      this.readRevision.update((v) => v + 1);
      await this.posts.load();
    });
  }
  async archive(post: SocialPost, archived: boolean): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      await this.ownerRow(post.id, context);
      const archivedAt = archived ? new Date().toISOString() : null;
      await this.ownerUpdate(post.id, context, { archived_at: archivedAt, pinned_at: null });
      this.patch(post.id, {
        archivedAt,
        pinSlot: null,
        pinnedAt: null,
      });
      this.readRevision.update((v) => v + 1);
      await this.posts.load();
    });
  }
  async remove(post: SocialPost): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      const current = await this.ownerRow(post.id, context);
      // A narrow SQL 22 RPC checks auth.uid() ownership without making deleted rows readable.
      const deleted = await (this.client as SupabaseClient<Database>)
        .rpc('kampusx_soft_delete_post', { p_post_id: post.id })
        .abortSignal(AbortSignal.any([AbortSignal.timeout(20000), this.replyLifetime.signal]));
      this.assert(context);
      this.check(deleted.error);
      if (deleted.data !== true) throw new MediaError('social.errors.ownerUncertain');
      this.changes.update((previous) => new Map(previous).set(post.id, null));
      this.readRevision.update((v) => v + 1);
      if (current.media_url && this.media.isPublicUrl(current.media_url, context.owner, 'post')) {
        try {
          const references = await this.database!.from('posts')
            .select('id')
            .eq('user_id', context.owner)
            .eq('media_url', current.media_url)
            .is('deleted_at', null)
            .limit(1)
            .abortSignal(AbortSignal.timeout(15000));
          this.assert(context);
          if (references.error) throw new Error('cleanup_reference_read');
          if (!references.data?.length) {
            const path = new URL(current.media_url).pathname.split('/object/public/uploads/')[1];
            await this.media.removePostMedia(path, context.owner);
          }
        } catch {
          // The row is already hidden. No duplicate delete or sensitive URL in logs.
          console.warn('KampusX: deleted post media cleanup was not confirmed.');
        }
      }
      this.assert(context);
      await this.posts.load();
    });
  }
  private async ownerRow(id: string, context: Context) {
    await this.verify(context);
    const setup = await (this.client as SupabaseClient<Database>)
      .rpc('kampusx_owner_actions_version', undefined, { get: true })
      .abortSignal(AbortSignal.timeout(15000));
    this.assert(context);
    if (setup.error || setup.data !== '2026102201') throw new MediaError('social.errors.ownerSetup');
    const result = await this.database!.from('posts')
      .select('id,user_id,media_url,pinned_at,archived_at,parent_id')
      .eq('id', id)
      .eq('user_id', context.owner)
      .is('deleted_at', null)
      .abortSignal(AbortSignal.any([AbortSignal.timeout(15000), this.replyLifetime.signal]))
      .maybeSingle();
    this.assert(context);
    this.check(result.error);
    if (!result.data || result.data.id !== id || result.data.user_id !== context.owner)
      throw new MediaError('social.errors.unavailable');
    return result.data;
  }
  private async ownerUpdate(
    id: string,
    context: Context,
    values: {
      pinned_at?: string | null;
      archived_at?: string | null;
      deleted_at?: string;
    },
  ): Promise<void> {
    const result = await this.database!.from('posts')
      .update(values, { count: 'exact' })
      .eq('id', id)
      .eq('user_id', context.owner)
      .is('deleted_at', null)
      .abortSignal(AbortSignal.any([AbortSignal.timeout(20000), this.replyLifetime.signal]));
    this.assert(context);
    this.check(result.error);
    if (result.count !== 1) throw new MediaError('social.errors.ownerUncertain');
  }
  async report(post: SocialPost, reason: ReportReason): Promise<boolean> {
    const context = this.context();
    this.postId(post);
    if (post.userId === context.owner || !['spam', 'harassment', 'inappropriate', 'other'].includes(reason))
      throw new MediaError('social.errors.save');
    let created = false;
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.database!.from('reports')
        .insert({
          reporter_id: context.owner,
          post_id: post.id,
          reported_user_id: post.userId,
          reason,
        })
        .abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      if (result.error?.code === '23505') return;
      this.check(result.error);
      created = true;
    });
    return created;
  }
  async block(post: SocialPost, label: string): Promise<void> {
    void label;
    const context = this.context();
    this.postId(post);
    if (!uuid(post.userId) || post.userId === context.owner) throw new MediaError('social.errors.save');
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.schema('public')
        .from('blocks')
        .insert({
          blocker_id: context.owner,
          blocked_id: post.userId,
        })
        .abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      if (result.error?.code !== '23505') this.check(result.error);
      this.hidden.update((previous) => new Set(previous).add(post.userId!));
      await Promise.all([this.posts.load(), this.follows.refresh()]);
    });
  }
  async unblock(target: string): Promise<void> {
    const context = this.context();
    if (!uuid(target)) throw new MediaError('social.errors.save');
    await this.action('block:' + target, context, async () => {
      await this.verify(context);
      const result = await this.client!.schema('public')
        .from('blocks')
        .delete()
        .eq('blocker_id', context.owner)
        .eq('blocked_id', target)
        .abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      this.check(result.error);
      this.hidden.update((previous) => {
        const next = new Set(previous);
        next.delete(target);
        return next;
      });
      await this.posts.load();
    });
  }
  async blocks(offset = 0): Promise<BlockedPerson[]> {
    const context = this.context();
    const result = await this.client!.schema('public')
      .from('blocks')
      .select('blocked_id,created_at')
      .eq('blocker_id', context.owner)
      .order('created_at', { ascending: false })
      .order('blocked_id')
      .range(offset, offset + 29)
      .abortSignal(AbortSignal.timeout(20000));
    this.assert(context);
    this.check(result.error);
    return (result.data ?? []).flatMap((row) =>
      uuid(row.blocked_id) && typeof row.created_at === 'string'
        ? [{ blocked_id: row.blocked_id, created_at: row.created_at, blocked_label: '' }]
        : [],
    );
  }
  async collection(mode: 'archive' | 'bookmarks', offset = 0): Promise<StoredPost[]> {
    const context = this.context();
    const result =
      mode === 'archive'
        ? await this.client!.schema('public')
            .from('posts')
            .select(POST_COLUMNS)
            .eq('user_id', context.owner)
            .not('archived_at', 'is', null)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + 29)
            .abortSignal(AbortSignal.timeout(20000))
        : await this.database!.schema('public')
            .from('bookmarks')
            .select(`post:posts!inner(${POST_COLUMNS})`)
            .eq('user_id', context.owner)
            .order('created_at', { ascending: false })
            .order('post_id')
            .range(offset, offset + 29)
            .abortSignal(AbortSignal.timeout(20000));
    this.assert(context);
    this.check(result.error);
    const rows = (result.data ?? []) as unknown as Record<string, unknown>[];
    return rows.flatMap((row) => {
      const value = mode === 'archive' ? row : row['post'];
      return value && typeof value === 'object' && !Array.isArray(value)
        ? [this.posts.mapRow(value as Record<string, unknown>)]
        : [];
    });
  }
  async find(id: string, signal?: AbortSignal): Promise<StoredPost | null> {
    const context = this.context();
    if (!uuid(id)) return null;
    const result = await this.client!.schema('public')
      .from('posts')
      .select(POST_COLUMNS)
      .eq('id', id)
      .abortSignal(signal ?? AbortSignal.timeout(20000))
      .maybeSingle();
    this.assert(context);
    this.check(result.error);
    return result.data ? this.posts.mapRow(result.data) : null;
  }
  async search(term: string, signal: AbortSignal): Promise<StoredPost[]> {
    const context = this.context();
    const result = await this.client!.schema('public')
      .from('posts')
      .select(POST_COLUMNS)
      .is('archived_at', null)
      .is('deleted_at', null)
      .ilike('content', '%' + term.slice(0, 120).replace(/[\\%_]/g, '\\$&') + '%')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(30)
      .abortSignal(signal);
    this.assert(context);
    this.check(result.error);
    return (result.data ?? []).map((row) => this.posts.mapRow(row));
  }
  async comments(postId: string, offset = 0, signal?: AbortSignal): Promise<PostComment[]> {
    const context = this.context();
    if (!uuid(postId)) return [];
    if (!Number.isSafeInteger(offset) || offset < 0) throw new MediaError('social.errors.read');
    const result = await this.database!.schema('public')
      .from('posts')
      .select(REPLY_COLUMNS)
      .eq('parent_id', postId)
      .order('created_at')
      .order('id')
      .range(offset, offset + 49)
      .abortSignal(AbortSignal.any([signal ?? AbortSignal.timeout(20000), this.replyLifetime.signal]));
    this.assert(context);
    this.check(result.error);
    return (result.data ?? []).map((row) => this.replyRow(row));
  }
  async replyDepth(post: SocialPost, signal?: AbortSignal): Promise<number> {
    if (!post.parentId) return 0;
    const context = this.context();
    const result = await this.database!.from('posts')
      .select('id,parent_id')
      .eq('id', post.parentId)
      .abortSignal(AbortSignal.any([signal ?? AbortSignal.timeout(15000), this.replyLifetime.signal]))
      .maybeSingle();
    this.assert(context);
    this.check(result.error);
    if (!result.data) throw new MediaError('social.errors.unavailable');
    return result.data.parent_id ? 2 : 1;
  }
  async comment(post: SocialPost, text: string, parent: string | null): Promise<PostComment> {
    const context = this.context();
    this.postId(post);
    if (typeof text !== 'string' || (parent !== null && !uuid(parent)) || !text.trim() || text.length > 2000)
      throw new MediaError('social.errors.comment');
    let comment: PostComment | undefined;
    await this.action(post.id, context, async () => {
      const request = AbortSignal.any([AbortSignal.timeout(20000), this.replyLifetime.signal]);
      await this.verify(context);
      const setup = await (this.client as SupabaseClient<Database>)
        .rpc('kampusx_reply_contract_version')
        .abortSignal(request);
      this.assert(context);
      if (setup.error || setup.data !== '2026102102') throw new MediaError('social.errors.setup');
      const targetId = parent ?? post.id;
      const root = await this.database!.from('posts')
        .select('id,parent_id')
        .eq('id', post.id)
        .abortSignal(request)
        .maybeSingle();
      this.assert(context);
      this.check(root.error);
      if (!root.data) throw new MediaError('social.errors.unavailable');
      let ancestorId = root.data.parent_id;
      if (parent) {
        if (root.data.parent_id) throw new MediaError('social.errors.replyDepth');
        const target = await this.database!.from('posts')
          .select('id,parent_id')
          .eq('id', parent)
          .abortSignal(request)
          .maybeSingle();
        this.assert(context);
        this.check(target.error);
        if (!target.data || target.data.parent_id !== post.id)
          throw new MediaError('social.errors.unavailable');
        ancestorId = null; // root is already verified to be a top-level post.
      }
      if (ancestorId) {
        const ancestor = await this.database!.from('posts')
          .select('id,parent_id')
          .eq('id', ancestorId)
          .abortSignal(request)
          .maybeSingle();
        this.assert(context);
        this.check(ancestor.error);
        if (!ancestor.data) throw new MediaError('social.errors.unavailable');
        if (ancestor.data.parent_id) throw new MediaError('social.errors.replyDepth');
      }
      let result;
      try {
        result = await this.database!.schema('public')
          .from('posts')
          .insert({
            user_id: context.owner,
            content: text.trim(),
            parent_id: targetId,
            media_url: null,
            media_type: null,
            repost_of_id: null,
          })
          .select(REPLY_COLUMNS)
          .abortSignal(request)
          .single();
      } catch {
        throw new MediaError('social.errors.commentUncertain');
      }
      this.assert(context);
      if (result.error) {
        if (!result.status || result.status >= 500) throw new MediaError('social.errors.commentUncertain');
        this.check(result.error);
      }
      const row = result.data;
      if (!row || row.user_id !== context.owner || row.parent_id !== targetId || row.content !== text.trim())
        throw new MediaError('social.errors.commentUncertain');
      try {
        comment = this.replyRow(row);
      } catch {
        throw new MediaError('social.errors.commentUncertain');
      }
      // Receipt confirmed. A failed counter refresh must not invite a duplicate INSERT.
      // Only mounted/known cards own reaction snapshots; plain reply rows do not.
      if (this.seen.has(post.id)) this.retryReactions(post.id);
      if (parent && this.seen.has(parent)) this.retryReactions(parent);
      void this.posts.load();
    });
    return comment!;
  }
  private replyRow(
    row: Pick<
      Database['public']['Tables']['posts']['Row'],
      'id' | 'user_id' | 'parent_id' | 'content' | 'created_at' | 'replies_count'
    >,
  ): PostComment {
    if (
      !uuid(row.id) ||
      !uuid(row.user_id) ||
      !uuid(row.parent_id) ||
      typeof row.content !== 'string' ||
      !Number.isFinite(Date.parse(row.created_at)) ||
      !Number.isSafeInteger(row.replies_count) ||
      row.replies_count < 0
    )
      throw new MediaError('social.errors.read');
    return {
      id: row.id,
      user_id: row.user_id,
      parent_id: row.parent_id,
      content: row.content,
      created_at: row.created_at,
      replies_count: row.replies_count,
    };
  }
  private patch(id: string, value: Partial<SocialPost>): void {
    this.changes.update((previous) => {
      const next = new Map(previous);
      next.set(id, { ...next.get(id), ...value });
      return next;
    });
  }
  private context(): Context {
    const owner = this.auth.session()?.user.id;
    if (!owner || !this.client || this.destroy.destroyed) throw new MediaError('media.errors.session');
    return { owner, epoch: this.auth.sessionEpoch() };
  }
  private owns(context: Context): boolean {
    return (
      !this.destroy.destroyed &&
      this.auth.session()?.user.id === context.owner &&
      this.auth.sessionEpoch() === context.epoch
    );
  }
  private assert(context: Context): void {
    if (!this.owns(context)) throw new MediaError('media.errors.session');
  }
  private async verify(context: Context): Promise<void> {
    if (!(await this.auth.hasVerifiedSession())) throw new MediaError('media.errors.session');
    this.assert(context);
  }
  private postId(post: SocialPost): void {
    if (!uuid(post.id)) throw new MediaError('social.errors.unavailable');
  }
  private ownerContext(post: SocialPost): Context {
    this.postId(post);
    const context = this.context();
    if (post.userId !== context.owner) throw new MediaError('social.errors.unavailable');
    return context;
  }
  private check(error: { code?: string; message?: string } | null): void {
    if (!error) return;
    throw new MediaError(
      error.message === 'reply_depth_limit'
        ? 'social.errors.replyDepth'
        : error.message === 'pin_limit' || error.message === 'En fazla 3 gönderi sabitleyebilirsin'
          ? 'social.errors.pinLimit'
          : error.message === 'pin_reply_forbidden' || error.message === 'Yorumlar sabitlenemez'
            ? 'social.errors.pinReply'
            : error.message === 'media_cleanup_required'
              ? 'social.errors.cleanup'
              : ['42P01', '42703', 'PGRST202'].includes(error.code ?? '')
                ? 'social.errors.setup'
                : error.code === '42501'
                  ? 'social.errors.unavailable'
                  : 'social.errors.save',
    );
  }
  private async action(id: string, context: Context, run: () => Promise<void>): Promise<void> {
    if (this.busy(id)) throw new MediaError('social.errors.busy');
    const ticket = Symbol();
    this.tickets.set(id, ticket);
    this.versions.set(id, (this.versions.get(id) ?? 0) + 1);
    this.pending.update((previous) => new Set(previous).add(id));
    this.posts.invalidateRead();
    try {
      await run();
    } catch (error) {
      throw error instanceof MediaError ? error : new MediaError('social.errors.save');
    } finally {
      if (this.owns(context) && this.tickets.get(id) === ticket) {
        this.tickets.delete(id);
        this.pending.update((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }
    }
  }
}
