const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  CONV = '77777777-7777-4777-8777-777777777777';
const tick = () => new Promise((resolve) => setImmediate(resolve));
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (fn) => (value = fn(value));
  return read;
}
function load(file, modules) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true,
    },
  }).outputText;
  new Function('require', 'exports', compiled)((name) => {
    assert.ok(name in modules, 'Unexpected module ' + name);
    return modules[name];
  }, exports);
  return exports;
}
function transport() {
  class AuthService {}
  class SupabaseService {}
  const auth = { session: signal({ user: { id: A }, access_token: 'first-test-token' }) },
    calls = [],
    results = [];
  const builder = (q) => {
    const value = {};
    for (const method of ['select', 'eq', 'or', 'order', 'limit', 'in', 'insert', 'update'])
      value[method] = (...args) => {
        q.steps.push([method, ...args]);
        return value;
      };
    value.setHeader = (name, header) => {
      assert.equal(name, 'Authorization');
      q.boundActor = header === 'Bearer first-test-token' ? A : B;
      return value;
    };
    value.abortSignal = (signal) => {
      q.signal = signal;
      return value;
    };
    value.then = (resolve, reject) => {
      calls.push(q);
      const result = results.shift() ?? { data: [], error: null };
      return (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)).then(
        resolve,
        reject,
      );
    };
    return value;
  };
  const client = {
    from: (table) => builder({ table, steps: [] }),
    rpc: (name, args) => builder({ name, args, steps: [] }),
  };
  const deps = new Map([
    [AuthService, auth],
    [SupabaseService, { client }],
  ]);
  const exports = load('apps/shell/src/app/core/messaging-api.service.ts', {
    '@angular/core': { Injectable: () => (t) => t, inject: (t) => deps.get(t) },
    './auth.service': { AuthService },
    './supabase.service': { SupabaseService },
  });
  return { ...exports, api: new exports.MessagingApiService(), calls, results, auth };
}
test('message transport sends only the two granted columns; deletion never requests hidden rows', async () => {
  const h = transport(),
    s = new AbortController().signal;
  await h.api.send(CONV, 'Hello', s);
  assert.deepEqual(h.calls[0].steps, [['insert', { conversation_id: CONV, content: 'Hello' }]]);
  await h.api.remove(B, s);
  assert.equal(h.calls[1].steps[0][0], 'update');
  assert.deepEqual(Object.keys(h.calls[1].steps[0][1]), ['deleted_at']);
  assert.ok(!h.calls[1].steps.some(([op]) => op === 'select'));
});
test('eligibility is a readonly server decision and never starts a conversation', async () => {
  const h = transport();
  h.results.push({ data: false, error: null });
  assert.equal(await h.api.canMessage(B, new AbortController().signal), false);
  assert.deepEqual(
    h.calls.map((q) => q.name),
    ['kx_can_message'],
  );
  assert.deepEqual(h.calls[0].args, { other: B });
});

test('post sharing sends only conversation and source IDs through the server RPC', async () => {
  const h = transport(),
    signal = new AbortController().signal;
  h.results.push({ data: B, error: null });
  await h.api.sharePost(CONV, B, signal);
  assert.equal(h.calls[0].name, 'kx_share_post');
  assert.deepEqual(h.calls[0].args, { conv: CONV, target: B });
  assert.equal(h.calls[0].boundActor, A);
  await assert.rejects(h.api.sharePost(CONV, 'invalid', signal));
  assert.equal(h.calls.length, 1);
  h.results.push({ error: { code: '42501' } });
  await assert.rejects(
    h.api.sharePost(CONV, B, signal),
    (e) => e.key === 'messaging.shareUnavailable' && !e.uncertain,
  );
  h.results.push({ error: { message: 'Lost response' } });
  await assert.rejects(h.api.sharePost(CONV, B, signal), (e) => e.uncertain);
});
test('a queued write keeps the initiating account even when the current session changes', async () => {
  const h = transport();
  const pending = h.api.send(CONV, 'Hello', new AbortController().signal);
  h.auth.session.set({ user: { id: B }, access_token: 'second-test-token' });
  await pending;
  assert.equal(h.calls[0].boundActor, A);
});
test('message validation rejects invalid IDs, whitespace and more than 2000 code points before network', async () => {
  const h = transport(),
    s = new AbortController().signal;
  for (const [conv, text] of [
    ['invalid', 'Hello'],
    [CONV, ' \n\t'],
    [CONV, 'x'.repeat(2001)],
  ])
    await assert.rejects(h.api.send(conv, text, s));
  assert.equal(h.calls.length, 0);
});
test('RLS rejection, missing migration and ambiguous delivery remain distinct', async () => {
  const h = transport(),
    s = new AbortController().signal;
  for (const [error, key, uncertain] of [
    [{ code: '42501', message: 'dm_unavailable' }, 'messaging.errors.unavailable', false],
    [{ code: 'PGRST205' }, 'messaging.errors.setup', false],
    [{ code: '', message: 'Fetch failed' }, 'messaging.errors.uncertain', true],
  ]) {
    h.results.push({ error, data: null });
    await assert.rejects(h.api.send(CONV, 'Hello', s), (e) => e.key === key && e.uncertain === uncertain);
  }
});
test('paging preserves PostgreSQL microseconds and uses an ID tiebreaker', async () => {
  const h = transport();
  await h.api.page(CONV, new AbortController().signal, {
    id: B,
    created_at: '2026-10-22T11:00:00.123456+00:00',
  });
  const filter = h.calls[0].steps.find(([op]) => op === 'or')[1];
  assert.ok(filter.includes('.123456+00:00'));
  assert.ok(filter.includes('id.lt.' + B));
});
function storeHarness() {
  class AuthService {}
  class FollowsService {}
  class PostActionsService {}
  class MessagingApiService {}
  class DestroyRef {}
  const DOCUMENT = Symbol('document'),
    effects = [],
    cleanups = [],
    channels = [],
    removed = [];
  const destroy = { destroyed: false, onDestroy: (fn) => cleanups.push(fn) },
    auth = { session: signal({ user: { id: A }, access_token: 'test' }), sessionEpoch: signal(1) };
  const inboxRow = { conversation_id: CONV, peer_id: B, can_send: true, unread_count: 1 };
  const message = {
    id: B,
    conversation_id: CONV,
    sender_id: B,
    content: 'Hello',
    created_at: '2026-10-22T12:00:00Z',
    deleted_at: null,
  };
  let resolveInbox, resolveAuth;
  const state = { pauseInbox: false, pauseAuth: false, failSend: false, reads: 0, sends: 0 };
  const api = {
    client: {
      realtime: {
        setAuth: () => (state.pauseAuth ? new Promise((r) => (resolveAuth = r)) : Promise.resolve()),
      },
      channel: () => {
        const ch = {
          events: [],
          on(_kind, filter, fn) {
            this.events.push({ filter, fn });
            return this;
          },
          subscribe(fn) {
            this.status = fn;
            return this;
          },
        };
        channels.push(ch);
        return ch;
      },
      removeChannel: async (ch) => removed.push(ch),
    },
    inbox: () => (state.pauseInbox ? new Promise((r) => (resolveInbox = r)) : Promise.resolve([inboxRow])),
    page: async () => [message],
    refreshLoaded: async () => [],
    markRead: async () => state.reads++,
    send: async () => {
      state.sends++;
      if (state.failSend) throw new Error('network');
    },
    remove: async () => {},
  };
  const doc = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const deps = new Map([
    [DestroyRef, destroy],
    [AuthService, auth],
    [FollowsService, { privacyRevision: signal(0) }],
    [PostActionsService, { readRevision: signal(0) }],
    [MessagingApiService, api],
    [DOCUMENT, doc],
  ]);
  const { MessagingError } = transport();
  const { MessagesStore } = load('apps/shell/src/app/features/messages/messages.store.ts', {
    '@angular/common': { DOCUMENT },
    '@angular/core': {
      Injectable: () => (t) => t,
      DestroyRef,
      inject: (t) => deps.get(t),
      effect: (fn) => effects.push(fn),
      untracked: (fn) => fn(),
      signal,
    },
    '../../core/auth.service': { AuthService },
    '../../core/follows.service': { FollowsService },
    '../../core/post-actions.service': { PostActionsService },
    '../../core/messaging-api.service': {
      MessagingApiService,
      MessagingError,
      isMessageId: (v) => v === CONV,
    },
  });
  const store = new MessagesStore();
  return {
    store,
    auth,
    state,
    api,
    doc,
    effects,
    channels,
    removed,
    resolveInbox: () => resolveInbox([inboxRow]),
    resolveAuth: () => resolveAuth(),
    close: () => {
      destroy.destroyed = true;
      cleanups.forEach((fn) => fn());
    },
  };
}
test('late inbox responses after logout are rejected even before Angular runs its session effect', async () => {
  const h = storeHarness();
  h.state.pauseInbox = true;
  h.effects[0]();
  await tick();
  h.auth.session.set(null);
  h.auth.sessionEpoch.set(2);
  h.resolveInbox();
  await tick();
  assert.deepEqual(h.store.inbox(), []);
  assert.deepEqual(h.store.messages(), []);
  h.effects[0]();
  h.close();
});
test('destroy closes subscriptions, and a late auth response cannot create a new channel', async () => {
  const h = storeHarness();
  h.effects[0]();
  await tick();
  assert.equal(h.channels.length, 1);
  assert.deepEqual(
    h.channels[0].events.map((e) => e.filter.event),
    ['INSERT', 'UPDATE'],
  );
  h.close();
  await tick();
  assert.equal(h.removed.length, 1);
  const pending = storeHarness();
  pending.state.pauseAuth = true;
  pending.effects[0]();
  pending.close();
  pending.resolveAuth();
  await tick();
  assert.equal(pending.channels.length, 0);
});
test('hidden tab does not mark conversations read; ambiguous send blocks repeat submission', async () => {
  const h = storeHarness();
  h.doc.visibilityState = 'hidden';
  h.store.active.set(CONV);
  await h.store.refresh();
  assert.equal(h.state.reads, 0);
  h.state.failSend = true;
  await h.store.send('Hello');
  await h.store.send('Hello');
  assert.equal(h.state.sends, 1);
  assert.equal(h.store.uncertain(), true);
  h.close();
});
test('token refresh and manual reconnect preserve an uncertain receipt lock', async () => {
  const h = storeHarness();
  h.effects[0]();
  await tick();
  h.store.uncertain.set(true);
  h.auth.session.set({ ...h.auth.session(), access_token: 'refreshed' });
  h.effects[0]();
  await tick();
  assert.equal(h.store.uncertain(), true);
  assert.equal(h.channels.length, 1);
  h.store.reconnect();
  await tick();
  assert.equal(h.store.uncertain(), true);
  assert.equal(h.channels.length, 2);
  h.close();
});
