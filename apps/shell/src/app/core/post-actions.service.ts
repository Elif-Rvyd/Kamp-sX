import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { SocialPost, PostComment } from '@kampusx/shared/util';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MediaError, MediaService } from './media.service';
import { PostsService, POST_COLUMNS, type StoredPost } from './posts.service';
import { FollowsService } from './follows.service';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export interface BlockedPerson {
  blocked_id: string;
  blocked_label: string;
  created_at: string;
}
const uuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
type Context = { owner: string; epoch: number };

/** One session-bound action state for feed, profile, search, bookmarks and archive. */
@Injectable({ providedIn: 'root' })
export class PostActionsService {
  readonly readRevision = signal(0);
  private readonly auth = inject(AuthService);
  private readonly client = inject(SupabaseService).client;
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
  private generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
  constructor() {
    effect(() => {
      const generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
      if (generation === this.generation) return;
      this.generation = generation;
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
    this.destroy.onDestroy(() => clearTimeout(this.hydrationTimer));
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
        const next = new Map(previous),
          value = next.get(post.id);
        if (value) next.delete(post.id);
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
      const results = await Promise.all(
        ['post_likes', 'post_bookmarks'].map((table) =>
          this.client!.schema('public')
            .from(table)
            .select('post_id')
            .eq('user_id', context.owner)
            .in('post_id', ids)
            .abortSignal(AbortSignal.timeout(15000)),
        ),
      );
      if (!this.owns(context)) return;
      if (results.some((r) => r.error)) throw new Error('reaction_read');
      const liked = new Set((results[0].data ?? []).map((r) => String(r['post_id'])));
      const saved = new Set((results[1].data ?? []).map((r) => String(r['post_id'])));
      for (const id of ids)
        if (!this.busy(id) && versions.get(id) === (this.versions.get(id) ?? 0)) {
          this.patch(id, { liked: liked.has(id), bookmarked: saved.has(id) });
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
        const result = await this.client!.rpc('kampusx_set_reaction', {
          p_post_id: post.id,
          p_kind: kind,
          p_enabled: enabled,
        }).abortSignal(AbortSignal.timeout(20000));
        this.assert(context);
        this.check(result.error);
        this.applyState(post, result.data);
        if (kind === 'bookmark') this.readRevision.update((v) => v + 1);
      } catch (error) {
        if (this.owns(context))
          this.patch(
            post.id,
            kind === 'like'
              ? { liked: before.liked, stats: before.stats }
              : { bookmarked: before.bookmarked },
          );
        throw error;
      }
    });
  }
  async pin(post: SocialPost): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.rpc('kampusx_pin_post', {
        p_post_id: post.id,
        p_pinned: !post.pinSlot,
      }).abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      this.check(result.error);
      const slot = result.data?.pin_slot;
      if (slot !== null && ![1, 2, 3].includes(slot)) throw new MediaError('social.errors.save');
      this.patch(post.id, { pinSlot: slot });
      await this.posts.load();
    });
  }
  async archive(post: SocialPost, archived: boolean): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.rpc('kampusx_archive_post', {
        p_post_id: post.id,
        p_archived: archived,
      }).abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      this.check(result.error);
      if (
        !result.data ||
        (archived ? typeof result.data.archived_at !== 'string' : result.data.archived_at !== null)
      )
        throw new MediaError('social.errors.save');
      this.patch(post.id, { archivedAt: result.data.archived_at, pinSlot: result.data.pin_slot ?? null });
      this.readRevision.update((v) => v + 1);
      await this.posts.load();
    });
  }
  async remove(post: SocialPost): Promise<void> {
    const context = this.ownerContext(post);
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const begin = await this.client!.rpc('kampusx_begin_post_delete', { p_post_id: post.id }).abortSignal(
        AbortSignal.timeout(20000),
      );
      this.assert(context);
      this.check(begin.error);
      if (begin.data?.missing !== true) {
        if (
          !begin.data ||
          begin.data.post_id !== post.id ||
          begin.data.user_id !== context.owner ||
          (begin.data.media_path !== null && typeof begin.data.media_path !== 'string')
        )
          throw new MediaError('social.errors.cleanup');
        this.patch(post.id, { deletionPending: true, pinSlot: null });
        if (begin.data.media_path) await this.media.removePostMedia(begin.data.media_path, context.owner);
        this.assert(context);
        const finish = await this.client!.rpc('kampusx_finish_post_delete', {
          p_post_id: post.id,
        }).abortSignal(AbortSignal.timeout(20000));
        this.assert(context);
        this.check(finish.error);
      }
      this.changes.update((previous) => new Map(previous).set(post.id, null));
      this.readRevision.update((v) => v + 1);
      await this.posts.load();
    });
  }
  async report(post: SocialPost, reason: ReportReason): Promise<boolean> {
    const context = this.context();
    this.postId(post);
    if (post.userId === context.owner || !['spam', 'harassment', 'inappropriate', 'other'].includes(reason))
      throw new MediaError('social.errors.save');
    let created = false;
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.rpc('kampusx_report_post', {
        p_post_id: post.id,
        p_reason: reason,
      }).abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      this.check(result.error);
      if (typeof result.data !== 'boolean') throw new MediaError('social.errors.save');
      created = result.data;
    });
    return created;
  }
  async block(post: SocialPost, label: string): Promise<void> {
    const context = this.context();
    this.postId(post);
    if (!uuid(post.userId) || post.userId === context.owner) throw new MediaError('social.errors.save');
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.schema('public')
        .from('user_blocks')
        .insert({
          blocker_id: context.owner,
          blocked_id: post.userId,
          blocked_label: label.trim().slice(0, 150),
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
        .from('user_blocks')
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
      .from('user_blocks')
      .select('blocked_id,blocked_label,created_at')
      .eq('blocker_id', context.owner)
      .order('created_at', { ascending: false })
      .order('blocked_id')
      .range(offset, offset + 29)
      .abortSignal(AbortSignal.timeout(20000));
    this.assert(context);
    this.check(result.error);
    return (result.data ?? []) as BlockedPerson[];
  }
  async collection(mode: 'archive' | 'bookmarks', offset = 0): Promise<StoredPost[]> {
    const context = this.context();
    const result =
      mode === 'archive'
        ? await this.client!.schema('public')
            .from('posts')
            .select(POST_COLUMNS)
            .eq('user_id', context.owner)
            .or('archived_at.not.is.null,deletion_started_at.not.is.null')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + 29)
            .abortSignal(AbortSignal.timeout(20000))
        : await this.client!.schema('public')
            .from('post_bookmarks')
            .select(`post:posts!inner(${POST_COLUMNS})`)
            .eq('user_id', context.owner)
            .is('post.archived_at', null)
            .is('post.deletion_started_at', null)
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
      .is('deletion_started_at', null)
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
    const result = await this.client!.schema('public')
      .from('post_comments')
      .select('id,post_id,user_id,parent_id,content,created_at')
      .eq('post_id', postId)
      .order('created_at')
      .order('id')
      .range(offset, offset + 49)
      .abortSignal(signal ?? AbortSignal.timeout(20000));
    this.assert(context);
    this.check(result.error);
    return (result.data ?? []) as PostComment[];
  }
  async comment(post: SocialPost, id: string, text: string, parent: string | null): Promise<PostComment> {
    const context = this.context();
    this.postId(post);
    if (!uuid(id) || (parent !== null && !uuid(parent)) || !text.trim() || text.length > 2000)
      throw new MediaError('social.errors.comment');
    let comment: PostComment | undefined;
    await this.action(post.id, context, async () => {
      await this.verify(context);
      const result = await this.client!.rpc('kampusx_add_comment', {
        p_id: id,
        p_post_id: post.id,
        p_parent_id: parent,
        p_content: text.trim(),
      }).abortSignal(AbortSignal.timeout(20000));
      this.assert(context);
      this.check(result.error);
      const row = result.data;
      if (
        !row ||
        row.id !== id ||
        row.post_id !== post.id ||
        row.user_id !== context.owner ||
        row.parent_id !== parent ||
        row.content !== text.trim()
      )
        throw new MediaError('social.errors.comment');
      comment = row as PostComment;
      const state = await this.client!.rpc('kampusx_post_state', { p_post_id: post.id }).abortSignal(
        AbortSignal.timeout(15000),
      );
      if (this.owns(context) && !state.error) this.applyState(post, state.data);
    });
    return comment!;
  }
  private applyState(post: SocialPost, state: Record<string, unknown> | null): void {
    if (
      !state ||
      state['id'] !== post.id ||
      typeof state['liked'] !== 'boolean' ||
      typeof state['bookmarked'] !== 'boolean' ||
      !Number.isSafeInteger(state['likes_count']) ||
      Number(state['likes_count']) < 0 ||
      !Number.isSafeInteger(state['comments_count']) ||
      Number(state['comments_count']) < 0
    )
      throw new MediaError('social.errors.save');
    this.patch(post.id, {
      liked: state['liked'],
      bookmarked: state['bookmarked'],
      stats: { ...post.stats, likes: Number(state['likes_count']), replies: Number(state['comments_count']) },
    });
    this.reactionReady.update((old) => new Set(old).add(post.id));
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
      error.message === 'pin_limit'
        ? 'social.errors.pinLimit'
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
