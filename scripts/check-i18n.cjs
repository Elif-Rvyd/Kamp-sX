const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = (lang) =>
  JSON.parse(fs.readFileSync(path.join(root, 'apps/shell/src/assets/i18n', `${lang}.json`), 'utf8'));
const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'object' ? flatten(value, prefix + key + '.') : [prefix + key],
  );
const tr = load('tr');
const en = load('en');
const trKeys = flatten(tr);
const enKeys = flatten(en);
const missing = [...trKeys.filter((k) => !enKeys.includes(k)), ...enKeys.filter((k) => !trKeys.includes(k))];
const empty = (object) =>
  Object.entries(object).some(([, value]) =>
    typeof value === 'object' ? empty(value) : !String(value).trim(),
  );
const sources = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|html)$/.test(file)) sources.push(fs.readFileSync(file, 'utf8'));
  }
}
walk(path.join(root, 'apps/shell/src/app'));
walk(path.join(root, 'libs/shared'));
const literals = sources.flatMap((source) =>
  [...source.matchAll(/\bt\(['"]([\w.]+)['"]\)/g)].map((match) => match[1]),
);
const unknown = [...new Set(literals.filter((key) => !trKeys.includes(key)))];
if (missing.length || unknown.length || empty(tr) || empty(en)) {
  console.error({ missing, unknown, empty: empty(tr) || empty(en) });
  process.exit(1);
}
console.log(`TR/EN: ${trKeys.length} matching non-empty keys; literal template keys resolved.`);
