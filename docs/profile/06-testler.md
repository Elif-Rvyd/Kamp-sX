# KampüsX profil — değişen dosyaların TAM kodu

Proje kökü: `C:\Users\elifr\source\project\web\KampüsX`

Bu dosya eklenen/değiştirilen dosyaların son halini içerir. Kod blokları diff/parça değildir.
Yerel ortam değişkenleri, oluşturulan environment.ts ve gerçek oturum bilgileri dahil edilmez.

## scripts/auth-services.test.cjs (değişti)

````javascript
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
  const calls = { remember: [], signIn: [], signUp: [], signOut: [], updateUser: [], lookup: [] };
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
    client: configured
      ? {
          auth,
          rpc(name, params) {
            calls.lookup.push({ name, params });
            return {
              abortSignal(signal) {
                assert.ok(signal instanceof AbortSignal);
                return overrides.lookup ? overrides.lookup() : Promise.resolve({ data: true, error: null });
              },
            };
          },
        }
      : null,
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
    signedInGuard: (...args) => load('apps/shell/src/app/core/auth.guard.ts').signedInGuard(...args),
    matchesCallback: (...args) =>
      load('apps/shell/src/app/core/supabase-callback.ts').isSupabaseImplicitCallback(...args),
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

test('all credential failures use one message and never query account existence', async () => {
  for (const lookup of [
    async () => ({ data: false, error: null }),
    async () => ({ data: true, error: null }),
    async () => {
      throw new Error('RPC must never be called');
    },
  ]) {
    const error = new AuthError('PRIVATE_BACKEND_ERROR', 400, 'invalid_credentials');
    const { service, calls } = harness({
      signInWithPassword: async () => ({ ...anonymousResult(), error }),
      lookup,
    });
    const result = await service.signIn('Student@itu.edu.tr', 'PrivatePassword');
    assert.equal(result.error, error);
    assert.equal(service.errorKey(result.error), 'auth.errors.credentials');
    assert.equal(result.data.session, null);
    assert.deepEqual(calls.lookup, []);
  }
});

test('legacy missing-user error codes also map to the generic credentials message', () => {
  const { service } = harness();
  for (const code of ['user_not_found', 'login_user_not_found', 'invalid_credentials'])
    assert.equal(service.errorKey({ code }), 'auth.errors.credentials');
});

test('successful login, unconfirmed email, rate limits and network failures skip account lookup', async () => {
  for (const error of [
    null,
    new AuthError('Confirm', 400, 'email_not_confirmed'),
    new AuthError('Wait', 429, 'over_request_rate_limit'),
    new AuthError('Offline', 0, 'network_error'),
  ]) {
    const { service, calls } = harness({
      signInWithPassword: async () => ({
        data: { user: error ? null : user, session: error ? null : session },
        error,
      }),
    });
    const result = await service.signIn('student@itu.edu.tr', 'Password');
    assert.equal(result.error, error);
    assert.equal(calls.lookup.length, 0);
  }
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

test('token refresh keeps the session epoch but replacement and logout invalidate pending work', async () => {
  const h = harness();
  await h.service.ready;
  h.emit('SIGNED_IN', session);
  const first = h.service.sessionEpoch();
  const refreshed = { ...session, access_token: 'refreshed-test-token' };
  h.emit('TOKEN_REFRESHED', refreshed);
  assert.equal(h.service.sessionEpoch(), first);
  h.emit('SIGNED_IN', refreshed);
  assert.equal(h.service.sessionEpoch(), first);
  h.emit('SIGNED_OUT', null);
  h.emit('SIGNED_IN', session);
  assert.ok(h.service.sessionEpoch() > first);
});

test('late sign-out success cannot clear a replacement account', async () => {
  const gate = deferred(),
    h = harness({ signOut: () => gate.promise });
  await h.service.ready;
  h.emit('SIGNED_IN', session);
  const request = h.service.signOut();
  const next = { ...session, access_token: 'new-test-token', user: { ...user, id: 'other-student' } };
  h.emit('SIGNED_IN', next);
  gate.resolve({ error: null });
  await request;
  assert.equal(h.service.session(), next);
});

test('a late password-update response cannot sign out a replacement account', async () => {
  const gate = deferred(),
    started = deferred(),
    h = harness({
      updateUser: () => {
        started.resolve();
        return gate.promise;
      },
    });
  await h.service.ready;
  h.emit('PASSWORD_RECOVERY', session);
  const request = h.service.updatePassword('NewStrongPassword123!');
  await started.promise;
  const next = { ...session, access_token: 'new-test-token', user: { ...user, id: 'other-student' } };
  h.emit('SIGNED_IN', next);
  gate.resolve({ data: { user }, error: null });
  const result = await request;
  assert.equal(result.passwordUpdated, true);
  assert.equal(result.error?.code, 'password_updated_signout_failed');
  assert.equal(h.service.session(), next);
  assert.equal(h.calls.signOut.length, 0);
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

test('registration sends only the declared academic display metadata', async () => {
  const { service, calls } = harness();
  await service.signUp('student@itu.edu.tr', 'password', 'student', {
    university: ' Example University ',
    department: ' Computer Science ',
    role: 'admin',
  });
  assert.deepEqual(calls.signUp[0].options.data, {
    username: 'student',
    university_name: 'Example University',
    department_name: 'Computer Science',
  });
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

test('the email quota error takes precedence over the generic HTTP 429 error', async () => {
  const { service } = harness();
  assert.equal(
    service.errorKey(new AuthError('PRIVATE_EMAIL_PROVIDER_ERROR', 429, 'over_email_send_rate_limit')),
    'auth.errors.emailRateLimit',
  );
  assert.equal(
    service.errorKey(new AuthError('PRIVATE_IP_LIMIT_ERROR', 429, 'over_request_rate_limit')),
    'auth.errors.rateLimit',
  );
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

test('verification cannot approve a destroyed service or a logout without an SDK event', async () => {
  for (const action of ['destroy', 'signOut']) {
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
    const pending = context.service.hasVerifiedSession();
    await started.promise;
    if (action === 'destroy') context.destroy();
    else await context.service.signOut();
    verified.resolve({ data: { user }, error: null });
    assert.equal(await pending, false);
  }
});

test('recovery sessions keep the password reset flow instead of opening dashboard', async () => {
  const context = harness();
  await context.service.ready;
  context.emit('PASSWORD_RECOVERY', session);
  assert.deepEqual(await context.guard({}, {}), { redirect: ['/auth/update-password'] });
  assert.deepEqual(await context.signedInGuard({}, {}), { redirect: ['/auth/update-password'] });
});

test('verified sessions skip sign-in, anonymous sessions can still sign in', async () => {
  const anonymous = harness();
  await anonymous.service.ready;
  assert.equal(await anonymous.signedInGuard({}, {}), true);
  const signedIn = harness({ getSession: async () => ({ data: { session }, error: null }) });
  await signedIn.service.ready;
  assert.deepEqual(await signedIn.signedInGuard({}, {}), { redirect: ['/dashboard'] });
});

test('plain login URLs retain stored sessions and only actual implicit callback parameters are detected', () => {
  const { matchesCallback } = harness();
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), {}), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/update-password'), {}), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), { access_token: 'token' }), true);
  assert.equal(
    matchesCallback(new URL('http://localhost:4200/auth/update-password/'), { error_description: 'expired' }),
    true,
  );
  assert.equal(matchesCallback(new URL('http://localhost:4200/dashboard'), { access_token: 'token' }), false);
  assert.equal(matchesCallback(new URL('http://localhost:4200/auth/login'), { code: 'pkce-code' }), false);
});
````

## scripts/build-production.cjs (değişti)

````javascript
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { generateEnvironment } = require('./generate-environment.cjs');
const { ProductionOutputError, verifyProductionOutput } = require('./verify-production-output.cjs');
const { ProductionSecurityError, secureProductionIndex } = require('./production-security.cjs');

function runProductionBuild() {
  const root = path.resolve(__dirname, '..');
  let configuration;
  try {
    configuration = generateEnvironment({ root, strict: true });
  } catch {
    console.error('Production build requires valid SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY configuration.');
    return 1;
  }

  let result;
  try {
    const packagePath = require.resolve('nx/package.json');
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const binary = path.resolve(path.dirname(packagePath), manifest.bin.nx);
    result = spawnSync(process.execPath, [binary, 'build', 'shell', '--configuration=production'], {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'production',
        NX_DAEMON: 'false',
        NX_TUI: 'false',
        NX_ISOLATE_PLUGINS: 'false',
      },
    });
  } catch {
    console.error('Could not start the production build.');
    return 1;
  }

  if (result.error || result.status === null) {
    console.error('Production build did not complete successfully.');
    return 1;
  }
  if (result.status !== 0) return result.status;

  try {
    secureProductionIndex(path.join(root, 'dist/apps/shell/browser'), configuration.supabaseUrl);
    const { fileCount } = verifyProductionOutput(path.join(root, 'dist/apps/shell/browser'));
    console.log(`Production output verified: ${fileCount} JavaScript files.`);
    return 0;
  } catch (error) {
    console.error(
      error instanceof ProductionOutputError || error instanceof ProductionSecurityError
        ? error.message
        : 'Could not verify production JavaScript files.',
    );
    return 1;
  }
}

if (require.main === module) process.exitCode = runProductionBuild();

module.exports = { runProductionBuild };
````

## scripts/e2e/auth-integration.spec.cjs (değişti)

````javascript
const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');

const email = 'student@itu.edu.tr';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  identities: [],
};

function sessionResponse() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: expiresAt,
  })}.fake_signature_for_local_test`;
  return {
    access_token: accessToken,
    refresh_token: 'fake_refresh_token_for_local_test',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
}

async function mockAuth(page, handlers = {}) {
  const requests = [];
  await mockSocial(page);
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const operation = url.pathname.split('/auth/v1/')[1];
    const body = request.postDataJSON();
    requests.push({ operation, method: request.method(), body, url });
    const handler = handlers[operation];
    const response = handler
      ? await handler({ request, body, url })
      : operation === 'user'
        ? { status: 200, body: user }
        : operation === 'logout'
          ? { status: 204 }
          : { status: 400, body: { code: 'unexpected_failure', msg: 'UNEXPECTED_TEST_REQUEST' } };
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'x-supabase-api-version',
        'x-supabase-api-version': '2024-01-01',
      },
      body: response.body === undefined ? '' : JSON.stringify(response.body),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem('kampusx-language', 'tr');
    localStorage.setItem('kampusx-theme', 'light');
  });
  return requests;
}

async function mockLoginLookup(page, handler = () => ({ status: 200, body: true })) {
  const requests = [];
  await page.route('**/rest/v1/rpc/kampusx_login_email_exists', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const body = route.request().postDataJSON();
    requests.push(body);
    const response = await handler(body);
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(response.body),
    });
  });
  return requests;
}

for (const remember of [false, true]) {
  test(`login uses ${remember ? 'persistent' : 'tab-scoped'} session storage`, async ({ page }) => {
    const response = sessionResponse();
    const requests = await mockAuth(page, { token: () => ({ body: response }) });
    await page.goto('/auth/login');
    await page.locator('#login-identity').fill(email);
    await page.locator('#login-password').fill('LocalTestPassword123!');
    const rememberControl = page.locator('input[formcontrolname=remember]');
    await rememberControl.setChecked(remember);
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.dashboard-page')).toBeVisible();
    const submitted = requests.find(({ operation }) => operation === 'token');
    expect(submitted.body.email).toBe(email);
    expect(submitted.body.password).toBe('LocalTestPassword123!');
    const persisted = await page.evaluate((accessToken) => {
      const containsToken = (storage) =>
        Object.keys(storage).some((key) => (storage.getItem(key) || '').includes(accessToken));
      return { local: containsToken(localStorage), session: containsToken(sessionStorage) };
    }, response.access_token);
    expect(persisted).toEqual({ local: remember, session: !remember });
    await page.reload();
    await expect(page.locator('.dashboard-page')).toBeVisible();
    await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
    await expect(page.getByRole('dialog').getByText('@student', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Okul bilgisi eklenmemiş')).toBeVisible();
    expect(requests.some(({ operation }) => operation === 'user')).toBe(true);
  });
}

test('invalid credentials display a safe localized error and allow retry', async ({ page }) => {
  const lookups = await mockLoginLookup(page);
  let failed = true;
  const requests = await mockAuth(page, {
    token: () =>
      failed
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.click();
  await expect(page.locator('#auth-panel [role=alert]')).toBeVisible();
  await expect(page.locator('#auth-panel [role=alert]')).toContainText('E-posta veya şifre yanlış');
  await expect(page.locator('#auth-panel')).not.toContainText('PRIVATE_BACKEND_ERROR');
  await expect(submit).toBeEnabled();
  failed = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requests.filter(({ operation }) => operation === 'token')).toHaveLength(2);
  expect(lookups).toEqual([]);
});

test('an unknown email uses the same generic message in TR and EN and permits retry', async ({ page }) => {
  let missing = true;
  await mockAuth(page, {
    token: () =>
      missing
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  const lookups = await mockLoginLookup(page, () => ({ body: false }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toHaveText('E-posta veya şifre yanlış. Bilgilerini kontrol et.');
  await expect(submit).toBeEnabled();
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toHaveText('The email or password is incorrect. Check your details.');
  expect(lookups).toEqual([]);
  missing = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(lookups).toHaveLength(0);
});

test('a disabled or missing legacy RPC does not affect credential error handling', async ({ page }) => {
  await mockAuth(page, {
    token: () => ({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } }),
  });
  const lookups = await mockLoginLookup(page, () => ({
    status: 404,
    body: { code: 'PGRST202', message: 'PRIVATE_SCHEMA_ERROR' },
  }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  const alert = page.locator('#auth-panel [role=alert]');
  await expect(alert).toHaveText('E-posta veya şifre yanlış. Bilgilerini kontrol et.');
  await expect(alert).not.toContainText('PRIVATE_SCHEMA_ERROR');
  expect(lookups).toHaveLength(0);
  await expect(page.locator('#auth-panel button[type=submit]')).toBeEnabled();
});

test('a slow sign-in keeps submits disabled and reserves generic error feedback on a narrow dark screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let resolveToken,
    tokenStarted = false;
  const response = new Promise((resolve) => (resolveToken = resolve));
  await mockAuth(page, {
    token: () => {
      tokenStarted = true;
      return response;
    },
  });
  const lookups = await mockLoginLookup(page);
  await page.addInitScript(() => localStorage.setItem('kampusx-theme', 'dark'));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.scrollIntoViewIfNeeded();
  const before = await submit.boundingBox();
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.locator('#auth-panel form')).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => tokenStarted).toBe(true);
  resolveToken({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } });
  await expect(page.locator('#auth-panel [role=alert]')).toHaveText(
    'E-posta veya şifre yanlış. Bilgilerini kontrol et.',
  );
  expect(lookups).toHaveLength(0);
  const after = await submit.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('login-generic-error-tr-dark.png'), fullPage: true });
});

test('registration sends metadata and displays email-verification guidance', async ({ page }) => {
  const requests = await mockAuth(page, {
    signup: () => ({ body: { ...user, email_confirmed_at: null, confirmed_at: null } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.locator('#auth-panel .success-message')).toBeVisible();
  await expect(page.locator('#auth-panel .success-message')).toContainText(/e-posta/i);
  const submitted = requests.find(({ operation }) => operation === 'signup');
  expect(submitted.body.email).toBe(email);
  expect(submitted.body.data.username).toBe('student');
  expect(submitted.body.data).not.toHaveProperty('role');
});

test('reset requests do not expose whether an account exists', async ({ page }) => {
  const requests = await mockAuth(page, { recover: () => ({ body: {} }) });
  await page.goto('/auth/forgot-password');
  await page.locator('#reset-email').fill(email);
  await page.locator('#auth-panel button[type=submit]').click();
  const success = page.locator('.reset-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText(/hesap|kayıtlı/i);
  await expect(success).toBeFocused();
  expect(requests.find(({ operation }) => operation === 'recover').body.email).toBe(email);
});

test('registration distinguishes email quota from request limits in Turkish and English', async ({
  page,
}) => {
  let code = 'over_email_send_rate_limit';
  await mockAuth(page, {
    signup: () => ({ status: 429, body: { code, msg: 'PRIVATE_PROVIDER_ERROR' } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toContainText('E-posta gönderim sınırına ulaşıldı');
  await expect(alert).not.toContainText('PRIVATE_PROVIDER_ERROR');
  await expect(submit).toBeEnabled();
  code = 'over_request_rate_limit';
  await submit.click();
  await expect(alert).toContainText('İstek sınırına ulaşıldı');
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toContainText('The request limit was reached');
  code = 'over_email_send_rate_limit';
  await submit.click();
  await expect(alert).toContainText('The email sending limit was reached');
});

test('an anonymous visitor cannot open dashboard', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('#login-identity')).toBeVisible();
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
});

test('a rejected stored token cannot open dashboard or reveal profile content', async ({ page }) => {
  const session = sessionResponse();
  await mockAuth(page, { user: () => ({ status: 401, body: { code: 'bad_jwt', msg: 'Invalid token' } }) });
  await page.addInitScript((session) => {
    sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
  }, session);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
  await expect(page.getByText('@student', { exact: true })).toHaveCount(0);
});

test('sign-out clears the session and denies dashboard until the next login', async ({ page }) => {
  const requests = await mockAuth(page, { token: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/auth/login');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(requests.filter(({ operation }) => operation === 'logout')).toHaveLength(1);
  const remains = await page.evaluate(() =>
    [localStorage, sessionStorage].some((storage) => !!storage.getItem('sb-auth-auth-token')),
  );
  expect(remains).toBe(false);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test('registration opens dashboard only when Supabase returns a session', async ({ page }) => {
  await mockAuth(page, { signup: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
````

## scripts/e2e/dashboard.spec.cjs (değişti)

````javascript
const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openDashboard(page, language = 'tr', theme = 'light', width = 390) {
  await page.setViewportSize({ width, height: width > 640 ? 900 : 844 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      username: 'elif',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      department_name: 'Bilgisayar Teknolojileri',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh_token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    }),
  );
  await mockSocial(page);
  await page.goto('/dashboard');
  await expect(
    page.getByRole('tab', { name: language === 'tr' ? 'Keşfet' : 'Explore', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.evaluate(() => document.fonts.ready);
}

async function swipe(page, from, to) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: from.x, y: from.y }],
  });
  for (let step = 1; step <= 5; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 5, y: from.y + ((to.y - from.y) * step) / 5 }],
    });
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

async function settledDrawer(page) {
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => page.getByRole('dialog').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
}

for (const language of ['tr', 'en']) {
  for (const theme of ['light', 'dark']) {
    test(`dashboard geometry and accessibility — ${language}/${theme}`, async ({ page }, info) => {
      await openDashboard(page, language, theme, language === 'en' ? 320 : 1440);
      await expect(page.locator('kx-header, kx-footer')).toHaveCount(0);
      await expect(page.getByRole('tab')).toHaveCount(4);
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect(page.locator('.bottom-nav button')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const surface = await page.locator('.dashboard-shell').evaluate((el) => ({
        actual: getComputedStyle(el).backgroundColor,
        expected: getComputedStyle(document.documentElement).getPropertyValue('--color-surface'),
      }));
      expect(surface.actual).not.toBe('rgba(0, 0, 0, 0)');
      expect(surface.expected.trim()).not.toBe('');
      const audit = await new AxeBuilder({ page }).analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`dashboard-${language}-${theme}.png`) });
      const opener = page.getByRole('button', {
        name: language === 'tr' ? 'Profil menüsünü aç' : 'Open profile menu',
      });
      await opener.click();
      const dialog = page.getByRole('dialog');
      await settledDrawer(page);
      await expect(dialog.getByText('@elif', { exact: true })).toBeVisible();
      await expect(dialog.locator('.profile-details p')).toHaveCount(2);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`drawer-${language}-${theme}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }
}

test('tabs, keyboard and content use one selection state', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  await tabs.nth(2).click();
  await expect(page.getByRole('heading', { name: 'Kampüsünün gündemi' })).toBeVisible();
  await tabs.nth(2).press('ArrowRight');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(3).press('Home');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).press('End');
  await expect(page.getByRole('heading', { name: 'Bölümündeki konuşmalar' })).toBeVisible();
  await tabs.nth(3).press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
});

test('real touch swipes change feeds, clamp boundaries and preserve vertical scroll', async ({ page }) => {
  await openDashboard(page);
  const tabs = page.getByRole('tab');
  for (const expected of [1, 2, 3, 3]) {
    await swipe(page, { x: 300, y: 530 }, { x: 85, y: 538 });
    await expect(tabs.nth(expected)).toHaveAttribute('aria-selected', 'true');
  }
  await swipe(page, { x: 85, y: 530 }, { x: 300, y: 538 });
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await swipe(page, { x: 200, y: 630 }, { x: 205, y: 350 });
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('drawer traps focus, locks scroll and closes on backdrop or touch', async ({ page }) => {
  await openDashboard(page);
  const opener = page.getByRole('button', { name: 'Profil menüsünü aç' });
  await opener.click();
  await settledDrawer(page);
  const close = page.getByRole('button', { name: 'Profil menüsünü kapat' });
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  await close.press('Shift+Tab');
  const profileEntry = page.locator('.profile-avatar-link');
  await expect(profileEntry).toBeFocused();
  await profileEntry.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Çıkış yap', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(profileEntry).toBeFocused();
  const drawerBounds = await page.getByRole('dialog').boundingBox();
  const backdropX = drawerBounds.x + drawerBounds.width + 8;
  await page.mouse.click(backdropX, 300);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await opener.click();
  await swipe(page, { x: 270, y: 245 }, { x: 70, y: 250 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('theme and language remain live without resetting the selected feed', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('tab', { name: 'Bölüm', exact: true }).click();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Department', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page).toHaveTitle('Home — KampüsX');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('heading', { name: 'Inside your department' })).toBeVisible();
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await expect(page.getByRole('dialog').getByText('Bilgisayar Teknolojileri', { exact: true })).toBeVisible();
});

test('reduced motion and unavailable visual controls have no business effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDashboard(page);
  expect(
    await page.locator('.discover-track').evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  for (const button of await page.locator('.bottom-nav button').all()) {
    await expect(button).toBeDisabled();
  }
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  for (const button of await page.locator('.profile-menu button[aria-disabled=true]').all())
    await expect(button).toBeDisabled();
  await page.getByRole('button', { name: 'Profil menüsünü kapat' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('leaving an open drawer restores the welcome and auth shell', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.evaluate(() => {
    history.pushState({}, '', '/auth/forgot-password');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('kx-header')).toBeVisible();
  await expect(page.locator('kx-footer')).toBeVisible();
  await expect(page.locator('#reset-email')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await page.goto('/');
  await expect(page.locator('.hero-poster')).toBeVisible();
  await expect(page.locator('kx-header')).toBeVisible();
});
````

## scripts/e2e/mock-social.cjs (eklendi)

````javascript
const OWNER = '11111111-1111-4111-8111-111111111111';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
async function mockSocial(page, options = {}) {
  const state = {
    profile: { user_id: OWNER, avatar_url: null, banner_url: null },
    posts: Array.from({ length: 6 }, (_, i) => ({
      id: `post-${i}`,
      user_id: OWNER,
      content: `Server post ${i + 1}`,
      media_url: null,
      media_type: null,
    })),
    requests: [],
  };
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    const payload = ['POST', 'PATCH'].includes(method) ? request.postDataJSON() : undefined;
    state.requests.push({ table: url.pathname.split('/').at(-1), method, payload, url: url.pathname });
    if (options.failProfileRead && method === 'GET' && url.pathname.endsWith('/profiles'))
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unavailable' }),
      });
    if ((options.failDatabase || options.uncertainDatabase) && method !== 'GET')
      return route.fulfill({
        status: options.uncertainDatabase ? 503 : 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: '42501', message: 'Policy rejected' }),
      });
    let body;
    if (url.pathname.endsWith('/profiles')) {
      if (method !== 'GET') state.profile = { ...state.profile, ...payload };
      body = method === 'GET' ? [state.profile] : state.profile;
    } else if (url.pathname.endsWith('/posts')) {
      if (method === 'POST') {
        const post = { id: `created-${state.posts.length}`, ...payload };
        state.posts.unshift(post);
        body = post;
      } else
        body = state.posts.filter(
          (post) =>
            !url.searchParams.has('user_id') || url.searchParams.get('user_id') === `eq.${post.user_id}`,
        );
    } else return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${Math.max(0, state.posts.length - 1)}/${state.posts.length}` },
      body: JSON.stringify(body),
    });
  });
  await page.route('**/storage/v1/**', (route) => {
    const request = route.request();
    state.requests.push({ storage: true, method: request.method(), url: new URL(request.url()).pathname });
    if (options.failStorage && request.method() === 'POST')
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized', message: 'Policy rejected', statusCode: '403' }),
      });
    if (request.method() === 'GET')
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        Id: 'test-object',
        Key: new URL(request.url()).pathname.replace('/storage/v1/object/', ''),
      }),
    });
  });
  return state;
}
module.exports = { mockSocial, OWNER };
````

## scripts/e2e/posts.spec.cjs (eklendi)

````javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const { mockSocial, OWNER } = require('./mock-social.cjs');
const png = () => ({
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
});

test('a failed initial profile read cannot erase an unknown saved banner', async ({ page }) => {
  const options = { failProfileRead: true };
  const state = await openSocial(page, 'tr', 'light', '/profile/edit', 390, options);
  state.profile.banner_url = `https://auth.kampusx.test/storage/v1/object/public/uploads/${OWNER}/banner/existing.png`;
  await expect(page.locator('.save-error[role=alert]')).toContainText('Profil fotoğrafların yüklenemedi');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  const save = page.getByRole('button', { name: 'Kaydet', exact: true });
  await expect(save).toBeDisabled();
  expect(state.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
  options.failProfileRead = false;
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(/\/profile$/);
  const write = state.requests.find((r) => r.table === 'profiles' && r.method === 'PATCH');
  expect(write.payload.banner_url).toBe(state.profile.banner_url);
  expect(write.payload.banner_url).toContain('/banner/existing.png');
});
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`composer and real SDK upload/database sequence ${language}/${theme}`, async ({ page }, info) => {
      const state = await openSocial(page, language, theme, '/compose');
      await page.locator('#post-content').fill('A real SDK request, isolated test data.');
      await page.locator('#post-file').setInputFiles(png());
      await expect(page.locator('.attachment-preview img')).toBeVisible();
      const publish = page.locator('button[type=submit]');
      await expect(publish).toBeEnabled();
      expect(state.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`compose-${language}-${theme}.png`), fullPage: true });
      await publish.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.locator('kx-social-post-card').first()).toContainText(
        'A real SDK request, isolated test data.',
      );
      const writes = state.requests.filter((r) => r.method !== 'GET');
      expect(writes).toHaveLength(2);
      expect(writes[0].storage).toBe(true);
      expect(writes[0].url).toContain(`/uploads/${OWNER}/post/`);
      expect(writes[1].payload).toEqual({
        user_id: OWNER,
        content: 'A real SDK request, isolated test data.',
        media_url: expect.stringContaining(`/uploads/${OWNER}/post/`),
        media_type: 'image',
      });
      await page.reload();
      await expect(page.locator('kx-social-post-card').first()).toContainText(
        'A real SDK request, isolated test data.',
      );
    });
  }
test('failed database writes preserve the draft and reuse the confirmed upload on retry', async ({
  page,
}) => {
  await openSocial(page, 'tr', 'light', '/compose');
  const options = { failDatabase: true },
    state = await mockSocial(page, options);
  await page.locator('#post-content').fill('Keep this draft');
  await page.locator('#post-file').setInputFiles(png());
  const publish = page.locator('button[type=submit]');
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(page.locator('[role=alert]')).toContainText('Gönderi kaydedilemedi');
  await expect(page.locator('#post-content')).toHaveValue('Keep this draft');
  await expect(page.locator('.attachment-preview img')).toBeVisible();
  options.failDatabase = false;
  await publish.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.requests.filter((r) => r.storage && r.method === 'POST')).toHaveLength(1);
  expect(state.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(2);
});
test('an ambiguous database result prevents blind duplicate publication', async ({ page }) => {
  await openSocial(page, 'tr', 'dark', '/compose');
  const state = await mockSocial(page, { uncertainDatabase: true });
  await page.locator('#post-content').fill('Check before repeating');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[role=alert]')).toContainText('sonucu doğrulanamadı');
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  expect(state.requests.filter((r) => r.method === 'POST' && r.table === 'posts')).toHaveLength(1);
});
test('invalid files and discarded drafts produce no storage or database mutations', async ({ page }) => {
  const state = await openSocial(page, 'tr', 'light', '/compose');
  await page
    .locator('#post-file')
    .setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('text') });
  await expect(page.locator('[role=alert]')).toContainText('Bu görsel okunamadı');
  await page.locator('#post-content').fill('Unsaved');
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Değişiklikleri sil', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
});
test('storage denial never inserts a post', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/compose');
  const state = await mockSocial(page, { failStorage: true });
  await page.locator('#post-file').setInputFiles(png());
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[role=alert]')).toContainText('Dosya yüklenemedi');
  expect(state.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(0);
});
test('browser-decodable WebM files are uploaded as video with a persistent URL', async ({ page }) => {
  const state = await openSocial(page, 'en', 'dark', '/compose');
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const stream = canvas.captureStream(10),
      chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const done = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    canvas.getContext('2d').fillRect(0, 0, 32, 32);
    await new Promise((resolve) => setTimeout(resolve, 250));
    recorder.stop();
    await done;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  });
  await page
    .locator('#post-file')
    .setInputFiles({ name: 'campus.webm', mimeType: 'video/webm', buffer: Buffer.from(bytes) });
  await expect(page.locator('.attachment-preview video')).toBeVisible();
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const post = state.requests.find((r) => r.table === 'posts' && r.method === 'POST');
  expect(post.payload.media_type).toBe('video');
  expect(post.payload.media_url).toMatch(/\/post\/[^/]+\.webm$/);
  await expect(page.locator('kx-social-post-card video').first()).toBeVisible();
});
````

## scripts/e2e/profile.spec.cjs (eklendi)

````javascript
const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
async function openProfile(page, language = 'tr', theme = 'light', url = '/profile', width = 390) {
  await page.setViewportSize({ width, height: 900 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {
      username: 'elif',
      full_name: 'Elif Yılmaz',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      faculty_name: 'Teknik Bilimler Meslek Yüksekokulu',
      department_name: 'Bilgisayar Programcılığı',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
  const backend = [];
  page.on('request', (request) => {
    if (/\/rest\/v1\/|\/storage\/v1\/|\/functions\/v1\//.test(request.url())) backend.push(request.url());
  });
  const social = await mockSocial(page);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return social;
}
const png = () => ({
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
});
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`profile and edit layout/accessibility ${language}/${theme}`, async ({ page }, info) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) errors.push(message.text());
      });
      const backend = await openProfile(page, language, theme);
      await expect(page.locator('kx-header,kx-footer')).toHaveCount(0);
      await expect(page.locator('kx-social-post-card')).toHaveCount(6);
      await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`profile-${language}-${theme}.png`), fullPage: true });
      await page
        .getByRole('button', { name: language === 'tr' ? 'Profili Düzenle' : 'Edit Profile', exact: true })
        .click();
      await expect(page).toHaveURL(/\/profile\/edit$/);
      await expect(
        page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }),
      ).toBeDisabled();
      for (const id of ['profile-username', 'profile-university', 'profile-faculty', 'profile-department'])
        await expect(page.locator('#' + id)).toHaveAttribute('readonly', '');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`profile-edit-${language}-${theme}.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      expect(backend.requests.filter((r) => r.method !== 'GET')).toEqual([]);
    });
  }
test('drawer contains exactly five items and both entry points close before opening profile', async ({
  page,
}) => {
  await openProfile(page, 'tr', 'light', '/dashboard');
  const open = page.getByRole('button', { name: 'Profil menüsünü aç' });
  await open.click();
  const menu = page.locator('.profile-menu button');
  await expect(menu).toHaveCount(5);
  await expect(menu.locator(':scope > span')).toHaveText([
    'Profil',
    'Geçmiş',
    'Topluluklar',
    'Ayarlar ve gizlilik',
    'Yardım Merkezi',
  ]);
  for (let i = 1; i < 5; i++) {
    await expect(menu.nth(i)).toBeDisabled();
    await menu.nth(i).click({ force: true });
    await expect(page).toHaveURL(/\/dashboard$/);
  }
  await menu.first().click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
  await open.click();
  await page.locator('.profile-avatar-link').click();
  await expect(page).toHaveURL(/\/profile$/);
});
test('tabs filter kinds, keyboard navigation and sticky header follow scroll', async ({ page }) => {
  await openProfile(page);
  const tabs = page.getByRole('tab');
  await tabs.nth(1).click();
  await expect(page.locator('kx-social-post-card')).toHaveCount(0);
  await expect(page.locator('[data-kind=reply]')).toHaveCount(0);
  await tabs.nth(1).press('ArrowRight');
  await expect(page.locator('[data-kind=retweet]')).toHaveCount(0);
  await expect(tabs.nth(2)).toBeFocused();
  await tabs.nth(2).press('Home');
  await expect(page.locator('kx-social-post-card')).toHaveCount(6);
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await expect(page.locator('.profile-toolbar')).toHaveClass(/collapsed/);
  await expect(page.locator('.toolbar-identity')).toContainText('6 gönderi');
  expect((await page.locator('.profile-tabs').boundingBox()).y).toBeCloseTo(64, 0);
  const scroll = await page.locator('.tab-scroll').evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scroll).toBe(true);
});
test('save updates profile, own post cards, dashboard avatar and drawer immediately', async ({ page }) => {
  const backend = await openProfile(page, 'tr', 'light', '/profile/edit');
  await page.locator('#profile-name').fill('Elif Kampüs');
  await page.locator('#profile-bio').fill('Kod, kampüs ve yeni fikirler.');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  await page.locator('#profile-cover-file').setInputFiles(png());
  await expect(page.locator('.cover-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Elif Kampüs', exact: true })).toBeVisible();
  await expect(page.locator('.profile-bio')).toHaveText('Kod, kampüs ve yeni fikirler.');
  await expect(page.locator('kx-toast')).toContainText('Profilin güncellendi');
  await expect(page.locator('.post-author strong')).toHaveText(Array(6).fill('Elif Kampüs'));
  await expect(page.locator('.post-header kx-avatar img')).toHaveCount(6);
  await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
  await expect(page.locator('.avatar-button img')).toBeVisible();
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await expect(page.getByRole('heading', { name: 'Elif Kampüs', exact: true })).toBeVisible();
  await expect(page.locator('.profile-avatar-link img')).toBeVisible();
  expect(backend.requests.filter((request) => request.storage && request.method === 'POST')).toHaveLength(2);
  const saved = backend.requests.find(
    (request) => request.table === 'profiles' && request.method === 'PATCH',
  );
  expect(Object.keys(saved.payload).sort()).toEqual(['avatar_url', 'banner_url']);
  expect(saved.payload.avatar_url).toContain(`/uploads/${backend.profile.user_id}/avatar/`);
  expect(saved.payload.banner_url).toContain(`/uploads/${backend.profile.user_id}/banner/`);
  await page.reload();
  await expect(page.locator('.avatar-button img')).toBeVisible();
});
test('cancel protects unsaved text and image drafts and does not commit discarded changes', async ({
  page,
}) => {
  await openProfile(page, 'tr', 'light', '/profile/edit');
  await page.locator('#profile-name').fill('Unsaved name');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Düzenlemeye devam et' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#profile-name')).toHaveValue('Unsaved name');
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await page.getByRole('button', { name: 'Değişiklikleri sil', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
  await expect(page.locator('.large-avatar img')).toHaveCount(0);
});
test('invalid images show localized errors and names/bios enforce counters and required validation', async ({
  page,
}) => {
  await openProfile(page, 'tr', 'dark', '/profile/edit');
  await page
    .locator('#profile-avatar-file')
    .setInputFiles({ name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.locator('#profile-avatar-file-error')).toContainText('JPG, PNG veya WEBP');
  await page
    .locator('#profile-cover-file')
    .setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.locator('#profile-cover-file-error')).toContainText('5 MB');
  await page
    .locator('#profile-avatar-file')
    .setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('#profile-avatar-file-error')).toContainText('okunamadı');
  await page.locator('#profile-name').fill(' ');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.locator('#profile-name')).toBeFocused();
  await expect(page.locator('#profile-name')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#profile-name').fill('Elif');
  await expect(page.locator('#profile-name-counter')).toHaveText('4 / 50');
  await page.locator('#profile-bio').fill('a'.repeat(160));
  await expect(page.locator('#profile-bio-counter')).toHaveText('160 / 160');
  await page.locator('kx-language-switcher button[lang=en]').click();
  await expect(page.locator('#profile-cover-file-error')).toContainText('5 MB');
});
test('desktop column, live locale/theme and reduced motion keep user content intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openProfile(page, 'tr', 'light', '/profile', 1440);
  expect((await page.locator('.profile-shell').boundingBox()).width).toBe(760);
  await page.locator('kx-language-switcher button[lang=en]').click();
  await expect(page).toHaveTitle('Profile — KampüsX');
  await expect(page.getByRole('tab', { name: 'Reposts', exact: true })).toBeVisible();
  await expect(page.locator('.post-text').first()).toContainText('Server post');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.locator('.indicator').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe(
    '0s',
  );
  await expect(page.getByRole('heading', { name: 'Elif Yılmaz', exact: true })).toBeVisible();
});
````

## scripts/e2e/session-security.spec.cjs (eklendi)

````javascript
const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');

async function signOutInAnotherTab(page) {
  await page.evaluate(async () => {
    sessionStorage.removeItem('sb-auth-auth-token');
    localStorage.removeItem('sb-auth-auth-token');
    const channel = new BroadcastChannel('sb-auth-auth-token');
    channel.postMessage({ event: 'SIGNED_OUT', session: null });
    await new Promise((resolve) => setTimeout(resolve, 25));
    channel.close();
  });
}

test('cross-tab sign-out leaves a dirty composer without a blocking draft dialog', async ({ page }) => {
  const backend = await openSocial(page, 'tr', 'dark', '/compose');
  await page.locator('#post-content').fill('Private unsaved campus draft');
  await signOutInAnotherTab(page);
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#post-content')).toHaveCount(0);
  expect(backend.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
});

test('an upload finishing after logout cannot insert a post', async ({ page }) => {
  const backend = await openSocial(page, 'en', 'light', '/compose');
  let finishUpload, started;
  const uploadStarted = new Promise((resolve) => (started = resolve));
  await page.route('**/storage/v1/object/uploads/**', async (route) => {
    const wait = new Promise((resolve) => (finishUpload = resolve));
    started();
    await wait;
    await route
      .fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Id: 'delayed', Key: 'uploads/delayed.png' }),
      })
      .catch(() => {});
  });
  await page.locator('#post-file').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  await page.locator('button[type=submit]').click();
  await uploadStarted;
  await signOutInAnotherTab(page);
  await expect(page).toHaveURL(/\/auth\/login$/);
  finishUpload();
  // Let the in-flight HTTP response reach the service's post-upload ownership check.
  await page.waitForTimeout(150);
  expect(backend.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(0);
});
````

## scripts/e2e/social-fixture.cjs (eklendi)

````javascript
const { mockSocial } = require('./mock-social.cjs');
const { expect } = require('@playwright/test');
async function openSocial(
  page,
  language = 'tr',
  theme = 'light',
  url = '/profile',
  width = 390,
  options = {},
) {
  await page.setViewportSize({ width, height: 900 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {
      username: 'elif',
      full_name: 'Elif Yılmaz',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      faculty_name: 'Teknik Bilimler Meslek Yüksekokulu',
      department_name: 'Bilgisayar Programcılığı',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
  const backend = [];
  page.on('request', (request) => {
    if (/\/rest\/v1\/|\/storage\/v1\/|\/functions\/v1\//.test(request.url())) backend.push(request.url());
  });
  const social = await mockSocial(page, options);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return social;
}
module.exports = { openSocial };
````

## scripts/e2e/welcome.spec.cjs (değişti)

````javascript
const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test.beforeEach(async ({ page }) => {
  await mockSocial(page);
  // All auth traffic is fulfilled locally; UI tests never contact a real project.
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const operation = new URL(request.url()).pathname.split('/auth/v1/')[1];
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'student@itu.edu.tr',
      email_confirmed_at: '2026-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { username: 'student' },
      identities: [],
    };
    if (operation === 'token') {
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const body = {
        access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: expiresAt })}.local_test_signature`,
        refresh_token: 'local_test_refresh_token',
        expires_in: 3600,
        expires_at: expiresAt,
        token_type: 'bearer',
        user,
      };
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    } else if (operation === 'signup') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ...user, email_confirmed_at: null }),
      });
    } else if (operation === 'recover') {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ contentType: 'application/json', body: '{}' });
    } else if (operation === 'user') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(user) });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'unexpected_failure', msg: 'Unexpected mocked operation' }),
      });
    }
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('kampusx-language')) localStorage.setItem('kampusx-language', 'tr');
    if (!localStorage.getItem('kampusx-theme')) localStorage.setItem('kampusx-theme', 'light');
  });
  await page.goto('/');
});
test('login validation, password reveal, and mocked authentication result', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toBeFocused();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('@deniz');
  await page.locator('#login-password').fill('test-password');
  await panel.getByRole('button', { name: 'Şifreyi göster' }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page.locator('#login-identity')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#login-identity').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Giriş yap', exact: true }).last().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.dashboard-page')).toBeVisible();
});
test('register validates university address and consent; Google stays local', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Kayıt ol', exact: true }).click();
  await panel.getByRole('button', { name: 'Google öğrenci hesabıyla başla' }).click();
  await expect(panel.locator('.info-message')).toContainText(/Google/);
  await page.locator('#register-email').fill('student@gmail.com');
  await page.locator('#register-username').fill('@deniz');
  await page.locator('#register-university').fill('İstanbul Teknik Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Mühendisliği');
  await page.locator('#register-password').fill('LongPassword123!');
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(page.locator('#register-email')).toBeFocused();
  await expect(panel.getByText('.edu.tr uzantılı üniversite e-postanı kullan.')).toBeVisible();
  await page.locator('#register-email').fill('student@itu.edu.tr');
  await page.locator('#register-consent').check();
  await panel.getByRole('button', { name: 'KampüsX’e katıl', exact: true }).click();
  await expect(panel.locator('.success-message')).toContainText(/e-posta/i);
});
test('password reset has validation, loading, success and return', async ({ page }) => {
  const panel = page.locator('#auth-panel');
  await panel.getByRole('button', { name: 'Şifremi unuttum' }).click();
  await page.locator('#reset-email').fill('student@itu.edu.tr');
  await panel.getByRole('button', { name: 'Sıfırlama bağlantısı gönder' }).click();
  await expect(panel.locator('button[type=submit]')).toBeDisabled();
  await expect(panel.locator('.reset-success')).toContainText(/hesap|kayıtlı/i);
  await expect(panel.locator('.reset-success')).toBeFocused();
  await panel.getByRole('button', { name: 'Girişe dön' }).click();
  await expect(page.locator('#login-identity')).toBeVisible();
});
test('feed keyboard tabs, community CTA and legal modal', async ({ page }) => {
  const university = page.getByRole('tab', { name: 'Üniversitem' });
  await university.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Bölümüm' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Bitirme projesi');
  await page.getByRole('button', { name: 'Katıl: Yazılım Kulübü' }).click();
  await expect(page.locator('#register-email')).toBeVisible();
  await expect(page.locator('#auth-title')).toBeFocused();
  await page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('footer').getByRole('button', { name: 'Gizlilik', exact: true })).toBeFocused();
});
test('instant language/theme change and persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'English', exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
  await page.getByRole('button', { name: 'Switch to dark theme' }).first().click();
  await expect(page.locator('html')).toHaveClass('dark');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-language'))).toBe('en');
  expect(await page.evaluate(() => localStorage.getItem('kampusx-theme'))).toBe('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#auth-title')).toContainText('Connect with campus');
});
test('all auth routes lazy load and unknown routes recover', async ({ page }) => {
  for (const [url, field] of [
    ['/auth/login', '#login-identity'],
    ['/auth/register', '#register-email'],
    ['/auth/forgot-password', '#reset-email'],
  ]) {
    await page.goto(url);
    await expect(page.locator(field)).toBeVisible();
  }
  await page.goto('/missing-page');
  await expect(page.getByRole('link', { name: 'Ana sayfaya dön' })).toBeVisible();
});
for (const width of [1440, 768, 390, 320]) {
  for (const language of ['tr', 'en']) {
    for (const theme of ['light', 'dark']) {
      test(`layout and accessibility ${width}px ${language} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        if (width <= 900) await page.getByRole('button', { name: 'Menüyü aç' }).click();
        if (language === 'en')
          await page.getByRole('button', { name: 'English', exact: true }).last().click();
        if (theme === 'dark')
          await page
            .getByRole('button', { name: language === 'tr' ? 'Koyu temaya geç' : 'Switch to dark theme' })
            .last()
            .click();
        if (width <= 900)
          await page.getByRole('button', { name: language === 'tr' ? 'Menüyü kapat' : 'Close menu' }).click();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('header').getByRole('button', { name: /Giriş yap|Sign in/ })).toHaveCount(
          0,
        );
        await expect(page.locator('header').getByRole('link', { name: /Hakkında|About/ })).toHaveCount(0);
        await expect(page.locator('.edition-line')).toHaveCount(0);
        await expect(
          page.locator('footer').getByText(/Frontend.*preview|Frontend tasarım|unofficial|resmi olmayan/),
        ).toHaveCount(0);
        await expect(page.locator('footer nav').getByRole('link')).toHaveCount(1);
        await expect(page.locator('footer nav').getByRole('button')).toHaveCount(3);
        if (width > 640) {
          for (const mode of ['login', 'register', 'reset']) {
            const panel = page.locator('#auth-panel');
            if (mode === 'register') await panel.locator('.auth-tabs button').last().click();
            if (mode === 'reset') {
              await panel.locator('.auth-tabs button').first().click();
              await panel
                .getByRole('button', { name: language === 'tr' ? 'Şifremi unuttum' : 'Forgot password?' })
                .click();
            }
            const posterBox = await page.locator('.hero-poster').boundingBox();
            const panelBox = await panel.boundingBox();
            expect(Math.abs(posterBox.y - panelBox.y)).toBeLessThanOrEqual(1);
            expect(Math.abs(posterBox.height - panelBox.height)).toBeLessThanOrEqual(1);
          }
          await page
            .locator('#auth-panel')
            .getByRole('button', { name: language === 'tr' ? 'Girişe dön' : 'Back to sign in' })
            .click();
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        }
        const agendaColors = await page.locator('.marquee-strip').evaluate((element) => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, text: style.color };
        });
        expect(agendaColors.background).toBe(theme === 'light' ? 'rgb(237, 239, 245)' : 'rgb(29, 37, 53)');
        expect(agendaColors.text).toBe(theme === 'light' ? 'rgb(21, 33, 58)' : 'rgb(237, 242, 255)');
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflow).toBe(false);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.evaluate(() => {
          document.querySelectorAll('.reveal-pending').forEach((el) => el.classList.remove('reveal-pending'));
        });
        await page.screenshot({
          path: test.info().outputPath(`${width}-${language}-${theme}.png`),
          fullPage: true,
        });
        if (width === 1440 || width === 390)
          await page.screenshot({ path: test.info().outputPath(`hero-${width}-${language}-${theme}.png`) });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
      });
    }
  }
}
````

## scripts/production-security.cjs (eklendi)

````javascript
const fs = require('node:fs');
const path = require('node:path');
const { validateUrl } = require('./generate-environment.cjs');

class ProductionSecurityError extends Error {}

/** Keep Angular's hashed script policy and allow only the configured API origin. */
function secureProductionHtml(html, supabaseUrl) {
  const url = new URL(validateUrl(supabaseUrl));
  if (!/^(?:[a-z\d.-]+|\[[a-f\d:]+\])$/i.test(url.hostname))
    throw new ProductionSecurityError('Invalid API hostname for production security policy.');
  const socket = new URL(url.origin);
  socket.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const meta = /<meta\b[^>]*http-equiv\s*=\s*(["'])Content-Security-Policy\1[^>]*>/i;
  const match = html.match(meta);
  const content = match?.[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
  if (
    !content ||
    !content[2].includes("'strict-dynamic'") ||
    !/sha(?:256|384|512)-/.test(content[2]) ||
    content[2].includes('unsafe-eval')
  )
    throw new ProductionSecurityError('Production HTML must contain the strict Angular script policy.');
  const policy =
    content[2].replace(/(?:^|;)\s*(?:connect-src|img-src|media-src)\b[^;]*/gi, '').replace(/;\s*$/, '') +
    `; connect-src 'self' ${url.origin} ${socket.origin}; img-src 'self' blob: data: ${url.origin}; media-src 'self' blob: ${url.origin};`;
  return html.replace(meta, match[0].replace(content[0], `content="${policy}"`));
}

function secureProductionIndex(browserDirectory, supabaseUrl) {
  try {
    const target = path.join(browserDirectory, 'index.html');
    fs.writeFileSync(target, secureProductionHtml(fs.readFileSync(target, 'utf8'), supabaseUrl));
  } catch (error) {
    if (error instanceof ProductionSecurityError) throw error;
    throw new ProductionSecurityError('Could not secure production HTML.');
  }
}

module.exports = { ProductionSecurityError, secureProductionHtml, secureProductionIndex };
````

## scripts/production-security.test.cjs (eklendi)

````javascript
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { secureProductionHtml } = require('./production-security.cjs');
const html = `<html><head><meta http-equiv="Content-Security-Policy" content="script-src 'strict-dynamic' 'sha256-test' https: 'unsafe-inline'; object-src 'none'; base-uri 'self';"></head></html>`;

test('strict script policy survives and only the configured API origin can connect', () => {
  for (const origin of [
    'https://example.supabase.co',
    'https://auth.example.org:8443',
    'http://127.0.0.1:54321',
  ]) {
    const result = secureProductionHtml(html, origin);
    const socket = origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    assert.ok(result.includes(`connect-src 'self' ${origin} ${socket};`));
    assert.ok(result.includes("script-src 'strict-dynamic' 'sha256-test'"));
    assert.equal(secureProductionHtml(result, origin), result);
    assert.equal(result.includes('unsafe-eval'), false);
  }
});

test('missing, permissive or malformed production policies fail closed', () => {
  for (const source of [
    '<head></head>',
    html.replace("'strict-dynamic'", "'self'"),
    html.replace('sha256-test', 'not-a-hash'),
    html.replace("'strict-dynamic'", "'strict-dynamic' 'unsafe-eval'"),
  ])
    assert.throws(() => secureProductionHtml(source, 'https://example.supabase.co'));
  for (const url of ['https://example.invalid;injected', 'http://remote.example.org', 'javascript:alert(1)'])
    assert.throws(() => secureProductionHtml(html, url));
});

test('deployment adds frame, MIME, referrer and permission protections without conflicting with hash CSP', () => {
  const root = path.resolve(__dirname, '..');
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const headers = Object.fromEntries(
    vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
  );
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'no-referrer');
  assert.match(headers['Permissions-Policy'], /camera=\(\), microphone=\(\)/);
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.doesNotMatch(headers['Content-Security-Policy'], /(?:^|;)\s*(?:script-src|default-src)\b/);
  const project = JSON.parse(fs.readFileSync(path.join(root, 'apps/shell/project.json'), 'utf8'));
  assert.equal(project.targets.build.configurations.production.security.autoCsp, true);
});
````

## scripts/profile-services.test.cjs (eklendi)

````javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function signal(value) {
  const read = () => value;
  read.set = (next) => (value = next);
  read.asReadonly = () => () => value;
  return read;
}
function harness() {
  class AuthService {}
  class MediaService {}
  class ProfileRepository {}
  class PostsService {}
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
    [
      ProfileRepository,
      {
        read: async (owner) => stored.get(owner) || null,
        save: async (owner, value) => stored.set(owner, value),
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
    [AuthService, { session, sessionEpoch }],
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
                    : specifier === './posts.service'
                      ? { PostsService }
                      : specifier === '@kampusx/shared/util'
                        ? load('libs/shared/util/image-header.ts')
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

test('profile changes are atomic and cannot edit account or university fields', async () => {
  const { service } = harness();
  await service.reload();
  const old = service.profile();
  await service.updateProfile({
    fullName: ' Yeni İsim ',
    bio: ' A campus bio ',
    username: 'intruder',
    university: 'Other school',
    id: 'other',
    followersCount: 999,
  });
  assert.equal(service.profile().fullName, 'Yeni İsim');
  assert.equal(service.profile().bio, 'A campus bio');
  for (const key of ['id', 'username', 'university', 'faculty', 'department', 'followersCount'])
    assert.equal(service.profile()[key], old[key]);
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
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
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
````

## scripts/security/production.spec.cjs (eklendi)

````javascript
const { mockSocial } = require('../e2e/mock-social.cjs');
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { generateEnvironment } = require('../generate-environment.cjs');
const configuration = generateEnvironment({ root: path.resolve(__dirname, '../..'), strict: true });
const provider = new URL(configuration.supabaseUrl);
const storageKey = `sb-${provider.hostname.split('.')[0]}-auth-token`;
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'student@university.edu.tr',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: { username: 'student', full_name: 'Campus Student' },
  identities: [],
};
async function initialize(page, language, theme, signedIn = true) {
  const errors = [];
  await mockSocial(page);
  page.on('pageerror', (error) => errors.push(error.message));
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'test_refresh',
    expires_at: expires,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
  await page.addInitScript(
    ({ language, theme, session, storageKey, signedIn }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      if (signedIn) sessionStorage.setItem(storageKey, JSON.stringify(session));
      window.securityViolations = [];
      document.addEventListener('securitypolicyviolation', (event) =>
        window.securityViolations.push(event.effectiveDirective),
      );
    },
    { language, theme, session, storageKey, signedIn },
  );
  // All production auth traffic is isolated; no live Auth or database mutation occurs.
  await page.route(`${provider.origin}/auth/v1/**`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
  return errors;
}
const png = {
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
};
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark'])
    test(`production CSP preserves guarded profile, literal user content and photo previews ${language}/${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      const errors = await initialize(page, language, theme);
      const response = await page.goto('/profile/edit');
      expect(response.headers()['x-frame-options']).toBe('DENY');
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['referrer-policy']).toBe('no-referrer');
      await expect(page.locator('#profile-name')).toBeVisible();
      const payload = '<img src=x onerror=alert(1)>';
      await page.locator('#profile-name').fill(payload);
      await page.locator('#profile-bio').fill('<svg onload=alert(1)>');
      await page.locator('#profile-avatar-file').setInputFiles(png);
      await expect(page.locator('.avatar-picker img')).toBeVisible();
      await page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole('heading', { name: payload, exact: true })).toBeVisible();
      await expect(page.locator('.profile-bio')).toHaveText('<svg onload=alert(1)>');
      await expect(page.locator('.profile-identity img[src="x"],.profile-bio svg')).toHaveCount(0);
      await expect(page.locator('.large-avatar img')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(
        theme === 'dark',
      );
      expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
      expect(errors).toEqual([]);
    });

test('production CSP blocks injected inline scripts and unauthorized network destinations', async ({
  page,
}) => {
  await initialize(page, 'tr', 'light');
  await page.route('**/profile', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace('</body>', '<script>window.injectedScriptExecuted = true;</script></body>'),
    });
  });
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Campus Student', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    try {
      await fetch('https://attacker.kampusx.invalid/leak');
    } catch {
      /* expected CSP refusal */
    }
  });
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('script-src-elem');
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('connect-src');
  expect(await page.evaluate(() => window.injectedScriptExecuted)).toBeUndefined();
});

test('valid JPEG and WebP still preview under the production image checks', async ({ page }) => {
  await initialize(page, 'tr', 'light');
  await page.goto('/profile/edit');
  await expect(page.locator('#profile-name')).toBeVisible();
  const files = [
    {
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      encoded:
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlaKKK/ST50//Z',
    },
    {
      name: 'photo.webp',
      mimeType: 'image/webp',
      encoded: 'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoIAAgAAUAmJaACdLoB+AADsAD+8MQL/3ZP9sn+2T/5NP/lKvBY3ZsAAAA=',
    },
  ];
  for (const { name, mimeType, encoded } of files) {
    await page
      .locator('#profile-avatar-file')
      .setInputFiles({ name, mimeType, buffer: Buffer.from(encoded, 'base64') });
    await expect(page.locator('.avatar-picker img')).toBeVisible();
    await expect(page.locator('#profile-avatar-file-error')).toHaveText('');
  }
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
});

test('production profile guards reject visitors with no session', async ({ page }) => {
  await initialize(page, 'tr', 'light', false);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('kx-profile-header')).toHaveCount(0);
  expect(await page.evaluate(() => window.securityViolations)).toEqual([]);
});

test('persisted post HTML stays literal and unsafe storage URLs are never requested', async ({ page }) => {
  const errors = await initialize(page, 'tr', 'dark');
  const backend = await mockSocial(page);
  const payload = '<img src=x onerror="window.postXss=true">';
  backend.posts[0].content = payload;
  backend.posts[0].media_url = `${provider.origin}/storage/v1/object/public/uploads/${user.id}/post/active.svg`;
  backend.posts[0].media_type = 'image';
  await page.goto('/dashboard');
  await expect(page.locator('.post-text').first()).toHaveText(payload);
  await expect(page.locator('kx-social-post-card img[src="x"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.postXss)).toBeUndefined();
  expect(backend.requests.filter((request) => request.storage)).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('production CSP blocks unauthorized image loads as well as fetch', async ({ page }) => {
  await initialize(page, 'en', 'light');
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Campus Student', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const image = new Image();
    image.src = 'https://attacker.kampusx.invalid/pixel';
    document.body.append(image);
  });
  await expect.poll(() => page.evaluate(() => window.securityViolations)).toContain('img-src');
});
````

## scripts/security/serve-production.cjs (eklendi)

````javascript
/** Test-only static host. It never creates an auth user or writes to Supabase. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'dist/apps/shell/browser');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headers = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
if (!fs.existsSync(path.join(directory, 'index.html')))
  throw Error('Build production output before running security tests.');
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4400').pathname);
    const target = path.resolve(directory, '.' + pathname);
    if (!target.startsWith(directory + path.sep) && target !== directory) {
      response.writeHead(403).end();
      return;
    }
    const file =
      fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(directory, 'index.html');
    response.writeHead(200, {
      ...headers,
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(400).end();
  }
});
server.listen(4400, '127.0.0.1');
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
````

## scripts/social-services.test.cjs (eklendi)

````javascript
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
````

## scripts/verify-login-email-lookup.cjs (değişti)

````javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Optional local SQL verification: install PGlite into the ignored .nx directory.
// No Supabase connection, real accounts or project dependency changes are needed.
const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, '.nx/login-sql-verification/node_modules/@electric-sql/pglite');
const { PGlite } = require(modulePath);

async function verify() {
  const db = new PGlite();
  const checks = [];
  const check = async (name, run) => {
    await run();
    checks.push({ name, passed: true });
  };
  const lookup = async (email) => {
    const { rows } = await db.query('select public.kampusx_login_email_exists($1) as present', [email]);
    return rows[0].present;
  };
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role unrelated;
      create schema auth;
      create table auth.users (email text, deleted_at timestamptz);
      insert into auth.users values
        ('student@itu.edu.tr', null),
        ('Deleted@itu.edu.tr', now());
      create table public.users (email text);
      insert into public.users values ('decoy@itu.edu.tr');
    `);
    const migration = fs.readFileSync(
      path.join(root, 'supabase/migrations/20261012174500_login_email_lookup.sql'),
      'utf8',
    );
    await check('migration applies and can be reapplied', async () => {
      await db.exec(migration);
      await db.exec(migration);
    });
    await check('known active email returns true', async () =>
      assert.equal(await lookup('student@itu.edu.tr'), true),
    );
    await check('email comparison trims and ignores case', async () =>
      assert.equal(await lookup(' Student@ITU.EDU.TR '), true),
    );
    await check('missing email returns false', async () =>
      assert.equal(await lookup('missing@itu.edu.tr'), false),
    );
    await check('soft-deleted account returns false', async () =>
      assert.equal(await lookup('deleted@itu.edu.tr'), false),
    );
    await check('invalid or oversized input is not classified as missing', async () => {
      for (const input of [null, '', 'not-an-email', 'a'.repeat(321) + '@itu.edu.tr']) {
        assert.equal(await lookup(input), null);
      }
    });
    await check('public-schema decoy cannot alter the auth lookup', async () =>
      assert.equal(await lookup('decoy@itu.edu.tr'), false),
    );
    await check('the unrelated role has no function access', async () => {
      const { rows } = await db.query(
        "select has_function_privilege('unrelated', 'public.kampusx_login_email_exists(text)', 'execute') as allowed",
      );
      assert.equal(rows[0].allowed, false);
    });
    for (const role of ['anon', 'authenticated']) {
      await check(`${role} can receive only the existence boolean`, async () => {
        await db.exec(`set role ${role}`);
        try {
          assert.equal(await lookup('student@itu.edu.tr'), true);
          assert.equal(await lookup('missing@itu.edu.tr'), false);
          await assert.rejects(db.query('select * from auth.users'), (error) => error.code === '42501');
        } finally {
          await db.exec('reset role');
        }
      });
    }
    const disable = fs.readFileSync(
      path.join(root, 'supabase/migrations/20261015180000_disable_login_email_lookup.sql'),
      'utf8',
    );
    await check('disabling account discovery is idempotent', async () => {
      await db.exec(disable);
      await db.exec(disable);
    });
    for (const role of ['anon', 'authenticated', 'unrelated']) {
      await check(`${role} has no execute permission after disable`, async () => {
        const { rows } = await db.query(
          "select has_function_privilege($1, 'public.kampusx_login_email_exists(text)', 'execute') as allowed",
          [role],
        );
        assert.equal(rows[0].allowed, false);
        await db.exec(`set role ${role}`);
        try {
          await assert.rejects(lookup('student@itu.edu.tr'), (error) => error.code === '42501');
        } finally {
          await db.exec('reset role');
        }
      });
    }
    await check('the disabling migration leaves all user rows untouched', async () => {
      const { rows } = await db.query('select count(*)::int as count from auth.users');
      assert.equal(rows[0].count, 2);
    });
    await check('a project without the old RPC accepts the disabling migration', async () => {
      await db.exec('drop function public.kampusx_login_email_exists(text)');
      await db.exec(disable);
      await db.exec(disable);
    });
    const report = {
      engine: 'PGlite PostgreSQL (isolated in-memory fixtures)',
      passed: checks.length,
      failed: 0,
      finalState: 'Legacy RPC execute denied for anon/authenticated; migration also safe when RPC is absent.',
      liveSupabaseChanged: false,
      checks,
    };
    fs.writeFileSync(
      path.join(root, 'docs/login-email-lookup-sql-verification.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(`SQL verification passed: ${checks.length} checks. Real Supabase was not modified.`);
  } finally {
    await db.close();
  }
}

verify().catch(() => {
  console.error('Login email lookup SQL verification failed.');
  process.exitCode = 1;
});
````

## scripts/verify-production-output.cjs (değişti)

````javascript
const fs = require('node:fs');
const path = require('node:path');

const FORBIDDEN_MARKERS = [
  '_console_ninja',
  'console_ninja',
  'console-ninja',
  'auth.kampusx.test',
  'sb_publishable_test_key',
  'kampusx_login_email_exists',
];

class ProductionOutputError extends Error {}

function verifyProductionOutput(browserDirectory) {
  const directory = path.resolve(browserDirectory);
  const javascriptFiles = [];

  function inspect(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) inspect(entryPath);
      else if (entry.isFile() && /\.js$/i.test(entry.name)) javascriptFiles.push(entryPath);
    }
  }

  try {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
      throw new ProductionOutputError('No production JavaScript files found.');
    }
    inspect(directory);
    if (javascriptFiles.length === 0) {
      throw new ProductionOutputError('No production JavaScript files found.');
    }
    for (const file of javascriptFiles) {
      const source = fs.readFileSync(file, 'utf8').toLowerCase();
      if (FORBIDDEN_MARKERS.some((marker) => source.includes(marker))) {
        const name = path.relative(directory, file).replaceAll(path.sep, '/');
        throw new ProductionOutputError(`Unexpected development runtime or test configuration in ${name}.`);
      }
    }
  } catch (error) {
    if (error instanceof ProductionOutputError) throw error;
    throw new ProductionOutputError('Could not verify production JavaScript files.');
  }

  return { fileCount: javascriptFiles.length };
}

if (require.main === module) {
  try {
    const output = path.resolve(__dirname, '../dist/apps/shell/browser');
    const { fileCount } = verifyProductionOutput(output);
    console.log(`Production output verified: ${fileCount} JavaScript files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ProductionOutputError, verifyProductionOutput };
````

## scripts/verify-production-output.test.cjs (değişti)

````javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { verifyProductionOutput } = require('./verify-production-output.cjs');

function temporaryOutput(t) {
  const temporaryDirectory = fs.realpathSync(os.tmpdir());
  const prefix = 'kampusx-production-output-';
  const root = fs.mkdtempSync(path.join(temporaryDirectory, prefix));
  t.after(() => {
    const resolvedRoot = fs.realpathSync(root);
    if (
      path.dirname(resolvedRoot) !== temporaryDirectory ||
      !path.basename(resolvedRoot).startsWith(prefix)
    ) {
      throw new Error('Refusing to remove an unexpected temporary output directory.');
    }
    fs.rmSync(resolvedRoot, { recursive: true, force: true });
  });
  return root;
}

test('valid output is checked recursively without treating non-JavaScript files as runtime', (t) => {
  const root = temporaryOutput(t);
  fs.mkdirSync(path.join(root, 'chunks'));
  fs.writeFileSync(path.join(root, 'main.js'), 'globalThis.applicationStarted = true;');
  fs.writeFileSync(path.join(root, 'chunks', 'lazy.js'), 'export const feature = "auth";');
  fs.writeFileSync(path.join(root, 'note.txt'), 'A note mentioning _console_ninja is not executable.');
  assert.deepEqual(verifyProductionOutput(root), { fileCount: 2 });
});

test('injected debugging runtime fails verification without printing bundle contents', (t) => {
  const root = temporaryOutput(t);
  const file = path.join(root, 'chunk.js');
  for (const source of [
    'eval("globalThis._console_ninja = function(){ return \'private_bundle_data\'; }");',
    'import "console-ninja/runtime";',
  ]) {
    fs.writeFileSync(file, source);
    assert.throws(
      () => verifyProductionOutput(root),
      (error) => {
        assert.match(error.message, /chunk\.js/);
        assert.equal(error.message.includes('private_bundle_data'), false);
        assert.equal(error.message.includes(source), false);
        return /Unexpected development runtime/.test(error.message);
      },
    );
  }
});

test('a production bundle containing either e2e endpoint or key is rejected without value leakage', (t) => {
  const root = temporaryOutput(t);
  for (const value of ['https://auth.kampusx.test', 'sb_publishable_test_key']) {
    fs.writeFileSync(path.join(root, 'main.js'), `const configuration = ${JSON.stringify(value)};`);
    assert.throws(
      () => verifyProductionOutput(root),
      (error) => {
        assert.match(error.message, /main\.js/);
        assert.equal(error.message.includes(value), false);
        return /Unexpected development runtime or test configuration/.test(error.message);
      },
    );
  }
});

test('missing or empty JavaScript output cannot pass as a clean production build', (t) => {
  const root = temporaryOutput(t);
  assert.throws(() => verifyProductionOutput(path.join(root, 'missing')), /No production JavaScript/);
  fs.writeFileSync(path.join(root, 'index.html'), '<html></html>');
  assert.throws(() => verifyProductionOutput(root), /No production JavaScript/);
});

test('the retired account discovery RPC cannot ship in production JavaScript', (t) => {
  const root = temporaryOutput(t);
  fs.writeFileSync(path.join(root, 'auth.js'), 'client.rpc("kampusx_login_email_exists", {});');
  assert.throws(() => verifyProductionOutput(root), /auth\.js/);
});
````
