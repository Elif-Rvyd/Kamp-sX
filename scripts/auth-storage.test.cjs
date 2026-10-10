const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exportsObject = {};
const source = fs.readFileSync('apps/shell/src/app/core/browser-auth-storage.ts', 'utf8');
new Function(
  'exports',
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
)(exportsObject);
const { BrowserAuthStorage } = exportsObject;
const key = 'sb-test-auth-token';
function storage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
test('unchecked remember stores tokens only for the current tab', () => {
  const local = storage(),
    tab = storage();
  new BrowserAuthStorage(key, local, tab).setItem(key, 'test-token');
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), 'test-token');
  assert.equal(new BrowserAuthStorage(key, local, storage()).getItem(key), null);
});
test('remember preference survives reload and tokens migrate without unrelated data', () => {
  const local = storage(),
    tab = storage();
  tab.setItem('kampusx-theme', 'dark');
  const adapter = new BrowserAuthStorage(key, local, tab);
  adapter.setItem(key, 'test-token');
  adapter.setRemember(true);
  assert.equal(local.getItem(key), 'test-token');
  assert.equal(tab.getItem(key), null);
  assert.equal(tab.getItem('kampusx-theme'), 'dark');
  assert.equal(new BrowserAuthStorage(key, local, storage()).getItem(key), 'test-token');
  adapter.setRemember(false);
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), 'test-token');
});
test('legacy persisted sessions without preference become tab scoped', () => {
  const local = storage(),
    tab = storage();
  local.setItem(key, 'legacy-token');
  const adapter = new BrowserAuthStorage(key, local, tab);
  assert.equal(adapter.getItem(key), 'legacy-token');
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), 'legacy-token');
});
test('removal clears both stores and does not resurrect a cached session', () => {
  const local = storage(),
    tab = storage();
  const adapter = new BrowserAuthStorage(key, local, tab);
  adapter.setItem(key, 'test-token');
  tab.removeItem(key); // External removal must not revive a memory-cached token.
  assert.equal(adapter.getItem(key), null);
  adapter.setRemember(true);
  adapter.setItem(key, 'test-token');
  adapter.removeItem(key);
  assert.equal(adapter.getItem(key), null);
  assert.equal(local.getItem(key), null);
  assert.equal(tab.getItem(key), null);
});
test('blocked or quota-limited browser storage has a page-memory fallback', () => {
  const denied = {
    get length() {
      throw new Error('blocked');
    },
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  const adapter = new BrowserAuthStorage(key, denied, denied);
  adapter.setItem(key, 'test-token');
  adapter.setRemember(true);
  assert.equal(adapter.getItem(key), 'test-token');
  adapter.removeItem(key);
  assert.equal(adapter.getItem(key), null);
  const quota = {
    ...storage(),
    setItem() {
      throw new Error('quota');
    },
  };
  const quotaAdapter = new BrowserAuthStorage(key, null, quota);
  quotaAdapter.setItem(key, 'test-token');
  assert.equal(quotaAdapter.getItem(key), 'test-token');
});
