const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222';
const ID = '77777777-7777-4777-8777-777777777777';
const source = ts.transpileModule(fs.readFileSync('supabase/functions/support-email/handler.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsValue = {};
new Function('exports', source)(exportsValue);
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
function harness(overrides = {}) {
  const env = {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'public-test-key',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key',
    RESEND_API_KEY: 'resend-only-test-key',
    SUPPORT_FROM: 'support@example.test',
    SUPPORT_TO: 'operator@example.test',
    SUPPORT_ALLOWED_ORIGINS: 'https://app.example.test',
    ...overrides,
  };
  const state = {
    user: { id: A, email: 'student@university.edu.tr', email_confirmed_at: '2026-01-01T00:00:00Z' },
    username: 'student',
    version: '2026102201',
    reservation: { decision: 'reserved' },
    status: { status: 'sent' },
    calls: [],
    mail: [],
    failMail: false,
    failFinish: false,
    mailStatus: 200,
    pauseMail: false,
    finishMail: undefined,
    serverStatus: 200,
  };
  const handler = exportsValue.createSupportHandler({
    env,
    bodyReadTimeoutMs: 30,
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers),
        body = options.body ? JSON.parse(options.body) : undefined;
      state.calls.push({ url, headers, body });
      if (url.endsWith('/auth/v1/user'))
        return headers.get('Authorization') === 'Bearer valid-test-session'
          ? json(state.user)
          : json({ msg: 'Invalid JWT' }, 401);
      if (url.includes('/rest/v1/profiles?')) {
        assert.ok(url.endsWith('user_id=eq.' + A));
        assert.equal(headers.get('Authorization'), 'Bearer valid-test-session');
        return json([{ username: state.username }]);
      }
      if (url.endsWith('/kx_support_contract_version')) {
        assert.equal(headers.get('Authorization'), 'Bearer valid-test-session');
        return json(state.version);
      }
      if (url.includes('/rest/v1/rpc/kx_support_')) {
        const serverKey = env.SUPABASE_SECRET_KEYS
          ? JSON.parse(env.SUPABASE_SECRET_KEYS).default
          : env.SUPABASE_SERVICE_ROLE_KEY;
        assert.equal(headers.get('apikey'), serverKey);
        assert.equal(
          headers.get('Authorization'),
          serverKey.startsWith('sb_secret_') ? null : 'Bearer ' + serverKey,
        );
        assert.equal(body.p_actor, A);
        if (state.serverStatus !== 200)
          return json({ code: '42501', message: 'PRIVATE_DATABASE_DETAILS' }, state.serverStatus);
        if (url.endsWith('/kx_support_reserve')) return json(state.reservation);
        if (url.endsWith('/kx_support_finish')) {
          if (state.failFinish) throw Error('Server private details');
          return json(true);
        }
        if (url.endsWith('/kx_support_status')) return json(state.status);
      }
      if (url === 'https://api.resend.com/emails') {
        state.mail.push({ headers, body });
        assert.equal(headers.get('Authorization'), 'Bearer ' + env.RESEND_API_KEY);
        if (state.pauseMail)
          await new Promise((resolve) => {
            state.finishMail = resolve;
          });
        if (state.failMail) throw Error('PRIVATE_PROVIDER_SECRET=' + env.RESEND_API_KEY);
        return state.mailStatus === 200
          ? json({ id: 'provider-receipt' })
          : json({ error: 'PRIVATE_PROVIDER_SECRET=' + env.RESEND_API_KEY }, state.mailStatus);
      }
      throw Error('Unexpected external call: ' + url);
    },
  });
  const request = (payload = { request_id: ID, description: 'A real support description' }, options = {}) =>
    handler(
      new Request('https://test-project.supabase.co/functions/v1/support-email' + (options.query ?? ''), {
        method: options.method ?? 'POST',
        headers: {
          Origin: 'https://app.example.test',
          Authorization: 'Bearer valid-test-session',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...(options.method === 'GET' || options.method === 'OPTIONS' || options.method === 'DELETE'
          ? {}
          : { body: typeof payload === 'string' ? payload : JSON.stringify(payload) }),
      }),
    );
  return { env, state, handler, request };
}
test('support mail uses verified server identity, fixed recipient and plain text; provider secret never returns to the browser', async () => {
  const h = harness();
  const response = await h.request({ request_id: ID, description: '<script>alert(1)</script>\nReal issue' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'sent', request_id: ID });
  const mail = h.state.mail[0];
  assert.deepEqual(mail.body.to, ['operator@example.test']);
  assert.equal(mail.body.reply_to, 'student@university.edu.tr');
  assert.equal(mail.body.from, 'KampüsX <support@example.test>');
  assert.equal(mail.body.html, undefined);
  assert.match(mail.body.text, /@student/);
  assert.match(mail.body.text, /student@university.edu.tr/);
  assert.match(mail.body.text, /<script>alert\(1\)<\/script>/);
  assert.equal(mail.headers.get('Idempotency-Key'), 'kampusx-support/' + A + '/' + ID);
  const reserve = h.state.calls.find((call) => call.url.endsWith('/kx_support_reserve'));
  assert.match(reserve.body.p_fingerprint, /^[a-f0-9]{64}$/);
  assert.ok(!('description' in reserve.body));
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('missing and forged sessions never reserve or send; unconfirmed and anonymous users are denied', async () => {
  for (const headers of [{ Authorization: '' }, { Authorization: 'Bearer forged-test-session' }]) {
    const h = harness();
    assert.equal((await h.request(undefined, { headers })).status, 401);
    assert.equal(h.state.mail.length, 0);
  }
  for (const value of [{ email_confirmed_at: null }, { is_anonymous: true }]) {
    const h = harness();
    Object.assign(h.state.user, value);
    assert.equal((await h.request()).status, 403);
    assert.equal(h.state.mail.length, 0);
  }
});
test('caller-supplied identity, sender, recipient and extra JSON keys are rejected before dispatch', async () => {
  for (const extra of [
    { user_id: B },
    { email: 'victim@example.test' },
    { username: 'admin' },
    { to: 'victim@example.test' },
    { reply_to: 'victim@example.test' },
    { from: 'admin@example.test' },
  ]) {
    const h = harness();
    assert.equal((await h.request({ request_id: ID, description: 'Problem', ...extra })).status, 400);
    assert.equal(h.state.mail.length, 0);
  }
});
test('header injection in server profile or configured sender cannot become a mail header', async () => {
  const h = harness();
  h.state.username = 'student\r\nBcc: other@example.test';
  assert.equal((await h.request()).status, 503);
  assert.equal(h.state.mail.length, 0);
  const invalid = harness({ SUPPORT_FROM: 'support@example.test\r\nBcc: other@example.test' });
  assert.equal((await invalid.request()).status, 503);
  assert.equal(invalid.state.mail.length, 0);
});
test('CORS allows only exact configured origins and unsupported methods fail without external side effects', async () => {
  const h = harness();
  assert.equal(
    (await h.request(undefined, { headers: { Origin: 'https://app.example.test.attacker.example' } })).status,
    403,
  );
  assert.equal(h.state.calls.length, 0);
  const options = await h.request(undefined, { method: 'OPTIONS' });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'https://app.example.test');
  assert.equal(options.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal((await h.request(undefined, { method: 'DELETE' })).status, 405);
});
test('invalid JSON, blank or excessive descriptions and oversized streaming bodies do not reach Resend', async () => {
  for (const payload of [
    '{bad json}',
    { request_id: ID, description: ' \n ' },
    { request_id: ID, description: 'x'.repeat(4001) },
    { request_id: 'invalid', description: 'Problem' },
  ]) {
    const h = harness();
    assert.equal((await h.request(payload)).status, 400);
    assert.equal(h.state.mail.length, 0);
  }
  const h = harness();
  const result = await h.request('x'.repeat(20001));
  assert.equal(result.status, 413);
  assert.equal(h.state.mail.length, 0);
  const type = harness();
  assert.equal((await type.request(undefined, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
});
test('slow request streams are canceled on a bounded deadline without a reservation or email', async () => {
  const h = harness();
  let canceled = false;
  const stream = new ReadableStream({
    cancel() {
      canceled = true;
    },
  });
  const result = await h.handler(
    new Request('https://test-project.supabase.co/functions/v1/support-email', {
      method: 'POST',
      headers: {
        Origin: 'https://app.example.test',
        Authorization: 'Bearer valid-test-session',
        'Content-Type': 'application/json',
      },
      body: stream,
      duplex: 'half',
    }),
  );
  assert.equal(result.status, 400);
  assert.equal(canceled, true);
  assert.equal(h.state.mail.length, 0);
  assert.ok(!h.state.calls.some((call) => call.url.endsWith('/kx_support_reserve')));
});
test('missing configuration or missing DB guard disables send while verified identity remains available', async () => {
  for (const override of [{ RESEND_API_KEY: '' }, { SUPPORT_TO: '' }, { SUPPORT_FROM: '' }]) {
    const h = harness(override);
    const health = await h.request(undefined, { method: 'GET' });
    const data = await health.json();
    assert.equal(data.ready, false);
    assert.equal(data.identity.username, 'student');
    assert.equal((await h.request()).status, 503);
    assert.equal(h.state.mail.length, 0);
  }
  const h = harness();
  h.state.version = 'old-version';
  assert.equal((await h.request()).status, 503);
  assert.equal(h.state.mail.length, 0);
});
test('durable rate limiting and duplicate decisions cannot trigger a provider request', async () => {
  for (const [decision, expected] of [
    ['rate_limited', 429],
    ['sent', 200],
    ['busy', 202],
    ['conflict', 409],
    ['expired', 409],
    ['locked', 409],
  ]) {
    const h = harness();
    h.state.reservation = { decision, retry_after: 60 };
    const result = await h.request();
    assert.equal(result.status, expected);
    assert.equal(h.state.mail.length, 0);
  }
});
test('provider failure or a lost bookkeeping receipt remains uncertain and never leaks raw error details', async () => {
  for (const value of [{ failMail: true }, { failFinish: true }, { mailStatus: 500 }]) {
    const h = harness();
    Object.assign(h.state, value);
    const result = await h.request();
    assert.equal(result.status, 202);
    const data = await result.text();
    assert.ok(!data.includes('test-key'));
    assert.ok(!data.includes('PRIVATE'));
    assert.match(data, /pending/);
  }
  const denied = harness();
  denied.state.mailStatus = 403;
  const result = await denied.request();
  assert.equal(result.status, 422);
  assert.deepEqual(await result.json(), { code: 'delivery_rejected' });
});
test('status checks bind the actor to verified Auth and never resend or accept an actor query parameter', async () => {
  const h = harness();
  h.state.status = { status: 'unknown' };
  const result = await h.request(undefined, { method: 'GET', query: '?request_id=' + ID });
  assert.equal((await result.json()).status, 'unknown');
  assert.equal(h.state.mail.length, 0);
  const call = h.state.calls.find(
    (call) => call.url.endsWith('/kx_support_status') && call.body.p_request === ID,
  );
  assert.ok(call);
  assert.equal(call.body.p_actor, A);
  assert.equal(
    (await h.request(undefined, { method: 'GET', query: '?request_id=' + ID + '&actor=' + B })).status,
    400,
  );
});

test('modern server keys stay in apikey and never replace the caller JWT or become an Authorization JWT', async () => {
  const h = harness({
    SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_TEST' }),
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_TEST' }),
  });
  assert.equal((await h.request()).status, 200);
  assert.equal(h.state.mail.length, 1);
  const userCalls = h.state.calls.filter(
    (call) =>
      call.url.endsWith('/auth/v1/user') ||
      call.url.includes('/profiles?') ||
      call.url.endsWith('/kx_support_contract_version'),
  );
  for (const call of userCalls) {
    assert.equal(call.headers.get('Authorization'), 'Bearer valid-test-session');
    assert.equal(call.headers.get('apikey'), 'sb_publishable_TEST');
  }
});

test('a readable version marker with a rejected server credential never advertises readiness or sends mail', async () => {
  for (const status of [401, 403, 404, 500]) {
    const h = harness();
    h.state.serverStatus = status;
    const data = await (await h.request(undefined, { method: 'GET' })).json();
    assert.equal(data.ready, false);
    assert.equal(data.identity.username, 'student');
    assert.equal((await h.request()).status, 503);
    assert.equal(h.state.mail.length, 0);
    assert.ok(!h.state.calls.some((call) => call.url.endsWith('/kx_support_reserve')));
  }
});

test('malformed modern credentials fail closed without leaking keys or reverting to a legacy server identity', async () => {
  for (const value of ['{broken', JSON.stringify({ default: 'not-a-server-key' })]) {
    const h = harness({ SUPABASE_SECRET_KEYS: value });
    const health = await (await h.request(undefined, { method: 'GET' })).json();
    assert.equal(health.ready, false);
    assert.equal((await h.request()).status, 503);
    assert.equal(h.state.mail.length, 0);
  }
});
