// Isolated PostgreSQL/PGlite: no environment files, network or production rows.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
async function main(afterBase) {
  const db = new PGlite();
  let passed = 0;
  const install = () =>
    db.exec(fs.readFileSync(path.join(__dirname, '../../docs/supabase/27-direct-messaging.sql'), 'utf8'));
  const check = async (name, fn) => {
    await fn();
    console.log('PASS ' + name);
    passed++;
  };
  const actor = async (text, args = [], id = A, role = 'authenticated') => {
    await db.exec('set role ' + role);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    try {
      return await db.query(text, args);
    } finally {
      await db.exec('reset role');
    }
  };
  try {
    await db.exec(`create role authenticated;create role anon;create schema auth;create schema private;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon;
   create table auth.users(id uuid primary key);
   create table profiles(user_id uuid primary key references auth.users(id),username text,full_name text,avatar_url text);
   create table follows(follower_id uuid,following_id uuid,status text,primary key(follower_id,following_id));
   create table blocks(blocker_id uuid,blocked_id uuid,primary key(blocker_id,blocked_id));
   create function private.is_blocked(a uuid,b uuid)returns boolean language sql stable security definer set search_path=public as $$
    select exists(select 1 from blocks where(blocker_id=a and blocked_id=b)or(blocker_id=b and blocked_id=a))$$;
   create function private.kx_follow_pair_lock(a uuid,b uuid)returns void language sql security definer set search_path=public as $$
    select pg_advisory_xact_lock(hashtextextended(least(a,b)::text||greatest(a,b)::text,0))$$;
   create publication supabase_realtime;
  `);
    for (const id of [A, B, C]) {
      await db.query('insert into auth.users values($1)', [id]);
      await db.query('insert into profiles(user_id,username)values($1,$2)', [id, 'student' + id[0]]);
    }
    await install();
    await install();
    await check('installation is idempotent; only messages enters Realtime', async () => {
      assert.equal(
        (await db.query("select tablename from pg_publication_tables where pubname='supabase_realtime'"))
          .rows[0].tablename,
        'messages',
      );
      assert.equal((await actor('select kx_messaging_version() as v')).rows[0].v, 2026102201);
    });
    await check(
      'no follow, pending follow and self cannot start; capability has no side effects',
      async () => {
        assert.equal((await actor('select kx_can_message($1) as ok', [B])).rows[0].ok, false);
        await assert.rejects(actor('select kx_start_conversation($1)', [B]), /dm_unavailable/);
        await db.query("insert into follows values($1,$2,'pending')", [A, B]);
        await assert.rejects(actor('select kx_start_conversation($1)', [B]), /dm_unavailable/);
        await assert.rejects(actor('select kx_start_conversation($1)', [A]), /dm_unavailable/);
        assert.equal((await db.query('select count(*)::int as n from conversations')).rows[0].n, 0);
      },
    );
    await db.exec("update follows set status='accepted'");
    const conv = (await actor('select kx_start_conversation($1) as id', [B])).rows[0].id;
    await check('either accepted direction starts the same canonical conversation', async () => {
      assert.equal((await actor('select kx_start_conversation($1) as id', [A], B)).rows[0].id, conv);
      assert.equal((await actor('select kx_can_message($1) as ok', [A], B)).rows[0].ok, true);
      await assert.rejects(
        actor('insert into conversations(user_a,user_b)values($1,$2)', [A, C]),
        /permission denied/,
      );
    });
    const send = (content, id = A) =>
      actor('insert into messages(conversation_id,content)values($1,$2)returning *', [conv, content], id);
    const msg = (await send('Hello')).rows[0];
    await check(
      'server fills sender/time; client cannot forge sender, time, ID or edit content',
      async () => {
        assert.equal(msg.sender_id, A);
        assert.ok(msg.created_at);
        for (const col of ['sender_id', 'created_at', 'id']) {
          const val = col === 'created_at' ? '2026-01-01T00:00:00Z' : B;
          await assert.rejects(
            actor(`insert into messages(conversation_id,content,${col})values($1,'Forged',$2)`, [conv, val]),
            /permission denied/,
          );
        }
        await assert.rejects(
          actor("update messages set content='Edited' where id=$1", [msg.id]),
          /permission denied/,
        );
      },
    );
    await check('whitespace/oversize messages, outsiders and anonymous clients are rejected', async () => {
      await assert.rejects(send(' \n\t'), /kx_dm_content/);
      await assert.rejects(send('x'.repeat(2001)), /kx_dm_content/);
      await assert.rejects(send('Intrusion', C), /dm_unavailable/);
      assert.equal(
        (await actor('select * from messages where conversation_id=$1', [conv], C)).rows.length,
        0,
      );
      assert.equal((await actor('select * from kx_inbox()', [], C)).rows.length, 0);
      await assert.rejects(actor('select * from kx_inbox()', [], '', 'anon'), /permission denied/);
    });
    await check('inbox unread counts, mark read and peer identity are server scoped', async () => {
      let row = (await actor('select * from kx_inbox()', [], B)).rows[0];
      assert.equal(row.peer_id, A);
      assert.equal(Number(row.unread_count), 1);
      assert.equal(row.can_send, true);
      await assert.rejects(actor('select kx_mark_read($1)', [conv], C), /dm_unavailable/);
      await actor('select kx_mark_read($1)', [conv], B);
      row = (await actor('select * from kx_inbox()', [], B)).rows[0];
      assert.equal(Number(row.unread_count), 0);
      const read = (await db.query('select * from conversations where id=$1', [conv])).rows[0];
      assert.equal(read.user_a_last_read_at, null);
      assert.ok(read.user_b_last_read_at);
    });
    await check('soft delete is owner only, blanks content and never hard deletes', async () => {
      assert.equal(
        (await actor('update messages set deleted_at=now() where id=$1 returning id', [msg.id], B)).rows
          .length,
        0,
      );
      await actor('update messages set deleted_at=now() where id=$1', [msg.id]);
      const row = (await actor('select * from messages where id=$1', [msg.id])).rows[0];
      assert.equal(row.content, '');
      assert.ok(row.deleted_at);
      await assert.rejects(actor('delete from messages where id=$1', [msg.id]), /permission denied/);
    });
    await check('unfollow disables sending but preserves readable conversation history', async () => {
      await db.exec('delete from follows');
      assert.equal((await actor('select * from kx_inbox()')).rows[0].can_send, false);
      assert.equal((await actor('select * from messages')).rows.length, 1);
      await assert.rejects(send('No permission'), /dm_unavailable/);
    });
    await db.query("insert into follows values($1,$2,'accepted')", [B, A]);
    await check('block in either direction hides history/inbox and rejects start/send/read', async () => {
      await db.query('insert into blocks values($1,$2)', [B, A]);
      for (const id of [A, B]) {
        assert.equal((await actor('select * from kx_inbox()', [], id)).rows.length, 0);
        assert.equal((await actor('select * from messages', [], id)).rows.length, 0);
        await assert.rejects(actor('select kx_mark_read($1)', [conv], id), /dm_unavailable/);
      }
      await assert.rejects(send('Blocked'), /dm_unavailable/);
      await assert.rejects(actor('select kx_start_conversation($1)', [B]), /dm_unavailable/);
      await db.exec('delete from blocks');
    });
    await check('rollback denies access and preserves data; reinstall restores it', async () => {
      await db.exec(
        fs.readFileSync(path.join(__dirname, '../../docs/supabase/27-direct-messaging-rollback.sql'), 'utf8'),
      );
      assert.equal((await db.query('select count(*)::int as n from messages')).rows[0].n, 1);
      await assert.rejects(actor('select * from messages'), /permission denied/);
      await assert.rejects(actor('select * from kx_inbox()'), /permission denied/);
      await install();
      assert.equal((await actor('select * from messages')).rows.length, 1);
    });
    if (afterBase) await afterBase({ db, actor, check, A, B, C });
    console.log(`${passed} messaging PostgreSQL checks passed.`);
  } finally {
    await db.close();
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main };
