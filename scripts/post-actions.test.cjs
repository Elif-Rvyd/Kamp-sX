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
    likes: [],
    bookmarks: [],
    postRows: [
      {
        id: P,
        user_id: A,
        parent_id: null,
        media_url: null,
        pinned_at: null,
        archived_at: null,
        deleted_at: null,
        content: 'Text',
        created_at: '2026-10-21T10:00:00Z',
        replies_count: 0,
        reposts_count: 0,
      },
    ],
    replySetup: true,
    ownerSetup: true,
    accountSetup: true,
    profile: {
      user_id: A,
      username: 'student',
      campus: 'North',
      campus_id: B,
      department_id: B,
      visible_department: false,
      visible_campus: false,
      visible_university: false,
      visible_explore: false,
      audience_configured: false,
    },
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
      if (name === 'kampusx_soft_delete_post' && !replies.length) {
        const row = state.postRows.find((row) => row.id === args.p_post_id && row.user_id === A);
        if (row) row.deleted_at = new Date().toISOString();
        return { abortSignal: () => Promise.resolve({ data: !!row, error: null }) };
      }
      const result = replies.shift() ?? {
        data:
          name === 'kampusx_reply_contract_version' && state.replySetup
            ? '2026102102'
            : (name === 'kampusx_owner_actions_version' && state.ownerSetup) ||
                (name === 'kampusx_account_contract_version' && state.accountSetup)
              ? '2026102201'
              : null,
        error: null,
      };
      return {
        abortSignal: () => Promise.resolve().then(() => (typeof result === 'function' ? result() : result)),
      };
    },
    schema() {
      return this;
    },
    from(table) {
      const q = { table, filters: [] };
      const builder = {};
      for (const key of [
        'select',
        'eq',
        'in',
        'is',
        'not',
        'neq',
        'limit',
        'update',
        'insert',
        'delete',
        'order',
        'range',
        'maybeSingle',
        'single',
      ])
        builder[key] = (...args) => {
          q[key] = args;
          if (['eq', 'in', 'is', 'neq'].includes(key)) q.filters.push([key, ...args]);
          return builder;
        };
      builder.abortSignal = (requestSignal) => {
        q.signal = requestSignal;
        return builder;
      };
      builder.then = async (resolve, reject) => {
        try {
          calls.push(q);
          const override = replies.shift();
          const result = await (typeof override === 'function' ? override() : override);
          if (result?.error) return resolve(result);
          if (table === 'likes' || table === 'bookmarks') {
            const matches = (row) =>
              q.filters.every(([kind, field, value]) =>
                kind === 'eq' ? row[field] === value : value.includes(row[field]),
              );
            if (q.insert) {
              const row = q.insert[0];
              if (!state[table].some((r) => r.user_id === row.user_id && r.post_id === row.post_id))
                state[table].push(row);
            }
            if (q.delete) state[table] = state[table].filter((r) => !matches(r));
            return resolve(result ?? { data: state[table].filter(matches), error: null });
          }
          if (table === 'profiles') {
            if (q.update) state.profile = { ...state.profile, ...q.update[0], audience_configured: true };
            return resolve(result ?? { data: state.profile, error: null });
          }
          if (table === 'posts') {
            const matches = (row) =>
              q.filters.every(([kind, field, value]) =>
                kind === 'in'
                  ? value.includes(row[field])
                  : kind === 'neq'
                    ? row[field] !== value
                    : row[field] === value,
              );
            if (q.update) {
              const rows = state.postRows.filter(matches);
              rows.forEach((row) => Object.assign(row, q.update[0]));
              return resolve(result ?? { data: null, error: null, count: rows.length });
            }
            if (q.insert) {
              assert.ok(
                Object.keys(q.insert[0]).every((key) =>
                  ['user_id', 'content', 'parent_id', 'media_url', 'media_type', 'repost_of_id'].includes(
                    key,
                  ),
                ),
              );
              const row = {
                id: require('node:crypto').randomUUID(),
                created_at: '2026-10-21T10:00:01Z',
                replies_count: 0,
                reposts_count: 0,
                deleted_at: null,
                archived_at: null,
                ...q.insert[0],
              };
              state.postRows.push(row);
              return resolve(result ?? { data: row, error: null, status: 201 });
            }
            let rows = state.postRows.filter(matches).map((row) => ({
              ...row,
              likes_count: state.likes.filter((r) => r.post_id === row.id).length,
              replies_count: state.postRows.filter((r) => r.parent_id === row.id).length,
            }));
            if (q.range) rows = rows.slice(q.range[0], q.range[1] + 1);
            return resolve(result ?? { data: q.maybeSingle ? (rows[0] ?? null) : rows, error: null });
          }
          resolve(result ?? { data: [], error: null });
        } catch (error) {
          reject(error);
        }
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
  const { AccountService } = load('account.service');
  const account = new AccountService();
  return {
    account,
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

test('user reports use the real reported_user_id without fabricating a post', async () => {
  const h = harness();
  assert.equal(await h.actions.reportUser(B, 'harassment'), true);
  const write = h.calls.find((q) => q.table === 'reports' && q.insert);
  assert.deepEqual(write.insert[0], {
    reporter_id: A,
    post_id: null,
    reported_user_id: B,
    reason: 'harassment',
  });
  assert.equal(
    h.calls.some((q) => q.table === 'posts' && q.insert),
    false,
  );
  await assert.rejects(h.actions.reportUser(A, 'spam'));
  await assert.rejects(h.actions.reportUser('invalid', 'spam'));
  await assert.rejects(h.actions.reportUser(B, 'invalid'));
  assert.equal(h.calls.filter((q) => q.table === 'reports' && q.insert).length, 1);
  h.destroy();
});

test('user blocking writes only session ownership and invalidates other visible surfaces', async () => {
  const h = harness();
  await h.actions.blockUser(B);
  const write = h.calls.find((q) => q.table === 'blocks' && q.insert);
  assert.deepEqual(write.insert[0], { blocker_id: A, blocked_id: B });
  assert.equal(h.actions.view({ ...h.post, userId: B }), null);
  assert.equal(h.actions.readRevision(), 1);
  await assert.rejects(h.actions.blockUser(A));
  await assert.rejects(h.actions.blockUser('invalid'));
  assert.equal(h.calls.filter((q) => q.table === 'blocks' && q.insert).length, 1);
  h.destroy();
});

test('a delayed profile block cannot hide content in a replacement session', async () => {
  const h = harness();
  let release;
  h.replies.push(() => new Promise((resolve) => (release = resolve)));
  const pending = h.actions.blockUser(B);
  await new Promise((resolve) => setImmediate(resolve));
  h.auth.sessionEpoch.set(2);
  h.effects.forEach((run) => run());
  release({ data: null, error: null });
  await assert.rejects(pending, (error) => error.key === 'media.errors.session');
  assert.notEqual(h.actions.view({ ...h.post, userId: B }), null);
  h.destroy();
});
test('account visibility writes only four owned audience flags and requires a confirmed server receipt', async () => {
  const h = harness();
  const values = {
    visible_department: true,
    visible_campus: false,
    visible_university: false,
    visible_explore: false,
  };
  const result = await h.account.save({
    ...values,
    user_id: B,
    campus: 'forged',
    is_private: false,
    role: 'admin',
  });
  assert.equal(result.audience_configured, true);
  const write = h.calls.find((q) => q.table === 'profiles' && q.update);
  assert.deepEqual(write.update[0], values);
  assert.ok(write.filters.some((f) => f[1] === 'user_id' && f[2] === A));
  h.destroy();
});
test('missing account migration cannot read or write preferences', async () => {
  const h = harness();
  h.state.accountSetup = false;
  await assert.rejects(h.account.preferences(), (e) => e.key === 'accountStatus.setup');
  assert.equal(
    h.calls.some((q) => q.table === 'profiles'),
    false,
  );
  h.destroy();
});
test('account preferences reject late responses across a replacement login', async () => {
  const h = harness();
  let release;
  const promise = new Promise((resolve) => (release = resolve));
  h.replies.push(() => promise);
  const read = h.account.preferences();
  h.auth.sessionEpoch.set(2);
  release({ data: '2026102201', error: null });
  await assert.rejects(read, (e) => e.key === 'media.errors.session');
  assert.equal(
    h.calls.some((q) => q.table === 'profiles'),
    false,
  );
  h.destroy();
});
test('account visibility rejects malformed booleans without a profile write', async () => {
  const h = harness();
  await assert.rejects(
    h.account.save({
      visible_department: 'true',
      visible_campus: false,
      visible_university: false,
      visible_explore: false,
    }),
    (e) => e.key === 'accountStatus.saveError',
  );
  assert.equal(
    h.calls.some((q) => q.update),
    false,
  );
  h.destroy();
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
  assert.equal(h.calls.filter((c) => c.table === 'bookmarks' && c.insert).length, 1);
  assert.equal(
    h.calls.some((c) => c.rpc === 'kampusx_set_reaction'),
    false,
  );
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
test('like/unlike uses only own real relation rows and takes all counters from posts', async () => {
  const h = harness();
  await h.actions.react(h.post, 'like');
  assert.equal(h.actions.view(h.post).liked, true);
  assert.equal(h.actions.view(h.post).stats.likes, 1);
  await h.actions.react(h.post, 'like');
  assert.equal(h.actions.view(h.post).liked, false);
  assert.equal(h.actions.view(h.post).stats.likes, 0);
  const writes = h.calls.filter((q) => q.insert || q.delete);
  assert.deepEqual(
    writes.map((q) => q.table),
    ['likes', 'likes'],
  );
  assert.deepEqual(writes[0].insert[0], { user_id: A, post_id: P });
  assert.deepEqual(writes[1].filters, [
    ['eq', 'user_id', A],
    ['eq', 'post_id', P],
  ]);
  assert.equal(
    h.calls.some((q) => q.rpc),
    false,
  );
  h.destroy();
});
test('duplicate like is idempotent and never increments an existing server count twice', async () => {
  const h = harness();
  h.state.likes.push({ user_id: A, post_id: P });
  h.replies.push({ data: null, error: { code: '23505' } });
  await h.actions.react(h.post, 'like');
  assert.equal(h.state.likes.length, 1);
  assert.equal(h.actions.view(h.post).stats.likes, 1);
  h.destroy();
});
test('retry after a lost receipt reads the committed state without writing twice', async () => {
  const h = harness();
  h.replies.push(
    { data: null, error: null },
    { data: [{ post_id: P }], error: null },
    { data: null, error: { code: '503' } },
  );
  await assert.rejects(h.actions.react(h.post, 'like'));
  assert.equal(h.state.likes.length, 1);
  assert.equal(h.actions.reactionsReady(P), false);
  assert.equal(h.actions.reactionsFailed(P), true);
  h.actions.observe(h.post);
  h.actions.retryReactions(P);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.view(h.post).liked, true);
  assert.equal(h.actions.view(h.post).stats.likes, 1);
  assert.equal(h.calls.filter((q) => q.insert).length, 1);
  h.destroy();
});
test('failed initial reads remain disabled until retry and do not fabricate a zero count', async () => {
  const h = harness();
  h.replies.push({ data: null, error: { code: '42501' } });
  h.actions.observe({ ...h.post, stats: { ...h.post.stats, likes: 8 } });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.reactionsReady(P), false);
  assert.equal(h.actions.reactionsFailed(P), true);
  assert.equal(h.actions.view({ ...h.post, stats: { ...h.post.stats, likes: 8 } }).stats.likes, 8);
  h.actions.retryReactions(P);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.reactionsReady(P), true);
  h.destroy();
});
test('bookmark removal verifies absence and invalidates the saved collection', async () => {
  const h = harness();
  await h.actions.react(h.post, 'bookmark');
  await h.actions.react(h.post, 'bookmark');
  assert.equal(h.actions.view(h.post).bookmarked, false);
  assert.equal(h.actions.readRevision(), 2);
  assert.equal(h.state.bookmarks.length, 0);
  h.destroy();
});
test('RLS-hidden post returns no interactive stale card', async () => {
  const h = harness();
  h.replies.push({ data: [], error: null }, { data: [], error: null }, { data: [], error: null });
  h.actions.observe(h.post);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.view(h.post), null);
  const fresh = { ...h.post };
  h.actions.observe(fresh);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(h.actions.view(fresh).id, P);
  assert.equal(h.actions.reactionsReady(P), true);
  h.destroy();
});
test('replies read actual posts by parent_id with independent paging', async () => {
  const h = harness();
  const reply = { ...h.state.postRows[0], id: B, parent_id: P, content: 'A reply' };
  h.state.postRows.push(reply);
  assert.deepEqual(
    (await h.actions.comments(P)).map((r) => r.id),
    [B],
  );
  const query = h.calls.find((q) => q.table === 'posts');
  assert.deepEqual(query.filters, [['eq', 'parent_id', P]]);
  assert.deepEqual(query.range, [0, 49]);
  await assert.rejects(h.actions.comments(P, -1));
  h.destroy();
});
test('reply insert uses the six allowed fields and never supplies id or counters', async () => {
  const h = harness();
  h.actions.observe(h.post);
  await new Promise((r) => setTimeout(r, 20));
  const row = await h.actions.comment(h.post, ' A reply ', null);
  assert.equal(row.parent_id, P);
  assert.equal(row.content, 'A reply');
  const write = h.calls.find((q) => q.table === 'posts' && q.insert);
  assert.deepEqual(write.insert[0], {
    user_id: A,
    content: 'A reply',
    parent_id: P,
    media_url: null,
    media_type: null,
    repost_of_id: null,
  });
  assert.equal(
    h.calls.some((q) => ['kampusx_add_comment', 'kampusx_post_state'].includes(q.rpc)),
    false,
  );
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(h.actions.view(h.post).stats.replies, 1);
  h.destroy();
});
test('missing reply migration, hidden root and unrelated parent cannot insert', async () => {
  const h = harness();
  h.state.replySetup = false;
  await assert.rejects(h.actions.comment(h.post, 'Reply', null), (e) => e.key === 'social.errors.setup');
  h.state.replySetup = true;
  h.state.postRows.push({ ...h.state.postRows[0], id: B, parent_id: A });
  await assert.rejects(h.actions.comment(h.post, 'Reply', B), (e) => e.key === 'social.errors.unavailable');
  h.state.postRows = [];
  await assert.rejects(
    h.actions.comment(h.post, 'Reply', null),
    (e) => e.key === 'social.errors.unavailable',
  );
  assert.equal(
    h.calls.some((q) => q.insert),
    false,
  );
  h.destroy();
});
test('reply rows without mounted cards do not accumulate background reaction snapshots', async () => {
  const h = harness();
  await h.actions.comment(h.post, 'Reply', null);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(
    h.calls.some((q) => q.table === 'likes' || q.table === 'bookmarks'),
    false,
  );
  h.destroy();
});
test('one nested reply is allowed but the next level is rejected before a write', async () => {
  const h = harness();
  h.state.postRows.push({ ...h.state.postRows[0], id: B, parent_id: P });
  const nested = await h.actions.comment(h.post, 'Nested', B);
  assert.equal(nested.parent_id, B);
  const row = h.state.postRows.find((r) => r.id === nested.id);
  const nestedPost = { ...h.post, id: row.id, parentId: B };
  await assert.rejects(
    h.actions.comment(nestedPost, 'Too deep', null),
    (e) => e.key === 'social.errors.replyDepth',
  );
  assert.equal(h.calls.filter((q) => q.insert).length, 1);
  h.destroy();
});
test('a lost reply receipt is uncertain, preserves safe errors and never retries automatically', async () => {
  const h = harness();
  h.replies.push(
    { data: '2026102102', error: null },
    { data: h.state.postRows[0], error: null },
    { data: null, error: { message: 'PRIVATE_DETAIL' }, status: 503 },
  );
  await assert.rejects(
    h.actions.comment(h.post, 'Reply', null),
    (e) => e.key === 'social.errors.commentUncertain',
  );
  assert.equal(h.calls.filter((q) => q.insert).length, 1);
  assert.equal(h.actions.busy(P), false);
  h.destroy();
});
test('delayed reply response from a replaced session cannot update local state', async () => {
  const h = harness();
  let release;
  h.replies.push(
    { data: '2026102102', error: null },
    { data: h.state.postRows[0], error: null },
    () => new Promise((r) => (release = r)),
  );
  const pending = h.actions.comment(h.post, 'Reply', null);
  await new Promise((r) => setImmediate(r));
  h.auth.sessionEpoch.set(2);
  h.effects.forEach((fn) => fn());
  assert.equal(h.calls.find((q) => q.table === 'posts' && q.insert).signal.aborted, true);
  release({ data: null, error: null, status: 201 });
  await assert.rejects(pending, (e) => e.key === 'media.errors.session');
  assert.equal(h.actions.view(h.post).stats.replies, 0);
  h.destroy();
});
test('soft delete commits before Storage cleanup and uses only the owned server media URL', async () => {
  const h = harness();
  const path = A + '/post/55555555-5555-4555-8555-555555555555.webp';
  h.state.postRows[0].media_url = 'https://example.supabase.co/storage/v1/object/public/uploads/' + path;
  await h.actions.remove(h.post);
  const steps = h.calls.filter((c) => c.rpc || c === 'storage-remove').map((c) => c.rpc ?? c);
  assert.ok(steps.indexOf('kampusx_soft_delete_post') < steps.indexOf('storage-remove'));
  assert.ok(h.state.postRows[0].deleted_at);
  assert.equal(h.actions.view(h.post), null);
  assert.equal(
    h.calls.some((c) => c.table === 'posts' && c.delete),
    false,
  );
  h.destroy();
});
test('failed cleanup keeps the post soft deleted and never invites another deletion', async () => {
  const h = harness();
  h.state.postRows[0].media_url =
    'https://example.supabase.co/storage/v1/object/public/uploads/' +
    A +
    '/post/55555555-5555-4555-8555-555555555555.webp';
  h.state.remove = async () => {
    throw Error('PRIVATE_ERROR');
  };
  await h.actions.remove(h.post);
  assert.equal(h.actions.view(h.post), null);
  assert.ok(h.state.postRows[0].deleted_at);
  h.destroy();
});
test('foreign owner and missing migration cannot reach a delete or Storage', async () => {
  const h = harness();
  await assert.rejects(h.actions.remove({ ...h.post, userId: B }));
  assert.equal(h.calls.length, 0);
  h.state.ownerSetup = false;
  await assert.rejects(h.actions.remove(h.post), (e) => e.key === 'social.errors.ownerSetup');
  assert.equal(
    h.calls.some((c) => c.rpc === 'kampusx_soft_delete_post'),
    false,
  );
  assert.equal(h.calls.includes('storage-remove'), false);
  h.destroy();
});
test('pin and archive write only allowlisted owned fields without RETURNING', async () => {
  const h = harness();
  await h.actions.pin(h.post);
  assert.ok(h.state.postRows[0].pinned_at);
  await h.actions.archive(h.post, true);
  assert.ok(h.state.postRows[0].archived_at);
  assert.equal(h.state.postRows[0].pinned_at, null);
  for (const q of h.calls.filter((q) => q.update)) {
    assert.equal(q.select, undefined);
    assert.ok(q.filters.some((f) => f[1] === 'user_id' && f[2] === A));
    assert.ok(Object.keys(q.update[0]).every((k) => ['pinned_at', 'archived_at'].includes(k)));
  }
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

test('profile details persist with exactly the two mutable public fields', async () => {
  const h = harness();
  await h.account.saveDetails({
    fullName: ' Canonical Name ',
    bio: ' Bio ',
    username: 'forged',
    university: 'forged',
  });
  const q = h.calls.find((q) => q.table === 'profiles' && q.update);
  assert.deepEqual(q.update[0], { full_name: 'Canonical Name', bio: 'Bio' });
  assert.ok(q.filters.some((f) => f[1] === 'user_id' && f[2] === A));
  h.destroy();
});
test('audience is exclusive and absent academic IDs cannot enable a level', async () => {
  const h = harness();
  await assert.rejects(
    h.account.save({
      visible_department: true,
      visible_campus: true,
      visible_university: false,
      visible_explore: false,
    }),
    { key: 'accountStatus.saveError' },
  );
  h.state.profile.campus_id = null;
  await assert.rejects(
    h.account.save({
      visible_department: false,
      visible_campus: true,
      visible_university: false,
      visible_explore: false,
    }),
    { key: 'accountStatus.missingAcademic' },
  );
  assert.equal(
    h.calls.some((q) => q.table === 'profiles' && q.update),
    false,
  );
  h.destroy();
});

test('plain repost and quotes insert only six fields with no counter/identity writes', async () => {
  const h = harness();
  await h.actions.repost(h.post, true);
  const first = h.calls.find((q) => q.table === 'posts' && q.insert);
  assert.deepEqual(first.insert[0], {
    user_id: A,
    content: '',
    parent_id: null,
    repost_of_id: P,
    media_url: null,
    media_type: null,
  });
  await h.actions.quote(h.post, ' Quoted text ');
  assert.equal(h.state.postRows.filter((r) => r.repost_of_id === P).length, 2);
  await h.actions.repost(h.post, false);
  assert.ok(h.state.postRows.find((r) => r.repost_of_id === P && r.content === '').deleted_at);
  h.destroy();
});
test('invalid quote drafts and replies/reposts cannot be pinned', async () => {
  const h = harness();
  for (const text of ['', ' ', 'x'.repeat(2001)])
    await assert.rejects(h.actions.quote(h.post, text), { key: 'social.repost.textError' });
  h.state.postRows[0].repost_of_id = B;
  await assert.rejects(h.actions.pin(h.post), { key: 'social.errors.pinReply' });
  assert.equal(
    h.calls.some((q) => q.insert || q.update),
    false,
  );
  h.destroy();
});
test('an uncertain quote cannot be submitted again in the same session', async () => {
  const h = harness();
  h.replies.push(() => {
    throw new TypeError('lost response');
  });
  await assert.rejects(h.actions.quote(h.post, 'Quote'), { key: 'social.repost.uncertain' });
  await assert.rejects(h.actions.quote(h.post, 'Quote'), { key: 'social.repost.uncertain' });
  assert.equal(h.calls.filter((q) => q.table === 'posts' && q.insert).length, 1);
  h.destroy();
});
