// Actual supplied production metadata; isolated PostgreSQL, no network/auth users in production.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const baseline = require('../fixtures/follow-schema-baseline.json');
const read = (p) => fs.readFileSync(path.join(__dirname, '../..', p), 'utf8');
const migration = read('supabase/migrations/20261018190000_follow_requests.sql');
const rollback = read('docs/supabase/15-follow-requests-rollback.sql');
const [A, B, C, D] = [1, 2, 3, 4].map(
  (i) =>
    String(i).repeat(8) +
    '-' +
    String(i).repeat(4) +
    '-4' +
    String(i).repeat(3) +
    '-8' +
    String(i).repeat(3) +
    '-' +
    String(i).repeat(12),
);
const qi = (s) => '"' + s.replaceAll('"', '""') + '"';
async function main() {
  const db = new PGlite();
  let checks = 0;
  const check = async (name, fn) => {
    await fn();
    checks++;
    console.log('PASS ' + name);
  };
  const as = async (id, fn, role = 'authenticated') => {
    await db.exec('set role ' + role);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    try {
      return await fn();
    } finally {
      await db.exec('reset role');
    }
  };
  const follow = (a, b) =>
    as(a, () => db.query('insert into public.follows(follower_id,following_id) values($1,$2)', [a, b]));
  const remove = (actor, a, b) =>
    as(actor, () => db.query('delete from public.follows where follower_id=$1 and following_id=$2', [a, b]));
  const status = async (a, b) =>
    (await db.query('select status from public.follows where follower_id=$1 and following_id=$2', [a, b]))
      .rows[0]?.status;
  const denied = (promise) => assert.rejects(promise, (e) => e.code === '42501');
  try {
    await db.exec(
      [
        'create role anon nologin;create role authenticated nologin;create schema auth;create schema private;create schema realtime;',
        'create table auth.users(id uuid primary key);',
        "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;",
        "create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;",
        'create table realtime.messages(extension text,payload jsonb,topic text not null);alter table realtime.messages enable row level security;',
        'create table realtime.sent(payload jsonb,event text,topic text,private boolean);',
        'create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as $$insert into realtime.sent values(payload,event,topic,private)$$;',
        'grant usage on schema public,auth,realtime to anon,authenticated;grant usage on schema private to authenticated;grant select,insert on realtime.messages to anon,authenticated;',
      ].join('\n'),
    );
    for (const table of ['profiles', 'follows', 'blocks']) {
      const columns = baseline.columns
        .filter((c) => c.table === table)
        .map(
          (c) =>
            qi(c.name) +
            ' ' +
            c.type +
            (c.nullable ? '' : ' not null') +
            (c.default ? ' default ' + c.default : ''),
        );
      const constraints = baseline.constraints
        .filter((c) => c.table === table)
        .map((c) => 'constraint ' + qi(c.name) + ' ' + c.definition);
      await db.exec(
        'create table public.' +
          qi(table) +
          '(' +
          [...columns, ...constraints].join(',') +
          ');alter table public.' +
          qi(table) +
          ' enable row level security;',
      );
    }
    for (const fn of [...baseline.functions].sort(
      (a, b) => Number(b.name === 'is_blocked') - Number(a.name === 'is_blocked'),
    ))
      await db.exec(fn.definition);
    await db.exec(
      'create trigger trg_on_block after insert on public.blocks for each row execute function private.on_block();',
    );
    for (const p of baseline.policies) {
      await db.exec(
        'create policy ' +
          qi(p.policyname) +
          ' on public.' +
          qi(p.tablename) +
          ' as ' +
          p.permissive +
          ' for ' +
          p.cmd +
          ' to ' +
          p.roles.map((r) => (r === 'public' ? 'public' : qi(r))).join(',') +
          (p.qual ? ' using (' + p.qual + ')' : '') +
          (p.with_check ? ' with check (' + p.with_check + ')' : ''),
      );
    }
    await db.exec(
      'grant all on public.follows,public.blocks to anon,authenticated;revoke update on public.follows from authenticated;grant update(status) on public.follows to authenticated;grant select(user_id,avatar_url,banner_url) on public.profiles to authenticated;',
    );
    for (const id of [A, B, C, D]) {
      await db.query('insert into auth.users values($1)', [id]);
      await db.query('insert into public.profiles(user_id,username,is_private) values($1,$2,$3)', [
        id,
        'student_' + id[0],
        id !== C,
      ]);
    }
    await db.query('insert into public.follows(follower_id,following_id) values($1,$2)', [D, B]);
    const acl = async () =>
      (
        await db.query(
          "select c.relname,c.relacl::text,a.attname,a.attacl::text from pg_class c join pg_attribute a on a.attrelid=c.oid and a.attnum>0 where c.oid in ('public.follows'::regclass,'public.profiles'::regclass) order by c.relname,a.attname",
        )
      ).rows;
    const originalAcl = await acl();
    await check('migration installs idempotently and preserves existing accepted relationships', async () => {
      await db.exec(migration);
      await db.exec(migration);
      assert.equal(await status(D, B), 'accepted');
    });
    await check(
      'read-only deployment verification and authenticated version RPC confirm the installation',
      async () => {
        const results = await db.exec(read('docs/supabase/16-follow-requests-verify.sql'));
        const values = results.flatMap((r) => r.rows)[0];
        assert(Object.values(values).every((value) => value === true));
        await db.exec('begin read only');
        const version = await as(A, () =>
          db.query('select public.kampusx_follow_requests_version() version'),
        );
        assert.equal(version.rows[0].version, '20261018190000');
        await db.exec('commit');
        await denied(as('', () => db.query('select public.kampusx_follow_requests_version()'), 'anon'));
      },
    );
    await check('private target gets pending, public target gets accepted', async () => {
      await follow(A, B);
      await follow(A, C);
      assert.equal(await status(A, B), 'pending');
      assert.equal(await status(A, C), 'accepted');
    });
    await check(
      'unrelated users cannot accept or delete another pair, including bulk operations',
      async () => {
        await as(D, () => db.exec("update public.follows set status='accepted' where status='pending'"));
        await remove(D, A, B);
        await as(D, () => db.exec("delete from public.follows where status='pending'"));
        assert.equal(await status(A, B), 'pending');
        assert.equal(await status(A, C), 'accepted');
      },
    );
    await check('trigger helpers are not callable by clients and use a fixed search path', async () => {
      const functions = (
        await db.query(
          "select proname,proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'kx_follow_%'",
        )
      ).rows;
      assert.equal(functions.length, 5);
      assert(functions.every((fn) => fn.proconfig.includes('search_path=public')));
      for (const role of ['anon', 'authenticated']) {
        await denied(as(A, () => db.query('select private.kx_follow_pair_lock($1,$2)', [A, B]), role));
        for (const name of ['kx_follow_guard', 'kx_follow_broadcast', 'kx_follow_block_lock']) {
          assert.equal(
            (
              await db.query("select has_function_privilege($1,$2,'execute') allowed", [
                role,
                'private.' + name + '()',
              ])
            ).rows[0].allowed,
            false,
          );
        }
      }
    });
    await check('client cannot supply status or timestamp, even through direct SQL', async () => {
      await denied(
        as(C, () =>
          db.query("insert into public.follows(follower_id,following_id,status) values($1,$2,'accepted')", [
            C,
            B,
          ]),
        ),
      );
      await denied(
        as(C, () =>
          db.query('insert into public.follows(follower_id,following_id,created_at) values($1,$2,now())', [
            C,
            B,
          ]),
        ),
      );
    });
    await check(
      'trigger overrides forged status even if insert privilege is widened accidentally',
      async () => {
        await db.exec('grant insert(status) on public.follows to authenticated;');
        await as(C, () =>
          db.query("insert into public.follows(follower_id,following_id,status) values($1,$2,'accepted')", [
            C,
            B,
          ]),
        );
        assert.equal(await status(C, B), 'pending');
        await db.exec('revoke insert(status) on public.follows from authenticated;');
      },
    );
    await check('only recipient sees incoming request and can accept it', async () => {
      assert.equal(
        (
          await as(D, () =>
            db.query('select * from public.follows where follower_id=$1 and following_id=$2', [A, B]),
          )
        ).rows.length,
        0,
      );
      await as(A, () =>
        db.query("update public.follows set status='accepted' where follower_id=$1 and following_id=$2", [
          A,
          B,
        ]),
      );
      assert.equal(await status(A, B), 'pending');
      assert.equal(
        (
          await as(B, () =>
            db.query('select * from public.follows where follower_id=$1 and following_id=$2', [A, B]),
          )
        ).rows.length,
        1,
      );
      await as(B, () =>
        db.query("update public.follows set status='accepted' where follower_id=$1 and following_id=$2", [
          A,
          B,
        ]),
      );
      assert.equal(await status(A, B), 'accepted');
    });
    await check('pending does not grant private content access; acceptance does', async () => {
      assert.equal(
        (await as(C, () => db.query('select private.can_view_user_content($1,$2) allowed', [C, B]))).rows[0]
          .allowed,
        false,
      );
      assert.equal(
        (await as(A, () => db.query('select private.can_view_user_content($1,$2) allowed', [A, B]))).rows[0]
          .allowed,
        true,
      );
    });
    await check('recipient cannot turn accepted relation back into pending or change identity', async () => {
      await as(B, () =>
        db.query("update public.follows set status='pending' where follower_id=$1 and following_id=$2", [
          A,
          B,
        ]),
      );
      assert.equal(await status(A, B), 'accepted');
      await denied(
        as(B, () => db.query('update public.follows set follower_id=$1 where following_id=$2', [C, B])),
      );
    });
    await check('self follow, duplicate and impersonation are rejected', async () => {
      await assert.rejects(follow(A, A), (e) => e.code === '23514');
      await assert.rejects(follow(A, B), (e) => e.code === '23505');
      await denied(
        as(A, () => db.query('insert into public.follows(follower_id,following_id) values($1,$2)', [B, C])),
      );
    });
    await check(
      'recipient can reject requests and remove followers; follower can cancel/unfollow',
      async () => {
        await remove(B, C, B);
        assert.equal(await status(C, B), undefined);
        await remove(B, D, B);
        assert.equal(await status(D, B), undefined);
        await follow(D, B);
        await remove(D, D, B);
        assert.equal(await status(D, B), undefined);
        await remove(A, A, C);
        assert.equal(await status(A, C), undefined);
        await remove(D, A, B);
        assert.equal(await status(A, B), 'accepted');
      },
    );
    await check(
      'blocking removes both directions, hides profile and prevents new follow requests',
      async () => {
        await follow(B, A);
        await as(B, () => db.query('insert into public.blocks(blocker_id,blocked_id) values($1,$2)', [B, A]));
        assert.equal(await status(A, B), undefined);
        assert.equal(await status(B, A), undefined);
        await denied(follow(A, B));
        await denied(follow(B, A));
        assert.equal(
          (await as(A, () => db.query('select username from public.profiles where user_id=$1', [B]))).rows
            .length,
          0,
        );
        assert.equal(
          (await as(A, () => db.query('select private.can_view_user_content($1,$2) allowed', [A, B]))).rows[0]
            .allowed,
          false,
        );
      },
    );
    await check(
      'anonymous and authenticated roles cannot truncate; anonymous cannot read/write follows',
      async () => {
        await denied(as('', () => db.query('select * from public.follows'), 'anon'));
        for (const role of ['anon', 'authenticated'])
          await denied(as(A, () => db.exec('truncate public.follows'), role));
        await denied(as(A, () => db.query('select private.kx_follow_pair_lock($1,$2)', [A, B])));
      },
    );
    await check(
      'every relation change broadcasts only empty invalidation to its two participants',
      async () => {
        const sent = (await db.query('select * from realtime.sent')).rows;
        assert(sent.length > 0);
        assert.equal(sent.length % 2, 0);
        assert(
          sent.every(
            (r) =>
              r.private &&
              r.event === 'changed' &&
              Object.keys(r.payload).length === 0 &&
              r.topic.startsWith('kampusx:follows:'),
          ),
        );
      },
    );
    await check('reserved channels resist permissive rules and forged client broadcasts', async () => {
      await db.exec(
        'create policy test_broad_read on realtime.messages for select to public using(true);create policy test_broad_send on realtime.messages for insert to public with check(true);',
      );
      for (const id of [A, B])
        await db.query("insert into realtime.messages values('broadcast','{}',$1)", [
          'kampusx:follows:' + id,
        ]);
      await db.query("select set_config('realtime.topic',$1,false)", ['kampusx:follows:' + A]);
      assert.equal((await as(A, () => db.query('select * from realtime.messages'))).rows.length, 1);
      assert.equal((await as(B, () => db.query('select * from realtime.messages'))).rows.length, 0);
      assert.equal((await as('', () => db.query('select * from realtime.messages'), 'anon')).rows.length, 0);
      await denied(
        as(A, () =>
          db.query("insert into realtime.messages values('broadcast','{}',$1)", ['kampusx:follows:' + A]),
        ),
      );
      await db.query("select set_config('realtime.topic','unrelated:topic',false)");
      assert.equal((await as(A, () => db.query('select * from realtime.messages'))).rows.length, 0);
      await denied(
        as(A, () =>
          db.query("insert into realtime.messages values('broadcast','{}',$1)", ['kampusx:follows:' + B]),
        ),
      );
      await as(A, () => db.exec("insert into realtime.messages values('broadcast','{}','unrelated:topic')"));
      assert.equal((await as(A, () => db.query('select * from realtime.messages'))).rows.length, 1);
      await db.exec(
        'drop policy test_broad_read on realtime.messages;drop policy test_broad_send on realtime.messages;',
      );
    });
    await check(
      'rollback restores exact prior ACL/policies without losing relationships; repeat rollback is safe',
      async () => {
        const rows = (await db.query('select * from public.follows order by follower_id,following_id')).rows;
        await db.exec(rollback);
        await db.exec(rollback);
        assert.deepEqual(
          (await db.query('select * from public.follows order by follower_id,following_id')).rows,
          rows,
        );
        assert.deepEqual(await acl(), originalAcl);
        assert.equal(
          (await db.query("select count(*)::int n from pg_policies where tablename='follows'")).rows[0].n,
          6,
        );
      },
    );
    console.log(checks + ' production-schema follow SQL checks passed. Broadcast delivery is stubbed.');
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
