const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('./verify-messaging.cjs')
  .main(async ({ db, actor, check, A, B, C }) => {
    const sql = (name) => db.exec(fs.readFileSync(path.join(__dirname, '../../docs/supabase', name), 'utf8'));
    await db.exec(`alter table profiles add column is_private boolean default false;alter table profiles add column audience_denied boolean default false;
 create function private.kx_profile_in_audience(viewer uuid,owner uuid)returns boolean language sql stable security definer set search_path=public as $$ select not coalesce((select audience_denied from profiles where user_id=owner),true) $$;
 create table public.posts(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),content text,deleted_at timestamptz,archived_at timestamptz);
 create function private.can_view_user_content(viewer uuid,owner uuid)returns boolean language sql stable security definer set search_path=public as $$
 select viewer is not null and(viewer=owner or(not private.is_blocked(viewer,owner)and(not coalesce((select is_private from profiles where user_id=owner),true)
 or exists(select 1 from follows where follower_id=viewer and following_id=owner and status='accepted'))))$$;
 alter table posts enable row level security;grant select on posts to authenticated;
 create policy visible on posts for select to authenticated using(deleted_at is null and(user_id=(select auth.uid())or(archived_at is null and private.can_view_user_content((select auth.uid()),user_id))));
 `);
    const p = (
      await db.query("insert into posts(user_id,content)values($1,'Protected source text')returning id", [B])
    ).rows[0].id;
    const hidden = (
      await db.query("insert into posts(user_id,content)values($1,'Private source')returning id", [C])
    ).rows[0].id;
    await db.query('update profiles set is_private=true where user_id=$1', [C]);
    await sql('29-post-sharing-and-views.sql');
    await sql('29-post-sharing-and-views.sql');
    await sql('32-sharing-audience-guard.sql');
    await sql('32-sharing-audience-guard.sql');
    const conv = (await actor('select kx_start_conversation($1) as id', [B])).rows[0].id;
    await check(
      'additional restrictive audience policy is honored even when the old visibility helper allows access',
      async () => {
        await db.query('update profiles set audience_denied=true where user_id=$1', [B]);
        assert.equal((await actor('select * from kx_record_post_views($1)', [[p]])).rows.length, 0);
        await assert.rejects(actor('select kx_share_post($1,$2)', [conv, p]), /shared_post_unavailable/);
        await assert.rejects(actor('select kx_share_post($1,$2)', [conv, null]), /shared_post_unavailable/);
        await db.query('update profiles set audience_denied=false where user_id=$1', [B]);
      },
    );
    await check('views count unique accounts, ignore repeats and exclude the author', async () => {
      assert.equal(
        Number((await actor('select * from kx_record_post_views($1)', [[p]])).rows[0].views_count),
        1,
      );
      assert.equal(
        Number((await actor('select * from kx_record_post_views($1)', [[p]])).rows[0].views_count),
        1,
      );
      assert.equal(
        Number((await actor('select * from kx_record_post_views($1)', [[p]], B)).rows[0].views_count),
        1,
      );
      assert.equal(
        Number((await actor('select * from kx_record_post_views($1)', [[p]], C)).rows[0].views_count),
        2,
      );
    });
    await check('a count read does not register a view; invisible posts produce no totals', async () => {
      assert.equal(
        Number((await actor('select * from kx_get_post_views($1)', [[p]])).rows[0].views_count),
        2,
      );
      assert.equal((await actor('select * from kx_record_post_views($1)', [[hidden]])).rows.length, 0);
    });
    await check('viewer identities and direct counter tampering remain inaccessible', async () => {
      await assert.rejects(actor('select * from private.post_views'), /permission denied/);
      await assert.rejects(actor('update posts set views_count=900 where id=$1', [p]), /permission denied/);
      await assert.rejects(
        actor('select * from kx_record_post_views($1)', [Array(51).fill(p)]),
        /views_unavailable/,
      );
      await assert.rejects(
        actor('select * from kx_get_post_views($1)', [[p]], '', 'anon'),
        /permission denied/,
      );
    });
    let shared;
    await check('sharing stores only a post reference and retains the old inbox contract', async () => {
      shared = (await actor('select kx_share_post($1,$2) as id', [conv, p])).rows[0].id;
      const row = (await actor('select * from messages where id=$1', [shared])).rows[0];
      assert.equal(row.shared_post_id, p);
      assert.equal(row.content, 'Post shared');
      assert.equal(row.sender_id, A);
      assert.equal((await actor('select * from kx_inbox_v2()')).rows[0].last_shared_post_id, p);
      assert.equal((await actor('select * from kx_inbox()')).rows[0].last_content, 'Post shared');
    });
    await check('sharing a private, archived or unrelated conversation is rejected', async () => {
      await assert.rejects(actor('select kx_share_post($1,$2)', [conv, hidden]), /shared_post_unavailable/);
      await assert.rejects(actor('select kx_share_post($1,$2)', [conv, p], C), /dm_unavailable/);
      await db.query('update posts set archived_at=now() where id=$1', [p]);
      await assert.rejects(actor('select kx_share_post($1,$2)', [conv, p]), /shared_post_unavailable/);
      await db.query('update posts set archived_at=null where id=$1', [p]);
    });
    await check('clients cannot inject or replace shared post IDs using table writes', async () => {
      await assert.rejects(
        actor("insert into messages(conversation_id,content,shared_post_id)values($1,'test',$2)", [conv, p]),
        /permission denied/,
      );
      await assert.rejects(
        actor('update messages set shared_post_id=$1 where id=$2', [hidden, shared]),
        /permission denied/,
      );
    });
    await check(
      'deleted source content is hidden while the shared message remains a harmless pointer',
      async () => {
        await db.query('update posts set deleted_at=now() where id=$1', [p]);
        assert.equal((await actor('select content from posts where id=$1', [p])).rows.length, 0);
        assert.equal(
          (await actor('select * from messages where id=$1', [shared])).rows[0].content,
          'Post shared',
        );
        assert.equal((await actor('select * from kx_get_post_views($1)', [[p]])).rows.length, 0);
      },
    );
    await check('feature rollback preserves unique view rows and shared messages', async () => {
      await sql('29-post-sharing-and-views-rollback.sql');
      assert.equal((await db.query('select count(*)::int as n from private.post_views')).rows[0].n, 2);
      assert.equal(
        (await db.query('select shared_post_id from messages where id=$1', [shared])).rows[0].shared_post_id,
        p,
      );
      await assert.rejects(actor('select * from kx_inbox_v2()'), /permission denied/);
      await sql('29-post-sharing-and-views.sql');
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
