import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.generated';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MediaError } from './media.service';

export type AudienceKey = 'visible_department' | 'visible_campus' | 'visible_university' | 'visible_explore';
export type Audience = Record<AudienceKey, boolean>;
export type AccountPreferences = Audience & { audience_configured: boolean };
// Generated from the live public schema after SQL 23 was applied.
export type AccountDatabase = Database;
export const AUDIENCE_KEYS: readonly AudienceKey[] = [
  'visible_department',
  'visible_campus',
  'visible_university',
  'visible_explore',
];
export const ACCOUNT_COLUMNS =
  'user_id,username,full_name,bio,avatar_url,banner_url,university,studying,created_at,is_private';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly auth = inject(AuthService);
  private readonly database = inject(SupabaseService).client as SupabaseClient<AccountDatabase> | null;
  private readonly destroy = inject(DestroyRef);
  readonly revision = signal(0);
  private lifetime = new AbortController();
  private generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
  constructor() {
    effect(() => {
      const generation = `${this.auth.session()?.user.id}:${this.auth.sessionEpoch()}`;
      if (generation !== this.generation) {
        this.generation = generation;
        this.lifetime.abort();
        this.lifetime = new AbortController();
        this.revision.update((v) => v + 1);
      }
    });
    this.destroy.onDestroy(() => this.lifetime.abort());
  }
  private context(signal?: AbortSignal) {
    const owner = this.auth.session()?.user.id,
      epoch = this.auth.sessionEpoch();
    if (!owner || !this.database) throw new MediaError('media.errors.session');
    return {
      owner,
      epoch,
      signal: AbortSignal.any([
        this.lifetime.signal,
        AbortSignal.timeout(20000),
        ...(signal ? [signal] : []),
      ]),
    };
  }
  private assert(context: { owner: string; epoch: number; signal: AbortSignal }): void {
    if (
      this.destroy.destroyed ||
      context.signal.aborted ||
      this.auth.session()?.user.id !== context.owner ||
      this.auth.sessionEpoch() !== context.epoch
    )
      throw new MediaError('media.errors.session');
  }
  async installed(signal?: AbortSignal): Promise<boolean> {
    const context = this.context(signal);
    const result = await this.database!.rpc('kampusx_account_contract_version', undefined, {
      get: true,
    }).abortSignal(context.signal);
    this.assert(context);
    return !result.error && result.data === '2026102201';
  }
  async preferences(signal?: AbortSignal): Promise<AccountPreferences> {
    const context = this.context(signal);
    if (!(await this.installed(context.signal))) throw new MediaError('accountStatus.setup');
    const result = await this.database!.from('profiles')
      .select('visible_department,visible_campus,visible_university,visible_explore,audience_configured')
      .eq('user_id', context.owner)
      .abortSignal(context.signal)
      .single();
    this.assert(context);
    if (
      result.error ||
      !result.data ||
      [...AUDIENCE_KEYS, 'audience_configured'].some(
        (key) => typeof result.data[key as keyof AccountPreferences] !== 'boolean',
      )
    )
      throw new MediaError('accountStatus.readError');
    return result.data;
  }
  async save(values: Audience): Promise<AccountPreferences> {
    const context = this.context();
    if (!(await this.auth.hasVerifiedSession()) || !(await this.installed(context.signal)))
      throw new MediaError('accountStatus.setup');
    this.assert(context);
    if (AUDIENCE_KEYS.some((key) => typeof values[key] !== 'boolean'))
      throw new MediaError('accountStatus.saveError');
    const payload: Audience = {
      visible_department: values.visible_department,
      visible_campus: values.visible_campus,
      visible_university: values.visible_university,
      visible_explore: values.visible_explore,
    };
    const result = await this.database!.from('profiles')
      .update(payload)
      .eq('user_id', context.owner)
      .select('visible_department,visible_campus,visible_university,visible_explore,audience_configured')
      .abortSignal(context.signal)
      .single();
    this.assert(context);
    if (
      result.error ||
      !result.data ||
      !result.data.audience_configured ||
      AUDIENCE_KEYS.some((key) => result.data[key] !== payload[key])
    )
      throw new MediaError('accountStatus.saveError');
    this.revision.update((value) => value + 1);
    return result.data;
  }
  async profile(userId: string, signal?: AbortSignal) {
    const context = this.context(signal);
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId)) return null;
    const installed = await this.installed(context.signal);
    const result = await this.database!.from('profiles')
      .select(ACCOUNT_COLUMNS)
      .eq('user_id', userId)
      .abortSignal(context.signal)
      .maybeSingle();
    this.assert(context);
    if (result.error || (result.data && result.data.user_id !== userId))
      throw new MediaError('accountStatus.readError');
    if (!result.data) return null;
    let campus = '';
    if (installed) {
      const academic = await this.database!.from('profiles')
        .select('campus')
        .eq('user_id', userId)
        .abortSignal(context.signal)
        .maybeSingle();
      this.assert(context);
      if (academic.error || !academic.data) throw new MediaError('accountStatus.readError');
      campus = academic.data.campus ?? '';
    }
    return { ...result.data, campus };
  }
}
