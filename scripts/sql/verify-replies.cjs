// Local PostgreSQL only. Never connects to Supabase or reads environment credentials.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const root = path.resolve(__dirname, '../..');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
async function main() {
  const db = new PGlite();
  let passed = 0;
  const sql = (file) => db.exec(fs.readFileSync(path.join(root, 'docs/supabase', file), 'utf8'));
  async function actor(text, values = [], owner = A, role = 'authenticated') {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner]);
    try {
      return await db.query(text, values);
    } finally {
      await db.exec('reset role');
    }
  }
  async function check(name, fn) {
    await fn();
    passed++;
    console.log('PASS ' + name);
  }
  try {
    await db.exec(`
      create role authenticated; create role anon;
      create schema auth; create schema private;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, private to authenticated;
      grant execute on function auth.uid() to authenticated;
      create table public.profiles(user_id uuid primary key, is_private boolean not null default true);
      create table public.follows(follower_id uuid, following_id uuid, status text);
      create table public.blocks(blocker_id uuid, blocked_id uuid);
      create table public.likes(user_id uuid, post_id uuid);
      create table public.bookmarks(user_id uuid, post_id uuid);
      create table public.reports(reporter_id uuid, post_id uuid, reported_user_id uuid, reason text, details text);
      grant select,insert,delete,truncate,references,trigger,maintain on public.blocks, public.likes, public.bookmarks to authenticated;
      grant truncate,references,trigger,maintain on public.reports to authenticated;
      grant insert(reporter_id,post_id,reported_user_id,reason,details) on public.reports to authenticated;
      create function private.can_view_user_content(viewer uuid, owner uuid) returns boolean
      language sql stable security definer set search_path = public as $$
        select viewer is not null and (viewer = owner or (
          not exists(select 1 from public.blocks where (blocker_id=viewer and blocked_id=owner) or (blocker_id=owner and blocked_id=viewer))
          and (not coalesce((select is_private from public.profiles where user_id=owner), true)
            or exists(select 1 from public.follows where follower_id=viewer and following_id=owner and status='accepted'))
        ));
      $$;
      create table public.posts(
        id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(user_id),
        content text not null default '', media_url text, media_type text, created_at timestamptz not null default now(),
        parent_id uuid references public.posts(id), repost_of_id uuid references public.posts(id),
        archived_at timestamptz, deleted_at timestamptz, pinned_at timestamptz,
        likes_count integer not null default 0, replies_count integer not null default 0, reposts_count integer not null default 0
      );
      alter table public.posts enable row level security;
      grant select on public.profiles to authenticated;
      create policy posts_select_visible on public.posts for select to authenticated using (
        deleted_at is null and (user_id = (select auth.uid()) or
          (archived_at is null and private.can_view_user_content((select auth.uid()), user_id)))
      );
      create policy posts_insert on public.posts for insert to authenticated with check (
        user_id = (select auth.uid()) and char_length(content) <= 2000
        and not (parent_id is not null and repost_of_id is not null)
        and (content ~ '[^[:space:]]' or media_url is not null or repost_of_id is not null)
      );
      create policy posts_insert_target_visible on public.posts as restrictive for insert to authenticated with check (
        (parent_id is null or exists(select 1 from public.posts t where t.id = posts.parent_id))
        and (repost_of_id is null or exists(select 1 from public.posts t where t.id = posts.repost_of_id))
      );
      grant select(id,user_id,content,media_url,media_type,created_at) on public.posts to authenticated;
      grant insert(user_id,content,media_url,media_type,parent_id,repost_of_id) on public.posts to authenticated;
      grant update(archived_at,deleted_at,pinned_at) on public.posts to authenticated;
      create function private.fixture_counter() returns trigger language plpgsql security definer set search_path = public as $$
      begin
        update public.posts set replies_count = (select count(*) from public.posts p where p.parent_id = new.parent_id and p.deleted_at is null) where id = new.parent_id;
        return null;
      end $$;
      create trigger existing_counter after insert on public.posts for each row execute function private.fixture_counter();
    `);
    await db.query('insert into public.profiles values ($1,false),($2,true)', [A, B]);
    const post = (
      await db.query("insert into public.posts(user_id,content) values($1,'Root') returning id", [A])
    ).rows[0].id;
    const hidden = (
      await db.query("insert into public.posts(user_id,content) values($1,'Private root') returning id", [B])
    ).rows[0].id;
    await check('baseline reproduces missing SELECT grant', async () => {
      await assert.rejects(actor('select likes_count from public.posts'), (e) => e.code === '42501');
    });
    await sql('19-post-read-columns.sql');
    await sql('19-post-read-columns.sql');
    await check('original INSERT target policy reproduces recursion with RETURNING', async () => {
      await assert.rejects(
        actor("insert into public.posts(user_id,content,parent_id) values($1,'Reply',$2) returning id", [
          A,
          post,
        ]),
        (e) => e.code === '42P17',
      );
    });
    await check('SQL 19 is idempotent and preserves rows/RLS', async () => {
      assert.equal(
        (await actor('select parent_id,likes_count,replies_count,reposts_count from public.posts')).rows
          .length,
        1,
      );
      assert.equal((await db.query('select count(*)::int as n from public.posts')).rows[0].n, 2);
      await assert.rejects(actor('select * from public.posts', [], A, 'anon'), (e) => e.code === '42501');
      await assert.rejects(actor('update public.posts set likes_count=9'), (e) => e.code === '42501');
    });
    await sql('20-reply-depth-guard.sql');
    await sql('20-reply-depth-guard.sql');
    await check('SQL 20 is idempotent and gate is authenticated only', async () => {
      assert.equal(
        (await actor('select public.kampusx_reply_contract_version() as v')).rows[0].v,
        '2026102102',
      );
      await assert.rejects(
        actor('select public.kampusx_reply_contract_version()', [], A, 'anon'),
        (e) => e.code === '42501',
      );
      assert.equal(
        (await db.query("select count(*)::int as n from pg_trigger where tgname='existing_counter'")).rows[0]
          .n,
        1,
      );
    });
    const reply = (parent) =>
      actor(
        "insert into public.posts(user_id,content,parent_id) values($1,'Reply',$2) returning id,parent_id",
        [A, parent],
      );
    const one = (await reply(post)).rows[0].id;
    const two = (await reply(one)).rows[0].id;
    await check('root reply and one nested reply succeed; counter remains trigger owned', async () => {
      assert.equal(
        (await actor('select replies_count from public.posts where id=$1', [post])).rows[0].replies_count,
        1,
      );
      assert.equal(
        (await actor('select replies_count from public.posts where id=$1', [one])).rows[0].replies_count,
        1,
      );
    });
    await check('third level and hidden target are rejected in PostgreSQL', async () => {
      await assert.rejects(reply(two), (e) => e.code === '23514' && e.message === 'reply_depth_limit');
      await assert.rejects(reply(hidden), (e) => e.code === '42501');
    });
    await check('target helper matches public/private/follow/block and archive visibility', async () => {
      await db.query('update public.profiles set is_private=false where user_id=$1', [B]);
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden])).rows[0].ok,
        true,
      );
      await db.query('update public.profiles set is_private=true where user_id=$1', [B]);
      await db.query("insert into public.follows values($1,$2,'pending')", [A, B]);
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden])).rows[0].ok,
        false,
      );
      await db.exec("update public.follows set status='accepted'");
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden])).rows[0].ok,
        true,
      );
      await db.query('insert into public.blocks values($1,$2)', [B, A]);
      await assert.rejects(reply(hidden), (e) => e.code === '42501');
      await db.exec('delete from public.blocks');
      await db.query('update public.posts set archived_at=now() where id=$1', [hidden]);
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden])).rows[0].ok,
        false,
      );
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden], B)).rows[0].ok,
        true,
      );
      await db.query('update public.posts set deleted_at=now() where id=$1', [hidden]);
      assert.equal(
        (await actor('select private.kx_post_target_visible($1) as ok', [hidden], B)).rows[0].ok,
        false,
      );
    });
    await check('owner spoof, reply+repost, explicit id and counter writes stay forbidden', async () => {
      await assert.rejects(
        actor("insert into public.posts(user_id,content,parent_id) values($1,'X',$2)", [B, post]),
        (e) => e.code === '42501',
      );
      await assert.rejects(
        actor("insert into public.posts(user_id,content,parent_id,repost_of_id) values($1,'X',$2,$2)", [
          A,
          post,
        ]),
        (e) => e.code === '42501',
      );
      await assert.rejects(
        actor("insert into public.posts(id,user_id,content) values(gen_random_uuid(),$1,'X')", [A]),
        (e) => e.code === '42501',
      );
      await assert.rejects(actor('update public.posts set parent_id=null'), (e) => e.code === '42501');
    });
    const count = (await db.query('select count(*)::int as n from public.posts')).rows[0].n;
    await sql('20-reply-depth-guard-rollback.sql');
    await sql('20-reply-depth-guard-rollback.sql');
    await check('guard rollback preserves posts and existing counter; gate disappears', async () => {
      assert.equal((await db.query('select count(*)::int as n from public.posts')).rows[0].n, count);
      assert.equal(
        (await db.query("select count(*)::int as n from pg_trigger where tgname='existing_counter'")).rows[0]
          .n,
        1,
      );
      await assert.rejects(
        actor('select public.kampusx_reply_contract_version()'),
        (e) => e.code === '42883',
      );
    });
    await sql('19-post-read-columns-rollback.sql');
    await sql('19-post-read-columns-rollback.sql');
    await check('read-grant rollback preserves original grants and rows', async () => {
      assert.ok((await actor('select id,content from public.posts')).rows.length);
      await assert.rejects(actor('select replies_count from public.posts'), (e) => e.code === '42501');
      assert.equal((await db.query('select count(*)::int as n from public.posts')).rows[0].n, count);
    });
    await sql('21-social-unused-privileges.sql');
    await sql('21-social-unused-privileges.sql');
    await check('unused privileges are revoked without affecting social DML or data', async () => {
      for (const table of ['blocks', 'bookmarks', 'likes', 'reports'])
        for (const privilege of ['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'])
          assert.equal(
            (
              await db.query('select has_table_privilege($1,$2,$3) as ok', [
                'authenticated',
                'public.' + table,
                privilege,
              ])
            ).rows[0].ok,
            false,
          );
      assert.equal(
        (await db.query("select has_table_privilege('authenticated','public.likes','INSERT') as ok")).rows[0]
          .ok,
        true,
      );
      assert.equal(
        (
          await db.query(
            "select has_column_privilege('authenticated','public.reports','reason','INSERT') as ok",
          )
        ).rows[0].ok,
        true,
      );
      assert.equal((await db.query('select count(*)::int as n from public.posts')).rows[0].n, count);
    });
    await sql('21-social-unused-privileges-rollback.sql');
    await check('privilege rollback restores only the documented baseline', async () => {
      assert.equal(
        (await db.query("select has_table_privilege('authenticated','public.likes','TRUNCATE') as ok"))
          .rows[0].ok,
        true,
      );
      assert.equal(
        (
          await db.query(
            "select has_column_privilege('authenticated','public.posts','likes_count','UPDATE') as ok",
          )
        ).rows[0].ok,
        false,
      );
    });
    console.log(`${passed} PostgreSQL reply/grant checks passed; no production connection.`);
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
