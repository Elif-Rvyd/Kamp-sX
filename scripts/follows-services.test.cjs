const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222';
const tick = () => new Promise((resolve) => setImmediate(resolve));
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  return read;
}
function harness() {
  class AuthService {}
  class SupabaseService {}
  class DestroyRef {}
  const session = signal({ user: { id: A } }),
    sessionEpoch = signal(1),
    effects = [],
    cleanup = [],
    queries = [],
    channels = [],
    removed = [];
  const destroyRef = { destroyed: false, onDestroy: (fn) => cleanup.push(fn) };
  let counts = { following: 3, followers: 7 },
    failure = false,
    pause,
    verified = true;
  const client = {
    realtime: { setAuth: async () => {} },
    channel(topic, config) {
      const channel = {
        topic,
        config,
        on(_type, filter, callback) {
          this.event = callback;
          return this;
        },
        subscribe(callback) {
          this.status = callback;
          return this;
        },
      };
      channels.push(channel);
      return channel;
    },
    removeChannel: async (channel) => removed.push(channel),
    schema(name) {
      assert.equal(name, 'public');
      return this;
    },
    from(table) {
      assert.equal(table, 'user_follows');
      const q = { filters: [], op: 'select' };
      queries.push(q);
      const builder = {
        select(column, options) {
          q.column = column;
          q.options = options;
          return this;
        },
        eq(key, value) {
          q.filters.push([key, value]);
          return this;
        },
        insert(payload) {
          q.op = 'insert';
          q.payload = payload;
          return this;
        },
        delete() {
          q.op = 'delete';
          return this;
        },
        async abortSignal(abort) {
          q.abort = abort;
          if (pause) await pause;
          return {
            count: counts[q.filters[0]?.[0] === 'follower_id' ? 'following' : 'followers'],
            error: failure ? { code: '42501', message: 'PRIVATE_SERVER_ERROR' } : null,
          };
        },
      };
      return builder;
    },
  };
  const dependencies = new Map([
    [AuthService, { session, sessionEpoch, hasVerifiedSession: async () => verified }],
    [SupabaseService, { client }],
    [DestroyRef, destroyRef],
  ]);
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../apps/shell/src/app/core/follows.service.ts'), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  new Function('exports', 'require', js)(exports, (specifier) =>
    specifier === '@angular/core'
      ? {
          Injectable: () => (x) => x,
          inject: (t) => dependencies.get(t),
          DestroyRef,
          signal,
          effect: (fn) => {
            effects.push(fn);
            fn();
          },
        }
      : specifier === './auth.service'
        ? { AuthService }
        : specifier === './supabase.service'
          ? { SupabaseService }
          : require(specifier),
  );
  const service = new exports.FollowsService();
  return {
    service,
    queries,
    channels,
    removed,
    setCounts: (value) => (counts = value),
    fail: (value) => (failure = value),
    verify: (value) => (verified = value),
    pause: () => {
      let resolve;
      pause = new Promise((r) => (resolve = r));
      return () => {
        pause = undefined;
        resolve();
      };
    },
    change: (id, run = true) => {
      session.set(id ? { user: { id } } : null);
      sessionEpoch.set(sessionEpoch() + 1);
      if (run) effects.forEach((fn) => fn());
    },
    destroy: () => {
      destroyRef.destroyed = true;
      cleanup.forEach((fn) => fn());
    },
  };
}
test('follow counts are exact owner-filtered HEAD queries; zero is real and unknown is never a mock count', async () => {
  const h = harness();
  assert.deepEqual(h.service.counts(), { following: null, followers: null });
  await tick();
  assert.deepEqual(h.service.counts(), { following: 3, followers: 7 });
  assert.equal(h.service.error(), ''); // An in-progress channel join is not a connection failure.
  for (const q of h.queries) {
    assert.deepEqual(q.options, { count: 'exact', head: true });
    assert.equal(q.filters[0][1], A);
  }
  h.setCounts({ following: 0, followers: 0 });
  await h.service.refresh();
  assert.deepEqual(h.service.counts(), { following: 0, followers: 0 });
  h.destroy();
});
test('private broadcasts coalesce refetches and reconnection refetches changes missed offline', async () => {
  const h = harness();
  await tick();
  const c = h.channels[0];
  assert.equal(c.topic, `kampusx:follows:${A}`);
  assert.deepEqual(c.config, { config: { private: true } });
  c.status('SUBSCRIBED');
  await tick();
  assert.equal(h.service.error(), '');
  const before = h.queries.length;
  h.setCounts({ following: 4, followers: 8 });
  c.event();
  c.event();
  c.event();
  await new Promise((r) => setTimeout(r, 110));
  assert.equal(h.queries.length, before + 2);
  assert.deepEqual(h.service.counts(), { following: 4, followers: 8 });
  c.status('CHANNEL_ERROR');
  assert.equal(h.service.error(), 'follows.liveError');
  h.setCounts({ following: 6, followers: 9 });
  c.status('SUBSCRIBED');
  await tick();
  assert.deepEqual(h.service.counts(), { following: 6, followers: 9 });
  h.destroy();
});
test('read denial preserves last confirmed counts and exposes only a translated error with retry', async () => {
  const h = harness();
  await tick();
  h.fail(true);
  await h.service.refresh();
  assert.equal(h.service.error(), 'follows.readError');
  assert.deepEqual(h.service.counts(), { following: 3, followers: 7 });
  h.fail(false);
  await h.service.retry();
  assert.equal(h.removed.length, 1);
  h.channels.at(-1).status('SUBSCRIBED');
  await tick();
  assert.equal(h.service.error(), '');
  h.destroy();
});
test('logout cancels count requests, removes channels and ignores late responses and events', async () => {
  const h = harness();
  await tick();
  const release = h.pause();
  const pending = h.service.refresh();
  const previous = h.channels[0];
  const request = h.queries.at(-1);
  h.change(null);
  assert.equal(request.abort.aborted, true);
  assert.equal(h.removed.length, 1);
  release();
  await pending;
  previous.status('SUBSCRIBED');
  previous.event();
  assert.deepEqual(h.service.counts(), { following: null, followers: null });
  assert.equal(h.service.live(), false);
  h.destroy();
});
test('same-user replacement rejects stale responses even before effects rerun', async () => {
  const h = harness();
  await tick();
  const release = h.pause();
  h.setCounts({ following: 100, followers: 200 });
  const pending = h.service.refresh();
  h.change(A, false);
  release();
  await pending;
  assert.deepEqual(h.service.counts(), { following: 3, followers: 7 });
  h.destroy();
});
test('follow writes only the verified owner; unfollow always filters both participants', async () => {
  const h = harness();
  await tick();
  await h.service.setFollowing(B, true);
  assert.deepEqual(h.queries.find((q) => q.op === 'insert').payload, { follower_id: A, followed_id: B });
  await h.service.setFollowing(B, false);
  assert.deepEqual(h.queries.find((q) => q.op === 'delete').filters, [
    ['follower_id', A],
    ['followed_id', B],
  ]);
  const before = h.queries.length;
  for (const id of [A, 'bad-id'])
    await assert.rejects(h.service.setFollowing(id, true), { key: 'follows.saveError' });
  h.verify(false);
  await assert.rejects(h.service.setFollowing(B, true), { key: 'follows.saveError' });
  assert.equal(h.queries.length, before);
  h.destroy();
});
test('service destruction clears scheduled broadcasts and pending work', async () => {
  const h = harness();
  await tick();
  h.channels[0].event();
  const before = h.queries.length;
  h.destroy();
  await new Promise((r) => setTimeout(r, 110));
  assert.equal(h.queries.length, before);
  assert.equal(h.removed.length, 1);
});
