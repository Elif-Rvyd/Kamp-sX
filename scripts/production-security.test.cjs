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
