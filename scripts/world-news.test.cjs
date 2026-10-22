const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('supabase/functions/world-news/handler.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const server = {};
new Function('require', 'exports', compiled)((name) => {
  assert.equal(name, 'npm:fast-xml-parser@5.11.2');
  return require('fast-xml-parser');
}, server);
const NOW = Date.parse('2026-10-22T12:00:00Z');
const item = (
  id = 'A',
  title = 'World headline',
  link = `https://www.euronews.com/2026/10/22/${id}`,
  date = new Date(NOW - 60000).toUTCString(),
) =>
  `<item><title><![CDATA[${title} - Euronews]]></title><link>${link}</link><source url="https://publisher.example">Publisher</source><pubDate>${date}</pubDate></item>`;
const xml = (items = item()) =>
  `<?xml version="1.0"?><rss version="2.0"><channel><title>World</title>${items}</channel></rss>`;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
function harness(env = {}) {
  const state = {
    clock: NOW,
    calls: [],
    feedCalls: 0,
    fail: false,
    authUser: { id: '11111111-1111-4111-8111-111111111111', is_anonymous: false },
    feedStatus: 200,
    feed: xml(),
    pause: null,
    resolve: null,
  };
  const handler = server.createNewsHandler({
    env: { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'public-test-key', ...env },
    now: () => state.clock,
    fetch: async (url, options) => {
      state.calls.push({ url, options });
      if (url.endsWith('/auth/v1/user'))
        return options.headers.Authorization === 'Bearer valid-session'
          ? json(state.authUser)
          : json({}, 401);
      assert.ok(/^https:\/\/(tr|www)[.]euronews[.]com\/rss[?]/.test(url));
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(options.headers.apikey, undefined);
      state.feedCalls++;
      if (state.pause) await state.pause;
      if (state.fail) throw Error('PRIVATE_UPSTREAM_DETAILS');
      return new Response(state.feed, {
        status: state.feedStatus,
        headers: { 'Content-Type': 'application/rss+xml' },
      });
    },
  });
  const request = (lang = 'tr', overrides = {}) =>
    handler(
      new Request(`https://test.supabase.co/functions/v1/world-news?lang=${lang}`, {
        headers: { Origin: 'https://kampusx.vercel.app', Authorization: 'Bearer valid-session' },
        ...overrides,
      }),
    );
  return { state, request };
}
test('news parser decodes XML safely, strips publisher suffix and deduplicates real article URLs', () => {
  const result = server.parseHeadlines(
    xml(item('A', 'Science &amp; world') + item('A') + item('B'))
      .replaceAll('<![CDATA[', '')
      .replaceAll(']]>', ''),
    NOW,
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].source, 'Euronews');
  assert.equal(result[0].title, 'Science & world');
  assert.equal(result[0].publishedAt, new Date(NOW - 60000).toISOString());
});
test('news parser refuses entities, malformed XML, oversized input, off-site links and out-of-date timestamps', () => {
  for (const value of [
    '<!DOCTYPE x [<!ENTITY leak SYSTEM "file:///private">]>' + xml(),
    '<rss><channel>',
    'x'.repeat(1000001),
  ])
    assert.throws(() => server.parseHeadlines(value, NOW));
  const bad = [
    'javascript:alert(1)',
    'https://www.euronews.com.evil.example/2026/10/22/A',
    'https://user:pass@www.euronews.com/2026/10/22/A',
    'https://www.euronews.com:444/2026/10/22/A',
    'https://www.euronews.com/search?q=a',
  ];
  for (const link of bad) assert.equal(server.parseHeadlines(xml(item('A', 'Title', link)), NOW).length, 0);
  for (const date of [
    'invalid',
    new Date(NOW + 7200000).toUTCString(),
    new Date(NOW - 8 * 86400000).toUTCString(),
  ])
    assert.equal(server.parseHeadlines(xml(item('A', 'Title', undefined, date)), NOW).length, 0);
  assert.equal(
    server.parseHeadlines(xml(Array.from({ length: 15 }, (_, i) => item('A' + i)).join('')), NOW).length,
    8,
  );
});
test('production and local CORS are exact; anonymous callers and arbitrary upstream queries cannot fetch feeds', async () => {
  const h = harness();
  assert.equal((await h.request('tr', { method: 'OPTIONS' })).status, 204);
  for (const origin of ['https://kampusx.vercel.app.evil.example', 'https://unknown.example'])
    assert.equal(
      (await h.request('tr', { headers: { Origin: origin, Authorization: 'Bearer valid-session' } })).status,
      403,
    );
  assert.equal((await h.request('tr', { headers: { Origin: 'https://kampusx.vercel.app' } })).status, 401);
  assert.equal((await h.request('tr', { headers: { Authorization: 'Bearer forged' } })).status, 401);
  assert.equal((await h.request('tr&url=https://private.example')).status, 400);
  assert.equal((await h.request('tr&lang=en')).status, 400);
  assert.equal((await h.request('xx')).status, 400);
  assert.equal((await h.request('tr', { method: 'POST' })).status, 405);
  assert.equal(h.state.feedCalls, 0);
});
test('news cache is locale-specific, bounded and authenticated on every read; credentials never leave Supabase', async () => {
  const h = harness();
  assert.equal((await h.request()).status, 200);
  assert.equal((await h.request()).status, 200);
  assert.equal(h.state.feedCalls, 1);
  const english = await (await h.request('en')).json();
  assert.equal(english.locale, 'en');
  assert.equal(h.state.feedCalls, 2);
  const unauthorized = await h.request('tr', { headers: { Authorization: 'Bearer forged' } });
  assert.equal(unauthorized.status, 401);
  assert.equal(h.state.feedCalls, 2);
  h.state.clock += 300001;
  assert.equal((await h.request()).status, 200);
  assert.equal(h.state.feedCalls, 3);
});
test('upstream failure labels bounded stale content and never fabricates headlines or leaks raw errors', async () => {
  const h = harness();
  await h.request();
  h.state.clock += 300001;
  h.state.fail = true;
  const stale = await (await h.request()).json();
  assert.equal(stale.stale, true);
  assert.equal(stale.updatedAt, new Date(NOW).toISOString());
  h.state.clock += 3600000;
  const unavailable = await h.request();
  assert.equal(unavailable.status, 503);
  const failure = await unavailable.json();
  assert.equal(failure.code, 'news_unavailable');
  assert.ok(!JSON.stringify(failure).includes('PRIVATE_UPSTREAM_DETAILS'));
  const cold = harness();
  cold.state.fail = true;
  assert.equal((await cold.request()).status, 503);
  assert.equal((await cold.request()).status, 503);
  assert.equal(cold.state.feedCalls, 1);
});
test('concurrent feed reads share one in-flight upstream request', async () => {
  const h = harness();
  h.state.pause = new Promise((resolve) => (h.state.resolve = resolve));
  const pending = [h.request(), h.request(), h.request()];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.state.feedCalls, 1);
  h.state.resolve();
  assert.ok((await Promise.all(pending)).every((result) => result.status === 200));
});

function clientHarness() {
  const state = {
    token: 'first-session',
    status: 200,
    networkFailure: false,
    calls: [],
    data: { items: [], updatedAt: new Date(NOW).toISOString(), locale: 'tr', stale: false },
  };
  const source = ts.transpileModule(
    fs.readFileSync('apps/shell/src/app/core/world-news-api.service.ts', 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  const exports = {};
  const modules = {
    '@angular/core': {
      Injectable: () => (target) => target,
      inject: () => ({ session: () => (state.token ? { access_token: state.token } : null) }),
    },
    './auth.service': {},
    '../../environments/environment': {
      environment: { supabaseUrl: 'https://test.supabase.co', supabasePublishableKey: 'public-test-key' },
    },
  };
  new Function('require', 'exports', 'fetch', source)(
    (name) => modules[name],
    exports,
    async (url, options) => {
      state.calls.push({ url, options });
      if (state.networkFailure) throw Error('PRIVATE_NETWORK_DETAILS');
      return json(state.data, state.status);
    },
  );
  return { state, api: new exports.WorldNewsApiService(), newsLink: exports.newsLink };
}
test('news client captures the initiating session, sends no server key and rejects malformed or mismatched feeds', async () => {
  const h = clientHarness(),
    signal = new AbortController().signal;
  const pending = h.api.load('tr', signal);
  h.state.token = 'replacement-session';
  await pending;
  assert.equal(h.state.calls[0].options.headers.Authorization, 'Bearer first-session');
  assert.equal(h.state.calls[0].options.credentials, 'omit');
  h.state.data.locale = 'en';
  await assert.rejects(h.api.load('tr', signal));
  h.state.token = '';
  await assert.rejects(h.api.load('tr', signal));
  assert.equal(h.newsLink('javascript:alert(1)'), false);
  assert.equal(h.newsLink('https://www.euronews.com.evil.example/2026/10/22/A'), false);
});

test('an empty named-key dictionary retains a valid legacy public key; malformed dictionaries fail closed', async () => {
  const legacy = harness({ SUPABASE_PUBLISHABLE_KEYS: '{}' });
  assert.equal((await legacy.request()).status, 200);
  assert.equal(legacy.state.feedCalls, 1);
  for (const raw of ['{bad', JSON.stringify({ default: 'wrong-kind' })]) {
    const broken = harness({ SUPABASE_PUBLISHABLE_KEYS: raw });
    assert.equal((await broken.request()).status, 503);
    assert.equal(broken.state.feedCalls, 0);
  }
});

test('news diagnostics expose fixed failure categories and HTTP statuses without raw upstream details', async () => {
  const h = clientHarness(),
    signal = new AbortController().signal;
  h.state.status = 503;
  h.state.data = { reason: 'source_http', upstream_status: 302, private: 'PRIVATE_DETAILS' };
  await assert.rejects(h.api.load('tr', signal), {
    message: 'news_unavailable',
    diagnostic: 'http_503_source_http_302',
  });
  h.state.data = { reason: 'PRIVATE_DETAILS', upstream_status: 'PRIVATE_DETAILS' };
  await assert.rejects(h.api.load('tr', signal), {
    message: 'news_unavailable',
    diagnostic: 'http_503_unavailable',
  });
  h.state.networkFailure = true;
  await assert.rejects(h.api.load('tr', signal), {
    message: 'news_unavailable',
    diagnostic: 'network_or_timeout',
  });
});

test('source HTTP diagnostics retain the original failure during the retry cooldown', async () => {
  const h = harness();
  h.state.feedStatus = 302;
  for (let i = 0; i < 2; i++) {
    const response = await h.request();
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      code: 'news_unavailable',
      reason: 'source_http',
      upstream_status: 302,
    });
  }
  assert.equal(h.state.feedCalls, 1);
});

test('news XML depth and real stream bytes are bounded even without a Content-Length header', async () => {
  assert.throws(() =>
    server.parseHeadlines(xml('<item>' + '<a>'.repeat(40) + 'x' + '</a>'.repeat(40) + '</item>'), NOW),
  );
  const h = harness();
  let canceled = false;
  h.state.feed = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1_000_001));
    },
    cancel() {
      canceled = true;
    },
  });
  const response = await h.request();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).reason, 'source_parse');
  assert.equal(canceled, true);
});

test('cached news never bypasses current Auth checks for anonymous or malformed account identities', async () => {
  const h = harness();
  assert.equal((await h.request()).status, 200);
  h.state.authUser.is_anonymous = true;
  assert.equal((await h.request()).status, 401);
  h.state.authUser = { id: '-'.repeat(36), is_anonymous: false };
  assert.equal((await h.request()).status, 401);
  assert.equal(h.state.feedCalls, 1);
});
