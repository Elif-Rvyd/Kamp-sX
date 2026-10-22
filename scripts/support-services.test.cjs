const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const ID = '77777777-7777-4777-8777-777777777777';
function harness() {
  class AuthService {}
  const auth = {
      token: 'first-test-token',
      session() {
        return this.token ? { access_token: this.token } : null;
      },
    },
    calls = [],
    results = [];
  const modules = {
    '@angular/core': { Injectable: () => (target) => target, inject: () => auth },
    './auth.service': { AuthService },
    '../../environments/environment': {
      environment: {
        supabaseUrl: 'https://test-project.supabase.co',
        supabasePublishableKey: 'public-test-key',
      },
    },
  };
  const compiled = ts.transpileModule(
    fs.readFileSync('apps/shell/src/app/core/support-api.service.ts', 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'fetch', compiled)(
    (name) => {
      assert.ok(name in modules);
      return modules[name];
    },
    exports,
    async (url, options) => {
      calls.push({ url, ...options });
      const result = results.shift() ?? { status: 200, data: { status: 'sent', request_id: ID } };
      if (result instanceof Error) throw result;
      return {
        ok: result.status >= 200 && result.status < 300,
        status: result.status,
        json: async () => result.data,
      };
    },
  );
  return { api: new exports.SupportApiService(), auth, calls, results };
}
test('support transport snapshots the initiating token and sends only a request ID and description', async () => {
  const h = harness();
  const pending = h.api.send(ID, '  Problem\r\nDetails  ', new AbortController().signal);
  h.auth.token = 'second-test-token';
  await pending;
  assert.equal(h.calls[0].headers.Authorization, 'Bearer first-test-token');
  assert.equal(h.calls[0].credentials, 'omit');
  assert.equal(h.calls[0].redirect, 'error');
  assert.deepEqual(JSON.parse(h.calls[0].body), { request_id: ID, description: 'Problem\nDetails' });
  assert.ok(!h.calls[0].headers.Authorization.includes('server-only'));
});
test('invalid support payloads and a missing session cannot reach the network', async () => {
  const h = harness(),
    signal = new AbortController().signal;
  for (const [id, description] of [
    ['invalid', 'Problem'],
    [ID, ' \n '],
    [ID, 'x'.repeat(4001)],
  ])
    await assert.rejects(h.api.send(id, description, signal));
  h.auth.token = '';
  await assert.rejects(h.api.send(ID, 'Problem', signal), (e) => e.key === 'support.errors.session');
  assert.equal(h.calls.length, 0);
});
test('support read readiness never becomes a fabricated send success and status is a read-only call', async () => {
  const h = harness(),
    signal = new AbortController().signal;
  h.results.push({
    status: 200,
    data: { identity: { email: 'student@uni.edu.tr', username: 'student' }, ready: false },
  });
  assert.equal((await h.api.identity(signal)).ready, false);
  h.results.push({ status: 200, data: { status: 'sent', request_id: ID } });
  assert.equal(await h.api.status(ID, signal), 'sent');
  assert.ok(h.calls.every((call) => call.method === 'GET' && !call.body));
  assert.ok(h.calls[1].url.endsWith('?request_id=' + ID));
});
test('ambiguous delivery, wrong receipts, rate limits and definite setup rejection remain distinct', async () => {
  const h = harness(),
    signal = new AbortController().signal;
  for (const [result, key, uncertain] of [
    [new Error('Lost reply'), 'support.errors.uncertain', true],
    [{ status: 200, data: { status: 'sent', request_id: 'different' } }, 'support.errors.uncertain', true],
    [{ status: 429, data: { code: 'rate_limited' } }, 'support.errors.rateLimit', false],
    [{ status: 503, data: { code: 'unavailable' } }, 'support.errors.unavailable', false],
    [{ status: 409, data: { code: 'request_conflict' } }, 'support.errors.uncertain', true],
  ]) {
    h.results.push(result);
    await assert.rejects(
      h.api.send(ID, 'Problem', signal),
      (e) => e.key === key && e.uncertain === uncertain,
    );
  }
});
