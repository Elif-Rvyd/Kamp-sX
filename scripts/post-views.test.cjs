const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const POST = '11111111-1111-4111-8111-111111111111';
const tick = () => new Promise((resolve) => setImmediate(resolve));
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (fn) => (value = fn(value));
  return read;
}
function harness() {
  class AuthService {}
  class SupabaseService {}
  class DestroyRef {}
  const effects = [],
    timers = new Map(),
    calls = [],
    results = [],
    cleanups = [];
  let timerId = 0;
  const auth = {
    session: signal({ user: { id: 'first' }, access_token: 'first-test-token' }),
    sessionEpoch: signal(1),
  };
  const destroy = { destroyed: false, onDestroy: (fn) => cleanups.push(fn) };
  const client = {
    rpc(name, args) {
      const call = { name, args };
      const builder = {
        setHeader(_name, value) {
          call.authorization = value;
          return builder;
        },
        abortSignal(value) {
          call.signal = value;
          return builder;
        },
        then(resolve, reject) {
          calls.push(call);
          const response = results.shift() ?? {
            data: args.p_ids.map((post_id) => ({ post_id, views_count: 1 })),
            error: null,
          };
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      return builder;
    },
  };
  const deps = new Map([
    [AuthService, auth],
    [SupabaseService, { client }],
    [DestroyRef, destroy],
  ]);
  const modules = {
    '@angular/core': {
      Injectable: () => (t) => t,
      inject: (t) => deps.get(t),
      signal,
      effect: (fn) => effects.push(fn),
      DestroyRef,
    },
    './auth.service': { AuthService },
    './supabase.service': { SupabaseService },
    './messaging-api.service': { isMessageId: (value) => /^[0-9a-f-]{36}$/.test(value) },
  };
  const compiled = ts.transpileModule(
    fs.readFileSync('apps/shell/src/app/core/post-views.service.ts', 'utf8'),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', 'setTimeout', 'clearTimeout', compiled)(
    (name) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
    exports,
    (fn) => {
      timers.set(++timerId, fn);
      return timerId;
    },
    (id) => timers.delete(id),
  );
  const service = new exports.PostViewsService();
  const reset = () => effects.forEach((fn) => fn());
  reset();
  return {
    service,
    auth,
    calls,
    results,
    reset,
    async runTimer() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'Expected a pending batch');
      timers.delete(entry[0]);
      entry[1]();
      await tick();
    },
    close() {
      destroy.destroyed = true;
      cleanups.forEach((fn) => fn());
    },
  };
}

test('view replies cannot cross account replacement; pending requests are aborted and bound to the initiating token', async () => {
  const h = harness();
  try {
    let finish;
    h.results.push(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    h.service.viewed(POST);
    await h.runTimer();
    assert.equal(h.calls[0].authorization, 'Bearer first-test-token');
    h.auth.session.set({ user: { id: 'second' }, access_token: 'second-test-token' });
    h.auth.sessionEpoch.set(2);
    h.reset();
    assert.ok(h.calls[0].signal.aborted);
    finish({ data: [{ post_id: POST, views_count: 89 }], error: null });
    await tick();
    assert.deepEqual(h.service.totals(), {});
    h.service.viewed(POST);
    await h.runTimer();
    assert.equal(h.calls[1].authorization, 'Bearer second-test-token');
    assert.equal(h.service.totals()[POST], 1);
  } finally {
    h.close();
  }
});

test('unknown or failed view totals stay unknown; retries read and never fabricate a zero', async () => {
  const h = harness();
  try {
    h.results.push({ data: null, error: { code: 'PGRST202' } });
    h.service.load(POST);
    await h.runTimer();
    assert.equal(h.service.totals()[POST], undefined);
    assert.equal(h.service.failed(), true);
    h.results.push({ data: [], error: null });
    h.service.load(POST, true);
    await h.runTimer();
    assert.equal(h.service.totals()[POST], undefined);
    assert.ok(h.calls.every((call) => call.name === 'kx_get_post_views'));
  } finally {
    h.close();
  }
});

test('large feeds respect the server batch limit and repeated card renders do not repeat confirmed view writes', async () => {
  const h = harness();
  try {
    const ids = Array.from(
      { length: 127 },
      (_, i) => `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`,
    );
    ids.forEach((id) => h.service.viewed(id));
    await h.runTimer();
    await h.runTimer();
    await h.runTimer();
    assert.deepEqual(
      h.calls.map((call) => call.args.p_ids.length),
      [50, 50, 27],
    );
    ids.forEach((id) => h.service.viewed(id));
    await tick();
    assert.equal(h.calls.length, 3);
  } finally {
    h.close();
  }
});
