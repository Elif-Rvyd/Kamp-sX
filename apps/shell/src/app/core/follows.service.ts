import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export class FollowError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}

@Injectable({ providedIn: 'root' })
export class FollowsService {
  private readonly auth = inject(AuthService);
  private readonly client = inject(SupabaseService).client;
  private readonly destroyRef = inject(DestroyRef);
  readonly counts = signal<{ following: number | null; followers: number | null }>({
    following: null,
    followers: null,
  });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly live = signal(false);
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
      this.loading.set(false);
      this.error.set('');
      if (owner) {
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
      const [following, followers] = await Promise.all([
        this.client
          .schema('public')
          .from('user_follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('follower_id', owner)
          .abortSignal(controller.signal),
        this.client
          .schema('public')
          .from('user_follows')
          .select('followed_id', { count: 'exact', head: true })
          .eq('followed_id', owner)
          .abortSignal(controller.signal),
      ]);
      if (!this.owns(owner, epoch) || revision !== this.revision) return;
      if (
        following.error ||
        followers.error ||
        !Number.isSafeInteger(following.count) ||
        !Number.isSafeInteger(followers.count) ||
        following.count! < 0 ||
        followers.count! < 0
      )
        throw new FollowError('follows.readError');
      this.counts.set({ following: following.count, followers: followers.count });
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
    await this.refresh();
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
          if (status === 'SUBSCRIBED')
            void this.refresh(); // Covers changes during connection/reconnection.
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
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

  /** The database enforces ownership, uniqueness and no self-follow independently of the UI. */
  async setFollowing(target: string, following: boolean): Promise<void> {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (
      !owner ||
      !this.client ||
      typeof target !== 'string' ||
      typeof following !== 'boolean' ||
      target === owner ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(target) ||
      !(await this.auth.hasVerifiedSession()) ||
      !this.owns(owner, epoch)
    )
      throw new FollowError('follows.saveError');
    try {
      const query = this.client.schema('public').from('user_follows');
      const result = await (
        following
          ? query.insert({ follower_id: owner, followed_id: target })
          : query.delete().eq('follower_id', owner).eq('followed_id', target)
      ).abortSignal(AbortSignal.timeout(15000));
      if (!this.owns(owner, epoch) || (result.error && !(following && result.error.code === '23505')))
        throw new FollowError('follows.saveError');
      await this.refresh();
    } catch {
      throw new FollowError('follows.saveError');
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
    clearTimeout(this.timer);
    this.timer = undefined;
    this.request?.abort();
    this.request = undefined;
    this.removeChannel();
  }
}
