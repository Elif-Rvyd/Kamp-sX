// Actual remediation SQL runs in isolated PostgreSQL. No live Supabase requests.
// Bucket API enforcement is not simulated: these tests check its configuration, plus real SQL RLS.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { PGlite } = require(path.join(root, '.nx/sql-verification/node_modules/@electric-sql/pglite'));
const sql = fs.readFileSync(path.join(root, 'docs/supabase/11-uploads-security-hardening.sql'), 'utf8');
const diagnostic = fs.readFileSync(
  path.join(root, 'docs/supabase/10-storage-security-diagnostics.sql'),
  'utf8',
);
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ID = '44444444-4444-4444-8444-444444444444';
async function main() {
  const db = new PGlite(),
    checks = [];
  const check = async (name, run) => {
    await run();
    checks.push(name);
  };
  const denied = (promise) => assert.rejects(promise, (error) => error.code === '42501');
  const asRole = async (role, user, run) => {
    assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user || '']);
    try {
      return await run();
    } finally {
      await db.exec('reset role');
    }
  };
  const insert = (name, bucket = 'uploads') =>
    db.query('insert into storage.objects (bucket_id, name) values ($1, $2) returning id, name', [
      bucket,
      name,
    ]);
  try {
    await db.exec(`
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table storage.buckets (id text primary key, public boolean not null, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets(id), name text not null);
      alter table storage.objects enable row level security;
      grant usage on schema storage, auth to anon, authenticated, service_role;
      grant all privileges on storage.objects to anon, authenticated, service_role;
      insert into storage.buckets values ('uploads', true, null, null), ('other', false, 1000, array['application/pdf']);
      create policy "Insert Policy 1va6avm_0" on storage.objects for insert to public with check (bucket_id = 'uploads');
      create policy "Select Policy 1va6avm_0" on storage.objects for select to public using (bucket_id = 'uploads');
    `);
    await check('diagnostic reports broad legacy policies without reading file/user data', async () => {
      const before = (await db.query(diagnostic)).rows[0].storage_security_diagnostics;
      assert.equal(before.objects_rls_enabled, true);
      assert.equal(before.uploads_bucket.file_size_limit, null);
      assert.equal(before.object_policies.length, 2);
    });
    await check(
      'before fix anonymous and foreign-path uploads succeed under reported legacy policy',
      async () => {
        await asRole('anon', null, () => insert(`${B}/post/${ID}.html`));
        await asRole('authenticated', A, () => insert(`${B}/avatar/${ID}.png`));
      },
    );
    await check('SQL is repeatable, retains legacy policies and changes no objects', async () => {
      await db.exec(sql);
      await db.exec(sql);
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, 2);
      assert.equal(
        (await db.query("select count(*)::int as n from pg_policies where schemaname='storage'")).rows[0].n,
        8,
      );
    });
    await check(
      'public visibility stays public, server MIME/size settings are bounded and other buckets unchanged',
      async () => {
        const rows = (await db.query('select * from storage.buckets order by id')).rows;
        assert.deepEqual(rows[0], {
          id: 'other',
          public: false,
          file_size_limit: 1000,
          allowed_mime_types: ['application/pdf'],
        });
        assert.equal(rows[1].public, true);
        assert.equal(rows[1].file_size_limit, 52428800);
        assert.deepEqual(rows[1].allowed_mime_types, [
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/webm',
        ]);
      },
    );
    await check('anonymous upload and metadata listing are denied despite broad legacy policies', () =>
      asRole('anon', null, async () => {
        await denied(insert(`${A}/post/${ID}.png`));
        assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
      }),
    );
    await check('owners upload every supported media format and read only their metadata', () =>
      asRole('authenticated', A, async () => {
        for (const purpose of ['avatar', 'banner', 'post'])
          for (const ext of purpose === 'post'
            ? ['jpg', 'png', 'webp', 'mp4', 'webm']
            : ['jpg', 'png', 'webp'])
            await insert(`${A}/${purpose}/${ID}.${ext}`);
        const rows = (await db.query('select * from storage.objects')).rows;
        assert.equal(rows.length, 11);
        assert.ok(rows.every((row) => row.name.startsWith(A + '/')));
      }),
    );
    await check('forged ownership, traversal, active formats and invalid areas/names are denied', () =>
      asRole('authenticated', A, async () => {
        for (const name of [
          `${B}/post/${ID}.png`,
          `${A}/post/../avatar/${ID}.png`,
          `${A}/post/%2e%2e/${ID}.png`,
          `${A}/post/${ID}.svg`,
          `${A}/post/${ID}.html`,
          `${A}/post/${ID}.png.html`,
          `${A}/post/${ID}.png?x=1`,
          `${A}/avatar/${ID}.mp4`,
          `${A}/banner/${ID}.webm`,
          `${A}/documents/${ID}.png`,
          `${A}/post/custom.png`,
          `${A}/post/${ID}.PNG`,
          `${A}/post/${ID}.png\n`,
        ])
          await denied(insert(name));
      }),
    );
    await check('authenticated role without user identity cannot upload', () =>
      asRole('authenticated', null, () => denied(insert(`${A}/post/${ID}.png`))),
    );
    await check('an unrelated permissive ALL policy cannot reopen uploads', async () => {
      await db.exec(
        'create policy unrelated_broad_policy on storage.objects for all to public using (true) with check (true)',
      );
      await asRole('anon', null, () => denied(insert(`${A}/post/${ID}.png`)));
      await asRole('authenticated', A, () => denied(insert(`${B}/post/${ID}.png`)));
    });
    await check('client update/delete of uploads are blocked even with permissive ALL', () =>
      asRole('authenticated', A, async () => {
        assert.equal(
          (await db.query("update storage.objects set name=name where bucket_id='uploads' returning id")).rows
            .length,
          0,
        );
        assert.equal(
          (await db.query("delete from storage.objects where bucket_id='uploads' returning id")).rows.length,
          0,
        );
      }),
    );
    await check('other bucket operations still follow existing policy but cannot move into uploads', () =>
      asRole('authenticated', A, async () => {
        const row = (await insert('document.pdf', 'other')).rows[0];
        assert.equal(
          (
            await db.query('update storage.objects set name=$1 where id=$2 returning id', [
              'updated.pdf',
              row.id,
            ])
          ).rows.length,
          1,
        );
        await denied(
          db.query('update storage.objects set bucket_id=$1, name=$2 where id=$3', [
            'uploads',
            `${A}/post/${ID}.png`,
            row.id,
          ]),
        );
        assert.equal(
          (await db.query('delete from storage.objects where id=$1 returning id', [row.id])).rows.length,
          1,
        );
      }),
    );
    await check('service role bypass remains intentional and must never ship to browser', () =>
      asRole('service_role', null, async () => {
        await insert('admin-only.txt');
      }),
    );
    await check('stricter pre-existing size limit and private visibility are preserved', async () => {
      await db.exec("update storage.buckets set file_size_limit=10485760, public=false where id='uploads'");
      await db.exec(sql);
      const bucket = (await db.query("select * from storage.buckets where id='uploads'")).rows[0];
      assert.equal(bucket.file_size_limit, 10485760);
      assert.equal(bucket.public, false);
    });
    await check('disabled RLS stops before changing configuration', async () => {
      await db.exec('alter table storage.objects disable row level security');
      await assert.rejects(db.exec(sql), /RLS açık değil/);
      await db.exec('rollback');
      await db.exec('alter table storage.objects enable row level security');
    });
    await check('missing uploads bucket stops atomically without creating it', async () => {
      await db.exec("delete from storage.objects; delete from storage.buckets where id='uploads'");
      await assert.rejects(db.exec(sql), /bucket bulunamadı/);
      await db.exec('rollback');
      assert.equal(
        (await db.query("select count(*)::int as n from storage.buckets where id='uploads'")).rows[0].n,
        0,
      );
    });
    console.log(
      JSON.stringify(
        {
          engine: 'in-memory PostgreSQL (PGlite)',
          passed: checks.length,
          checks,
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
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
