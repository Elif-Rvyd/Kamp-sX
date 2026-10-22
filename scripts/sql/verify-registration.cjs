const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  let checks = 0;
  const test = async (name, fn) => {
    await fn();
    checks++;
    console.log('PASS ' + name);
  };
  try {
    await db.exec(`create role anon;create role authenticated;create schema private;create schema auth;
   create table auth.users(id uuid primary key default gen_random_uuid(),raw_user_meta_data jsonb);
   create table profiles(user_id uuid primary key,full_name text,university text,campus text,studying text,university_id uuid,campus_id uuid,department_id uuid,faculty_id uuid);
   create function private.kx_key(value text) returns text language sql immutable set search_path=public as $$ select lower(btrim(value)) $$;
   create table universities(id uuid primary key default gen_random_uuid(),name text,name_key text generated always as(private.kx_key(name)) stored unique);
   create table campuses(id uuid primary key default gen_random_uuid(),university_id uuid references universities,name text,name_key text generated always as(private.kx_key(name)) stored,unique(university_id,name_key));
   create table departments(id uuid primary key default gen_random_uuid(),university_id uuid references universities,name text,name_key text generated always as(private.kx_key(name)) stored,unique(university_id,name_key));
   grant all on universities,campuses,departments to anon,authenticated;
   grant update,select on profiles to authenticated;
   create function public.handle_new_user() returns trigger language plpgsql as $$ begin return new; end $$;
   insert into auth.users(id,raw_user_meta_data) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{}');
   insert into profiles(user_id,full_name,university_id) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Old user','11111111-1111-4111-8111-111111111111');`);
    const install = fs.readFileSync('docs/supabase/30-registration-catalog-and-consent.sql', 'utf8');
    await test('additive installation is idempotent and does not backdate existing consent', async () => {
      await db.exec(install);
      await db.exec(install);
      assert.equal(
        (await db.query('select count(*)::int as n from private.registration_acceptances')).rows[0].n,
        0,
      );
    });
    await db.exec(`insert into universities(id,name,catalog_verified) values('11111111-1111-4111-8111-111111111111','University A',true),('22222222-2222-4222-8222-222222222222','University B',true),('33333333-3333-4333-8333-333333333333','User typo',false);
   insert into campuses(university_id,name,catalog_verified) values('11111111-1111-4111-8111-111111111111','Campus A',true),('22222222-2222-4222-8222-222222222222','Campus B',true);
   insert into departments(university_id,name,catalog_verified) values('11111111-1111-4111-8111-111111111111','Department A',true),('22222222-2222-4222-8222-222222222222','Department B',true);`);
    const metadata = {
      terms_accepted: true,
      privacy_acknowledged: true,
      terms_version: '2026-10-22',
      privacy_version: '2026-10-22',
      university_name: 'University A',
      campus_name: 'Campus A',
      department_name: 'Department A',
    };
    const signup = (value) =>
      db.query('insert into auth.users(raw_user_meta_data) values($1::jsonb) returning id', [
        JSON.stringify(value),
      ]);
    for (const field of ['terms_accepted', 'privacy_acknowledged'])
      await test(field + ' must be a literal boolean true', async () => {
        for (const value of [undefined, false, 'true', null])
          await assert.rejects(signup({ ...metadata, [field]: value }), /legal_acceptance_required/);
      });
    await test('versions must match the documents shown at signup', async () => {
      for (const field of ['terms_version', 'privacy_version'])
        await assert.rejects(signup({ ...metadata, [field]: 'old' }), /legal_acceptance_required/);
    });
    await test('free text, missing values and unapproved rows cannot register', async () => {
      for (const field of ['university_name', 'campus_name', 'department_name'])
        for (const value of [null, '', 'User typo', 'Made up'])
          await assert.rejects(
            signup({ ...metadata, [field]: value }),
            /academic_catalog_selection_required/,
          );
    });
    await test('campus and department must belong to the selected university', async () => {
      for (const value of [{ campus_name: 'Campus B' }, { department_name: 'Department B' }])
        await assert.rejects(signup({ ...metadata, ...value }), /academic_catalog_selection_required/);
    });
    let id;
    await test('valid signup produces one immutable receipt with server time', async () => {
      id = (await signup(metadata)).rows[0].id;
      const row = (await db.query('select * from private.registration_acceptances where user_id=$1', [id]))
        .rows[0];
      assert.equal(row.terms_version, '2026-10-22');
      assert.ok(new Date(row.accepted_at).getFullYear() >= 2026);
    });
    for (const role of ['anon', 'authenticated'])
      await test(
        role + ' can read approved names but cannot modify the catalog or read receipts',
        async () => {
          await db.exec('set role ' + role);
          assert.equal((await db.query('select id,name from universities')).rows.length, 2);
          await assert.rejects(
            db.query("insert into universities(name,catalog_verified) values('Fake',true)"),
            /permission denied/,
          );
          await assert.rejects(
            db.query('select * from private.registration_acceptances'),
            /permission denied/,
          );
          await db.exec('reset role');
        },
      );
    await test('a user cannot change academic text or foreign keys, but can update display name', async () => {
      await db.exec('set role authenticated');
      await assert.rejects(
        db.query("update profiles set university_id='22222222-2222-4222-8222-222222222222'"),
        /academic_fields_locked/,
      );
      await assert.rejects(db.query("update profiles set campus='Forged'"), /academic_fields_locked/);
      await db.exec("update profiles set full_name='New name'");
      await db.exec('reset role');
    });
    await test('full catalog seed is idempotent, excludes free-text samples and preserves existing IDs', async () => {
      const seed = fs.readFileSync('docs/supabase/31-academic-catalog-seed.sql', 'utf8');
      await db.exec(seed);
      const before = (await db.query('select id,name from universities order by id')).rows;
      await db.exec(seed);
      assert.deepEqual((await db.query('select id,name from universities order by id')).rows, before);
      assert.equal(
        (await db.query("select catalog_verified from universities where name='User typo'")).rows[0]
          .catalog_verified,
        false,
      );
      assert.ok(before.length >= 210);
      assert.equal((await db.query('select user_id from profiles')).rows.length, 1);
      const ahi = (
        await db.query(
          "select id,name from universities where name_key=private.kx_key('Kırşehir Ahi Evran Üniversitesi')",
        )
      ).rows[0];
      assert.ok(ahi);
      assert.equal(
        (
          await db.query(
            'select count(*)::int as n from campuses where university_id=$1 and catalog_verified',
            [ahi.id],
          )
        ).rows[0].n,
        6,
      );
      const counts = (
        await db.query(
          'select (select count(*) from universities where catalog_verified) as universities,(select count(*) from departments where catalog_verified) as departments,(select count(*) from campuses where catalog_verified) as campuses',
        )
      ).rows[0];
      console.log('Catalog fixture totals: ' + JSON.stringify(counts));
      assert.equal(
        (
          await db.query(
            "select count(*)::int as n from campuses where catalog_verified and name in('hello','selam','Merhaba')",
          )
        ).rows[0].n,
        0,
      );
    });
    await test('rollback preserves accounts and receipts and disables only the new signup gate', async () => {
      await db.exec(
        fs.readFileSync('docs/supabase/30-registration-catalog-and-consent-rollback.sql', 'utf8'),
      );
      await signup({});
      assert.equal(
        (await db.query('select count(*)::int as n from private.registration_acceptances')).rows[0].n,
        1,
      );
      assert.equal((await db.query('select count(*)::int as n from profiles')).rows[0].n, 1);
    });
    console.log(checks + ' registration PostgreSQL checks passed; no production connection.');
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
