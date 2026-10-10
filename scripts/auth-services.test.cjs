const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { AuthError } = require('@supabase/supabase-js');

const root = path.resolve(__dirname, '..');
const anonymousResult = () => ({ data: { session: null, user: null }, error: null });
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'student@itu.edu.tr' };
const session = { access_token: 'test-access-token', refresh_token: 'test-refresh-token', user };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.update = (update) => (value = update(value));
  read.asReadonly = () => () => value;
  return read;
}

// Exercise the real service/guard logic, replacing only Angular DI and the SDK boundary.
// No Supabase client is created and no network requests are made in these tests.
function harness(overrides = {}, configured = true, browser = null) {
  class SupabaseService {}
  class DestroyRef {}
  class Router {}
  const DOCUMENT = Symbol('DOCUMENT');
  const destroyCallbacks = [];
  const calls = { remember: [], signIn: [], signUp: [], signOut: [], updateUser: [] };
  let authCallback;
  let unsubscribeCount = 0;
  const auth = {
    initialize: async () => ({ error: null }),
    getSession: async () => anonymousResult(),
    getUser: async () => ({ data: { user }, error: null }),
    onAuthStateChange(callback) {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: () => unsubscribeCount++ } } };
    },
    signInWithPassword: async (credentials) => {
      calls.signIn.push(credentials);
      return { data: { session, user }, error: null };
    },
    signUp: async (credentials) => {
      calls.signUp.push(credentials);
      return { data: { session: null, user }, error: null };
    },
    signOut: async (options) => {
      calls.signOut.push(options);
      return { error: null };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async (attributes) => {
      calls.updateUser.push(attributes);
      return { data: { user }, error: null };
    },
    ...overrides,
  };
  const supabase = {
    client: configured ? { auth } : null,
    setRemember(value) {
      calls.remember.push(value);
    },
    redirectTo(route) {
      return new URL(route, 'http://localhost:4300').href;
    },
  };
  const router = { createUrlTree: (commands) => ({ redirect: commands }) };
  const destroyRef = { destroyed: false, onDestroy: (callback) => destroyCallbacks.push(callback) };
  const dependencies = new Map([
    [SupabaseService, supabase],
    [DestroyRef, destroyRef],
    [Router, router],
    [DOCUMENT, { location: browser?.location || { origin: 'http://localhost:4300' }, defaultView: browser }],
  ]);
  const angular = {
    Injectable: () => (target) => target,
    DestroyRef,
    inject(token) {
      assert.ok(dependencies.has(token), `Unmocked injection: ${token?.name || String(token)}`);
      return dependencies.get(token);
    },
    signal,
    computed: (calculate) => calculate,
  };
  const modules = new Map();
  function load(relativePath) {
    const filename = path.resolve(root, relativePath);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {};
    modules.set(filename, exports);
    const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    const boundaryRequire = (specifier) => {
      if (specifier === '@angular/core') return angular;
      if (specifier === '@angular/common') return { DOCUMENT };
      if (specifier === '@angular/router') return { Router };
      if (specifier === './supabase.service') return { SupabaseService };
      if (specifier.startsWith('.'))
        return load(path.relative(root, path.resolve(path.dirname(filename), `${specifier}.ts`)));
      return require(specifier);
    };
    new Function('exports', 'require', 'window', js)(exports, boundaryRequire, {
      location: { origin: 'http://localhost:4300' },
    });
    return exports;
  }
  const { AuthService } = load('apps/shell/src/app/core/auth.service.ts');
  const service = new AuthService();
  dependencies.set(AuthService, service);
  return {
    service,
    auth,
    calls,
    emit: (event, nextSession) => authCallback(event, nextSession),
    destroy: () => {
      destroyRef.destroyed = true;
      destroyCallbacks.forEach((callback) => callback());
    },
    unsubscribeCount: () => unsubscribeCount,
    guard: (...args) => load('apps/shell/src/app/core/auth.guard.ts').authGuard(...args),
  };
}

test('auth initialization restores a session and exposes readonly state', async () => {
  const { service } = harness({ getSession: async () => ({ data: { session }, error: null }) });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.session(), session);
  assert.equal(typeof service.session.set, 'undefined');
});

test('a newer auth event wins over a stale initialization snapshot', async () => {
  const snapshot = deferred();
  const started = deferred();
  const { service, emit } = harness({
    getSession: () => {
      started.resolve();
      return snapshot.promise;
    },
  });
  await started.promise;
  emit('SIGNED_IN', session);
  snapshot.resolve({ data: { session: null }, error: null });
  await service.ready;
  assert.equal(service.session(), session);
});

test('returned callback initialization errors remain visible', async () => {
  const error = new AuthError('Expired callback', 403, 'otp_expired');
  const { service } = harness({ initialize: async () => ({ error }) });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.initializationError()?.code, 'otp_expired');
  assert.equal(service.recovery(), false);
});

test('thrown initialization failures settle ready instead of leaking rejection', async () => {
  const { service } = harness({
    initialize: async () => {
      throw new TypeError('Failed to fetch');
    },
  });
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.ok(service.initializationError());
  assert.equal(service.session(), null);
});

test('session lookup errors do not initialize an authenticated session', async () => {
  const error = new AuthError('Refresh failed', 401, 'refresh_token_not_found');
  const { service } = harness({ getSession: async () => ({ data: { session: null }, error }) });
  await service.ready;
  assert.equal(service.session(), null);
  assert.equal(service.initializationError()?.code, error.code);
});

test('unconfigured auth settles readiness and denies verified access', async () => {
  const { service } = harness({}, false);
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(await service.hasVerifiedSession(), false);
  const result = await service.signIn('student@itu.edu.tr', 'password');
  assert.ok(result.error);
});

test('app destruction unsubscribes the auth event handler', async () => {
  const context = harness();
  await context.service.ready;
  context.destroy();
  assert.equal(context.unsubscribeCount(), 1);
});

test('sign-in applies the requested persistence before the SDK request', async () => {
  const { service, calls } = harness();
  await service.ready;
  await service.signIn('student@itu.edu.tr', 'password', false);
  await service.signIn('student@itu.edu.tr', 'password', true);
  assert.deepEqual(calls.remember, [false, true]);
  assert.deepEqual(calls.signIn, [
    { email: 'student@itu.edu.tr', password: 'password' },
    { email: 'student@itu.edu.tr', password: 'password' },
  ]);
});

test('sign-out targets the current session', async () => {
  const { service, calls } = harness();
  await service.ready;
  await service.signOut();
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('normal sign-in cannot authorize the password recovery form', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('SIGNED_IN', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.ok(result.error);
  assert.equal(result.passwordUpdated, false);
  assert.deepEqual(calls.updateUser, []);
});

test('recovery events require an actual session before changing a password', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('PASSWORD_RECOVERY', null);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.ok(result.error);
  assert.deepEqual(calls.updateUser, []);
});

test('a recovery password update is followed by current-session sign-out', async () => {
  const { service, emit, calls } = harness();
  await service.ready;
  emit('PASSWORD_RECOVERY', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.equal(result.passwordUpdated, true);
  assert.equal(result.error, null);
  assert.deepEqual(calls.updateUser, [{ password: 'NewStrongPassword123!' }]);
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('logout failure after a password update does not claim the password change failed', async () => {
  const error = new AuthError('Logout unavailable', 503, 'unexpected_failure');
  const { service, emit } = harness({ signOut: async () => ({ error }) });
  await service.ready;
  emit('PASSWORD_RECOVERY', session);
  const result = await service.updatePassword('NewStrongPassword123!');
  assert.equal(result.passwordUpdated, true);
  assert.equal(result.error?.code, 'password_updated_signout_failed');
  assert.equal(service.errorKey(result.error), 'auth.errors.signOut');
});

test('destroyed services ignore a pending initialization snapshot', async () => {
  const snapshot = deferred();
  const started = deferred();
  const context = harness({
    getSession: () => {
      started.resolve();
      return snapshot.promise;
    },
  });
  await started.promise;
  context.destroy();
  snapshot.resolve({ data: { session }, error: null });
  await context.service.ready;
  assert.equal(context.service.session(), null);
  assert.equal(context.unsubscribeCount(), 1);
});

test('registration normalizes display metadata without accepting roles', async () => {
  const { service, calls } = harness();
  await service.signUp(' student@itu.edu.tr ', 'password', ' @student ');
  assert.deepEqual(calls.signUp, [
    {
      email: 'student@itu.edu.tr',
      password: 'password',
      options: {
        data: { username: 'student' },
        emailRedirectTo: 'http://localhost:4300/auth/login',
      },
    },
  ]);
});

test('network exceptions become safe translated auth errors', async () => {
  const { service } = harness({
    signInWithPassword: async () => {
      throw new TypeError('PRIVATE_BACKEND_ERROR');
    },
  });
  const result = await service.signIn('student@itu.edu.tr', 'password');
  assert.equal(service.errorKey(result.error), 'auth.errors.network');
  assert.notEqual(result.error.message, 'PRIVATE_BACKEND_ERROR');
});

test('safe auth mappings distinguish useful failures without exposing arbitrary messages', async () => {
  const { service } = harness();
  const cases = [
    ['invalid_credentials', 'auth.errors.credentials'],
    ['email_not_confirmed', 'auth.errors.unconfirmed'],
    ['weak_password', 'auth.errors.weakPassword'],
    ['over_request_rate_limit', 'auth.errors.rateLimit'],
    ['otp_expired', 'auth.errors.recoveryInvalid'],
    ['UNEXPECTED_BACKEND_VALUE', 'auth.errors.generic'],
  ];
  for (const [code, key] of cases) {
    assert.equal(service.errorKey(new AuthError('PRIVATE_BACKEND_ERROR', 400, code)), key);
  }
  assert.equal(service.errorKey(new AuthError('Retry later', 429)), 'auth.errors.rateLimit');
});

test('callback cleanup removes credentials and errors while preserving unrelated URL state', async () => {
  let replacement;
  const browser = {
    location: {
      origin: 'http://localhost:4300',
      pathname: '/auth/update-password',
      href: 'http://localhost:4300/auth/update-password?code=private-code&intent=keep&error_description=private-error#access_token=private-access&refresh_token=private-refresh&type=recovery&section=keep',
    },
    history: {
      state: { navigationId: 2 },
      replaceState: (state, title, url) => (replacement = { state, title, url }),
    },
  };
  const { service } = harness({}, true, browser);
  await service.ready;
  assert.deepEqual(replacement, {
    state: { navigationId: 2 },
    title: '',
    url: '/auth/update-password?intent=keep#section=keep',
  });
});

test('restricted history does not turn callback cleanup into an unhandled auth failure', async () => {
  const browser = {
    location: {
      origin: 'http://localhost:4300',
      pathname: '/auth/login',
      href: 'http://localhost:4300/auth/login?code=private-code',
    },
    history: {
      state: null,
      replaceState: () => {
        throw new DOMException('History access denied', 'SecurityError');
      },
    },
  };
  const { service } = harness({}, true, browser);
  await service.ready;
  assert.equal(service.initialized(), true);
  assert.equal(service.initializationError(), null);
});

test('server verification rejects a token identifying another user', async () => {
  const { service, emit } = harness({
    getUser: async () => ({ data: { user: { ...user, id: 'another-user' } }, error: null }),
  });
  await service.ready;
  emit('SIGNED_IN', session);
  assert.equal(await service.hasVerifiedSession(), false);
});

test('server verification denies a stored session rejected by Supabase', async () => {
  const { service, emit } = harness({
    getUser: async () => ({ data: { user: null }, error: new AuthError('Invalid token', 401) }),
  });
  await service.ready;
  emit('SIGNED_IN', session);
  assert.equal(await service.hasVerifiedSession(), false);
});

test('the guard waits for restored-session readiness and requires server verification', async () => {
  const snapshot = deferred();
  const context = harness({ getSession: () => snapshot.promise });
  let settled = false;
  const guarded = context.guard({}, {}).then((result) => {
    settled = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(settled, false);
  snapshot.resolve({ data: { session }, error: null });
  assert.equal(await guarded, true);
});

test('the guard redirects anonymous users to local login', async () => {
  const context = harness({ getUser: async () => ({ data: { user: null }, error: null }) });
  await context.service.ready;
  assert.deepEqual(await context.guard({}, {}), { redirect: ['/auth/login'] });
});

test('sign-out during server verification prevents a stale guard approval', async () => {
  const verified = deferred();
  const started = deferred();
  const context = harness({
    getSession: async () => ({ data: { session }, error: null }),
    getUser: () => {
      started.resolve();
      return verified.promise;
    },
  });
  await context.service.ready;
  const guarded = context.guard({}, {});
  await started.promise;
  context.emit('SIGNED_OUT', null);
  verified.resolve({ data: { user }, error: null });
  assert.deepEqual(await guarded, { redirect: ['/auth/login'] });
});
