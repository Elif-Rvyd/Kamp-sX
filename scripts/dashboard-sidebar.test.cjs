const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const tick = () => new Promise((resolve) => setImmediate(resolve));
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  return read;
}
function harness() {
  const effects = [],
    cleanups = [],
    calls = [],
    navigations = [];
  const session = signal({ user: { id: 'owner' } }),
    epoch = signal(1),
    privacy = signal(0);
  let peopleRead = async (term) => [{ userId: term, username: term }],
    postsRead = async (term) => [{ id: term, text: term }];
  class AuthService {}
  class FollowsService {}
  class PostActionsService {}
  class DestroyRef {}
  class Router {}
  const DOCUMENT = Symbol('document'),
    destroy = { destroyed: false, onDestroy: (fn) => cleanups.push(fn) };
  class FormControl {
    constructor(value) {
      this.value = value;
      this.listeners = [];
      this.valueChanges = { pipe: () => ({ subscribe: (fn) => this.listeners.push(fn) }) };
    }
    setValue(value, options) {
      this.value = value;
      if (options?.emitEvent !== false) this.listeners.forEach((fn) => fn(value));
    }
  }
  const dependencies = new Map([
    [AuthService, { session, sessionEpoch: epoch }],
    [
      FollowsService,
      {
        privacyRevision: privacy,
        searchPeople: (term, abort) => {
          calls.push({ type: 'people', term, abort });
          return peopleRead(term, abort);
        },
      },
    ],
    [
      PostActionsService,
      {
        readRevision: signal(0),
        search: (term, abort) => {
          calls.push({ type: 'posts', term, abort });
          return postsRead(term, abort);
        },
      },
    ],
    [DestroyRef, destroy],
    [Router, { navigate: (...args) => navigations.push(args) }],
    [DOCUMENT, { getElementById: () => ({ focus() {} }) }],
  ]);
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(
      'apps/shell/src/app/features/dashboard/sidebar-search/sidebar-search.component.ts',
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
  new Function('exports', 'require', code)(exports, (name) => {
    if (name === '@angular/core')
      return {
        Component: () => (x) => x,
        ChangeDetectionStrategy: { OnPush: 0 },
        DestroyRef,
        inject: (t) => dependencies.get(t),
        signal,
        effect: (fn) => {
          effects.push(fn);
          fn();
        },
        untracked: (fn) => fn(),
      };
    if (name === '@angular/common') return { DOCUMENT };
    if (name === '@angular/forms') return { FormControl };
    if (name === '@angular/router') return { Router };
    if (name === '@angular/core/rxjs-interop') return { takeUntilDestroyed: () => () => {} };
    if (name.endsWith('/auth.service')) return { AuthService };
    if (name.endsWith('/follows.service')) return { FollowsService };
    if (name.endsWith('/post-actions.service')) return { PostActionsService };
    if (name === '@kampusx/shared/util') return { profileInitials: (x) => x };
    return {};
  });
  const page = new exports.SidebarSearchComponent();
  return {
    page,
    calls,
    navigations,
    effects,
    session,
    epoch,
    privacy,
    readPeople: (fn) => (peopleRead = fn),
    readPosts: (fn) => (postsRead = fn),
    load: () => {
      clearTimeout(page.timer);
      return page.load();
    },
    destroy: () => {
      destroy.destroyed = true;
      cleanups.forEach((fn) => fn());
    },
  };
}
test('dashboard search cancels obsolete reads and late replies cannot replace a newer term', async () => {
  const h = harness();
  let resolvePeople, resolvePosts;
  h.readPeople(() => new Promise((resolve) => (resolvePeople = resolve)));
  h.readPosts(() => new Promise((resolve) => (resolvePosts = resolve)));
  try {
    h.page.query.setValue('old');
    const old = h.load();
    await tick();
    h.readPeople(async () => [{ userId: 'new' }]);
    h.readPosts(async () => [{ id: 'new' }]);
    h.page.query.setValue('new');
    await h.load();
    assert.ok(h.calls.slice(0, 2).every((call) => call.abort.aborted));
    resolvePeople([{ userId: 'old' }]);
    resolvePosts([{ id: 'old' }]);
    await old;
    assert.deepEqual(h.page.people(), [{ userId: 'new' }]);
    assert.deepEqual(h.page.posts(), [{ id: 'new' }]);
  } finally {
    h.destroy();
  }
});
test('dashboard search clears identity-owned data on logout and never repeats the previous account query', async () => {
  const h = harness();
  try {
    h.page.query.setValue('deniz');
    await h.load();
    const count = h.calls.length;
    h.session.set(null);
    h.epoch.set(2);
    h.effects.forEach((fn) => fn());
    assert.equal(h.page.query.value, '');
    assert.deepEqual(h.page.people(), []);
    assert.deepEqual(h.page.posts(), []);
    assert.equal(h.page.open(), false);
    assert.equal(h.calls.length, count);
  } finally {
    h.destroy();
  }
});
test('dashboard search respects IME, preserves independent read results and submits to the existing search route', async () => {
  const h = harness();
  try {
    h.page.compositionStart();
    h.page.query.setValue('deniz');
    await h.load();
    assert.equal(h.calls.length, 0);
    h.readPeople(async () => {
      throw Error('PRIVATE');
    });
    h.page.compositionEnd();
    await h.load();
    assert.equal(h.page.peopleError(), true);
    assert.equal(h.page.postsError(), false);
    assert.equal(h.page.posts()[0].id, 'deniz');
    h.page.submit({ preventDefault() {} });
    assert.deepEqual(h.navigations, [[['/search'], { queryParams: { q: 'deniz' } }]]);
  } finally {
    h.destroy();
  }
});
test('a privacy invalidation clears previews before the permitted results are read again', async () => {
  const h = harness();
  try {
    h.page.query.setValue('deniz');
    await h.load();
    assert.equal(h.page.people().length, 1);
    h.readPeople(async () => []);
    h.readPosts(async () => []);
    h.privacy.set(1);
    h.effects.forEach((fn) => fn());
    assert.deepEqual(h.page.people(), []);
    assert.deepEqual(h.page.posts(), []);
    await h.load();
    assert.deepEqual(h.page.people(), []);
  } finally {
    h.destroy();
  }
});
