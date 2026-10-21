import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MediaService } from './media.service';
import type { FollowDatabase, FollowProfileRow, FollowRow } from './follow-database.types';
import type { FollowAction, FollowList, FollowPeoplePage, FollowPerson, FollowStatus } from './follow.model';

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const PEOPLE_COLUMNS = 'user_id,username,full_name,avatar_url,university,studying';

export class FollowError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}

@Injectable({ providedIn: 'root' })
export class FollowsService {
  private readonly auth = inject(AuthService);
  // Scope typing to Part A; unrelated services are not migrated to a guessed schema.
  private readonly client = inject(SupabaseService).client as SupabaseClient<FollowDatabase> | null;
  private readonly media = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);
  readonly counts = signal<{ following: number | null; followers: number | null }>({
    following: null,
    followers: null,
  });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly live = signal(false);
  readonly privacyRevision = signal(0);
  readonly pendingCount = signal<number | null>(null);
  readonly ready = signal(false);
  readonly setupError = signal('');
  private setupRevision = 0;
  readonly busy = signal<ReadonlySet<string>>(new Set());
  private readonly writes = new Set<AbortController>();
  private readonly setupReads = new Set<AbortController>();
  private owner: string | undefined;
  private epoch = -1;
  private revision = 0;
  private connectionVersion = 0;
  private connectionFailed = false;
  private channel?: RealtimeChannel;
  private timer?: ReturnType<typeof setTimeout>;
  private request?: AbortController;

  constructor() {
    effect(() => {
      const owner = this.auth.session()?.user.id;
      const epoch = this.auth.sessionEpoch();
      if (owner === this.owner && epoch === this.epoch) return;
      this.cleanup();
      this.owner = owner;
      this.epoch = epoch;
      this.counts.set({ following: null, followers: null });
      this.pendingCount.set(null);
      this.ready.set(false);
      this.setupError.set('');
      this.busy.set(new Set());
      this.loading.set(false);
      this.error.set('');
      if (owner) {
        void this.checkSetup();
        void this.refresh();
        void this.connect(owner, epoch);
      }
    });
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private owns(owner: string, epoch: number): boolean {
    return (
      !this.destroyRef.destroyed &&
      this.auth.session()?.user.id === owner &&
      this.auth.sessionEpoch() === epoch
    );
  }

  async refresh(): Promise<void> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (!owner || !this.client || !this.owns(owner, epoch)) return;
    this.request?.abort();
    const controller = new AbortController(),
      revision = ++this.revision;
    this.request = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    this.loading.set(true);
    try {
      const [following, followers, pending] = await Promise.all([
        this.client
          .schema('public')
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('follower_id', owner)
          .eq('status', 'accepted')
          .abortSignal(controller.signal),
        this.client
          .schema('public')
          .from('follows')
          .select('following_id', { count: 'exact', head: true })
          .eq('following_id', owner)
          .eq('status', 'accepted')
          .abortSignal(controller.signal),
        this.client
          .schema('public')
          .from('follows')
          .select('following_id', { count: 'exact', head: true })
          .eq('following_id', owner)
          .eq('status', 'pending')
          .abortSignal(controller.signal),
      ]);
      if (!this.owns(owner, epoch) || revision !== this.revision) return;
      if (
        following.error ||
        followers.error ||
        pending.error ||
        !Number.isSafeInteger(pending.count) ||
        pending.count! < 0 ||
        !Number.isSafeInteger(following.count) ||
        !Number.isSafeInteger(followers.count) ||
        following.count! < 0 ||
        followers.count! < 0
      )
        throw new FollowError('follows.readError');
      this.counts.set({ following: following.count, followers: followers.count });
      this.pendingCount.set(pending.count);
      this.error.set(this.connectionFailed ? 'follows.liveError' : '');
    } catch {
      if (this.owns(owner, epoch) && revision === this.revision) this.error.set('follows.readError');
    } finally {
      clearTimeout(timeout);
      if (revision === this.revision) {
        this.loading.set(false);
        this.request = undefined;
      }
    }
  }

  async retry(): Promise<void> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (!owner) return;
    if (!this.live()) {
      this.removeChannel();
      void this.connect(owner, epoch);
    }
    await Promise.all([this.checkSetup(), this.refresh()]);
  }

  private async checkSetup(): Promise<void> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch(),
      revision = ++this.setupRevision;
    if (!owner || !this.client) return;
    const request = new AbortController();
    this.setupReads.add(request);
    try {
      const result = await this.client
        .rpc('kampusx_follow_requests_version', undefined, { get: true })
        .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(15000)]));
      if (!this.owns(owner, epoch) || revision !== this.setupRevision) return;
      const ready = !result.error && result.data === '20261018190000';
      this.ready.set(ready);
      this.setupError.set(ready ? '' : 'follows.unavailable');
    } catch {
      if (this.owns(owner, epoch) && revision === this.setupRevision) {
        this.ready.set(false);
        this.setupError.set('follows.unavailable');
      }
    } finally {
      this.setupReads.delete(request);
    }
  }

  private async connect(owner: string, epoch: number): Promise<void> {
    if (!this.client) return;
    const version = ++this.connectionVersion;
    // Never call SDK auth from onAuthStateChange; the service effect runs outside that callback.
    try {
      await this.client.realtime.setAuth();
      if (!this.owns(owner, epoch) || version !== this.connectionVersion) return;
      const channel = this.client.channel(`kampusx:follows:${owner}`, { config: { private: true } });
      this.channel = channel;
      channel
        .on('broadcast', { event: 'changed' }, () => {
          if (!this.owns(owner, epoch) || this.channel !== channel) return;
          this.privacyRevision.update((value) => value + 1);
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.refresh();
          }, 80);
        })
        .subscribe((status) => {
          if (!this.owns(owner, epoch) || this.channel !== channel) return;
          this.live.set(status === 'SUBSCRIBED');
          this.connectionFailed = status !== 'SUBSCRIBED';
          if (status === 'SUBSCRIBED') {
            this.privacyRevision.update((value) => value + 1);
            void this.refresh(); // Covers changes during connection/reconnection.
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            if (this.error() !== 'follows.readError') this.error.set('follows.liveError');
          }
        });
    } catch {
      if (this.owns(owner, epoch) && version === this.connectionVersion) {
        this.connectionFailed = true;
        if (this.error() !== 'follows.readError') this.error.set('follows.liveError');
      }
    }
  }

  async people(kind: FollowList, offset = 0, signal?: AbortSignal): Promise<FollowPeoplePage> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (
      !owner ||
      !this.client ||
      !['followers', 'following', 'requests'].includes(kind) ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      throw new FollowError('follows.readError');
    const abort = signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
    const { data, error } = await this.client
      .schema('public')
      .from('follows')
      .select('follower_id,following_id,status,created_at')
      .eq(kind === 'following' ? 'follower_id' : 'following_id', owner)
      .eq('status', kind === 'requests' ? 'pending' : 'accepted')
      .order('created_at', { ascending: false })
      .order(kind === 'following' ? 'following_id' : 'follower_id')
      .range(offset, offset + 29)
      .abortSignal(abort);
    if (error || !data || !this.owns(owner, epoch)) throw new FollowError('follows.readError');
    for (const row of data) if (!this.validRelation(row)) throw new FollowError('follows.readError');
    const ids = data.map((row) => (kind === 'following' ? row.following_id : row.follower_id));
    const people = await this.hydrate(ids, owner, epoch, abort);
    return { people, nextOffset: offset + data.length, more: data.length === 30 };
  }

  async findPerson(username: string, signal?: AbortSignal): Promise<FollowPerson | null> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    const value = username.trim().replace(/^@/, '');
    if (!owner || !this.client || !value || value.length > 50) throw new FollowError('follows.readError');
    const abort = signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
    const { data, error } = await this.client
      .schema('public')
      .from('profiles')
      .select('user_id')
      .eq('username', value)
      .neq('user_id', owner)
      .limit(1)
      .abortSignal(abort);
    if (error || !data || !this.owns(owner, epoch)) throw new FollowError('follows.readError');
    if (!data.length) return null;
    return (await this.hydrate([data[0].user_id], owner, epoch, abort))[0] ?? null;
  }

  async searchPeople(term: string, signal?: AbortSignal): Promise<FollowPerson[]> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (!owner || !this.client || !this.owns(owner, epoch)) throw new FollowError('follows.readError');
    const value = term.trim().replace(/^@/, '');
    if (value.length < 2) return [];
    if (value.length > 120) throw new FollowError('follows.readError');
    const abort = signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
    const pattern = '%' + value.replace(/[\\%_]/g, '\\$&') + '%';
    // Separate scalar filters keep names out of PostgREST's raw OR expression grammar.
    // Both reads use the caller's session and existing profile RLS, never Auth's user directory.
    const results = await Promise.all(
      (['username', 'full_name'] as const).map((field) =>
        this.client!.schema('public')
          .from('profiles')
          .select('user_id')
          .neq('user_id', owner)
          .ilike(field, pattern)
          .order(field)
          .order('user_id')
          .limit(20)
          .abortSignal(abort),
      ),
    );
    if (abort.aborted || !this.owns(owner, epoch) || results.some((result) => result.error || !result.data))
      throw new FollowError('follows.readError');
    const ids = [...new Set(results.flatMap((result) => result.data!.map((row) => row.user_id)))].slice(
      0,
      20,
    );
    return this.hydrate(ids, owner, epoch, abort);
  }

  private validRelation(row: FollowRow): boolean {
    return (
      UUID.test(row.follower_id) &&
      UUID.test(row.following_id) &&
      ['pending', 'accepted'].includes(row.status) &&
      typeof row.created_at === 'string'
    );
  }

  private async hydrate(
    ids: readonly string[],
    owner: string,
    epoch: number,
    signal: AbortSignal,
  ): Promise<FollowPerson[]> {
    if (!ids.length) return [];
    if (!this.client || ids.some((id) => !UUID.test(id))) throw new FollowError('follows.readError');
    const [profiles, outgoing] = await Promise.all([
      this.client
        .schema('public')
        .from('profiles')
        .select(PEOPLE_COLUMNS)
        .in('user_id', ids)
        .abortSignal(signal),
      this.client
        .schema('public')
        .from('follows')
        .select('follower_id,following_id,status,created_at')
        .eq('follower_id', owner)
        .in('following_id', ids)
        .abortSignal(signal),
    ]);
    if (profiles.error || outgoing.error || !profiles.data || !outgoing.data || !this.owns(owner, epoch))
      throw new FollowError('follows.readError');
    const statuses = new Map<string, FollowStatus>();
    for (const row of outgoing.data) {
      if (!this.validRelation(row) || row.follower_id !== owner || !ids.includes(row.following_id))
        throw new FollowError('follows.readError');
      statuses.set(row.following_id, row.status === 'accepted' ? 'accepted' : 'pending');
    }
    const rows = new Map(profiles.data.map((p) => [p.user_id, p]));
    return ids.flatMap((id) => {
      const p = rows.get(id);
      if (!p) return []; // RLS may hide a peer blocked between the two reads.
      const fields: (keyof Pick<
        FollowProfileRow,
        'username' | 'full_name' | 'avatar_url' | 'university' | 'studying'
      >)[] = ['username', 'full_name', 'avatar_url', 'university', 'studying'];
      if (!UUID.test(p.user_id) || fields.some((field) => p[field] !== null && typeof p[field] !== 'string'))
        throw new FollowError('follows.readError');
      return [
        {
          userId: id,
          username: p.username ?? '',
          fullName: p.full_name ?? '',
          avatarUrl:
            p.avatar_url && this.media.isPublicUrl(p.avatar_url, id, 'avatar') ? p.avatar_url : undefined,
          university: p.university ?? '',
          department: p.studying ?? '',
          status: statuses.get(id) ?? 'none',
        },
      ];
    });
  }

  follow(target: string): Promise<void> {
    return this.act(target, 'follow');
  }
  cancelRequest(target: string): Promise<void> {
    return this.act(target, 'cancel');
  }
  unfollow(target: string): Promise<void> {
    return this.act(target, 'unfollow');
  }
  acceptRequest(target: string): Promise<void> {
    return this.act(target, 'accept');
  }
  rejectRequest(target: string): Promise<void> {
    return this.act(target, 'reject');
  }
  removeFollower(target: string): Promise<void> {
    return this.act(target, 'remove');
  }

  /** Compatibility for existing callers; new UI uses explicit relationship operations. */
  async setFollowing(target: string, following: boolean): Promise<void> {
    if (typeof following !== 'boolean') throw new FollowError('follows.saveError');
    return this.act(target, following ? 'follow' : 'disconnect');
  }

  private async act(target: string, action: FollowAction | 'disconnect'): Promise<void> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (
      !owner ||
      !this.client ||
      typeof target !== 'string' ||
      target === owner ||
      !UUID.test(target) ||
      this.busy().has(target) ||
      !this.owns(owner, epoch)
    )
      throw new FollowError('follows.saveError');
    this.busy.update((ids) => new Set([...ids, target]));
    const request = new AbortController();
    this.writes.add(request);
    try {
      if (!(await this.auth.hasVerifiedSession()) || !this.owns(owner, epoch))
        throw new FollowError('follows.saveError');
      await this.checkSetup();
      if (!this.owns(owner, epoch) || !this.ready()) throw new FollowError('follows.unavailable');
      const table = this.client.schema('public').from('follows');
      const incoming = ['accept', 'reject', 'remove'].includes(action);
      const follower = incoming ? target : owner,
        following = incoming ? owner : target;
      const abort = AbortSignal.any([request.signal, AbortSignal.timeout(15000)]);
      let result: { error: { code: string } | null; count: number | null };
      if (action === 'follow') {
        result = await table.insert({ follower_id: owner, following_id: target }).abortSignal(abort);
      } else if (action === 'accept') {
        result = await table
          .update({ status: 'accepted' }, { count: 'exact' })
          .eq('follower_id', follower)
          .eq('following_id', following)
          .eq('status', 'pending')
          .abortSignal(abort);
      } else {
        const query = table
          .delete({ count: 'exact' })
          .eq('follower_id', follower)
          .eq('following_id', following);
        result = await (
          action === 'disconnect'
            ? query
            : query.eq('status', action === 'cancel' || action === 'reject' ? 'pending' : 'accepted')
        ).abortSignal(abort);
      }
      if (
        !this.owns(owner, epoch) ||
        (result.error && !(action === 'follow' && result.error.code === '23505'))
      )
        throw new FollowError('follows.saveError');
      await this.refresh();
      if (!this.owns(owner, epoch)) throw new FollowError('follows.saveError');
      this.privacyRevision.update((revision) => revision + 1);
      if (action !== 'follow' && result.count === 0) throw new FollowError('follows.changed');
    } catch (error) {
      throw error instanceof FollowError ? error : new FollowError('follows.saveError');
    } finally {
      this.writes.delete(request);
      if (this.owns(owner, epoch)) this.busy.update((ids) => new Set([...ids].filter((id) => id !== target)));
    }
  }

  private removeChannel(): void {
    this.connectionVersion++;
    this.connectionFailed = false;
    const previous = this.channel;
    this.channel = undefined;
    this.live.set(false);
    if (previous && this.client) void this.client.removeChannel(previous).catch(() => {});
  }
  private cleanup(): void {
    this.revision++;
    this.setupRevision++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.request?.abort();
    this.request = undefined;
    for (const request of this.writes) request.abort();
    this.writes.clear();
    for (const request of this.setupReads) request.abort();
    this.setupReads.clear();
    this.removeChannel();
  }
}
