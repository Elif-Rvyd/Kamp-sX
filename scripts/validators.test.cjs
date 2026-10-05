const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile the actual pure validator implementation, avoiding Angular's JIT runtime in Node.
const source = fs.readFileSync('libs/shared/util/validators.ts', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
new Function('exports', js)(exportsObject);
const { universityEmail, username, passwordStrength, validationKey } = exportsObject;
test('university emails accept legitimate subdomains and reject spoofed suffixes', () => {
  for (const value of ['ogrenci@itu.edu.tr', 'student@std.metu.edu.tr', 'Student@ITU.EDU.TR'])
    assert.equal(universityEmail({ value }), null);
  for (const value of [
    'student@gmail.com',
    'student@itu.edu.tr.evil.com',
    'student@edu.tr',
    'a b@itu.edu.tr',
    'a@.edu.tr',
  ])
    assert.deepEqual(universityEmail({ value }), { universityEmail: true });
});
test('usernames accept handles and enforce character/length limits', () => {
  assert.equal(username({ value: '@ece_codes' }), null);
  for (const value of ['ab', 'a'.repeat(21), 'a b c', '@@name'])
    assert.deepEqual(username({ value }), { username: true });
});
test('password strength and localized error keys reflect actual state', () => {
  assert.equal(passwordStrength(''), 0);
  assert.equal(passwordStrength('Abcdefgh123!'), 4);
  assert.equal(validationKey({ touched: false, errors: { required: true } }), '');
  assert.equal(validationKey({ touched: true, errors: { minlength: true } }), 'validation.passwordLength');
});
