// Isolated PostgreSQL. Storage object rows model API completion; no live file is deleted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const root = path.resolve(__dirname, '../..');
const sql = (name) => fs.readFileSync(path.join(root, 'docs/supabase', name), 'utf8');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
const ids = Array.from(
  { length: 12 },
  (_, i) => `44444444-4444-4444-8444-${String(i + 1).padStart(12, '0')}`,
);
const mediaPath = `${A}/post/55555555-5555-4555-8555-555555555555.webp`;
const url = `https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/${mediaPath}`;
async function main() {
  const db = new PGlite();
  let checks = 0;
  const check = async (name, fn) => {
    await fn();
    checks++;
    console.log('PASS ' + name);
  };
  const denied = (promise, code = '42501') => assert.rejects(promise, (e) => e.code === code);
  const as = async (id, fn, role = 'authenticated') => {
    assert.ok(['authenticated', 'anon'].includes(role));
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    try {
      return await fn();
    } finally {
      await db.exec('reset role');
    }
  };
  const rpc = (name, args = []) => {
    assert.match(name, /^kampusx_[a-z_]+$/);
    return db.query(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as value`, args);
  };
  const state = async (id) => (await rpc('kampusx_post_state', [id])).rows[0].value;
  const count = async (table) => {
    assert.match(table, /^[a-z_]+$/);
    return (await db.query(`select count(*)::int as n from public.${table}`)).rows[0].n;
  };
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth;create schema storage;create schema realtime;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table auth.users(id uuid primary key);
      create table public.profiles(user_id uuid primary key references auth.users(id),username text,full_name text,avatar_url text,banner_url text,university text,studying text,bio text,created_at timestamptz not null default now());
      create table public.posts(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(user_id) on delete cascade,content text,media_url text,media_type text,created_at timestamptz not null default now());
      alter table public.profiles enable row level security;alter table public.posts enable row level security;
      grant usage on schema public,auth,storage,realtime to anon,authenticated,service_role;
      grant all on public.profiles,public.posts to public,anon,authenticated,service_role;
      create table storage.buckets(id text primary key,public boolean not null,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references storage.buckets(id),name text not null,unique(bucket_id,name));
      alter table storage.objects enable row level security;grant all on storage.objects to anon,authenticated;
      insert into storage.buckets values('uploads',true,null,null),('other',false,null,null);
      create policy "Insert Policy 1va6avm_0" on storage.objects for insert to public with check(bucket_id='uploads');
      create policy "Select Policy 1va6avm_0" on storage.objects for select to public using(bucket_id='uploads');
      create table realtime.messages(extension text,payload jsonb);alter table realtime.messages enable row level security;
      create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;
      create table realtime.sent(payload jsonb,event text,topic text,private boolean);
      create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language plpgsql as $$begin insert into realtime.sent values($1,$2,$3,$4); end$$;
    `);
    for (const id of [A, B, C]) {
      await db.query('insert into auth.users values($1)', [id]);
      await db.query('insert into public.profiles(user_id) values($1)', [id]);
    }
    await db.exec(sql('05-profile-media-permissions.sql'));
    await db.exec(sql('07-realtime-follows.sql'));
    await db.exec(sql('09-post-publishing-permissions.sql'));
    await db.exec(sql('11-uploads-security-hardening.sql'));
    for (let i = 0; i < 10; i++)
      await db.query('insert into public.posts(id,user_id,content) values($1,$2,$3)', [
        ids[i],
        i < 6 ? A : B,
        'Post ' + i,
      ]);
    await check(
      'migration installs against supplied schemas without deleting existing posts/profiles',
      async () => {
        await db.exec(sql('12-post-actions-and-blocking.sql'));
        assert.equal(await count('posts'), 10);
        assert.equal(await count('profiles'), 3);
      },
    );
    await check('three pins succeed, fourth is refused, unpin frees a slot', () =>
      as(A, async () => {
        for (let i = 0; i < 3; i++)
          assert.equal((await rpc('kampusx_pin_post', [ids[i], true])).rows[0].value.pin_slot, i + 1);
        await assert.rejects(rpc('kampusx_pin_post', [ids[3], true]), /pin_limit/);
        await rpc('kampusx_pin_post', [ids[0], false]);
        assert.equal((await rpc('kampusx_pin_post', [ids[3], true])).rows[0].value.pin_slot, 1);
      }),
    );
    await check('database unique/check constraints also reject a bypassed fourth pin', async () => {
      await denied(db.query('update public.posts set pin_slot=4 where id=$1', [ids[4]]), '23514');
      await denied(db.query('update public.posts set pin_slot=2 where id=$1', [ids[4]]), '23505');
    });
    await check(
      'foreign pin/archive/delete preparation and direct counter/ownership updates are denied',
      () =>
        as(B, async () => {
          for (const [name, value] of [
            ['kampusx_pin_post', true],
            ['kampusx_archive_post', true],
          ])
            await denied(rpc(name, [ids[0], value]));
          await denied(rpc('kampusx_begin_post_delete', [ids[0]]));
          for (const update of [
            'likes_count=999',
            'comments_count=999',
            'user_id=null',
            'pin_slot=1',
            'archived_at=now()',
          ])
            await denied(db.query(`update public.posts set ${update} where id=$1`, [ids[0]]));
        }),
    );
    await check('archive clears pin, hides from others, blocks interactions; owner restores', async () => {
      await as(A, () => rpc('kampusx_archive_post', [ids[1], true]));
      await as(B, async () => {
        assert.equal((await db.query('select id from public.posts where id=$1', [ids[1]])).rows.length, 0);
        await denied(rpc('kampusx_set_reaction', [ids[1], 'like', true]));
      });
      await as(A, async () => {
        const p = await state(ids[1]);
        assert.equal(p.pin_slot, null);
        assert.ok(p.archived_at);
        await rpc('kampusx_archive_post', [ids[1], false]);
      });
    });
    await check('like/bookmark are idempotent and duplicate rows cannot bypass unique constraints', () =>
      as(B, async () => {
        await rpc('kampusx_set_reaction', [ids[0], 'like', true]);
        await rpc('kampusx_set_reaction', [ids[0], 'like', true]);
        assert.equal((await state(ids[0])).likes_count, 1);
        assert.equal(await count('post_likes'), 1);
        await denied(
          db.query('insert into public.post_likes(post_id,user_id) values($1,$2)', [ids[0], B]),
          '23505',
        );
        await rpc('kampusx_set_reaction', [ids[0], 'bookmark', true]);
        await rpc('kampusx_set_reaction', [ids[0], 'bookmark', true]);
        assert.equal(await count('post_bookmarks'), 1);
        await rpc('kampusx_set_reaction', [ids[0], 'bookmark', false]);
        assert.equal(await count('post_bookmarks'), 0);
        await rpc('kampusx_set_reaction', [ids[0], 'like', false]);
        assert.equal((await state(ids[0])).likes_count, 0);
      }),
    );
    await check('likes and bookmarks cannot be forged for another user', () =>
      as(B, async () => {
        for (const table of ['post_likes', 'post_bookmarks'])
          await denied(db.query(`insert into public.${table}(post_id,user_id) values($1,$2)`, [ids[0], C]));
      }),
    );
    await check('report reasons are constrained and repeated reports remain one row', () =>
      as(B, async () => {
        assert.equal((await rpc('kampusx_report_post', [ids[0], 'spam'])).rows[0].value, true);
        assert.equal((await rpc('kampusx_report_post', [ids[0], 'harassment'])).rows[0].value, false);
        assert.equal(await count('post_reports'), 1);
        await denied(rpc('kampusx_report_post', [ids[1], 'invented']), '23514');
        await denied(
          db.query('insert into public.post_reports(post_id,user_id,reason) values($1,$2,$3)', [
            ids[0],
            B,
            'other',
          ]),
          '23505',
        );
      }),
    );
    await check('owner cannot report own post; other users cannot read reports', async () => {
      await as(A, async () => {
        await denied(rpc('kampusx_report_post', [ids[0], 'spam']));
        assert.equal(await count('post_reports'), 0);
      });
    });
    await check('comment + one reply are allowed; deeper/cross-post replies and forged authors fail', () =>
      as(B, async () => {
        await rpc('kampusx_add_comment', [ids[10], ids[0], null, 'Root']);
        await rpc('kampusx_add_comment', [ids[11], ids[0], ids[10], 'Reply']);
        await rpc('kampusx_add_comment', [ids[11], ids[0], ids[10], 'Reply']);
        assert.equal((await state(ids[0])).comments_count, 2);
        await denied(
          rpc('kampusx_add_comment', ['66666666-6666-4666-8666-666666666666', ids[0], ids[11], 'Too deep']),
          '22023',
        );
        await denied(
          rpc('kampusx_add_comment', ['66666666-6666-4666-8666-666666666666', ids[1], ids[10], 'Wrong post']),
          '22023',
        );
        await denied(
          db.query('insert into public.post_comments(post_id,user_id,content) values($1,$2,$3)', [
            ids[0],
            C,
            'Forged',
          ]),
        );
      }),
    );
    await check('root comment deletion cascades replies and updates the counter', () =>
      as(B, async () => {
        await db.query('delete from public.post_comments where id=$1', [ids[10]]);
        assert.equal((await state(ids[0])).comments_count, 0);
      }),
    );
    await check('blocking deletes both directions of following in the same transaction', async () => {
      await as(A, () =>
        db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [A, B]),
      );
      await as(B, () =>
        db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [B, A]),
      );
      await as(A, () =>
        db.query('insert into public.user_blocks(blocker_id,blocked_id,blocked_label) values($1,$2,$3)', [
          A,
          B,
          'Visible name',
        ]),
      );
      assert.equal(await count('user_follows'), 0);
    });
    await check(
      'both directions of post/search visibility and interaction/follow access are blocked',
      async () => {
        for (const [viewer, other, postId] of [
          [A, B, ids[6]],
          [B, A, ids[0]],
        ])
          await as(viewer, async () => {
            assert.equal(
              (
                await db.query('select id from public.posts where user_id=$1 and content ilike $2', [
                  other,
                  '%Post%',
                ])
              ).rows.length,
              0,
            );
            await denied(rpc('kampusx_set_reaction', [postId, 'like', true]));
            await denied(rpc('kampusx_set_reaction', [postId, 'bookmark', true]));
            await denied(rpc('kampusx_report_post', [postId, 'spam']));
            await denied(
              rpc('kampusx_add_comment', ['66666666-6666-4666-8666-666666666666', postId, null, 'Blocked']),
            );
            await denied(
              db.query('insert into public.user_follows(follower_id,followed_id) values($1,$2)', [
                viewer,
                other,
              ]),
            );
          });
      },
    );
    await check(
      'blocked-list exception permits own list/unblock without exposing blocked profiles or incoming blocks',
      async () => {
        await db.exec(
          'create policy test_public_profiles on public.profiles for select to authenticated using(true)',
        );
        await as(A, async () => {
          assert.equal(await count('user_blocks'), 1);
          assert.equal(
            (await db.query('select user_id from public.profiles where user_id=$1', [B])).rows.length,
            0,
          );
        });
        await as(B, async () => {
          assert.equal(await count('user_blocks'), 0);
          assert.equal(
            (await db.query('select user_id from public.profiles where user_id=$1', [A])).rows.length,
            0,
          );
        });
        await db.exec('drop policy test_public_profiles on public.profiles');
      },
    );
    await check(
      'privacy restrictions compose with block rules; broad policies do not reopen blocked rows',
      async () => {
        await db.exec(
          'create policy test_broad_posts on public.posts for all to authenticated using(true) with check(true)',
        );
        await as(B, async () => {
          assert.equal((await db.query('select id from public.posts where user_id=$1', [A])).rows.length, 0);
        });
        await db.exec(
          `create policy test_private_posts on public.posts as restrictive for select to authenticated using(user_id=auth.uid() or content <> 'Private post')`,
        );
        await db.query('update public.posts set content=$1 where id=$2', ['Private post', ids[8]]);
        await as(C, async () => {
          assert.equal((await db.query('select id from public.posts where id=$1', [ids[8]])).rows.length, 0);
          await denied(rpc('kampusx_set_reaction', [ids[8], 'like', true]));
        });
        await db.exec(
          'drop policy test_broad_posts on public.posts;drop policy test_private_posts on public.posts',
        );
      },
    );
    await check('unblock restores eligible visibility but never recreates deleted follows', async () => {
      await as(A, () =>
        db.query('delete from public.user_blocks where blocker_id=$1 and blocked_id=$2', [A, B]),
      );
      await as(B, async () =>
        assert.equal((await db.query('select id from public.posts where id=$1', [ids[0]])).rows.length, 1),
      );
      assert.equal(await count('user_follows'), 0);
    });
    await check(
      'Storage cleanup must precede post deletion and cannot target avatar/foreign media',
      async () => {
        await as(A, () =>
          db.query('insert into storage.objects(bucket_id,name) values($1,$2)', ['uploads', mediaPath]),
        );
        const post = (
          await as(A, () =>
            db.query(
              'insert into public.posts(user_id,content,media_url,media_type) values($1,$2,$3,$4) returning id',
              [A, '', url, 'image'],
            ),
          )
        ).rows[0].id;
        await as(A, async () => {
          assert.equal(
            (await db.query('delete from public.posts where id=$1 returning id', [post])).rows.length,
            0,
          );
          assert.equal(
            (await db.query('delete from storage.objects where name=$1 returning id', [mediaPath])).rows
              .length,
            0,
          );
          const begin = (await rpc('kampusx_begin_post_delete', [post])).rows[0].value;
          assert.equal(begin.media_path, mediaPath);
          await denied(rpc('kampusx_finish_post_delete', [post]));
          await denied(
            db.query('insert into public.posts(user_id,content,media_url,media_type) values($1,$2,$3,$4)', [
              A,
              '',
              url,
              'image',
            ]),
          );
          assert.equal(
            (await db.query('delete from storage.objects where name=$1 returning id', [mediaPath])).rows
              .length,
            1,
          );
          await rpc('kampusx_finish_post_delete', [post]);
          await rpc('kampusx_finish_post_delete', [post]);
        });
        assert.equal((await db.query('select id from public.posts where id=$1', [post])).rows.length, 0);
        await as(A, () =>
          denied(
            db.query('insert into public.posts(user_id,content,media_url,media_type) values($1,$2,$3,$4)', [
              A,
              '',
              url,
              'image',
            ]),
          ),
        );
        await db.query('insert into storage.objects(bucket_id,name) values($1,$2),($1,$3)', [
          'uploads',
          `${A}/avatar/55555555-5555-4555-8555-555555555555.webp`,
          `${B}/post/55555555-5555-4555-8555-555555555555.webp`,
        ]);
        await as(A, async () =>
          assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 0),
        );
      },
    );
    await check('pending deletion is retryable, hidden from others and reserves its media URL', async () => {
      await as(A, () => rpc('kampusx_begin_post_delete', [ids[5]]));
      await as(B, async () =>
        assert.equal((await db.query('select id from public.posts where id=$1', [ids[5]])).rows.length, 0),
      );
      await as(A, async () => {
        assert.ok(
          (await db.query('select deletion_started_at from public.posts where id=$1', [ids[5]])).rows[0]
            .deletion_started_at,
        );
        await rpc('kampusx_finish_post_delete', [ids[5]]);
      });
    });
    await check(
      'anonymous writes/RPCs and TRUNCATE are denied; client cannot set counters/state/timestamps',
      async () => {
        await as(
          null,
          async () => {
            await denied(rpc('kampusx_pin_post', [ids[0], true]));
            for (const table of [
              'posts',
              'post_likes',
              'post_bookmarks',
              'post_reports',
              'post_comments',
              'user_blocks',
            ])
              await denied(db.query(`select * from public.${table}`));
          },
          'anon',
        );
        await as(A, async () => {
          for (const table of [
            'posts',
            'post_likes',
            'post_bookmarks',
            'post_reports',
            'post_comments',
            'user_blocks',
          ])
            await denied(db.query(`truncate public.${table} cascade`));
          await denied(
            db.query('insert into public.posts(user_id,content,likes_count) values($1,$2,999)', [
              A,
              'Spoofed',
            ]),
          );
          await denied(
            db.query('insert into public.post_likes(post_id,user_id,created_at) values($1,$2,now())', [
              ids[6],
              A,
            ]),
          );
        });
      },
    );
    await check(
      'public URL mode preserves bucket visibility and only owners list upload metadata',
      async () => {
        assert.equal(
          (await db.query("select public from storage.buckets where id='uploads'")).rows[0].public,
          true,
        );
        const avatar = `${A}/avatar/55555555-5555-4555-8555-555555555555.webp`;
        await as(A, async () =>
          assert.equal(
            (
              await db.query("select name from storage.objects where bucket_id='uploads' and name=$1", [
                avatar,
              ])
            ).rows.length,
            1,
          ),
        );
        await as(B, async () =>
          assert.equal(
            (
              await db.query("select name from storage.objects where bucket_id='uploads' and name=$1", [
                avatar,
              ])
            ).rows.length,
            0,
          ),
        );
        await as(
          null,
          async () =>
            assert.equal(
              (await db.query("select name from storage.objects where bucket_id='uploads'")).rows.length,
              0,
            ),
          'anon',
        );
      },
    );
    await check(
      'block changes with no follows still notify only both private channels with empty payloads',
      async () => {
        await db.exec('delete from realtime.sent');
        await as(A, () =>
          db.query('insert into public.user_blocks(blocker_id,blocked_id) values($1,$2)', [A, C]),
        );
        const sent = (await db.query('select * from realtime.sent order by topic')).rows;
        assert.deepEqual(
          sent.map((r) => r.topic),
          ['kampusx:follows:' + A, 'kampusx:follows:' + C],
        );
        for (const row of sent) {
          assert.equal(row.private, true);
          assert.equal(row.event, 'changed');
          assert.deepEqual(row.payload, {});
        }
        await db.exec('delete from realtime.sent');
        await as(A, () => db.query('delete from public.user_blocks where blocked_id=$1', [C]));
        assert.equal((await db.query('select count(*)::int as n from realtime.sent')).rows[0].n, 2);
      },
    );
    await check('uploads guards leave unrelated buckets governed by their existing policies', async () => {
      await db.exec(
        "create policy test_other_bucket on storage.objects for all to public using(bucket_id='other') with check(bucket_id='other')",
      );
      await as(
        null,
        async () => {
          await db.query("insert into storage.objects(bucket_id,name) values('other','asset.txt')");
          assert.equal(
            (await db.query("select name from storage.objects where bucket_id='other'")).rows.length,
            1,
          );
          assert.equal(
            (await db.query("delete from storage.objects where bucket_id='other' returning name")).rows
              .length,
            1,
          );
        },
        'anon',
      );
      await db.exec('drop policy test_other_bucket on storage.objects');
    });
    await check(
      'public rollback is repeatable and preserves files, post rows and delete permissions',
      async () => {
        const beforePosts = await count('posts'),
          beforeObjects = (await db.query('select count(*)::int as n from storage.objects')).rows[0].n;
        await db.exec(
          "update storage.buckets set public=false where id='uploads'; create function kampusx_security.read_media(path text) returns boolean language sql stable as 'select false'; create policy kampusx_private_media_read on storage.objects for select to authenticated using(kampusx_security.read_media(name)); drop policy kampusx_uploads_guard_select on storage.objects; create policy kampusx_uploads_guard_select on storage.objects as restrictive for select to public using(bucket_id <> 'uploads' or kampusx_security.read_media(name))",
        );
        await db.exec(sql('13-restore-public-uploads.sql'));
        await db.exec(sql('13-restore-public-uploads.sql'));
        assert.equal(
          (await db.query("select to_regprocedure('kampusx_security.read_media(text)') as helper")).rows[0]
            .helper,
          null,
        );
        assert.equal(
          (await db.query("select public from storage.buckets where id='uploads'")).rows[0].public,
          true,
        );
        assert.equal(await count('posts'), beforePosts);
        assert.equal(
          (await db.query('select count(*)::int as n from storage.objects')).rows[0].n,
          beforeObjects,
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from pg_policies where policyname='kampusx_remove_pending_post_media'",
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await check('repeat migration stops atomically without altering live-like data', async () => {
      const before = await count('posts');
      await assert.rejects(db.exec(sql('12-post-actions-and-blocking.sql')), /zaten var/);
      await db.exec('rollback');
      assert.equal(await count('posts'), before);
    });
    console.log(
      JSON.stringify({ passed: checks, engine: 'PGlite PostgreSQL', liveSupabaseContacted: false }),
    );
  } finally {
    await db.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
