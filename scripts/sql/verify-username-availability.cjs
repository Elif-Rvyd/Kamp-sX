const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create table profiles(username text unique);alter table profiles enable row level security;insert into profiles values('Student_1');",
    );
    const migration = fs.readFileSync('docs/supabase/25-username-availability.sql', 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    await db.exec('set role anon');
    for (const [name, expected] of [
      ['Student_1', false],
      ['@student_1', false],
      ['new_student', true],
      ['x', false],
      ['student%1', false],
      [null, false],
    ]) {
      assert.equal(
        (await db.query('select public.kampusx_username_available($1) as result', [name])).rows[0].result,
        expected,
      );
    }
    await assert.rejects(db.query('select * from profiles'), /permission denied/);
    await db.exec('reset role');
    await db.exec(fs.readFileSync('docs/supabase/25-username-availability-rollback.sql', 'utf8'));
    assert.equal(
      (await db.query("select to_regprocedure('public.kampusx_username_available(text)') as fn")).rows[0].fn,
      null,
    );
    console.log('PASS: 9 username checks, idempotence and rollback; no production connection');
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
