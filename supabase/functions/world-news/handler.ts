import { XMLParser, XMLValidator } from 'npm:fast-xml-parser@5.11.2';

type Locale = 'tr' | 'en';
interface Article {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}
interface NewsFeed {
  items: Article[];
  updatedAt: string;
  stale: boolean;
  locale: Locale;
}
interface Environment {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEYS?: string;
  NEWS_ALLOWED_ORIGINS?: string;
}
const feeds: Record<Locale, string> = {
  tr: 'https://tr.euronews.com/rss?format=mrss&level=theme&name=news',
  en: 'https://www.euronews.com/rss?format=mrss&level=theme&name=news',
};
class NewsUnavailable extends Error {
  constructor(
    readonly reason: 'source_http' | 'source_parse' | 'source_network',
    readonly status?: number,
  ) {
    super('news_unavailable');
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && !!value.trim() && value.length <= max && !/[\x00-\x1f\x7f]/.test(value);

export function parseHeadlines(xml: string, now: number): Article[] {
  if (new TextEncoder().encode(xml).length > 1_000_000 || /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml))
    throw Error('invalid_feed');
  if (XMLValidator.validate(xml) !== true) throw Error('invalid_feed');
  const parsed: unknown = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    maxNestedTags: 32,
  }).parse(xml);
  if (!record(parsed) || !record(parsed.rss) || !record(parsed.rss.channel)) throw Error('invalid_feed');
  const raw = parsed.rss.channel.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const result: Article[] = [],
    seen = new Set<string>();
  for (const item of items.slice(0, 100)) {
    if (!record(item)) continue;
    const source = 'Euronews';
    if (!text(item.title, 500) || !text(item.link, 2500) || !text(source, 100) || !text(item.pubDate, 100))
      continue;
    let url: URL;
    try {
      url = new URL(item.link);
    } catch {
      continue;
    }
    if (
      url.protocol !== 'https:' ||
      !['tr.euronews.com', 'www.euronews.com'].includes(url.hostname) ||
      url.port ||
      url.username ||
      url.password ||
      !/^\/(?:video\/)?\d{4}\/\d{2}\/\d{2}\/[^/]+$/.test(url.pathname)
    )
      continue;
    const published = Date.parse(item.pubDate);
    if (!Number.isFinite(published) || published > now + 3_600_000 || published < now - 7 * 86_400_000)
      continue;
    url.hash = '';
    url.search = '';
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    const suffix = ' - ' + source;
    const title = item.title.endsWith(suffix) ? item.title.slice(0, -suffix.length) : item.title;
    if (!title.trim()) continue;
    result.push({
      title: title.trim(),
      source: source.trim(),
      url: url.href,
      publishedAt: new Date(published).toISOString(),
    });
    if (result.length === 8) break;
  }
  return result;
}

export function createNewsHandler({
  env,
  fetch: fetcher,
  now = Date.now,
}: {
  env: Environment;
  fetch: typeof fetch;
  now?: () => number;
}) {
  const origins = new Set(['https://kampusx.vercel.app', 'http://127.0.0.1:4200', 'http://localhost:4200']);
  for (const value of (env.NEWS_ALLOWED_ORIGINS ?? '').split(',')) {
    try {
      const url = new URL(value.trim());
      if (url.protocol === 'https:' && url.origin === value.trim()) origins.add(url.origin);
    } catch {
      /* Exact origins only. */
    }
  }
  let publicKey = env.SUPABASE_ANON_KEY ?? '';
  if (env.SUPABASE_PUBLISHABLE_KEYS) {
    try {
      const keys: unknown = JSON.parse(env.SUPABASE_PUBLISHABLE_KEYS);
      if (!record(keys)) publicKey = '';
      else if (keys.default !== undefined)
        publicKey =
          typeof keys.default === 'string' && keys.default.startsWith('sb_publishable_') ? keys.default : '';
    } catch {
      publicKey = '';
    }
  }
  let base = '';
  try {
    const url = new URL(env.SUPABASE_URL ?? '');
    if (url.protocol === 'https:' && url.origin === url.href.replace(/\/$/, '')) base = url.origin;
  } catch {
    /* Fail closed. */
  }
  const cache = new Map<Locale, NewsFeed>();
  const flights = new Map<Locale, Promise<NewsFeed>>();
  const failures = new Map<Locale, { until: number; error: NewsUnavailable }>();
  async function refresh(locale: Locale): Promise<NewsFeed> {
    const existing = cache.get(locale);
    if (existing && now() - Date.parse(existing.updatedAt) < 300_000) return existing;
    const failure = failures.get(locale);
    if (failure && failure.until > now()) throw failure.error;
    const inflight = flights.get(locale);
    if (inflight) return inflight;
    const task = (async () => {
      let response: Response;
      try {
        response = await fetcher(feeds[locale], {
          redirect: 'manual',
          signal: AbortSignal.timeout(8000),
          headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        });
      } catch {
        throw new NewsUnavailable('source_network');
      }
      if (!response.ok) throw new NewsUnavailable('source_http', response.status);
      if (Number(response.headers.get('content-length')) > 1_000_000)
        throw new NewsUnavailable('source_parse');
      const reader = response.body?.getReader();
      if (!reader) throw new NewsUnavailable('source_parse');
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          total += part.value.byteLength;
          if (total > 1_000_000) {
            await reader.cancel();
            throw new NewsUnavailable('source_parse');
          }
          chunks.push(part.value);
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      let items: Article[];
      try {
        items = parseHeadlines(new TextDecoder('utf-8', { fatal: true }).decode(bytes), now());
      } catch {
        throw new NewsUnavailable('source_parse');
      }
      const result: NewsFeed = { items, updatedAt: new Date(now()).toISOString(), stale: false, locale };
      cache.set(locale, result);
      return result;
    })();
    flights.set(locale, task);
    try {
      return await task;
    } catch (error) {
      const failure = error instanceof NewsUnavailable ? error : new NewsUnavailable('source_network');
      failures.set(locale, { until: now() + 30_000, error: failure });
      throw failure;
    } finally {
      flights.delete(locale);
    }
  }
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    };
    if (origin && origins.has(origin))
      Object.assign(headers, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Max-Age': '600',
      });
    const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
    if (origin && !origins.has(origin)) return json(403, { code: 'forbidden_origin' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') return json(405, { code: 'method_not_allowed' });
    const url = new URL(request.url),
      locale = url.searchParams.get('lang') ?? 'tr';
    if (
      !['tr', 'en'].includes(locale) ||
      [...url.searchParams.keys()].some((key) => key !== 'lang') ||
      url.searchParams.getAll('lang').length > 1
    )
      return json(400, { code: 'invalid_request' });
    if (!base || !publicKey) return json(503, { code: 'news_unavailable', reason: 'configuration' });
    const authorization = request.headers.get('Authorization') ?? '';
    if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192)
      return json(401, { code: 'unauthorized' });
    try {
      const userResponse = await fetcher(base + '/auth/v1/user', {
        redirect: 'error',
        signal: AbortSignal.timeout(7000),
        headers: { apikey: publicKey, Authorization: authorization },
      });
      if (!userResponse.ok) return json(401, { code: 'unauthorized' });
      const user: unknown = await userResponse.json();
      if (
        !record(user) ||
        typeof user.id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) ||
        user.is_anonymous === true
      )
        return json(401, { code: 'unauthorized' });
    } catch {
      return json(503, { code: 'news_unavailable', reason: 'authentication' });
    }
    try {
      return json(200, await refresh(locale as Locale));
    } catch (error) {
      const previous = cache.get(locale as Locale);
      if (previous && now() - Date.parse(previous.updatedAt) <= 3_600_000)
        return json(200, { ...previous, stale: true });
      return json(503, {
        code: 'news_unavailable',
        reason: error instanceof NewsUnavailable ? error.reason : 'source_network',
        ...(error instanceof NewsUnavailable && error.status ? { upstream_status: error.status } : {}),
      });
    }
  };
}
