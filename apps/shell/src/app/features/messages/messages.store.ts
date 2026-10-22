import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../core/auth.service';
import { FollowsService } from '../../core/follows.service';
import { PostActionsService } from '../../core/post-actions.service';
import { MessagingApiService, MessagingError, isMessageId } from '../../core/messaging-api.service';
import type { InboxRow, MessageRow } from '../../core/messaging.contract';

export const mergeMessages = (...groups: MessageRow[][]): MessageRow[] =>
  [...new Map(groups.flat().map((row) => [row.id, row])).values()].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );

/** Component-scoped: leaving /messages tears down channels and all sensitive state. */
@Injectable()
export class MessagesStore {
  private readonly api = inject(MessagingApiService);
  private readonly auth = inject(AuthService);
  private readonly destroy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly follows = inject(FollowsService);
  private readonly actions = inject(PostActionsService);
  readonly inbox = signal<InboxRow[]>([]);
  readonly messages = signal<MessageRow[]>([]);
  readonly contentRevision = signal(0);
  readonly active = signal('');
  readonly loading = signal(false);
  readonly olderLoading = signal(false);
  readonly hasOlder = signal(false);
  readonly unavailable = signal(false);
  readonly error = signal('');
  readonly readError = signal(false);
  readonly connected = signal(false);
  readonly connecting = signal(true);
  readonly sending = signal(false);
  readonly uncertain = signal(false);
  readonly mutationError = signal('');
  readonly deleting = signal('');
  private channel?: RealtimeChannel;
  private read?: AbortController;
  private write?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private channelGeneration = 0;
  private identity = '';
  private revision = 0;
  private refreshAgain = false;
  private refreshing = false;
  constructor() {
    effect(() => {
      const session = this.auth.session(),
        epoch = this.auth.sessionEpoch();
      const identity = `${session?.user.id ?? ''}:${epoch}`;
      if (identity !== this.identity) {
        this.identity = identity;
        untracked(() => this.sessionChanged(session?.user.id ?? '', session?.access_token ?? '', epoch));
      }
    });
    effect(() => {
      this.follows.privacyRevision();
      this.actions.readRevision();
      untracked(() => {
        this.inbox.set([]);
        this.messages.set([]);
        this.schedule();
      });
    });
    const visible = () => {
      if (this.document.visibilityState === 'visible') this.schedule();
    };
    this.document.addEventListener('visibilitychange', visible);
    this.destroy.onDestroy(() => {
      this.generation++;
      this.read?.abort();
      this.write?.abort();
      clearTimeout(this.timer);
      this.document.removeEventListener('visibilitychange', visible);
      this.stopChannel();
      this.inbox.set([]);
      this.messages.set([]);
    });
  }
  private stopChannel() {
    this.channelGeneration++;
    const channel = this.channel;
    this.channel = undefined;
    if (channel && this.api.client) void this.api.client.removeChannel(channel).catch(() => undefined);
  }
  private sessionChanged(owner: string, token: string, epoch: number) {
    ++this.generation;
    this.read?.abort();
    this.write?.abort();
    this.stopChannel();
    clearTimeout(this.timer);
    this.revision++;
    this.refreshing = false;
    this.refreshAgain = false;
    this.inbox.set([]);
    this.messages.set([]);
    this.error.set('');
    this.sending.set(false);
    this.deleting.set('');
    this.olderLoading.set(false);
    this.hasOlder.set(false);
    this.loading.set(false);
    this.readError.set(false);
    this.unavailable.set(false);
    this.uncertain.set(false);
    this.mutationError.set('');
    this.connected.set(false);
    this.connecting.set(!!owner);
    if (!owner || !this.api.client) return;
    void this.refresh();
    this.connect(owner, token, epoch);
  }
  private connect(owner: string, token: string, epoch: number) {
    const client = this.api.client;
    if (!client || !owner) return;
    this.stopChannel();
    const generation = this.generation,
      channelGeneration = this.channelGeneration;
    const current = () =>
      generation === this.generation &&
      channelGeneration === this.channelGeneration &&
      !this.destroy.destroyed;
    this.connected.set(false);
    this.connecting.set(true);
    void client.realtime
      .setAuth(token)
      .then(() => {
        if (!current()) return;
        this.channel = client
          .channel(`dm:${owner}:${epoch}:${generation}:${channelGeneration}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
            this.schedule(),
          )
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () =>
            this.schedule(),
          )
          .subscribe((status) => {
            if (!current()) return;
            this.connecting.set(false);
            this.connected.set(status === 'SUBSCRIBED');
            if (status === 'SUBSCRIBED') this.schedule();
          });
      })
      .catch(() => {
        if (current()) this.connecting.set(false);
      });
  }
  reconnect() {
    const session = this.auth.session();
    this.connect(session?.user.id ?? '', session?.access_token ?? '', this.auth.sessionEpoch());
    this.schedule();
  }
  select(conv: string) {
    if (conv === this.active()) return;
    this.read?.abort();
    this.revision++;
    this.refreshing = false;
    this.active.set(conv);
    this.messages.set([]);
    this.hasOlder.set(false);
    this.unavailable.set(false);
    this.mutationError.set('');
    this.uncertain.set(false);
    this.schedule();
  }
  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.refresh(), 100);
  }
  async refresh() {
    if (this.destroy.destroyed || !this.auth.session()?.user.id) return;
    if (this.refreshing) {
      this.refreshAgain = true;
      return;
    }
    this.refreshing = true;
    const revision = ++this.revision,
      generation = this.generation,
      conv = this.active(),
      owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    this.read?.abort();
    const controller = (this.read = new AbortController());
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]);
    const current = () =>
      !this.destroy.destroyed &&
      revision === this.revision &&
      generation === this.generation &&
      owner === this.auth.session()?.user.id &&
      epoch === this.auth.sessionEpoch();
    this.loading.set(true);
    this.error.set('');
    this.readError.set(false);
    try {
      const inbox = await this.api.inbox(signal);
      if (!current()) return;
      this.inbox.set(inbox);
      this.contentRevision.update((value) => value + 1);
      if (conv) {
        const entry = inbox.find((row) => row.conversation_id === conv);
        this.unavailable.set(!entry || !isMessageId(conv));
        if (!entry || !isMessageId(conv)) {
          this.messages.set([]);
          this.hasOlder.set(false);
          return;
        }
        const previous = this.messages();
        const [latest, loaded] = await Promise.all([
          this.api.page(conv, signal),
          this.api.refreshLoaded(
            conv,
            previous.map((row) => row.id),
            signal,
          ),
        ]);
        if (!current()) return;
        this.messages.set(mergeMessages(loaded, latest));
        if (!previous.length) this.hasOlder.set(latest.length === 50);
        if (this.document.visibilityState === 'visible') {
          try {
            await this.api.markRead(conv, signal);
            if (current())
              this.inbox.update((rows) =>
                rows.map((row) => (row.conversation_id === conv ? { ...row, unread_count: 0 } : row)),
              );
          } catch {
            if (current()) this.readError.set(true);
          }
        }
      }
    } catch (error) {
      if (current()) {
        this.error.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
        // Fail closed on failed privacy refresh; never leave stale private content visible.
        this.inbox.set([]);
        this.messages.set([]);
      }
    } finally {
      if (current()) {
        this.loading.set(false);
        this.refreshing = false;
        if (this.refreshAgain) {
          this.refreshAgain = false;
          this.schedule();
        }
      }
    }
  }
  async older() {
    const first = this.messages()[0],
      conv = this.active(),
      generation = this.generation,
      revision = this.revision;
    if (!first || this.olderLoading() || this.loading() || !this.hasOlder()) return;
    this.olderLoading.set(true);
    try {
      const rows = await this.api.page(
        conv,
        AbortSignal.any([this.read!.signal, AbortSignal.timeout(20000)]),
        first,
      );
      if (this.destroy.destroyed || generation !== this.generation || revision !== this.revision) return;
      this.messages.update((current) => mergeMessages(rows, current));
      this.hasOlder.set(rows.length === 50);
    } catch {
      if (generation === this.generation) this.mutationError.set('messaging.errors.request');
    } finally {
      if (!this.destroy.destroyed) this.olderLoading.set(false);
    }
  }
  async send(content: string): Promise<boolean> {
    const conv = this.active(),
      generation = this.generation;
    if (
      this.sending() ||
      this.uncertain() ||
      !this.inbox().find((row) => row.conversation_id === conv)?.can_send
    )
      return false;
    this.sending.set(true);
    this.mutationError.set('');
    const controller = (this.write = new AbortController());
    try {
      await this.api.send(conv, content, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]));
      if (generation !== this.generation || this.destroy.destroyed || conv !== this.active()) return false;
      this.schedule();
      return true;
    } catch (error) {
      if (generation === this.generation && !this.destroy.destroyed) {
        const key = error instanceof MessagingError ? error.key : 'messaging.errors.uncertain';
        this.mutationError.set(key);
        this.uncertain.set(!(error instanceof MessagingError) || error.uncertain);
        if (key === 'messaging.errors.unavailable')
          this.inbox.update((rows) =>
            rows.map((row) => (row.conversation_id === conv ? { ...row, can_send: false } : row)),
          );
        this.schedule();
      }
      return false;
    } finally {
      if (generation === this.generation && !this.destroy.destroyed) this.sending.set(false);
    }
  }
  async remove(id: string) {
    if (this.deleting()) return;
    const generation = this.generation;
    this.deleting.set(id);
    this.mutationError.set('');
    try {
      await this.api.remove(
        id,
        AbortSignal.any([this.read?.signal ?? AbortSignal.timeout(20000), AbortSignal.timeout(20000)]),
      );
      if (generation === this.generation && !this.destroy.destroyed) this.schedule();
    } catch (error) {
      if (generation === this.generation && !this.destroy.destroyed)
        this.mutationError.set(error instanceof MessagingError ? error.key : 'messaging.errors.request');
    } finally {
      if (generation === this.generation && !this.destroy.destroyed) this.deleting.set('');
    }
  }
}
