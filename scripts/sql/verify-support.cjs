const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222';
const fingerprint = 'a'.repeat(64);
let sequence = 0;
const nextId = () => `77777777-7777-4777-8777-${String(++sequence).padStart(12, '0')}`;
(async () => {
  const db = new PGlite();
  let checks = 0;
  const check = async (name, fn) => {
    await fn();
    console.log('PASS ' + name);
    checks++;
  };
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
   create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');`);
    const install = fs.readFileSync('docs/supabase/33-support-email-guard.sql', 'utf8');
    const reserve = async (actor, id, hash = fingerprint) =>
      (await db.query('select public.kx_support_reserve($1,$2,$3) as result', [actor, id, hash])).rows[0]
        .result;
    const status = async (actor, id) =>
      (await db.query('select public.kx_support_status($1,$2) as result', [actor, id])).rows[0].result;
    const finish = (actor, id, outcome = 'sent') =>
      db.query('select public.kx_support_finish($1,$2,$3,$4)', [actor, id, fingerprint, outcome]);
    await check('installation can repeat and creates no public ticket or content table', async () => {
      await db.exec(install);
      await db.exec(install);
      assert.equal(
        (await db.query('select count(*)::int as n from private.support_dispatches')).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int as n from information_schema.columns where table_schema='private' and table_name='support_dispatches' and column_name in('email','username','description','content')",
          )
        ).rows[0].n,
        0,
      );
    });
    for (const role of ['anon', 'authenticated'])
      await check(role + ' cannot dispatch, forge status, read metadata or truncate', async () => {
        await db.exec('set role ' + role);
        await assert.rejects(reserve(A, nextId()), /permission denied/);
        await assert.rejects(status(A, nextId()), /permission denied/);
        await assert.rejects(db.query('select * from private.support_dispatches'), /permission denied/);
        await assert.rejects(db.exec('truncate private.support_dispatches'), /permission denied/);
        await db.exec('reset role');
      });
    const id = nextId();
    await check(
      'service-only reservation binds fingerprint and actor and serializes duplicate in-flight work',
      async () => {
        await db.exec('set role service_role');
        assert.equal((await reserve(A, id)).decision, 'reserved');
        assert.equal((await reserve(A, id)).decision, 'busy');
        assert.equal((await reserve(B, id)).decision, 'conflict');
        assert.equal((await reserve(A, id, 'b'.repeat(64))).decision, 'conflict');
        await db.exec('reset role');
      },
    );
    await check('sent status is permanent and cannot be downgraded by a late error', async () => {
      await finish(A, id);
      await finish(A, id, 'uncertain');
      assert.equal((await status(A, id)).status, 'sent');
      assert.equal((await reserve(A, id)).decision, 'sent');
      assert.equal((await status(B, id)).status, 'unknown');
    });
    await check('one minute and hourly limits are durable across fresh request IDs', async () => {
      assert.equal((await reserve(A, nextId())).decision, 'rate_limited');
      await db.exec(
        `update private.support_dispatches set created_at=clock_timestamp()-interval '2 minutes'`,
      );
      assert.equal((await reserve(A, nextId())).decision, 'reserved');
      await db.exec(
        `update private.support_dispatches set created_at=clock_timestamp()-interval '2 minutes'`,
      );
      assert.equal((await reserve(A, nextId())).decision, 'reserved');
      await db.exec(
        `update private.support_dispatches set created_at=clock_timestamp()-interval '2 minutes'`,
      );
      assert.equal((await reserve(A, nextId())).decision, 'rate_limited');
    });
    await check('daily limit includes failed attempts and cannot be bypassed by retry IDs', async () => {
      await db.exec(`update private.support_dispatches set created_at=clock_timestamp()-interval '2 hours'`);
      assert.equal((await reserve(A, nextId())).decision, 'reserved');
      await db.exec(`update private.support_dispatches set created_at=clock_timestamp()-interval '2 hours'`);
      assert.equal((await reserve(A, nextId())).decision, 'reserved');
      await db.exec(
        `update private.support_dispatches set created_at=clock_timestamp()-interval '2 hours',state='rejected'`,
      );
      assert.equal((await reserve(A, nextId())).decision, 'rate_limited');
    });
    const retry = nextId();
    await check(
      'uncertain delivery retries the same ID only after the lease and within the provider deduplication window',
      async () => {
        assert.equal((await reserve(B, retry)).decision, 'reserved');
        await finish(B, retry, 'uncertain');
        assert.equal((await status(B, retry)).status, 'retryable');
        assert.equal((await reserve(B, retry)).decision, 'reserved');
        assert.equal((await reserve(B, retry)).decision, 'busy');
        await db.exec(
          `update private.support_dispatches set lease_until=clock_timestamp()-interval '1 second' where request_id='${retry}'`,
        );
        assert.equal((await reserve(B, retry)).decision, 'reserved');
        await finish(B, retry, 'uncertain');
        assert.equal((await reserve(B, retry)).decision, 'locked');
      },
    );
    await check('expired ambiguous requests never trigger a new dispatch', async () => {
      await db.exec(
        `update private.support_dispatches set created_at=clock_timestamp()-interval '24 hours',lease_until=clock_timestamp()-interval '1 second' where request_id='${retry}'`,
      );
      assert.equal((await reserve(B, retry)).decision, 'expired');
      assert.equal((await status(B, retry)).status, 'expired');
    });
    await check('global daily budget bounds multi-account abuse', async () => {
      await db.exec(`insert into private.support_dispatches(request_id,user_id,fingerprint,lease_until,created_at)
    select gen_random_uuid(),'${B}','${fingerprint}',clock_timestamp(),clock_timestamp()-interval '2 minutes' from generate_series(1,100)`);
      const result = await reserve(A, nextId());
      assert.equal(result.decision, 'rate_limited');
    });
    await check('invalid hashes and outcomes are refused', async () => {
      await assert.rejects(reserve(A, nextId(), 'not-a-hash'), /support_invalid_request/);
      await assert.rejects(finish(A, id, 'anything'), /support_invalid_outcome/);
    });
    await check('rollback disables dispatch without deleting records or accounts', async () => {
      const before = (await db.query('select count(*)::int as n from private.support_dispatches')).rows[0].n;
      await db.exec(fs.readFileSync('docs/supabase/33-support-email-guard-rollback.sql', 'utf8'));
      await db.exec('set role service_role');
      await assert.rejects(reserve(A, nextId()), /permission denied/);
      await db.exec('reset role');
      assert.equal(
        (await db.query('select count(*)::int as n from private.support_dispatches')).rows[0].n,
        before,
      );
      assert.equal((await db.query('select count(*)::int as n from auth.users')).rows[0].n, 2);
    });
    console.log(checks + ' support PostgreSQL checks passed; no production connection.');
  } finally {
    await db.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
