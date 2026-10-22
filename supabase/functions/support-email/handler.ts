/** Server-only mail boundary. Browser payloads never control identity, sender or recipient. */
export interface SupportEnvironment {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  SUPPORT_FROM?: string;
  SUPPORT_TO?: string;
  SUPPORT_ALLOWED_ORIGINS?: string;
}
interface Dependencies {
  env: SupportEnvironment;
  fetch: typeof fetch;
  bodyReadTimeoutMs?: number;
}
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const uuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const mailbox = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 254 &&
  /^[^\s<>@\x00-\x1f\x7f]+@[^\s<>@\x00-\x1f\x7f]+\.[^\s<>@\x00-\x1f\x7f]+$/.test(value);
const VERSION = '2026102201';
const BODY_LIMIT = 20_000;

export function createSupportHandler({ env, fetch: fetcher, bodyReadTimeoutMs = 5000 }: Dependencies) {
  const origins = new Set(['http://127.0.0.1:4200', 'http://localhost:4200']);
  for (const candidate of (env.SUPPORT_ALLOWED_ORIGINS ?? '').split(',')) {
    try {
      const url = new URL(candidate.trim());
      if (url.protocol === 'https:' && url.origin === candidate.trim()) origins.add(url.origin);
    } catch {
      /* Invalid configuration never broadens CORS. */
    }
  }
  let base = '';
  try {
    const url = new URL(env.SUPABASE_URL ?? '');
    if (url.protocol === 'https:' && url.origin === url.href.replace(/\/$/, '')) base = url.origin;
  } catch {
    /* Fail closed. */
  }
  const configured = () =>
    !!base &&
    !!env.SUPABASE_ANON_KEY &&
    !!env.SUPABASE_SERVICE_ROLE_KEY &&
    !!env.RESEND_API_KEY &&
    mailbox(env.SUPPORT_FROM) &&
    mailbox(env.SUPPORT_TO);

  async function rpc(name: string, args: ObjectValue, token: string): Promise<unknown> {
    const result = await fetcher(base + '/rest/v1/rpc/' + name, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(7000),
      headers: {
        apikey: env.SUPABASE_ANON_KEY ?? '',
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    if (!result.ok) throw Error('support_database_unavailable');
    return result.json();
  }
  const serverRpc = (name: string, args: ObjectValue) => rpc(name, args, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
  async function body(request: Request): Promise<unknown> {
    const length = request.headers.get('Content-Length');
    if (length && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) throw Error('body_too_large');
    const reader = request.body?.getReader();
    if (!reader) throw Error('invalid_body');
    const chunks: Uint8Array[] = [];
    let total = 0;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(Error('body_timeout'));
        void reader.cancel().catch(() => undefined);
      }, bodyReadTimeoutMs);
    });
    try {
      while (true) {
        const part = await Promise.race([reader.read(), deadline]);
        if (part.done) break;
        total += part.value.byteLength;
        if (total > BODY_LIMIT) {
          await reader.cancel();
          throw Error('body_too_large');
        }
        chunks.push(part.value);
      }
    } finally {
      clearTimeout(timer!);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Max-Age': '600',
      });
    const response = (status: number, data: ObjectValue, extra: Record<string, string> = {}) =>
      new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
    if (origin && !origins.has(origin)) return response(403, { code: 'forbidden_origin' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method))
      return response(405, { code: 'method_not_allowed' }, { Allow: 'GET, POST, OPTIONS' });
    if (!base || !env.SUPABASE_ANON_KEY) return response(503, { code: 'unavailable' });
    const authorization = request.headers.get('Authorization') ?? '';
    if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192)
      return response(401, { code: 'unauthorized' });
    const token = authorization.slice(7);
    let actor: string, email: string, username: string;
    try {
      const authResult = await fetcher(base + '/auth/v1/user', {
        redirect: 'error',
        signal: AbortSignal.timeout(7000),
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization },
      });
      if (!authResult.ok) return response(401, { code: 'unauthorized' });
      const user: unknown = await authResult.json();
      if (
        !object(user) ||
        !uuid(user.id) ||
        !mailbox(user.email) ||
        user.is_anonymous === true ||
        typeof user.email_confirmed_at !== 'string' ||
        !user.email_confirmed_at
      )
        return response(403, { code: 'confirmed_account_required' });
      actor = user.id;
      email = user.email;
      const profileResult = await fetcher(base + '/rest/v1/profiles?select=username&user_id=eq.' + actor, {
        redirect: 'error',
        signal: AbortSignal.timeout(7000),
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization },
      });
      if (!profileResult.ok) return response(503, { code: 'identity_unavailable' });
      const profiles: unknown = await profileResult.json();
      if (
        !Array.isArray(profiles) ||
        profiles.length !== 1 ||
        !object(profiles[0]) ||
        typeof profiles[0].username !== 'string' ||
        !profiles[0].username.trim() ||
        profiles[0].username.length > 80 ||
        /[\x00-\x1f\x7f]/.test(profiles[0].username)
      )
        return response(503, { code: 'identity_unavailable' });
      username = profiles[0].username;
    } catch {
      return response(503, { code: 'identity_unavailable' });
    }
    const url = new URL(request.url);
    if (
      [...url.searchParams.keys()].some((key) => key !== 'request_id') ||
      url.searchParams.getAll('request_id').length > 1
    )
      return response(400, { code: 'invalid_request' });
    let ready = false;
    try {
      ready = configured() && (await rpc('kx_support_contract_version', {}, token)) === VERSION;
    } catch {
      /* No sends until the DB guard is installed. */
    }
    if (request.method === 'GET') {
      const id = url.searchParams.get('request_id');
      if (id !== null) {
        if (!uuid(id)) return response(400, { code: 'invalid_request' });
        if (!ready) return response(503, { code: 'unavailable' });
        try {
          const state = await serverRpc('kx_support_status', { p_actor: actor, p_request: id });
          if (
            !object(state) ||
            typeof state.status !== 'string' ||
            !['sent', 'pending', 'retryable', 'rejected', 'unknown', 'expired'].includes(state.status)
          )
            throw Error('invalid_status');
          return response(200, {
            status: state.status,
            retry_after: typeof state.retry_after === 'number' ? state.retry_after : 0,
            request_id: id,
          });
        } catch {
          return response(503, { code: 'status_unavailable' });
        }
      }
      return response(200, { identity: { email, username }, ready });
    }
    if (url.search) return response(400, { code: 'invalid_request' });
    if (!ready) return response(503, { code: 'unavailable' });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? ''))
      return response(415, { code: 'invalid_content_type' });
    let payload: unknown;
    try {
      payload = await body(request);
    } catch (error) {
      return response(error instanceof Error && error.message === 'body_too_large' ? 413 : 400, {
        code: 'invalid_request',
      });
    }
    if (
      !object(payload) ||
      Object.keys(payload).length !== 2 ||
      !uuid(payload.request_id) ||
      typeof payload.description !== 'string'
    )
      return response(400, { code: 'invalid_request' });
    if (!Object.keys(payload).every((key) => key === 'request_id' || key === 'description'))
      return response(400, { code: 'invalid_request' });
    const id = payload.request_id,
      description = payload.description.replace(/\r\n?/g, '\n').trim();
    if (!description || description.length > 4000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(description))
      return response(400, { code: 'invalid_description' });
    const mail = {
      from: 'KampüsX <' + env.SUPPORT_FROM + '>',
      to: [env.SUPPORT_TO],
      reply_to: email,
      subject: 'KampüsX destek / ' + id,
      text:
        'KampüsX destek başvurusu\nBaşvuru: ' +
        id +
        '\nKullanıcı adı: @' +
        username +
        '\nE-posta: ' +
        email +
        '\n\nAçıklama:\n' +
        description,
    };
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(mail)));
    const fingerprint = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
    const args = { p_actor: actor, p_request: id, p_fingerprint: fingerprint };
    let reservation: unknown;
    try {
      reservation = await serverRpc('kx_support_reserve', args);
    } catch {
      return response(202, { status: 'pending', request_id: id });
    }
    if (!object(reservation)) return response(202, { status: 'pending', request_id: id });
    switch (reservation.decision) {
      case 'sent':
        return response(200, { status: 'sent', request_id: id });
      case 'busy':
        return response(202, { status: 'pending', request_id: id });
      case 'rate_limited':
        return response(
          429,
          { code: 'rate_limited', retry_after: reservation.retry_after },
          { 'Retry-After': String(reservation.retry_after ?? 60) },
        );
      case 'conflict':
        return response(409, { code: 'request_conflict' });
      case 'expired':
      case 'locked':
        return response(409, { code: 'request_expired' });
      case 'rejected':
        return response(422, { code: 'delivery_rejected' });
      case 'reserved':
        break;
      default:
        return response(202, { status: 'pending', request_id: id });
    }
    const finish = async (outcome: 'sent' | 'uncertain' | 'rejected') => {
      try {
        return (await serverRpc('kx_support_finish', { ...args, p_outcome: outcome })) === true;
      } catch {
        return false;
      }
    };
    try {
      const result = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: 'Bearer ' + env.RESEND_API_KEY,
          'Content-Type': 'application/json',
          'Idempotency-Key': 'kampusx-support/' + actor + '/' + id,
        },
        body: JSON.stringify(mail),
      });
      if (result.ok) {
        const receipt: unknown = await result.json();
        if (
          object(receipt) &&
          typeof receipt.id === 'string' &&
          receipt.id.length > 0 &&
          (await finish('sent'))
        )
          return response(200, { status: 'sent', request_id: id });
        await finish('uncertain');
        return response(202, { status: 'pending', request_id: id });
      }
      if ([400, 401, 403, 404, 422].includes(result.status)) {
        await finish('rejected');
        return response(422, { code: 'delivery_rejected' });
      }
      await finish('uncertain');
      return response(202, { status: 'pending', request_id: id });
    } catch {
      await finish('uncertain');
      return response(202, { status: 'pending', request_id: id });
    }
  };
}
