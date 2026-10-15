const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const OWNER = '11111111-1111-4111-8111-111111111111';
const signal = (value) => {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (fn) => (value = fn(value));
  return read;
};
function harness() {
  class AuthService {}
  class SupabaseService {}
  class DestroyRef {}
  const DOCUMENT = Symbol('document');
  const calls = [],
    results = [],
    effects = [];
  const state = { uploadError: null, verified: true, switchAfterValidation: false, closed: 0 };
  const auth = {
    session: signal({ user: { id: OWNER } }),
    sessionEpoch: signal(1),
    hasVerifiedSession: async () => state.verified,
  };
  const destroyRef = { destroyed: false };
  const base = 'https://example.supabase.co/storage/v1/object/public/uploads/';
  const bucket = {
    getPublicUrl: (key) => ({ data: { publicUrl: base + key } }),
    upload: async (key, file, options) => {
      calls.push({ kind: 'upload', key, file, options });
      return { error: state.uploadError };
    },
  };
  const client = {
    storage: {
      from: (name) => {
        assert.equal(name, 'uploads');
        return bucket;
      },
    },
    schema: (name) => {
      assert.equal(name, 'public');
      return {
        from: (table) => {
          const query = { table, filters: [] };
          const builder = {};
          for (const operation of [
            'select',
            'order',
            'limit',
            'abortSignal',
            'maybeSingle',
            'single',
            'eq',
            'insert',
            'update',
          ])
            builder[operation] = (...args) => {
              if (operation === 'eq') query.filters.push(args);
              else query[operation] = args;
              return builder;
            };
          builder.then = (resolve, reject) => {
            calls.push({ kind: 'database', ...query });
            const response = results.shift() || { data: [], error: null, status: 200, count: 0 };
            return (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)).then(
              resolve,
              reject,
            );
          };
          return builder;
        },
      };
    },
  };
  const deps = new Map([
    [AuthService, auth],
    [SupabaseService, { client }],
    [DestroyRef, destroyRef],
    [
      DOCUMENT,
      {
        defaultView: {
          crypto: { randomUUID: () => 'random-id' },
          createImageBitmap: async () => {
            if (state.switchAfterValidation) auth.session.set({ user: { id: 'other' } });
            return { width: 1, height: 1, close: () => state.closed++ };
          },
        },
      },
    ],
  ]);
  const modules = new Map();
  const angular = {
    DestroyRef,
    Injectable: () => (target) => target,
    inject: (token) => {
      assert.ok(deps.has(token), `Unexpected DI token ${token?.name}`);
      return deps.get(token);
    },
    signal,
    computed: (fn) => fn,
    effect: (fn) => effects.push(fn),
  };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
      },
    }).outputText;
    new Function('require', 'exports', js)((specifier) => {
      if (specifier === '@angular/core') return angular;
      if (specifier === '@angular/common') return { DOCUMENT };
      if (specifier === './auth.service') return { AuthService };
      if (specifier === './supabase.service') return { SupabaseService };
      if (specifier === '@kampusx/shared/util') return load('libs/shared/util/image-header.ts');
      if (specifier.startsWith('.'))
        return load(path.relative(root, path.resolve(path.dirname(filename), specifier + '.ts')));
      throw Error(`Unmocked dependency ${specifier}`);
    }, exports);
    return exports;
  }
  const { MediaService } = load('apps/shell/src/app/core/media.service.ts');
  const media = new MediaService();
  deps.set(MediaService, media);
  const { ProfileRepository } = load('apps/shell/src/app/core/profile-repository.service.ts');
  const { PostsService } = load('apps/shell/src/app/core/posts.service.ts');
  return {
    media,
    repository: new ProfileRepository(),
    posts: new PostsService(),
    calls,
    results,
    state,
    auth,
    destroyRef,
    effects,
    base,
  };
}
const png = () =>
  new File(
    [
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZZkAAAAASUVORK5CYII=',
        'base64',
      ),
    ],
    'photo.png',
    { type: 'image/png' },
  );
test('actual media service rejects spoofed content and profile videos before uploading', async () => {
  const h = harness();
  await assert.rejects(
    h.media.upload(new File(['plain text'], 'fake.png', { type: 'image/png' }), 'avatar', OWNER),
    { key: 'profile.errors.image' },
  );
  await assert.rejects(h.media.upload(new File(['video'], 'v.mp4', { type: 'video/mp4' }), 'banner', OWNER), {
    key: 'media.errors.type',
  });
  await assert.rejects(h.media.upload(new File(['svg'], 'v.svg', { type: 'image/svg+xml' }), 'post', OWNER), {
    key: 'media.errors.type',
  });
  assert.equal(h.calls.length, 0);
});
test('actual media service uses a user-owned random path and reuses a confirmed upload', async () => {
  const h = harness(),
    file = png();
  const result = await h.media.upload(file, 'avatar', OWNER);
  assert.equal(result.path, `${OWNER}/avatar/random-id.png`);
  assert.equal(result.url, h.base + result.path);
  assert.deepEqual(h.calls[0].options, { contentType: 'image/png', cacheControl: '3600', upsert: false });
  assert.equal(await h.media.upload(file, 'avatar', OWNER), result);
  assert.equal(h.calls.length, 1);
  assert.equal(h.state.closed, 1);
});
test('account changes during decoding and invalid sessions cannot write Storage', async () => {
  const h = harness();
  h.state.switchAfterValidation = true;
  await assert.rejects(h.media.upload(png(), 'post', OWNER), { key: 'media.errors.session' });
  h.state.verified = false;
  await assert.rejects(h.media.upload(png(), 'post', OWNER), { key: 'media.errors.session' });
  assert.equal(h.calls.length, 0);
});
test('public URLs accept only this configured bucket without credentials or alternate origins', () => {
  const h = harness();
  assert.ok(h.media.isPublicUrl(h.base + OWNER + '/avatar/file.png'));
  for (const value of [
    'javascript:alert(1)',
    'https://evil.example/a.png',
    h.base.replace('uploads/', 'private/') + 'x',
    h.base + 'x?redirect=evil',
    h.base + 'x#fragment',
    h.base.replace('https://', 'https://user:password@') + 'x',
  ])
    assert.equal(h.media.isPublicUrl(value), false);
});
test('profile updates filter by user_id and never send roles or auth credentials', async () => {
  const h = harness(),
    value = { avatar_url: h.base + OWNER + '/avatar/x.png', banner_url: null };
  h.results.push({ data: { user_id: OWNER }, error: null });
  await h.repository.save(OWNER, value);
  assert.deepEqual(h.calls[0].filters, [['user_id', OWNER]]);
  assert.deepEqual(h.calls[0].update, [value]);
  assert.equal(h.calls[0].table, 'profiles');
});
test('missing profiles are inserted with the same user_id contract', async () => {
  const h = harness(),
    value = { avatar_url: null, banner_url: h.base + OWNER + '/banner/x.png' };
  h.results.push({ data: null, error: null }, { data: { user_id: OWNER }, error: null });
  await h.repository.save(OWNER, value);
  assert.deepEqual(h.calls[1].insert, [{ user_id: OWNER, ...value }]);
});
test('a rejected profile write is reported; a confirmed commit survives a lost response', async () => {
  const h = harness(),
    value = { avatar_url: null, banner_url: null };
  h.results.push({ data: null, error: { code: '42501' } }, { data: null, error: null });
  await assert.rejects(h.repository.save(OWNER, value), { key: 'media.errors.profileSave' });
  h.results.push(new TypeError('connection lost'), { data: { user_id: OWNER, ...value }, error: null });
  await h.repository.save(OWNER, value);
});
test('text posts use the current user_id and the four declared payload fields', async () => {
  const h = harness();
  h.results.push({
    data: { id: 'created', user_id: OWNER, content: 'Hello', media_url: null, media_type: null },
    error: null,
    status: 201,
  });
  await h.posts.publish('  Hello  ');
  const write = h.calls.find((call) => call.insert);
  assert.deepEqual(write.insert, [{ user_id: OWNER, content: 'Hello', media_url: null, media_type: null }]);
  assert.equal(write.table, 'posts');
});
test('image upload completes before a post stores its public URL', async () => {
  const h = harness(),
    url = h.base + OWNER + '/post/random-id.png';
  h.results.push({
    data: { id: 'p', user_id: OWNER, content: '', media_url: url, media_type: 'image' },
    error: null,
    status: 201,
  });
  await h.posts.publish('', png());
  assert.equal(h.calls[0].kind, 'upload');
  assert.deepEqual(h.calls[1].insert, [{ user_id: OWNER, content: '', media_url: url, media_type: 'image' }]);
});
test('upload failure never creates a post; ambiguous database outcomes are never blindly retried', async () => {
  const h = harness();
  h.state.uploadError = { message: 'denied' };
  await assert.rejects(h.posts.publish('draft', png()), { key: 'media.errors.upload' });
  assert.equal(h.calls.filter((call) => call.insert).length, 0);
  h.results.push({ data: null, error: { message: 'unavailable' }, status: 503 });
  await assert.rejects(h.posts.publish('draft'), { key: 'media.errors.uncertain' });
  assert.equal(h.calls.filter((call) => call.insert).length, 1);
});
test('empty and oversized content is refused before any write', async () => {
  const h = harness();
  await assert.rejects(h.posts.publish('   '), { key: 'media.errors.content' });
  await assert.rejects(h.posts.publish('a'.repeat(2001)), { key: 'media.errors.content' });
  assert.equal(h.calls.length, 0);
});

test('profile repository strips unexpected runtime fields including a forged user_id', async () => {
  const h = harness();
  h.results.push({ data: null, error: null }, { data: { user_id: OWNER }, error: null });
  await h.repository.save(OWNER, {
    avatar_url: null,
    banner_url: null,
    user_id: 'other',
    role: 'admin',
    password: 'not-a-real-password',
  });
  assert.deepEqual(h.calls[0].update, [{ avatar_url: null, banner_url: null }]);
  assert.deepEqual(h.calls[1].insert, [{ user_id: OWNER, avatar_url: null, banner_url: null }]);
});

test('same-user re-login while verification is pending invalidates the old upload', async () => {
  const h = harness();
  h.auth.hasVerifiedSession = async () => {
    h.auth.sessionEpoch.set(2);
    return true;
  };
  await assert.rejects(h.media.upload(png(), 'avatar', OWNER), { key: 'media.errors.session' });
  assert.equal(h.calls.length, 0);
});

test('media URL validation rejects encoded separators and active file formats', () => {
  const h = harness();
  for (const path of [
    `${OWNER}/avatar/x.svg`,
    `${OWNER}/avatar/x.html`,
    `${OWNER}/avatar/%2f..%2fsecret.png`,
    `${OWNER}/avatar/x.png/extra`,
  ])
    assert.equal(h.media.isPublicUrl(h.base + path), false, path);
});

test('profile writes reject foreign owners, wrong photo areas and incomplete runtime values', async () => {
  const h = harness();
  for (const value of [
    null,
    {},
    { avatar_url: h.base + 'other/avatar/photo.png', banner_url: null },
    { avatar_url: h.base + OWNER + '/post/file.png', banner_url: null },
    { avatar_url: null, banner_url: h.base + OWNER + '/banner/video.mp4' },
  ])
    await assert.rejects(h.repository.save(OWNER, value), { key: 'media.errors.upload' });
  assert.equal(h.calls.length, 0);
});

test('repository snapshots the allowed payload before awaiting authentication', async () => {
  const h = harness(),
    value = { avatar_url: null, banner_url: null };
  h.auth.hasVerifiedSession = async () => {
    value.avatar_url = h.base + OWNER + '/avatar/replaced.png';
    return true;
  };
  h.results.push({ data: { user_id: OWNER }, error: null });
  await h.repository.save(OWNER, value);
  assert.deepEqual(h.calls[0].update, [{ avatar_url: null, banner_url: null }]);
});

test('invalid or foreign profile media never becomes an apparently empty profile', async () => {
  const h = harness();
  h.results.push({
    data: { user_id: OWNER, avatar_url: 'https://attacker.invalid/pixel.png', banner_url: null },
    error: null,
  });
  await assert.rejects(h.repository.read(OWNER), { key: 'media.errors.profileRead' });
});

test('same-user re-login during post verification prevents a database insert', async () => {
  const h = harness();
  h.auth.hasVerifiedSession = async () => {
    h.auth.sessionEpoch.set(2);
    return true;
  };
  await assert.rejects(h.posts.publish('Old draft'), { key: 'media.errors.session' });
  assert.equal(h.calls.length, 0);
});

test('late feed responses from an old session cannot repopulate the current feed', async () => {
  const h = harness();
  let finishFeed, finishMine;
  h.results.push(
    new Promise((resolve) => (finishFeed = resolve)),
    new Promise((resolve) => (finishMine = resolve)),
  );
  const request = h.posts.load();
  await Promise.resolve();
  h.auth.sessionEpoch.set(2);
  const response = {
    data: [{ id: 'old', user_id: OWNER, content: 'Old session', media_url: null, media_type: null }],
    error: null,
    count: 1,
  };
  finishFeed(response);
  finishMine(response);
  await request;
  assert.deepEqual(h.posts.feed(), []);
  assert.deepEqual(h.posts.mine(), []);
});

test('prototype property names are not accepted as MIME types or upload purposes', async () => {
  const h = harness();
  for (const type of ['constructor', '__proto__', 'tostring'])
    await assert.rejects(h.media.validate(new File(['binary'], 'file', { type }), 'post'), {
      key: 'media.errors.type',
    });
  await assert.rejects(h.media.validate(png(), '../../other'), { key: 'media.errors.type' });
});

test('an uploaded File is not reused across separate logins', async () => {
  const h = harness(),
    file = png();
  await h.media.upload(file, 'avatar', OWNER);
  h.auth.sessionEpoch.set(2);
  await h.media.upload(file, 'avatar', OWNER);
  assert.equal(h.calls.filter((call) => call.kind === 'upload').length, 2);
});
