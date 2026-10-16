const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (fn) => (value = fn(value));
  read.asReadonly = () => () => value;
  return read;
}
function harness() {
  class AuthService {}
  class MediaService {}
  class ProfileRepository {}
  class PostsService {}
  class FollowsService {}
  class DestroyRef {}
  class TranslocoService {}
  const DOCUMENT = Symbol('document');
  const session = signal({
    user: {
      id: 'student-one',
      email: 'elif@university.edu.tr',
      user_metadata: {
        username: 'elif',
        full_name: 'Elif Yılmaz',
        university_name: 'Kırşehir Ahi Evran Üniversitesi',
        faculty_name: 'Teknik Bilimler MYO',
        department_name: 'Bilgisayar Programcılığı',
      },
    },
  });
  const sessionEpoch = signal(1);
  const dictionary = signal({
    profile: {
      mock: {
        posts: {
          library: 'Library',
          reply: 'Reply',
          club: 'Club',
          project: 'Project',
          replyTwo: 'Another reply',
          week: 'A week',
        },
      },
    },
  });
  const effects = [],
    cleanup = [],
    created = [],
    revoked = [];
  let closed = 0;
  let bitmapFailure = false;
  let bitmapPause;
  let decoded = 0;
  const destroyRef = { destroyed: false, onDestroy: (fn) => cleanup.push(fn) };
  const stored = new Map(),
    uploads = [];
  const academicCalls = [];
  let academicError = null;
  let photoError = false;
  const ownPosts = signal(
    ['post', 'reply', 'retweet', 'post', 'reply', 'post'].map((kind, i) => ({
      id: String(i),
      kind,
      text: 'Server content',
      createdAt: '2026-01-01T00:00:00Z',
      stats: { replies: 0, retweets: 0, likes: 0, views: 0 },
    })),
  );
  const dependencies = new Map([
    [PostsService, { mine: ownPosts, ownCount: signal(6) }],
    [FollowsService, { counts: signal({ following: 0, followers: 0 }) }],
    [
      ProfileRepository,
      {
        read: async (owner) => stored.get(owner) || null,
        save: async (owner, value) => {
          if (photoError) throw Error('Photo save rejected');
          stored.set(owner, value);
        },
      },
    ],
    [
      MediaService,
      {
        upload: async (file, purpose, owner) => {
          const value = {
            url: `https://test.supabase.co/storage/v1/object/public/uploads/${owner}/${purpose}/${uploads.length}.png`,
          };
          uploads.push(value);
          return value;
        },
      },
    ],
    [
      AuthService,
      {
        session,
        sessionEpoch,
        updateProfileDetails: async (value) => {
          academicCalls.push(value);
          if (!academicError)
            session.set({
              ...session(),
              user: {
                ...session().user,
                user_metadata: {
                  ...session().user.user_metadata,
                  full_name: value.fullName.trim(),
                  bio: value.bio.trim(),
                  university_name: value.university.trim(),
                  department_name: value.department.trim(),
                },
              },
            });
          return { error: academicError };
        },
      },
    ],
    [DestroyRef, destroyRef],
    [TranslocoService, { selectTranslation: () => dictionary }],
    [
      DOCUMENT,
      {
        defaultView: {
          createImageBitmap: async () => {
            decoded++;
            if (bitmapPause) await bitmapPause;
            if (bitmapFailure) throw Error('Invalid image');
            return { width: 1, height: 1, close: () => closed++ };
          },
          URL: {
            createObjectURL: () => {
              const url = `blob:test-${created.length}`;
              created.push(url);
              return url;
            },
            revokeObjectURL: (url) => revoked.push(url),
          },
        },
      },
    ],
  ]);
  const angular = {
    Injectable: () => (target) => target,
    inject: (token) => {
      assert.ok(dependencies.has(token));
      return dependencies.get(token);
    },
    DestroyRef,
    signal,
    computed: (calculate) => calculate,
    effect: (fn) => {
      effects.push(fn);
      fn();
    },
  };
  const modules = new Map();
  const load = (relative) => {
    const file = path.join(root, relative);
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    new Function('exports', 'require', js)(exports, (specifier) =>
      specifier === '@angular/core'
        ? angular
        : specifier === '@angular/common'
          ? { DOCUMENT }
          : specifier === '@angular/core/rxjs-interop'
            ? { toSignal: (source) => source }
            : specifier === '@jsverse/transloco'
              ? { TranslocoService }
              : specifier === './auth.service'
                ? { AuthService }
                : specifier === './media.service'
                  ? { MediaService }
                  : specifier === './profile-repository.service'
                    ? { ProfileRepository }
                    : specifier === './follows.service'
                      ? { FollowsService }
                      : specifier === './posts.service'
                        ? { PostsService }
                        : specifier === '@kampusx/shared/util'
                          ? {
                              ...load('libs/shared/util/image-header.ts'),
                              ...load('libs/shared/util/profile-image.ts'),
                            }
                          : specifier.startsWith('.')
                            ? load(path.relative(root, path.resolve(path.dirname(file), specifier + '.ts')))
                            : require(specifier),
    );
    return exports;
  };
  const { ProfileService } = load('apps/shell/src/app/core/profile.service.ts');
  const service = new ProfileService();
  return {
    service,
    created,
    revoked,
    uploads,
    academicCalls,
    failAcademic: () => (academicError = Error('Denied')),
    failPhotoSave: () => (photoError = true),
    refreshMetadata: (metadata) => {
      session.set({
        ...session(),
        user: { ...session().user, user_metadata: { ...session().user.user_metadata, ...metadata } },
      });
      effects.forEach((fn) => fn());
    },
    closed: () => closed,
    decoded: () => decoded,
    pauseBitmap: () => {
      let release;
      bitmapPause = new Promise((resolve) => (release = resolve));
      return () => release();
    },
    failBitmap: () => (bitmapFailure = true),
    changeUser: (user) => {
      sessionEpoch.set(sessionEpoch() + 1);
      session.set(user ? { user } : null);
      effects.forEach((fn) => fn());
    },
    setSessionOnly: (next) => session.set(next),
    replaceSameUserSession: () => sessionEpoch.set(sessionEpoch() + 1),
    destroy: () => {
      destroyRef.destroyed = true;
      cleanup.forEach((fn) => fn());
    },
    dictionary,
    load,
  };
}
const png = () =>
  new File(
    [
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
        'base64',
      ),
    ],
    'avatar.png',
    { type: 'image/png' },
  );

test('profile changes allow academic display fields but cannot edit account or role fields', async () => {
  const { service } = harness();
  await service.reload();
  const old = service.profile();
  await service.updateProfile({
    fullName: ' Yeni İsim ',
    bio: ' A campus bio ',
    username: 'intruder',
    university: 'Other school',
    department: 'New department',
    id: 'other',
    followersCount: 999,
  });
  assert.equal(service.profile().fullName, 'Yeni İsim');
  assert.equal(service.profile().bio, 'A campus bio');
  assert.equal(service.profile().university, 'Other school');
  assert.equal(service.profile().department, 'New department');
  for (const key of ['id', 'username', 'faculty', 'followersCount'])
    assert.equal(service.profile()[key], old[key]);
});

test('academic validation and a rejected account update keep the current profile and draft intact', async () => {
  const h = harness();
  await h.service.reload();
  const initial = h.service.profile();
  for (const university of [' ', 'x'.repeat(151), 123])
    await assert.rejects(h.service.updateProfile({ fullName: 'Elif', bio: '', university }), {
      key: 'profile.errors.university',
    });
  for (const department of [' ', 'x'.repeat(151), 123])
    await assert.rejects(h.service.updateProfile({ fullName: 'Elif', bio: '', department }), {
      key: 'profile.errors.department',
    });
  assert.equal(h.academicCalls.length, 0);
  h.failAcademic();
  await assert.rejects(
    h.service.updateProfile({ fullName: 'Elif', bio: '', university: 'Other university' }),
    { key: 'profile.errors.detailsSave' },
  );
  assert.deepEqual(h.service.profile(), initial);
});

test('account metadata refresh updates academic labels without erasing local name or bio', async () => {
  const h = harness();
  await h.service.reload();
  await h.service.updateProfile({ fullName: 'Local name', bio: 'Local bio' });
  h.refreshMetadata({ university_name: 'Updated university', department_name: 'Updated department' });
  assert.equal(h.service.profile().university, 'Updated university');
  assert.equal(h.service.profile().department, 'Updated department');
  assert.equal(h.service.profile().fullName, 'Local name');
  assert.equal(h.service.profile().bio, 'Local bio');
});

test('a photo write failure after an academic save reports the partial result honestly', async () => {
  const h = harness();
  await h.service.reload();
  const avatar = await h.service.uploadAvatar(png());
  h.failPhotoSave();
  await assert.rejects(
    h.service.updateProfile({
      fullName: 'Elif',
      bio: '',
      university: 'New university',
      department: 'New department',
      avatarUrl: avatar,
    }),
    { key: 'profile.errors.partialSave' },
  );
  assert.equal(h.service.profile().university, 'New university');
  assert.equal(h.service.profile().department, 'New department');
  assert.equal(h.service.profile().avatarUrl, undefined);
  assert.deepEqual(h.revoked, []);
});
test('whitespace names, length limits and unowned image URLs fail without changing state', async () => {
  const { service } = harness();
  await service.reload();
  const initial = service.profile();
  for (const payload of [
    { fullName: ' ', bio: '' },
    { fullName: 'x'.repeat(51), bio: '' },
    { fullName: 'Name', bio: 'x'.repeat(161) },
    { fullName: 'Name', bio: '', avatarUrl: 'https://untrusted.invalid/image.svg' },
  ])
    await assert.rejects(service.updateProfile(payload));
  assert.deepEqual(service.profile(), initial);
});
test('uploads only prepare previews; save retains the current image and replaces old URLs', async () => {
  const ctx = harness();
  const a = await ctx.service.uploadAvatar(png());
  assert.equal(ctx.service.profile().avatarUrl, undefined);
  await ctx.service.updateProfile({ fullName: 'Elif', bio: '', avatarUrl: a });
  ctx.service.releaseUpload(a);
  assert.deepEqual(ctx.revoked, [a]);
  const b = await ctx.service.uploadAvatar(png());
  await ctx.service.updateProfile({ fullName: 'Elif', bio: '', avatarUrl: b });
  assert.deepEqual(ctx.revoked, [a, b]);
  await ctx.service.updateProfile({ fullName: 'Elif', bio: '', avatarUrl: null });
  assert.deepEqual(ctx.revoked, [a, b]);
  assert.equal(ctx.closed(), 2);
});
test('cancelled previews and service destruction release owned object URLs', async () => {
  const ctx = harness();
  const avatar = await ctx.service.uploadAvatar(png());
  const cover = await ctx.service.uploadCover(png());
  ctx.service.releaseUpload(avatar);
  ctx.destroy();
  assert.deepEqual(ctx.revoked, [avatar, cover]);
});
test('image type, actual content, size and decoding are validated before preview creation', async () => {
  const ctx = harness();
  for (const file of [
    new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }),
    new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    new File(['not a PNG'], 'fake.png', { type: 'image/png' }),
  ])
    await assert.rejects(ctx.service.uploadAvatar(file));
  ctx.failBitmap();
  await assert.rejects(ctx.service.uploadCover(png()));
  assert.deepEqual(ctx.created, []);
});
test('switching accounts resets mock edits and revokes images instead of exposing another profile', async () => {
  const ctx = harness();
  const image = await ctx.service.uploadAvatar(png());
  await ctx.service.updateProfile({ fullName: 'Changed', bio: 'Private draft', avatarUrl: image });
  ctx.changeUser({
    id: 'student-two',
    email: 'another@university.edu.tr',
    user_metadata: { username: 'another' },
  });
  assert.equal(ctx.service.profile().username, 'another');
  assert.equal(ctx.service.profile().bio, '');
  assert.equal(ctx.service.profile().avatarUrl, undefined);
  assert.deepEqual(ctx.revoked, [image]);
});
test('persisted post content remains verbatim across locale changes and filters remain reusable', () => {
  const ctx = harness();
  const util = ctx.load('libs/shared/util/social-post.ts');
  const posts = ctx.service.posts();
  assert.equal(posts.length, 6);
  assert.equal(util.filterProfilePosts(posts, 0).length, 6);
  assert.equal(util.filterProfilePosts(posts, 1).length, 2);
  assert.equal(util.filterProfilePosts(posts, 2).length, 1);
  assert.deepEqual(util.filterProfilePosts([], 1), []);
  ctx.dictionary.set({ profile: { mock: { posts: { library: 'Kütüphane' } } } });
  assert.equal(ctx.service.posts()[0].text, 'Server content');
  ctx.dictionary.set({ 'profile.mock.posts.library': 'Flat dictionary text' });
  assert.equal(ctx.service.posts()[0].text, 'Server content');
  assert.equal(util.profileInitials('Elif Yılmaz'), 'EY');
});

test('malformed runtime updates and anonymous state cannot modify a profile', async () => {
  const ctx = harness();
  await ctx.service.reload();
  const initial = ctx.service.profile();
  for (const payload of [null, {}, { fullName: 123, bio: '' }, { fullName: 'Elif', bio: null }])
    await assert.rejects(ctx.service.updateProfile(payload));
  assert.deepEqual(ctx.service.profile(), initial);
  ctx.changeUser(null);
  await assert.rejects(ctx.service.updateProfile({ fullName: 'Anonymous', bio: '' }));
  await assert.rejects(ctx.service.uploadAvatar(png()));
  assert.equal(ctx.decoded(), 0);
});

test('a failed profile read blocks saves before any media upload', async () => {
  const ctx = harness();
  await ctx.service.reload();
  const url = await ctx.service.uploadAvatar(png());
  ctx.service.readError.set('media.errors.profileRead');
  await assert.rejects(ctx.service.updateProfile({ fullName: 'Elif', bio: '', avatarUrl: url }), {
    key: 'media.errors.profileRead',
  });
  assert.equal(ctx.uploads.length, 0);
});

test('re-login to the same account invalidates a pending decoded photo before effects run', async () => {
  const h = harness(),
    release = h.pauseBitmap();
  const request = h.service.uploadAvatar(png());
  await new Promise((resolve) => setImmediate(resolve));
  h.replaceSameUserSession();
  release();
  await assert.rejects(request, { key: 'profile.errors.upload' });
  assert.equal(h.created.length, 0);
  assert.equal(h.closed(), 1);
});

test('PNG, JPEG and every WebP header variant are bounded before bitmap decoding', async () => {
  const ctx = harness();
  const pngBytes = new Uint8Array(await png().arrayBuffer());
  new DataView(pngBytes.buffer).setUint32(16, 10000);
  new DataView(pngBytes.buffer).setUint32(20, 10000);
  const jpeg = Uint8Array.from([255, 216, 255, 192, 0, 8, 8, 39, 16, 39, 16, 3]);
  const webp = (kind, payload) => {
    const bytes = new Uint8Array(20 + payload.length + (payload.length % 2));
    bytes.set(Buffer.from('RIFF'));
    bytes.set(Buffer.from('WEBP'), 8);
    bytes.set(Buffer.from(kind), 12);
    const view = new DataView(bytes.buffer);
    view.setUint32(4, bytes.length - 8, true);
    view.setUint32(16, payload.length, true);
    bytes.set(payload, 20);
    return bytes;
  };
  const vp8x = Uint8Array.from([0, 0, 0, 0, 15, 39, 0, 15, 39, 0]);
  const vp8l = new Uint8Array(5);
  vp8l[0] = 47;
  new DataView(vp8l.buffer).setUint32(1, 9999 | (9999 << 14), true);
  const vp8 = Uint8Array.from([0, 0, 0, 157, 1, 42, 16, 39, 16, 39]);
  for (const [bytes, mime] of [
    [pngBytes, 'image/png'],
    [jpeg, 'image/jpeg'],
    [webp('VP8X', vp8x), 'image/webp'],
    [webp('VP8L', vp8l), 'image/webp'],
    [webp('VP8 ', vp8), 'image/webp'],
  ])
    await assert.rejects(
      ctx.service.uploadAvatar(new File([bytes], 'huge-image', { type: mime })),
      (error) => error.key === 'profile.errors.resolution',
    );
  assert.equal(ctx.decoded(), 0);
  assert.deepEqual(ctx.created, []);
});

test('truncated or corrupt headers do not throw parser bounds errors or reach the decoder', async () => {
  const ctx = harness();
  const { imageDimensions } = ctx.load('libs/shared/util/image-header.ts');
  assert.deepEqual(imageDimensions(new Uint8Array(await png().arrayBuffer()), 'image/png'), {
    width: 8,
    height: 8,
  });
  for (let size = 0; size < 100; size++)
    for (const mime of ['image/png', 'image/jpeg', 'image/webp']) {
      const bytes = new Uint8Array(size).fill(255);
      assert.equal(imageDimensions(bytes, mime), null);
    }
  for (const mime of ['image/png', 'image/jpeg', 'image/webp'])
    await assert.rejects(ctx.service.uploadCover(new File(['broken'], 'image', { type: mime })));
  assert.equal(ctx.decoded(), 0);
});

test('logout or account changes during decoding reject previews even before effects run', async () => {
  for (const next of [null, { user: { id: 'other-student' } }]) {
    const ctx = harness();
    const release = ctx.pauseBitmap();
    const pending = ctx.service.uploadAvatar(png());
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(ctx.decoded(), 1);
    ctx.setSessionOnly(next);
    release();
    await assert.rejects(pending, (error) => error.key === 'profile.errors.upload');
    assert.equal(ctx.closed(), 1);
    assert.deepEqual(ctx.created, []);
  }
});
