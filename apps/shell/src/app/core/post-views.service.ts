import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import type { ReleaseDatabase } from './social-release.contract';
import { isMessageId } from './messaging-api.service';

@Injectable({ providedIn: 'root' })
export class PostViewsService {
  private readonly auth = inject(AuthService);
  private readonly destroy = inject(DestroyRef);
  private readonly client = inject(SupabaseService).client as SupabaseClient<ReleaseDatabase> | null;
  readonly totals = signal<Readonly<Record<string, number>>>({});
  readonly failed = signal(false);
  private readonly reads = new Set<string>();
  private readonly seen = new Set<string>();
  private readonly recorded = new Set<string>();
  private request = new AbortController();
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    effect(() => {
      this.auth.sessionEpoch();
      this.request.abort();
      this.request = new AbortController();
      if (this.timer) clearTimeout(this.timer);
      this.timer = undefined;
      this.reads.clear();
      this.seen.clear();
      this.recorded.clear();
      this.totals.set({});
      this.failed.set(false);
    });
    this.destroy.onDestroy(() => {
      this.request.abort();
      if (this.timer) clearTimeout(this.timer);
    });
  }
  load(id: string, refresh = false): void {
    if (isMessageId(id) && (refresh || this.totals()[id] === undefined)) {
      this.reads.add(id);
      this.schedule();
    }
  }
  viewed(id: string): void {
    if (isMessageId(id) && !this.recorded.has(id)) {
      this.seen.add(id);
      this.schedule();
    }
  }
  private schedule() {
    if (!this.timer)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        void this.flush();
      }, 100);
  }
  private async flush() {
    const token = this.auth.session()?.access_token,
      epoch = this.auth.sessionEpoch(),
      request = this.request;
    if (!token || !this.client || request.signal.aborted) return;
    const seen = [...this.seen].slice(0, 50),
      reads = [...this.reads].filter((id) => !seen.includes(id)).slice(0, 50);
    seen.forEach((id) => {
      this.seen.delete(id);
      this.reads.delete(id);
    });
    reads.forEach((id) => this.reads.delete(id));
    try {
      for (const [ids, record] of [
        [seen, true],
        [reads, false],
      ] as const) {
        if (!ids.length) continue;
        const result = await this.client
          .rpc(record ? 'kx_record_post_views' : 'kx_get_post_views', { p_ids: ids })
          .setHeader('Authorization', `Bearer ${token}`)
          .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(15000)]));
        if (request.signal.aborted || this.destroy.destroyed || epoch !== this.auth.sessionEpoch()) return;
        if (result.error) throw new Error('views_request_failed');
        this.totals.update((values) =>
          Object.fromEntries([
            ...Object.entries(values),
            ...(result.data ?? [])
              .filter((row) => Number.isSafeInteger(row.views_count) && row.views_count >= 0)
              .map((row) => [row.post_id, Math.max(values[row.post_id] ?? 0, row.views_count)] as const),
          ]),
        );
        if (record) (result.data ?? []).forEach((row) => this.recorded.add(row.post_id));
      }
      this.failed.set(false);
    } catch {
      if (!request.signal.aborted && epoch === this.auth.sessionEpoch()) this.failed.set(true);
    } finally {
      if (this.seen.size || this.reads.size) this.schedule();
    }
  }
}
