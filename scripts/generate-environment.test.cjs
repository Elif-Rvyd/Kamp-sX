const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  generateEnvironment,
  readLocalEnvironment,
  resolveEnvironment,
  validatePublishableKey,
  validateUrl,
} = require('./generate-environment.cjs');

const publicConfig = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_public_test_value',
};

function temporaryWorkspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kampusx-environment-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function jwt(role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url');
  return `${header}.${payload}.test_signature`;
}

test('valid public configuration is normalized and selected', () => {
  assert.deepEqual(resolveEnvironment(publicConfig), {
    supabaseUrl: 'https://example.supabase.co',
    supabasePublishableKey: publicConfig.SUPABASE_PUBLISHABLE_KEY,
  });
});

test('an unconfigured local checkout keeps the landing page available', () => {
  assert.deepEqual(resolveEnvironment({}), { supabaseUrl: '', supabasePublishableKey: '' });
  assert.throws(() => resolveEnvironment({}, {}, true), /Missing environment variables/);
  assert.throws(() => resolveEnvironment({ SUPABASE_URL: publicConfig.SUPABASE_URL }), /KEY/);
});

test('Vercel requires variables and ignores a local file', (t) => {
  const root = temporaryWorkspace(t);
  fs.writeFileSync(
    path.join(root, '.env.local'),
    Object.entries(publicConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n'),
  );
  assert.throws(() => generateEnvironment({ root, environment: { VERCEL: '1' } }), /Missing/);
  assert.throws(() => generateEnvironment({ root, environment: { VERCEL_ENV: 'production' } }), /Missing/);
  assert.equal(fs.existsSync(path.join(root, 'apps/shell/src/environments/environment.ts')), false);
});

test('deployment variables reach the generated Angular source', (t) => {
  const root = temporaryWorkspace(t);
  const config = generateEnvironment({ root, environment: { ...publicConfig, VERCEL: '1' } });
  const source = fs.readFileSync(path.join(root, 'apps/shell/src/environments/environment.ts'), 'utf8');
  assert.match(source, /export const environment/);
  assert.ok(source.includes(JSON.stringify(config.supabaseUrl)));
  assert.ok(source.includes(JSON.stringify(config.supabasePublishableKey)));
});

test('environment changes regenerate source rather than preserve an old project', (t) => {
  const root = temporaryWorkspace(t);
  generateEnvironment({ root, environment: publicConfig });
  generateEnvironment({
    root,
    environment: { ...publicConfig, SUPABASE_URL: 'https://replacement.supabase.co' },
  });
  const source = fs.readFileSync(path.join(root, 'apps/shell/src/environments/environment.ts'), 'utf8');
  assert.ok(source.includes('replacement.supabase.co'));
  assert.equal(source.includes('example.supabase.co'), false);
});

test('local .env values support quotes, comments, and process overrides', (t) => {
  const root = temporaryWorkspace(t);
  const file = path.join(root, '.env.local');
  fs.writeFileSync(
    file,
    [
      '# Public connection',
      'export SUPABASE_URL="https://example.supabase.co" # comment',
      "SUPABASE_PUBLISHABLE_KEY='sb_publishable_example_public_test_value'",
      'OTHER_SECRET=must_not_enter_browser',
    ].join('\n'),
  );
  const local = readLocalEnvironment(file);
  assert.deepEqual(local, publicConfig);
  assert.equal(
    resolveEnvironment({ SUPABASE_URL: 'https://override.supabase.co' }, local).supabaseUrl,
    'https://override.supabase.co',
  );
  assert.throws(() => resolveEnvironment({ SUPABASE_URL: '' }, local), /Missing/);
});

test('secret, service role, arbitrary and malformed keys are rejected without value leakage', () => {
  const invalidKeys = [
    'sb_secret_do_not_show_this_value',
    jwt('service_role'),
    jwt('authenticated'),
    'not-a-key',
    'x.y.z',
  ];
  for (const key of invalidKeys) {
    assert.throws(
      () => validatePublishableKey(key),
      (error) => {
        assert.equal(error.message.includes(key), false);
        return /SUPABASE_PUBLISHABLE_KEY/.test(error.message);
      },
    );
  }
  assert.equal(validatePublishableKey(jwt('anon')), jwt('anon'));
});

test('remote plaintext, credentials, paths and executable URL schemes are rejected', () => {
  for (const url of [
    'http://example.supabase.co',
    'https://username:password@example.supabase.co',
    'https://example.supabase.co/rest/v1',
    'https://example.supabase.co?api_key=secret',
    'https://example.supabase.co#secret',
    'javascript:alert(1)',
  ]) {
    assert.throws(
      () => validateUrl(url),
      (error) => {
        assert.equal(error.message.includes(url), false);
        return /SUPABASE_URL/.test(error.message);
      },
    );
  }
  assert.equal(validateUrl('http://127.0.0.1:54321'), 'http://127.0.0.1:54321');
});
