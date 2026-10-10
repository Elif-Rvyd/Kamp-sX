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
