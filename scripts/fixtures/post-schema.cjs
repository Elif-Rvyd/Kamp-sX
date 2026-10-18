// Test the API boundary against the real CLI-generated schema, not a permissive mock row.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = ts.createSourceFile(
  'database.generated.ts',
  fs.readFileSync(path.join(__dirname, '../../apps/shell/src/app/core/database.generated.ts'), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const database = source.statements.find(
  (s) => ts.isTypeAliasDeclaration(s) && s.name.text === 'Database',
).type;
const property = (type, name) =>
  type.members.find((member) => member.name.getText(source).replaceAll("'", '') === name).type;
const row = property(property(property(property(database, 'public'), 'Tables'), 'posts'), 'Row');
module.exports = { postColumns: new Set(row.members.map((member) => member.name.getText(source))) };
