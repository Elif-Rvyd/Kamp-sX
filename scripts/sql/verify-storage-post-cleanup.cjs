// Real SQL 11 + 22 + 24 in isolated PostgreSQL; no credentials or production connection.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const ID = '44444444-4444-4444-8444-444444444444';
const media = (owner, purpose = 'post', id = ID) => `${owner}/${purpose}/${id}.webp`;
const url = (name) => `https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/${name}`;
async function main() {
  const db = new PGlite();
  let passed = 0;
  const sql = (name) => db.exec(fs.readFileSync(path.join(__dirname, '../../docs/supabase', name), 'utf8'));
  const check = async (name, run) => {
    await run();
    console.log('PASS ' + name);
    passed++;
  };
  const actor = async (text, params = [], owner = A, role = 'authenticated') => {
    await db.exec('set role ' + role);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    try {
      return await db.query(text, params);
    } finally {
      await db.exec('reset role');
    }
  };
  try {
    await db.exec(`create role anon;create role authenticated;
      create schema auth;create schema private;create schema storage;
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,storage to anon,authenticated;
      create table public.posts(id uuid primary key default gen_random_uuid(),user_id uuid,media_url text,
        parent_id uuid,pinned_at timestamptz,archived_at timestamptz,deleted_at timestamptz);
      alter table public.posts enable row level security;
      create policy own_posts on public.posts for select to authenticated
        using(user_id=(select auth.uid()) and deleted_at is null);
      grant select on public.posts to authenticated;
      grant update(pinned_at,archived_at,deleted_at) on public.posts to authenticated;
      create function private.enforce_pin_limit() returns trigger language plpgsql as $$begin return new;end$$;
      create trigger trg_pin_limit before update of pinned_at on public.posts for each row execute function private.enforce_pin_limit();
      create table storage.buckets(id text primary key,public boolean not null,file_size_limit bigint,allowed_mime_types text[]);
      insert into storage.buckets values('uploads',true,null,null),('other',false,null,null);
      create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
      create function storage.foldername(name text) returns text[] language sql immutable as
        $$select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1]$$;
      create policy legacy_select on storage.objects for select to public using(true);
      create policy legacy_delete on storage.objects for delete to public using(true);
    `);
    await sql('11-uploads-security-hardening.sql');
    await sql('22-owner-post-actions.sql');
    await db.query('insert into public.posts(user_id,media_url,deleted_at)values($1,$2,now())', [
      A,
      url(media(A)),
    ]);
    await db.query("insert into storage.objects values('uploads',$1)", [media(A)]);
    await check('SQL 11 restrictive guard reproduces the SQL 22 cleanup conflict', async () => {
      assert.equal((await actor('delete from storage.objects where name=$1', [media(A)])).affectedRows, 0);
    });
    await sql('24-storage-post-cleanup-guard.sql');
    await sql('24-storage-post-cleanup-guard.sql');
    await check('repair is idempotent and preserves rows and public bucket', async () => {
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, 1);
      assert.equal(
        (await db.query("select public from storage.buckets where id='uploads'")).rows[0].public,
        true,
      );
    });
    await check('owner can clean soft-deleted media without reading the deleted post', async () => {
      assert.equal((await actor('select id from public.posts')).rows.length, 0);
      assert.equal((await actor('delete from storage.objects where name=$1', [media(A)])).affectedRows, 1);
    });
    await db.query("insert into storage.objects values('uploads',$1),('uploads',$2),('uploads',$3)", [
      media(A),
      media(B),
      media(A, 'avatar'),
    ]);
    await db.query('insert into public.posts(user_id,media_url)values($1,$2)', [A, url(media(A))]);
    await check('live or archived references protect a shared file after one post is deleted', async () => {
      assert.equal((await actor('delete from storage.objects')).affectedRows, 0);
      await db.exec('update public.posts set archived_at=now() where deleted_at is null');
      assert.equal((await actor('delete from storage.objects')).affectedRows, 0);
    });
    await db.exec('update public.posts set deleted_at=now() where deleted_at is null');
    await check('anonymous and foreign callers cannot delete even with broad legacy policies', async () => {
      assert.equal((await actor('delete from storage.objects', [], B)).affectedRows, 0);
      assert.equal((await actor('delete from storage.objects', [], '', 'anon')).affectedRows, 0);
      assert.equal((await actor('delete from storage.objects')).affectedRows, 1);
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, 2);
    });
    await check('unreferenced uploads without an owned deleted receipt are not removable', async () => {
      const orphan = media(A, 'post', '55555555-5555-4555-8555-555555555555');
      await db.query("insert into storage.objects values('uploads',$1)", [orphan]);
      assert.equal((await actor('delete from storage.objects where name=$1', [orphan])).affectedRows, 0);
    });
    await check('other buckets keep their existing delete policy', async () => {
      await db.exec("insert into storage.objects values('other','document.pdf')");
      assert.equal(
        (await actor("delete from storage.objects where bucket_id='other'", [], '', 'anon')).affectedRows,
        1,
      );
    });
    await check('rollback closes uploads deletes and never removes rows', async () => {
      await sql('24-storage-post-cleanup-guard-rollback.sql');
      const before = (await db.query('select count(*)::int as n from storage.objects')).rows[0].n;
      assert.equal((await actor("delete from storage.objects where bucket_id='uploads'")).affectedRows, 0);
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, before);
    });
    console.log(passed + ' PostgreSQL Storage integration checks passed; no production connection.');
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
