import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface SupportIdentity {
  email: string;
  username: string;
  ready: boolean;
}
export type SupportStatus = 'sent' | 'pending' | 'retryable' | 'rejected' | 'unknown' | 'expired';
export class SupportError extends Error {
  constructor(
    readonly key: string,
    readonly uncertain = false,
  ) {
    super(key);
  }
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const idValid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private readonly auth = inject(AuthService);
  private readonly url = environment.supabaseUrl + '/functions/v1/support-email';
  private async request(
    method: 'GET' | 'POST',
    signal: AbortSignal,
    payload?: { request_id: string; description: string },
    query = '',
  ): Promise<unknown> {
    const token = this.auth.session()?.access_token;
    if (!token || !environment.supabaseUrl || !environment.supabasePublishableKey)
      throw new SupportError('support.errors.session');
    try {
      const result = await fetch(this.url + query, {
        method,
        signal: AbortSignal.any([signal, AbortSignal.timeout(40000)]),
        credentials: 'omit',
        redirect: 'error',
        headers: {
          apikey: environment.supabasePublishableKey,
          Authorization: 'Bearer ' + token,
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      const data: unknown = await result.json();
      if (!result.ok) {
        const code = object(data) ? data.code : undefined;
        if (result.status === 401 || result.status === 403) throw new SupportError('support.errors.session');
        if (result.status === 429) throw new SupportError('support.errors.rateLimit');
        if (code === 'request_conflict' || code === 'request_expired')
          throw new SupportError('support.errors.uncertain', true);
        if (code === 'delivery_rejected') throw new SupportError('support.errors.rejected');
        throw new SupportError(
          'support.errors.unavailable',
          method === 'POST' && result.status >= 500 && code !== 'unavailable',
        );
      }
      return data;
    } catch (error) {
      if (error instanceof SupportError) throw error;
      throw new SupportError(
        method === 'POST' ? 'support.errors.uncertain' : 'support.errors.unavailable',
        method === 'POST',
      );
    }
  }
  async identity(signal: AbortSignal): Promise<SupportIdentity> {
    const result = await this.request('GET', signal);
    if (
      !object(result) ||
      !object(result.identity) ||
      typeof result.identity.email !== 'string' ||
      typeof result.identity.username !== 'string' ||
      typeof result.ready !== 'boolean'
    )
      throw new SupportError('support.errors.unavailable');
    return { email: result.identity.email, username: result.identity.username, ready: result.ready };
  }
  async send(id: string, description: string, signal: AbortSignal): Promise<'sent' | 'pending'> {
    if (!idValid(id) || !description.trim() || description.trim().length > 4000)
      throw new SupportError('support.errors.invalid');
    const result = await this.request('POST', signal, {
      request_id: id,
      description: description.replace(/\r\n?/g, '\n').trim(),
    });
    if (!object(result) || result.request_id !== id || !['sent', 'pending'].includes(String(result.status)))
      throw new SupportError('support.errors.uncertain', true);
    return result.status as 'sent' | 'pending';
  }
  async status(id: string, signal: AbortSignal): Promise<SupportStatus> {
    if (!idValid(id)) throw new SupportError('support.errors.invalid');
    const result = await this.request('GET', signal, undefined, '?request_id=' + encodeURIComponent(id));
    if (
      !object(result) ||
      result.request_id !== id ||
      !['sent', 'pending', 'retryable', 'rejected', 'unknown', 'expired'].includes(String(result.status))
    )
      throw new SupportError('support.errors.status');
    return result.status as SupportStatus;
  }
}
