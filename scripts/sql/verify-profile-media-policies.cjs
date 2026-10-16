// Run only against an in-memory PostgreSQL engine. Never connects to Supabase.
// Test dependency (outside application dependencies):
// npm install --prefix .nx/sql-verification --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.10
// node scripts/sql/verify-profile-media-policies.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { PGlite } = require(path.join(root, '.nx/sql-verification/node_modules/@electric-sql/pglite'));
const sql = fs.readFileSync(path.join(root, 'docs/supabase/05-profile-media-permissions.sql'), 'utf8');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const D = '44444444-4444-4444-8444-444444444444';
const checks = [];
async function verify() {
  const db = new PGlite();
  const check = async (name, run) => {
    await run();
    checks.push({ name, passed: true });
  };
  const denied = (operation) => assert.rejects(operation, (error) => error.code === '42501');
  const asRole = async (role, owner, run) => {
    assert.ok(['authenticated', 'anon', 'service_role'].includes(role));
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner || '']);
    try {
      return await run();
    } finally {
      await db.exec('reset role');
    }
  };
  try {
    // Schema, constraints and overly broad grants mirror the supplied diagnostic.
    // All rows/identities below are synthetic and exist only inside this test engine.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      create table auth.users (id uuid primary key);
      create table public.profiles (
        user_id uuid primary key references auth.users(id) on delete cascade,
        username text unique, full_name text, avatar_url text, banner_url text,
        university text, studying text, bio text,
        created_at timestamptz not null default timezone('utc', now())
      );
      alter table public.profiles enable row level security;
      grant all on public.profiles to public, anon, authenticated, service_role;
      grant select (username), update (full_name) on public.profiles to public, anon, authenticated;
    `);
    for (const id of [A, B, C, D]) await db.query('insert into auth.users values ($1)', [id]);
    for (const id of [A, B])
      await db.query('insert into public.profiles (user_id, full_name) values ($1, $2)', [
        id,
        'Test student',
      ]);
    await check('before fix: RLS with no policies hides the existing own row', () =>
      asRole('authenticated', A, async () => {
        assert.deepEqual(
          (
            await db.query('select user_id, avatar_url, banner_url from public.profiles where user_id = $1', [
              A,
            ])
          ).rows,
          [],
        );
        assert.deepEqual(
          (
            await db.query(
              'update public.profiles set avatar_url = $1 where user_id = $2 returning user_id',
              ['test-before', A],
            )
          ).rows,
          [],
        );
      }),
    );
    await check('before fix: the client fallback insert is rejected', () =>
      asRole('authenticated', C, () =>
        denied(db.query('insert into public.profiles (user_id) values ($1)', [C])),
      ),
    );
    await check('the exact SQL executes successfully and can be applied twice', async () => {
      await db.exec(sql);
      await db.exec(sql);
      assert.equal(
        (
          await db.query(
            "select count(*)::int as count from pg_policies where schemaname='public' and tablename='profiles'",
          )
        ).rows[0].count,
        3,
      );
      assert.equal(
        (await db.query("select relrowsecurity from pg_class where oid='public.profiles'::regclass")).rows[0]
          .relrowsecurity,
        true,
      );
    });
    await check('signed-in owner reads and updates both photo columns with returning', () =>
      asRole('authenticated', A, async () => {
        assert.deepEqual(
          (
            await db.query('select user_id, avatar_url, banner_url from public.profiles where user_id=$1', [
              A,
            ])
          ).rows,
          [{ user_id: A, avatar_url: null, banner_url: null }],
        );
        assert.deepEqual(
          (
            await db.query(
              'update public.profiles set avatar_url=$1, banner_url=$2 where user_id=$3 returning user_id',
              ['avatar-test', 'banner-test', A],
            )
          ).rows,
          [{ user_id: A }],
        );
      }),
    );
    await check('missing own profile inserts with only the three media fields', () =>
      asRole('authenticated', C, async () => {
        assert.deepEqual(
          (
            await db.query(
              'insert into public.profiles (user_id, avatar_url, banner_url) values ($1, $2, $3) returning user_id',
              [C, 'new-avatar', null],
            )
          ).rows,
          [{ user_id: C }],
        );
      }),
    );
    await check('another user cannot read or update a foreign profile', () =>
      asRole('authenticated', A, async () => {
        assert.deepEqual(
          (await db.query('select user_id, avatar_url from public.profiles where user_id=$1', [B])).rows,
          [],
        );
        assert.deepEqual(
          (
            await db.query('update public.profiles set avatar_url=$1 where user_id=$2 returning user_id', [
              'forged',
              B,
            ])
          ).rows,
          [],
        );
      }),
    );
    await check('forged owner inserts are rejected by RLS', () =>
      asRole('authenticated', A, () =>
        denied(db.query('insert into public.profiles (user_id) values ($1)', [D])),
      ),
    );
    await check('changing row ownership or unrelated fields is denied at column level', () =>
      asRole('authenticated', A, async () => {
        await denied(db.query('update public.profiles set user_id=$1 where user_id=$2', [D, A]));
        await denied(db.query('update public.profiles set full_name=$1 where user_id=$2', ['forged', A]));
        await denied(db.query('select username from public.profiles where user_id=$1', [A]));
      }),
    );
    await check('anonymous users cannot read, insert, update, delete or truncate', () =>
      asRole('anon', null, async () => {
        for (const query of [
          'select user_id, avatar_url from public.profiles',
          `insert into public.profiles (user_id) values ('${D}')`,
          'update public.profiles set avatar_url=null',
          'delete from public.profiles',
          'truncate public.profiles',
          'select username from public.profiles',
        ])
          await denied(db.query(query));
      }),
    );
    await check('signed-in users cannot delete or truncate the table', () =>
      asRole('authenticated', A, async () => {
        await denied(db.query('delete from public.profiles where user_id=$1', [A]));
        await denied(db.query('truncate public.profiles'));
      }),
    );
    await check('server service-role permissions are preserved', () =>
      asRole('service_role', null, async () => {
        assert.equal((await db.query('select count(*)::int as count from public.profiles')).rows[0].count, 3);
      }),
    );
    await check('unexpected existing policies cause an atomic stop', async () => {
      await db.exec(
        'create policy unexpected_policy on public.profiles for select to authenticated using (false)',
      );
      await assert.rejects(db.exec(sql), /Başka profiles policy/);
      await db.exec('rollback');
      assert.equal(
        (await db.query("select count(*)::int as count from pg_policies where tablename='profiles'")).rows[0]
          .count,
        4,
      );
      await db.exec('drop policy unexpected_policy on public.profiles');
    });
    await check('RLS being disabled causes a stop rather than exposing rows', async () => {
      await db.exec('alter table public.profiles disable row level security');
      await assert.rejects(db.exec(sql), /RLS açık public.profiles/);
      await db.exec('rollback; alter table public.profiles enable row level security');
    });
    await check('a new required field without a default stops safely', async () => {
      await db.exec(
        "alter table public.profiles add column required_external text; update public.profiles set required_external='fixture'; alter table public.profiles alter column required_external set not null",
      );
      await assert.rejects(db.exec(sql), /ek zorunlu sütun/);
      await db.exec('rollback; alter table public.profiles drop column required_external');
    });
    console.log(
      JSON.stringify(
        {
          engine: 'in-memory PostgreSQL (PGlite 0.5.10)',
          checks,
          passed: checks.length,
          liveSupabaseContacted: false,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
