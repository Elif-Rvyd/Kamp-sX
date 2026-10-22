import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
export interface WorldHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}
export interface WorldNewsFeed {
  items: WorldHeadline[];
  updatedAt: string;
  stale: boolean;
  locale: 'tr' | 'en';
}
export class WorldNewsError extends Error {
  constructor(readonly diagnostic: string) {
    super('news_unavailable');
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export function newsLink(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2500) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['tr.euronews.com', 'www.euronews.com'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^\/(?:video\/)?\d{4}\/\d{2}\/\d{2}\/[^/]+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}
@Injectable({ providedIn: 'root' })
export class WorldNewsApiService {
  private readonly auth = inject(AuthService);
  async load(locale: 'tr' | 'en', signal: AbortSignal): Promise<WorldNewsFeed> {
    const token = this.auth.session()?.access_token;
    if (!token || !environment.supabaseUrl || !environment.supabasePublishableKey)
      throw new WorldNewsError('session_or_configuration');
    let response: Response;
    try {
      response = await fetch(environment.supabaseUrl + '/functions/v1/world-news?lang=' + locale, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
        credentials: 'omit',
        redirect: 'error',
        headers: { apikey: environment.supabasePublishableKey, Authorization: 'Bearer ' + token },
      });
    } catch {
      throw new WorldNewsError('network_or_timeout');
    }
    if (!response.ok) {
      const details: unknown = await response.json().catch(() => null);
      const reason =
        record(details) &&
        ['configuration', 'authentication', 'source_http', 'source_parse', 'source_network'].includes(
          String(details.reason),
        )
          ? String(details.reason)
          : 'unavailable';
      const upstream =
        record(details) &&
        typeof details.upstream_status === 'number' &&
        Number.isInteger(details.upstream_status) &&
        details.upstream_status >= 100 &&
        details.upstream_status <= 599
          ? '_' + details.upstream_status
          : '';
      // Fixed categories/statuses only; never include raw response bodies or account data.
      throw new WorldNewsError('http_' + response.status + '_' + reason + upstream);
    }
    const data: unknown = await response.json();
    if (
      !record(data) ||
      data.locale !== locale ||
      !Array.isArray(data.items) ||
      data.items.length > 8 ||
      typeof data.stale !== 'boolean' ||
      typeof data.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(data.updatedAt))
    )
      throw Error('news_unavailable');
    const items: WorldHeadline[] = data.items.map((item: unknown) => {
      if (
        !record(item) ||
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        item.title.length > 500 ||
        typeof item.source !== 'string' ||
        !item.source.trim() ||
        item.source.length > 100 ||
        !newsLink(item.url) ||
        typeof item.publishedAt !== 'string' ||
        !Number.isFinite(Date.parse(item.publishedAt))
      )
        throw Error('news_unavailable');
      return { title: item.title, source: item.source, url: item.url, publishedAt: item.publishedAt };
    });
    return { items, updatedAt: data.updatedAt, stale: data.stale, locale };
  }
}
