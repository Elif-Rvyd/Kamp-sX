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
