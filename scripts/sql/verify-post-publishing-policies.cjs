// Uses the existing local test engine; never connects to Supabase or uploads a file.
// node scripts/sql/verify-post-publishing-policies.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { PGlite } = require(path.join(root, '.nx/sql-verification/node_modules/@electric-sql/pglite'));
const sql = fs.readFileSync(path.join(root, 'docs/supabase/09-post-publishing-permissions.sql'), 'utf8');
const diagnostics = fs.readFileSync(path.join(root, 'docs/supabase/08-post-save-diagnostics.sql'), 'utf8');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const FILE_ID = '44444444-4444-4444-8444-444444444444';
const mediaUrl = (owner, extension) =>
  `https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/${owner}/post/${FILE_ID}.${extension}`;

async function verify() {
  const db = new PGlite();
  const checks = [];
  const check = async (name, run) => {
    await run();
    checks.push({ name, passed: true });
  };
  const denied = (operation, code = '42501') => assert.rejects(operation, (error) => error.code === code);
  const asRole = async (role, owner, run) => {
    assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner || '']);
    try {
      return await run();
    } finally {
      await db.exec('reset role');
    }
  };
  const insert = (owner, content = 'Test post', url = null, type = null) =>
    db.query(
      `insert into public.posts (user_id, content, media_url, media_type)
       values ($1, $2, $3, $4) returning id, user_id, content, media_url, media_type`,
      [owner, content, url, type],
    );
  let textPostId;
  try {
    // Exact supplied posts schema and broad grants, with synthetic users only.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create schema storage;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      create table auth.users (id uuid primary key);
      create table public.profiles (user_id uuid primary key references auth.users(id));
      create table storage.objects (name text);
      create table public.posts (
        id uuid primary key default gen_random_uuid(),
        user_id uuid references public.profiles(user_id) on delete cascade,
        content text, media_url text, media_type text,
        created_at timestamptz not null default timezone('utc', now())
      );
      alter table public.posts enable row level security;
      grant all privileges on public.posts to public, anon, authenticated, service_role;
      grant update (content), insert (id) on public.posts to public, anon, authenticated;
      insert into storage.objects values ('untouched-fixture');
    `);
    for (const id of [A, B, C]) await db.query('insert into auth.users values ($1)', [id]);
    for (const id of [A, B]) await db.query('insert into public.profiles values ($1)', [id]);

    await check('diagnostic query confirms the reported RLS/no-policy state', async () => {
      const output = JSON.parse((await db.query(diagnostics)).rows[0].post_save_diagnostics);
      assert.equal(output.rls_enabled, true);
      assert.equal(output.policies, null);
      assert.equal(output.columns.length, 6);
      assert.ok(output.columns.every((column) => column.authenticated_insert && column.authenticated_select));
    });
    await check('before fix: real INSERT ... RETURNING is rejected', () =>
      asRole('authenticated', A, () => denied(insert(A))),
    );
    await check('exact SQL is valid, repeatable and creates no posts', async () => {
      await db.exec(sql);
      await db.exec(sql);
      assert.equal((await db.query('select count(*)::int as count from public.posts')).rows[0].count, 0);
      assert.equal(
        (await db.query("select count(*)::int as count from pg_policies where tablename='posts'")).rows[0]
          .count,
        2,
      );
      assert.equal(
        (await db.query("select relrowsecurity from pg_class where oid='public.posts'::regclass")).rows[0]
          .relrowsecurity,
        true,
      );
    });
    await check('owner publishes text with generated UUID/date and reads returned fields', () =>
      asRole('authenticated', A, async () => {
        const row = (await insert(A)).rows[0];
        textPostId = row.id;
        assert.match(row.id, /^[0-9a-f-]{36}$/);
        assert.deepEqual(row, {
          id: row.id,
          user_id: A,
          content: 'Test post',
          media_url: null,
          media_type: null,
        });
        assert.ok(
          (await db.query('select created_at from public.posts where id=$1', [row.id])).rows[0].created_at,
        );
      }),
    );
    await check('photo-only JPG/PNG/WebP and video-only MP4/WebM publish successfully', () =>
      asRole('authenticated', A, async () => {
        for (const extension of ['jpg', 'png', 'webp', 'mp4', 'webm']) {
          const type = ['mp4', 'webm'].includes(extension) ? 'video' : 'image';
          const row = (await insert(A, '', mediaUrl(A, extension), type)).rows[0];
          assert.equal(row.content, '');
          assert.equal(row.media_url, mediaUrl(A, extension));
          assert.equal(row.media_type, type);
        }
      }),
    );
    await check('another signed-in user reads the shared feed', () =>
      asRole('authenticated', B, async () => {
        assert.equal(
          (await db.query('select id, user_id, content, media_url, media_type from public.posts')).rows
            .length,
          6,
        );
      }),
    );
    await check('forged and null owner IDs are rejected', () =>
      asRole('authenticated', A, async () => {
        await denied(insert(B));
        await denied(insert(null));
      }),
    );
    await check('authenticated role without a user identity cannot publish', () =>
      asRole('authenticated', null, () => denied(insert(A))),
    );
    await check('missing profile retains the original foreign-key protection', () =>
      asRole('authenticated', C, () => denied(insert(C), '23503')),
    );
    await check('null, empty, whitespace-only and oversized text-only posts are rejected', () =>
      asRole('authenticated', A, async () => {
        for (const content of [null, '', '   ', '\t\n\r', 'x'.repeat(2001)]) await denied(insert(A, content));
        await insert(A, 'x'.repeat(2000));
      }),
    );
    await check('media URL/type pairs, owner paths and extensions are checked', () =>
      asRole('authenticated', A, async () => {
        for (const [url, type] of [
          [mediaUrl(A, 'jpg'), null],
          [null, 'image'],
          [mediaUrl(A, 'jpg'), 'video'],
          [mediaUrl(A, 'mp4'), 'image'],
          [mediaUrl(A, 'svg'), 'image'],
          [mediaUrl(B, 'jpg'), 'image'],
          [mediaUrl(A, 'jpg').replace('djhezivksrvcyqxzpiau', 'another-project'), 'image'],
          [mediaUrl(A, 'jpg') + '?arbitrary=1', 'image'],
          [mediaUrl(A, 'jpg').replace('/post/', '/post/../avatar/'), 'image'],
          ['blob:temporary-preview', 'image'],
          ['data:image/png;base64,AAAA', 'image'],
        ])
          await denied(insert(A, 'Test attachment', url, type));
      }),
    );
    await check('anonymous read/write/delete/truncate is denied', () =>
      asRole('anon', null, async () => {
        await denied(insert(A));
        for (const statement of [
          'select id from public.posts',
          'update public.posts set content=null',
          'delete from public.posts',
          'truncate public.posts',
        ])
          await denied(db.query(statement));
      }),
    );
    await check('signed-in clients cannot edit/delete/truncate or supply server-generated fields', () =>
      asRole('authenticated', A, async () => {
        await denied(db.query('update public.posts set content=$1 where id=$2', ['Changed', textPostId]));
        await denied(db.query('delete from public.posts where id=$1', [textPostId]));
        await denied(db.query('truncate public.posts'));
        await denied(
          db.query('insert into public.posts (id, user_id, content) values ($1, $2, $3)', [
            FILE_ID,
            A,
            'Explicit ID',
          ]),
        );
        await denied(
          db.query('insert into public.posts (user_id, content, created_at) values ($1, $2, now())', [
            A,
            'Explicit date',
          ]),
        );
      }),
    );
    await check('profile, storage and auth fixture data are untouched', async () => {
      assert.equal((await db.query('select count(*)::int as count from public.profiles')).rows[0].count, 2);
      assert.equal((await db.query('select count(*)::int as count from auth.users')).rows[0].count, 3);
      assert.deepEqual((await db.query('select name from storage.objects')).rows, [
        { name: 'untouched-fixture' },
      ]);
    });
    await check('service-role direct grants are preserved', () =>
      asRole('service_role', null, async () => {
        assert.equal((await db.query('select count(*)::int as count from public.posts')).rows[0].count, 7);
        assert.equal(
          (await db.query("select has_table_privilege('service_role', 'public.posts', 'UPDATE') as allowed"))
            .rows[0].allowed,
          true,
        );
      }),
    );
    await check('unexpected policies stop atomically', async () => {
      await db.exec('create policy unexpected on public.posts for select to authenticated using (false)');
      await assert.rejects(db.exec(sql), /Başka posts policy/);
      await db.exec('rollback');
      assert.equal(
        (await db.query("select count(*)::int as count from pg_policies where tablename='posts'")).rows[0]
          .count,
        3,
      );
      await db.exec('drop policy unexpected on public.posts');
    });
    await check('disabled RLS stops safely', async () => {
      await db.exec('alter table public.posts disable row level security');
      await assert.rejects(db.exec(sql), /RLS açık public.posts/);
      await db.exec('rollback; alter table public.posts enable row level security');
    });
    await check('unexpected required columns stop safely', async () => {
      await db.exec(
        "alter table public.posts add column required_external text; update public.posts set required_external='fixture'; alter table public.posts alter column required_external set not null",
      );
      await assert.rejects(db.exec(sql), /ek zorunlu sütun/);
      await db.exec('rollback; alter table public.posts drop column required_external');
    });
    await check('unexpected column types stop safely', async () => {
      await db.exec(
        'drop policy kampusx_posts_insert_own on public.posts; alter table public.posts alter column media_type type varchar(20)',
      );
      await assert.rejects(db.exec(sql), /sütunları paylaşılan teşhis/);
      await db.exec('rollback; alter table public.posts alter column media_type type text');
      await db.exec(sql);
    });
    await check('optional sensitive columns receive no client read/write permissions', async () => {
      await db.exec('alter table public.posts add column moderation_notes text');
      await db.exec(sql);
      await asRole('authenticated', A, async () => {
        await denied(db.query('select moderation_notes from public.posts'));
        await denied(
          db.query('insert into public.posts (user_id, content, moderation_notes) values ($1, $2, $3)', [
            A,
            'Test',
            'Forged',
          ]),
        );
      });
    });
    console.log(
      JSON.stringify(
        {
          engine: 'in-memory PostgreSQL (PGlite)',
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
