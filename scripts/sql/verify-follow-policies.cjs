// Local PostgreSQL only. No network requests, real users or production mutations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const sql = fs.readFileSync(path.join(__dirname, '../../docs/supabase/07-realtime-follows.sql'), 'utf8');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
async function verify() {
  const db = new PGlite();
  let checks = 0;
  const check = async (name, fn) => {
    await fn();
    checks++;
    console.log('PASS ' + name);
  };
  const as = async (role, id, fn) => {
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    try {
      return await fn();
    } finally {
      await db.exec('reset role');
    }
  };
  const denied = (p) => assert.rejects(p, (e) => e.code === '42501');
  try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create schema realtime;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;
   create table realtime.messages(extension text, payload jsonb);
   alter table realtime.messages enable row level security;
   grant usage on schema public,auth,realtime to anon,authenticated;
   grant select,insert on realtime.messages to anon,authenticated;
   create table realtime.test_sent(topic text,event text,payload jsonb,private boolean);
   create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as
    $$insert into realtime.test_sent values(topic,event,payload,private)$$;
   insert into realtime.messages values('broadcast','{}'),('presence','{}');
   create table public.profiles(user_id uuid);create table public.posts(user_id uuid);
   insert into public.profiles values('${A}');insert into public.posts values('${B}');
  `);
    for (const id of [A, B, C]) await db.query('insert into auth.users values($1)', [id]);
    await check('approved SQL installs three table policies and three private-channel policies', async () => {
      await db.exec(sql);
      assert.equal(
        (await db.query("select count(*)::int n from pg_policies where policyname like 'kampusx_follows_%'"))
          .rows[0].n,
        6,
      );
    });
    await check(
      'owner follows and only the two affected private topics receive empty notifications',
      async () => {
        await as('authenticated', A, () =>
          db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [A, B]),
        );
        assert.deepEqual(
          (await db.query('select * from realtime.test_sent order by topic')).rows,
          [A, B].map((id) => ({
            topic: `kampusx:follows:${id}`,
            event: 'changed',
            payload: {},
            private: true,
          })),
        );
      },
    );
    await check('self-follow, duplicate follow and forged owner inserts fail', async () => {
      await as('authenticated', A, async () => {
        await assert.rejects(
          db.query('insert into public.user_follows(follower_id,followed_id) values($1,$1)', [A]),
          (e) => e.code === '23514',
        );
        await assert.rejects(
          db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [A, B]),
          (e) => e.code === '23505',
        );
        await denied(
          db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [B, C]),
        );
      });
    });
    await check('both participants read their relation; unrelated users cannot see it', async () => {
      for (const id of [A, B, C])
        assert.equal(
          (await as('authenticated', id, () => db.query('select * from public.user_follows'))).rows.length,
          id === C ? 0 : 1,
        );
    });
    await check('exact counts return real zero for accounts with no relations', async () => {
      await as('authenticated', C, async () =>
        assert.equal(
          (await db.query('select count(*)::int n from public.user_follows where follower_id=$1', [C]))
            .rows[0].n,
          0,
        ),
      );
    });
    await check('no client can update ownership or supply a forged timestamp', async () => {
      await as('authenticated', A, async () => {
        await denied(db.query('update public.user_follows set follower_id=$1', [C]));
        await denied(db.query('insert into public.user_follows values($1,$2,now())', [A, C]));
      });
    });
    await check('anonymous clients cannot read, insert, delete or call the trigger function', async () => {
      await as('anon', null, async () => {
        await denied(db.query('select * from public.user_follows'));
        await denied(
          db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [A, C]),
        );
        await denied(db.query('delete from public.user_follows'));
        await denied(db.query('select public.kampusx_notify_follow_change()'));
      });
    });
    await check(
      'only the follower can unfollow; a target cannot remove someone else’s relation',
      async () => {
        assert.equal(
          (await as('authenticated', B, () => db.query('delete from public.user_follows returning *'))).rows
            .length,
          0,
        );
        assert.equal(
          (await as('authenticated', A, () => db.query('delete from public.user_follows returning *'))).rows
            .length,
          1,
        );
        assert.equal((await db.query('select count(*)::int n from realtime.test_sent')).rows[0].n, 4);
      },
    );
    await check('private channel guard resists unrelated broad permissive rules', async () => {
      await db.exec(
        'create policy unrelated_read_all on realtime.messages for select to public using(true);create policy unrelated_write_all on realtime.messages for insert to public with check(true)',
      );
      await db.query("select set_config('realtime.topic',$1,false)", [`kampusx:follows:${A}`]);
      assert.equal(
        (await as('authenticated', A, () => db.query('select * from realtime.messages'))).rows.length,
        1,
      );
      assert.equal(
        (await as('authenticated', B, () => db.query('select * from realtime.messages'))).rows.length,
        0,
      );
      assert.equal(
        (await as('anon', null, () => db.query('select * from realtime.messages'))).rows.length,
        0,
      );
      for (const role of ['anon', 'authenticated'])
        await as(role, A, () => denied(db.query("insert into realtime.messages values('broadcast','{}')")));
      await db.query("select set_config('realtime.topic','other:channel',false)");
      assert.equal(
        (await as('authenticated', B, () => db.query('select * from realtime.messages'))).rows.length,
        2,
      );
    });
    await check(
      'existing profiles/posts are untouched and a second installation stops atomically',
      async () => {
        await assert.rejects(db.exec(sql), /zaten var/);
        await db.exec('rollback');
        assert.deepEqual((await db.query('select * from public.profiles')).rows, [{ user_id: A }]);
        assert.deepEqual((await db.query('select * from public.posts')).rows, [{ user_id: B }]);
      },
    );
    console.log(
      `${checks} follow SQL checks passed. Broadcast transport is stubbed; production delivery requires Supabase.`,
    );
  } finally {
    await db.close();
  }
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
