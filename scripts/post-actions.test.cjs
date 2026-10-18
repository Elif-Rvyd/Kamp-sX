const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  ts = require('typescript');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  P = '44444444-4444-4444-8444-000000000001';
const signal = (value) => {
  const read = () => value;
  read.set = (v) => (value = v);
  read.update = (fn) => (value = fn(value));
  return read;
};
function harness() {
  class AuthService {}
  class SupabaseService {}
  class FollowsService {}
  class PostsService {}
  class MediaService {}
  class DestroyRef {}
  class MediaError extends Error {
    constructor(key) {
      super(key);
      this.key = key;
    }
  }
  const DOCUMENT = Symbol(),
    callbacks = [],
    effects = [],
    calls = [],
    replies = [];
  const auth = {
    session: signal({ user: { id: A } }),
    sessionEpoch: signal(1),
    hasVerifiedSession: async () => true,
  };
  const destroy = { destroyed: false, onDestroy: (fn) => callbacks.push(fn) };
  const follows = { privacyRevision: signal(0), refresh: async () => calls.push('follow-refresh') };
  const posts = {
    invalidateRead: () => {},
    load: async () => calls.push('posts-refresh'),
    mapRow: (row) => row,
  };
  const state = {
    download: async () => ({ data: new Blob(['bytes'], { type: 'image/webp' }), error: null }),
    remove: async () => calls.push('storage-remove'),
  };
  const media = {
    isPublicUrl: (s) =>
      typeof s === 'string' && s.startsWith('https://example.supabase.co/storage/v1/object/public/uploads/'),
    removePostMedia: async (...args) => state.remove(...args),
  };
  const client = {
    storage: {
      from: () => ({
        download: (...args) => {
          calls.push({ download: args });
          return state.download(...args);
        },
      }),
    },
    rpc(name, args) {
      calls.push({ rpc: name, args });
      const result = replies.shift() ?? { data: null, error: null };
      return {
        abortSignal: () => Promise.resolve().then(() => (typeof result === 'function' ? result() : result)),
      };
    },
    schema() {
      return this;
    },
    from(table) {
      const q = { table };
      const builder = {};
      for (const key of ['select', 'eq', 'in', 'insert', 'delete', 'order', 'range'])
        builder[key] = (...args) => {
          q[key] = args;
          return builder;
        };
      builder.abortSignal = async () => {
        calls.push(q);
        return replies.shift() ?? { data: [], error: null };
      };
      return builder;
    },
  };
  const document = {
    defaultView: { addEventListener() {}, removeEventListener() {} },
    addEventListener() {},
    removeEventListener() {},
    visibilityState: 'visible',
  };
  const deps = new Map([
    [AuthService, auth],
    [SupabaseService, { client }],
    [DestroyRef, destroy],
    [FollowsService, follows],
    [PostsService, posts],
    [MediaService, media],
    [DOCUMENT, document],
  ]);
  const angular = {
    Injectable: () => (x) => x,
    DestroyRef,
    inject: (token) => {
      assert.ok(deps.has(token), token?.name);
      return deps.get(token);
    },
    signal,
    computed: (fn) => fn,
    effect: (fn) => effects.push(fn),
  };
  function load(file) {
    const exports = {};
    const js = ts.transpileModule(
      fs.readFileSync(path.join(__dirname, '../apps/shell/src/app/core', file + '.ts'), 'utf8'),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          experimentalDecorators: true,
        },
      },
    ).outputText;
    new Function('exports', 'require', js)(exports, (name) => {
      if (name === '@angular/core') return angular;
      if (name === '@angular/common') return { DOCUMENT };
      return (
        {
          './auth.service': { AuthService },
          './supabase.service': { SupabaseService },
          './follows.service': { FollowsService },
          './posts.service': { PostsService, POST_COLUMNS: 'id' },
          './media.service': { MediaService, MediaError },
        }[name] ?? {}
      );
    });
    return exports;
  }
  const { PostActionsService } = load('post-actions.service');
  const actions = new PostActionsService();
  return {
    auth,
    state,
    calls,
    replies,
    actions,
    effects,
    destroy: () => {
      destroy.destroyed = true;
      callbacks.forEach((fn) => fn());
    },
    post: {
      id: P,
      userId: A,
      kind: 'post',
      text: 'Text',
      stats: { likes: 0, replies: 0, retweets: 0, views: 0 },
    },
  };
}
const snapshot = (extra = {}) => ({
  id: P,
  likes_count: 0,
  comments_count: 0,
  liked: false,
  bookmarked: false,
  ...extra,
});
test('first session effect does not cancel reaction hydration queued by a newly mounted card', async () => {
  const h = harness();
  h.actions.observe(h.post);
  h.effects.forEach((fn) => fn());
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.reactionsReady(P), true);
  assert.equal(h.actions.reactionsFailed(P), false);
  h.destroy();
});
test('optimistic reactions roll back on a rejected server write without exposing raw errors', async () => {
  const h = harness();
  let release;
  h.replies.push(() => new Promise((r) => (release = r)));
  const pending = h.actions.react(h.post, 'like');
  assert.equal(h.actions.view(h.post).liked, true);
  await new Promise((r) => setImmediate(r));
  release({ data: null, error: { code: '42501', message: 'PRIVATE_SERVER_DETAIL' } });
  await assert.rejects(pending, (e) => e.key === 'social.errors.unavailable');
  assert.equal(h.actions.view(h.post).stats.likes, 0);
  assert.equal(h.actions.busy(P), false);
  h.destroy();
});
test('duplicate in-flight reaction fails rather than announcing an uncommitted success', async () => {
  const h = harness();
  let release;
  h.replies.push(() => new Promise((r) => (release = r)));
  const pending = h.actions.react(h.post, 'bookmark');
  await assert.rejects(h.actions.react(h.post, 'bookmark'), (e) => e.key === 'social.errors.busy');
  await new Promise((r) => setImmediate(r));
  release({ data: snapshot({ bookmarked: true }), error: null });
  await pending;
  assert.equal(h.calls.filter((c) => c.rpc).length, 1);
  h.destroy();
});
test('re-login during a delayed action cannot patch another session or roll back its state', async () => {
  const h = harness();
  let release;
  h.replies.push(() => new Promise((r) => (release = r)));
  const pending = h.actions.react(h.post, 'like');
  await new Promise((r) => setImmediate(r));
  h.auth.sessionEpoch.set(2);
  h.effects.forEach((fn) => fn());
  release({ data: snapshot({ liked: true, likes_count: 1 }), error: null });
  await assert.rejects(pending, (e) => e.key === 'media.errors.session');
  assert.equal(h.actions.view(h.post).stats.likes, 0);
  h.destroy();
});
test('deletion validates server reservation, cleans media and only then finishes database deletion', async () => {
  const h = harness();
  h.replies.push(
    {
      data: {
        post_id: P,
        user_id: A,
        media_path: `${A}/post/55555555-5555-4555-8555-555555555555.webp`,
        missing: false,
      },
      error: null,
    },
    { data: null, error: null },
  );
  await h.actions.remove(h.post);
  const sequence = h.calls.filter((c) => c.rpc || c === 'storage-remove').map((c) => c.rpc ?? c);
  assert.deepEqual(sequence, ['kampusx_begin_post_delete', 'storage-remove', 'kampusx_finish_post_delete']);
  assert.equal(h.actions.view(h.post), null);
  h.destroy();
});
test('failed media cleanup never calls final deletion and retains a retryable pending state', async () => {
  const h = harness();
  h.state.remove = async () => {
    throw Error('PRIVATE_ERROR');
  };
  h.replies.push({
    data: { post_id: P, user_id: A, media_path: A + '/post/object.webp', missing: false },
    error: null,
  });
  await assert.rejects(h.actions.remove(h.post));
  assert.equal(
    h.calls.some((c) => c.rpc === 'kampusx_finish_post_delete'),
    false,
  );
  assert.equal(h.actions.view(h.post).deletionPending, true);
  h.destroy();
});
test('a foreign reservation or owner cannot reach Storage deletion', async () => {
  const h = harness();
  await assert.rejects(h.actions.remove({ ...h.post, userId: B }));
  assert.equal(h.calls.length, 0);
  h.replies.push({ data: { post_id: P, user_id: B, media_path: B + '/post/object.webp' }, error: null });
  await assert.rejects(h.actions.remove(h.post));
  assert.equal(h.calls.includes('storage-remove'), false);
  h.destroy();
});
test('blocking hides the author across post surfaces and refreshes server state', async () => {
  const h = harness();
  h.replies.push({ data: null, error: null });
  const other = { ...h.post, userId: B };
  await h.actions.block(other, 'Other person');
  assert.equal(h.actions.view(other), null);
  assert.ok(h.calls.includes('posts-refresh'));
  assert.ok(h.calls.includes('follow-refresh'));
  h.destroy();
});
