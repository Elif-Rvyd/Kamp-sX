import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import type { InboxRow, MessageRow, MessagingDatabase } from './messaging.contract';

export const MESSAGE_COLUMNS = 'id,conversation_id,sender_id,content,created_at,deleted_at,shared_post_id';
export const isMessageId = (value: string): boolean =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
export class MessagingError extends Error {
  constructor(
    readonly key: string,
    readonly uncertain = false,
  ) {
    super(key);
  }
}
/** Stateless transport. All eligibility decisions come from RPC/RLS, never follow counts in the UI. */
@Injectable({ providedIn: 'root' })
export class MessagingApiService {
  private readonly auth = inject(AuthService);
  readonly client = inject(SupabaseService).client as SupabaseClient<MessagingDatabase> | null;
  private requireClient() {
    if (!this.client || !this.auth.session()?.user.id)
      throw new MessagingError('messaging.errors.unavailable');
    return this.client;
  }
  private authorize<T extends { setHeader(name: string, value: string): unknown }>(query: T): T {
    const token = this.auth.session()?.access_token;
    if (!token) throw new MessagingError('messaging.errors.unavailable');
    // Bind this request to the initiating session, including while the SDK awaits its token provider.
    // Session replacement also aborts it in the owning store/page. Never persist or log this header.
    query.setHeader('Authorization', `Bearer ${token}`);
    return query;
  }
  private failure(error: { code?: string; message?: string } | null, write = false): never {
    if (error?.code === '42501' || error?.message?.includes('dm_unavailable'))
      throw new MessagingError('messaging.errors.unavailable');
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error?.code ?? ''))
      throw new MessagingError('messaging.errors.setup');
    // PostgREST SQL errors guarantee rejection; network/abort responses have no SQL code.
    const uncertain = write && !error?.code;
    throw new MessagingError(
      uncertain ? 'messaging.errors.uncertain' : 'messaging.errors.request',
      uncertain,
    );
  }
  async canMessage(other: string, signal: AbortSignal): Promise<boolean> {
    if (!isMessageId(other)) return false;
    const result = await this.requireClient().rpc('kx_can_message', { other }).abortSignal(signal);
    if (result.error) this.failure(result.error);
    if (typeof result.data !== 'boolean') throw new MessagingError('messaging.errors.setup');
    return result.data;
  }
  async start(other: string, signal: AbortSignal): Promise<string> {
    if (!isMessageId(other)) throw new MessagingError('messaging.errors.unavailable');
    const result = await this.authorize(
      this.requireClient().rpc('kx_start_conversation', { other }).abortSignal(signal),
    );
    if (result.error) this.failure(result.error);
    if (!result.data || !isMessageId(result.data)) throw new MessagingError('messaging.errors.request');
    return result.data;
  }
  async inbox(signal: AbortSignal): Promise<InboxRow[]> {
    const result = await this.requireClient().rpc('kx_inbox_v2').abortSignal(signal);
    if (result.error) this.failure(result.error);
    return result.data ?? [];
  }
  async page(conv: string, signal: AbortSignal, before?: MessageRow): Promise<MessageRow[]> {
    if (!isMessageId(conv)) throw new MessagingError('messaging.errors.unavailable');
    let query = this.requireClient().from('messages').select(MESSAGE_COLUMNS).eq('conversation_id', conv);
    if (before) {
      // Preserve PostgreSQL microseconds; validate timestamp and UUID before filter interpolation.
      if (!isMessageId(before.id) || !Number.isFinite(Date.parse(before.created_at)))
        throw new MessagingError('messaging.errors.request');
      if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before.created_at))
        throw new MessagingError('messaging.errors.request');
      const time = before.created_at;
      query = query.or(`created_at.lt.${time},and(created_at.eq.${time},id.lt.${before.id})`);
    }
    const result = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(50)
      .abortSignal(signal);
    if (result.error) this.failure(result.error);
    return result.data ?? [];
  }
  async refreshLoaded(conv: string, ids: readonly string[], signal: AbortSignal): Promise<MessageRow[]> {
    const client = this.requireClient();
    const rows: MessageRow[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const result = await client
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .eq('conversation_id', conv)
        .in('id', ids.slice(i, i + 100))
        .abortSignal(signal);
      if (result.error) this.failure(result.error);
      rows.push(...(result.data ?? []));
    }
    return rows;
  }
  async send(conv: string, content: string, signal: AbortSignal): Promise<void> {
    if (!isMessageId(conv) || !content.trim() || [...content].length > 2000)
      throw new MessagingError('messaging.errors.content');
    const result = await this.authorize(
      this.requireClient().from('messages').insert({ conversation_id: conv, content }).abortSignal(signal),
    );
    if (result.error) this.failure(result.error, true);
  }
  async sharePost(conv: string, target: string, signal: AbortSignal): Promise<void> {
    if (!isMessageId(conv) || !isMessageId(target)) throw new MessagingError('messaging.shareUnavailable');
    const result = await this.authorize(
      this.requireClient().rpc('kx_share_post', { conv, target }).abortSignal(signal),
    );
    if (result.error?.code === '42501') throw new MessagingError('messaging.shareUnavailable');
    if (result.error) this.failure(result.error, true);
    if (!result.data || !isMessageId(result.data))
      throw new MessagingError('messaging.errors.uncertain', true);
  }
  async remove(id: string, signal: AbortSignal): Promise<void> {
    if (!isMessageId(id)) throw new MessagingError('messaging.errors.unavailable');
    const result = await this.authorize(
      this.requireClient()
        .from('messages')
        .update({ deleted_at: new Date().toISOString() }, { count: 'exact' })
        .eq('id', id)
        .abortSignal(signal),
    );
    if (result.error) this.failure(result.error);
    if (result.count === 0) throw new MessagingError('messaging.errors.unavailable');
  }
  async markRead(conv: string, signal: AbortSignal): Promise<void> {
    const result = await this.authorize(
      this.requireClient().rpc('kx_mark_read', { conv }).abortSignal(signal),
    );
    if (result.error) this.failure(result.error);
    if (result.data !== true) throw new MessagingError('messaging.errors.request');
  }
}
