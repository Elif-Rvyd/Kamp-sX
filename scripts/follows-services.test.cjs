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
  read.update = (fn) => (value = fn(value));
  return read;
}
function harness() {
  class AuthService {}
  class SupabaseService {}
  class MediaService {}
  class DestroyRef {}
  const session = signal({ user: { id: A } }),
    sessionEpoch = signal(1),
    effects = [],
    cleanup = [],
    queries = [],
    setupReads = [],
    channels = [],
    removed = [];
  const destroyRef = { destroyed: false, onDestroy: (fn) => cleanup.push(fn) };
  let counts = { following: 3, followers: 7 },
    failure = false,
    setupReady = true,
    affected = 1,
    pause,
    setupPause,
    verified = true;
  const client = {
    rpc(name, args, options) {
      assert.equal(name, 'kampusx_follow_requests_version');
      assert.deepEqual(args, {});
      assert.deepEqual(options, { get: true });
      return {
        abortSignal: async (abort) => {
          setupReads.push({ abort });
          if (setupPause) await setupPause;
          return { data: setupReady ? '20261018190000' : null, error: null };
        },
      };
    },
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
      assert.equal(table, 'follows');
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
        update(payload, options) {
          q.op = 'update';
          q.payload = payload;
          q.options = options;
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
            count:
              q.op !== 'select'
                ? affected
                : q.filters.some(([key, value]) => key === 'status' && value === 'pending')
                  ? 0
                  : counts[q.filters[0]?.[0] === 'follower_id' ? 'following' : 'followers'],
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
    [MediaService, { isPublicUrl: () => true }],
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
          : specifier === './media.service'
            ? { MediaService }
            : require(specifier),
  );
  const service = new exports.FollowsService();
  return {
    service,
    queries,
    setupReads,
    channels,
    removed,
    setCounts: (value) => (counts = value),
    fail: (value) => (failure = value),
    verify: (value) => (verified = value),
    affected: (value) => (affected = value),
    setup: (value) => (setupReady = value),
    pauseSetup: () => {
      let resolve;
      setupPause = new Promise((r) => (resolve = r));
      return () => {
        setupPause = undefined;
        resolve();
      };
    },
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
  assert.equal(h.queries.length, before + 3);
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
  assert.deepEqual(h.queries.find((q) => q.op === 'insert').payload, { follower_id: A, following_id: B });
  await h.service.setFollowing(B, false);
  assert.deepEqual(h.queries.find((q) => q.op === 'delete').filters, [
    ['follower_id', A],
    ['following_id', B],
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

test('pending requests are separate from accepted follow counts', async () => {
  const h = harness();
  await tick();
  assert.equal(h.service.pendingCount(), 0);
  assert.equal(h.queries.length, 3);
  assert.deepEqual(
    h.queries.map((q) => q.filters[1]),
    [
      ['status', 'accepted'],
      ['status', 'accepted'],
      ['status', 'pending'],
    ],
  );
  h.destroy();
});

test('request actions filter actor, recipient and expected status; updates never request returned rows', async () => {
  const h = harness();
  await tick();
  for (const [method, op, incoming, status] of [
    ['cancelRequest', 'delete', false, 'pending'],
    ['unfollow', 'delete', false, 'accepted'],
    ['acceptRequest', 'update', true, 'pending'],
    ['rejectRequest', 'delete', true, 'pending'],
    ['removeFollower', 'delete', true, 'accepted'],
  ]) {
    await h.service[method](B);
    const q = h.queries.filter((q) => q.op === op).at(-1);
    assert.deepEqual(q.filters, [
      ['follower_id', incoming ? B : A],
      ['following_id', incoming ? A : B],
      ['status', status],
    ]);
    assert.equal(q.column, undefined);
    if (op === 'update') assert.deepEqual(q.payload, { status: 'accepted' });
  }
  h.destroy();
});

test('a concurrently changed request does not report a successful accept', async () => {
  const h = harness();
  await tick();
  h.affected(0);
  await assert.rejects(h.service.acceptRequest(B), { key: 'follows.changed' });
  assert.equal(h.service.busy().size, 0);
  h.destroy();
});

test('duplicate actions are locked and replacement sessions abort pending writes', async () => {
  const h = harness();
  await tick();
  const release = h.pause();
  const pending = h.service.follow(B);
  const assertion = assert.rejects(pending, { key: 'follows.saveError' });
  await tick();
  await assert.rejects(h.service.follow(B), { key: 'follows.saveError' });
  const request = h.queries.find((q) => q.op === 'insert');
  h.change(null);
  assert.equal(request.abort.aborted, true);
  release();
  await assertion;
  assert.equal(h.service.busy().size, 0);
  h.destroy();
});

test('deployment gate blocks writes when the follow migration is missing or rolled back', async () => {
  const h = harness();
  await tick();
  h.setup(false);
  await assert.rejects(h.service.follow(B), { key: 'follows.unavailable' });
  assert.equal(h.service.ready(), false);
  assert.equal(h.queries.filter((q) => q.op === 'insert').length, 0);
  h.destroy();
});

test('account replacement aborts setup checks and ignores late installation responses', async () => {
  const h = harness();
  await tick();
  const release = h.pauseSetup();
  const pending = h.service.retry();
  const request = h.setupReads.at(-1);
  h.change(null);
  try {
    assert.equal(request.abort.aborted, true);
  } finally {
    release();
    await pending;
    h.destroy();
  }
  assert.equal(h.service.ready(), false);
});

test('destroying the follow service aborts outstanding setup checks', async () => {
  const h = harness();
  await tick();
  const release = h.pauseSetup();
  const pending = h.service.retry();
  const request = h.setupReads.at(-1);
  h.destroy();
  try {
    assert.equal(request.abort.aborted, true);
  } finally {
    release();
    await pending;
  }
});

// Isolate the page while navigation is delayed: cleanup must not rely on the router destroying it.
function pageHarness() {
  class AuthService {}
  class FollowsService {}
  class NoticeService {}
  class DestroyRef {}
  class ElementRef {}
  class Injector {}
  class ActivatedRoute {}
  const DOCUMENT = Symbol('document');
  const session = signal({ user: { id: A } }),
    sessionEpoch = signal(1);
  const effects = [],
    cleanup = [],
    reads = [],
    lookups = [];
  const person = { userId: B, username: 'deniz', fullName: 'Deniz', status: 'pending' };
  const destroyRef = { destroyed: false, onDestroy: (fn) => cleanup.push(fn) };
  class FormControl {
    constructor(value) {
      this.value = value;
      this.invalid = false;
    }
    markAsTouched() {}
    setValue(value, options = {}) {
      this.value = value;
      if (options.emitEvent !== false) this.changed?.();
    }
    valueChanges = {
      pipe: () => ({
        subscribe: (fn) => {
          this.changed = fn;
        },
      }),
    };
  }
  const dependencies = new Map([
    [AuthService, { session, sessionEpoch }],
    [
      FollowsService,
      {
        privacyRevision: signal(0),
        people: async (...args) => {
          reads.push(args);
          return { people: [person], nextOffset: 1, more: false };
        },
        findPerson: async (...args) => {
          lookups.push(args);
          return person;
        },
      },
    ],
    [DestroyRef, destroyRef],
    [NoticeService, { show() {} }],
    [DOCUMENT, { activeElement: null }],
    [ElementRef, { nativeElement: { querySelector: () => null, contains: () => false } }],
    [Injector, {}],
    [ActivatedRoute, { snapshot: { data: { followList: 'followers' } } }],
  ]);
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../apps/shell/src/app/features/profile/follow-connections.page.ts'),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  new Function('exports', 'require', js)(exports, (specifier) => {
    if (specifier === '@angular/core')
      return {
        Component: () => (x) => x,
        ChangeDetectionStrategy: { OnPush: 0 },
        inject: (t) => dependencies.get(t),
        DestroyRef,
        ElementRef,
        Injector,
        signal,
        untracked: (fn) => fn(),
        effect: (fn) => {
          effects.push(fn);
          fn();
        },
        afterNextRender: (fn) => fn(),
      };
    if (specifier === '@angular/common') return { DOCUMENT };
    if (specifier === '@angular/forms')
      return {
        FormControl,
        FormGroup: class {},
        Validators: { required() {}, maxLength: () => () => {} },
      };
    if (specifier === '@angular/router') return { ActivatedRoute };
    if (specifier === '@angular/core/rxjs-interop') return { takeUntilDestroyed: () => () => {} };
    if (specifier.endsWith('/auth.service')) return { AuthService };
    if (specifier.endsWith('/follows.service'))
      return { FollowsService, FollowError: class extends Error {} };
    if (specifier.endsWith('/notice.service')) return { NoticeService };
    if (specifier === './profile-page-context') return { bindProfilePage() {} };
    return {};
  });
  const page = new exports.FollowConnectionsPage();
  return {
    page,
    reads,
    lookups,
    effects,
    session,
    sessionEpoch,
    destroy: () => {
      destroyRef.destroyed = true;
      cleanup.forEach((fn) => fn());
    },
  };
}

test('account switch clears page-owned identity/search data without replaying the previous search', async () => {
  const h = pageHarness();
  await tick();
  h.page.username.setValue('deniz');
  h.page.search();
  await tick();
  assert.equal(h.page.searchResult().userId, B);
  const readCount = h.reads.length,
    lookupCount = h.lookups.length;
  h.session.set({ user: { id: B } });
  h.sessionEpoch.set(2);
  h.effects.forEach((fn) => fn());
  await tick();
  try {
    assert.deepEqual(h.page.rows(), []);
    assert.equal(h.page.searchResult(), null);
    assert.equal(h.page.username.value, '');
    assert.equal(h.lookups.length, lookupCount);
    assert.equal(h.reads.length, readCount);
    assert.equal(h.lookups[0][1].aborted, true);
  } finally {
    h.destroy();
  }
});

test('logged-out follow pages refuse new reads and searches even before navigation finishes', async () => {
  const h = pageHarness();
  await tick();
  h.session.set(null);
  h.sessionEpoch.set(2);
  h.effects.forEach((fn) => fn());
  const readCount = h.reads.length,
    lookupCount = h.lookups.length;
  h.page.username.setValue('deniz');
  h.page.search();
  await h.page.load(false);
  await tick();
  try {
    assert.equal(h.reads.length, readCount);
    assert.equal(h.lookups.length, lookupCount);
    assert.deepEqual(h.page.rows(), []);
    assert.equal(h.page.searchResult(), null);
  } finally {
    h.destroy();
  }
});
