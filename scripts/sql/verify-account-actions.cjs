// Isolated PostgreSQL/PGlite. No environment files, Supabase connection or production writes.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { PGlite } = require('../../.nx/sql-verification/node_modules/@electric-sql/pglite');
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333',
  D = '44444444-4444-4444-8444-444444444444',
  E = '55555555-5555-4555-8555-555555555555';
async function main() {
  const db = new PGlite();
  let passed = 0;
  const sql = (file) =>
    db.exec(fs.readFileSync(path.resolve(__dirname, '../../docs/supabase', file), 'utf8'));
  const check = async (name, fn) => {
    await fn();
    passed++;
    console.log('PASS ' + name);
  };
  async function actor(text, params = [], owner = A, role = 'authenticated') {
    await db.exec('set role ' + role);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    try {
      return await db.query(text, params);
    } finally {
      await db.exec('reset role');
    }
  }
  try {
    await db.exec(`create role authenticated;create role anon;create role supabase_auth_admin;
 create schema auth;create schema private;create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,private,storage to authenticated;grant usage on schema auth to supabase_auth_admin;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 grant select,update on auth.users to supabase_auth_admin;
 create table public.profiles(user_id uuid primary key references auth.users(id),username text unique,full_name text,avatar_url text,banner_url text,
 university text,studying text,bio text,created_at timestamptz not null default now(),is_private boolean not null default true);
 create table public.follows(follower_id uuid,following_id uuid,status text default 'accepted',created_at timestamptz default now(),primary key(follower_id,following_id));
 create table public.blocks(blocker_id uuid,blocked_id uuid,primary key(blocker_id,blocked_id));
 create table public.posts(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(user_id),content text not null default '',
 media_url text,media_type text,created_at timestamptz default now(),parent_id uuid references public.posts(id),repost_of_id uuid references public.posts(id),
 archived_at timestamptz,deleted_at timestamptz,pinned_at timestamptz,likes_count int default 0,replies_count int default 0,reposts_count int default 0);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1]$$;
 create table storage.buckets(id text primary key,public boolean);insert into storage.buckets values('uploads',true);
 create function private.is_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from blocks where (blocker_id=a and blocked_id=b)or(blocker_id=b and blocked_id=a))$$;
 create function private.can_view_user_content(viewer uuid,owner uuid) returns boolean language sql stable security definer set search_path=public as $$
 select viewer is not null and(viewer=owner or(not private.is_blocked(viewer,owner)and(not coalesce((select is_private from profiles where user_id=owner),true)
 or exists(select 1 from follows where follower_id=viewer and following_id=owner and status='accepted'))))$$;
 alter table profiles enable row level security;alter table posts enable row level security;alter table follows enable row level security;
 create policy profiles_select_all on profiles for select to authenticated using(user_id=(select auth.uid())or not private.is_blocked((select auth.uid()),user_id));
 create policy profiles_update_own on profiles for update to authenticated using(user_id=(select auth.uid()))with check(user_id=(select auth.uid()));
 create policy posts_select_visible on posts for select to authenticated using(deleted_at is null and(user_id=(select auth.uid())or(archived_at is null and private.can_view_user_content((select auth.uid()),user_id))));
 create policy posts_update_own on posts for update to authenticated using(user_id=(select auth.uid())and deleted_at is null)with check(user_id=(select auth.uid()));
 create policy posts_insert_own on posts for insert to authenticated with check(user_id=(select auth.uid()));
 create policy posts_insert_target_visible on posts as restrictive for insert to authenticated with check(parent_id is null or exists(select 1 from posts t where t.id=posts.parent_id));
 create policy follows_select on follows for select to authenticated using(true);
 create policy follows_insert on follows for insert to authenticated with check(follower_id=(select auth.uid()));
 grant select on profiles to authenticated;grant update(avatar_url,banner_url) on profiles to authenticated;
 grant select on posts to authenticated;grant update(pinned_at,archived_at,deleted_at) on posts to authenticated;
 grant insert(user_id,content,media_url,media_type,parent_id,repost_of_id) on posts to authenticated;grant select,insert on follows to authenticated;
 create function private.enforce_pin_limit() returns trigger language plpgsql security definer set search_path=public as $$begin return new;end$$;
 create trigger trg_pin_limit before update of pinned_at on posts for each row execute function private.enforce_pin_limit();
 create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
 begin insert into public.profiles(user_id,username)values(new.id,new.raw_user_meta_data->>'username');return new;end$$;
 create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
 `);
    for (const [id, campus, dept, uni] of [
      [A, 'North', 'Computing', 'Uni'],
      [B, 'North', 'Computing', 'Uni'],
      [C, 'North', 'History', 'Uni'],
      [D, 'South', 'Computing', 'Uni'],
      [E, 'North', 'Computing', 'Other'],
    ]) {
      await db.query('insert into auth.users(id,raw_user_meta_data)values($1,$2)', [
        id,
        {
          username: 'u' + id[0],
          full_name: 'Student ' + id[0],
          university_name: uni,
          faculty_name: campus,
          department_name: dept,
        },
      ]);
    }
    const own = [];
    for (let n = 0; n < 5; n++)
      own.push(
        (await db.query('insert into posts(user_id,content)values($1,$2)returning id', [A, 'Post ' + n]))
          .rows[0].id,
      );
    const peer = (await db.query("insert into posts(user_id,content)values($1,'Peer')returning id", [B]))
      .rows[0].id;
    await sql('22-owner-post-actions.sql');
    await sql('22-owner-post-actions.sql');
    await check('owner migration is idempotent and preserves public bucket/data', async () => {
      assert.equal(
        (await actor('select public.kampusx_owner_actions_version()as v')).rows[0].v,
        '2026102201',
      );
      assert.equal((await db.query('select public from storage.buckets')).rows[0].public, true);
      assert.equal((await db.query('select count(*)::int as n from posts')).rows[0].n, 6);
    });
    await check('database caps pins at three; archive unpins and frees a slot', async () => {
      for (const id of own.slice(0, 3)) await actor('update posts set pinned_at=now()where id=$1', [id]);
      await assert.rejects(
        actor('update posts set pinned_at=now()where id=$1', [own[3]]),
        (e) => e.message === 'pin_limit',
      );
      await actor('update posts set archived_at=now()where id=$1', [own[0]]);
      assert.equal(
        (await db.query('select pinned_at from posts where id=$1', [own[0]])).rows[0].pinned_at,
        null,
      );
      await actor('update posts set pinned_at=now()where id=$1', [own[3]]);
    });
    await check('only owner mutates; soft delete hides without RETURNING or hard delete', async () => {
      assert.equal(
        (await actor('update posts set deleted_at=now()where id=$1', [own[4]], B)).affectedRows,
        0,
      );
      await assert.rejects(
        actor('select public.kampusx_soft_delete_post($1)', [own[4]], B),
        (e) => e.code === '42501',
      );
      await assert.rejects(
        actor('update posts set deleted_at=now()where id=$1', [own[4]]),
        (e) => e.code === '42501',
      );
      await actor('select public.kampusx_soft_delete_post($1)', [own[4]]);
      assert.equal((await actor('select id from posts where id=$1', [own[4]])).rows.length, 0);
      assert.equal(
        (await db.query('select count(*)::int as n from posts where id=$1', [own[4]])).rows[0].n,
        1,
      );
      await assert.rejects(actor('update posts set likes_count=99'), (e) => e.code === '42501');
    });
    await check('Storage delete policy only covers the signed in owners post folder', async () => {
      await db.query("insert into storage.objects values('uploads',$1),('uploads',$2)", [
        A + '/post/a.webp',
        B + '/post/a.webp',
      ]);
      await actor('delete from storage.objects');
      assert.equal((await db.query('select count(*)::int as n from storage.objects')).rows[0].n, 1);
    });
    await sql('23-academic-account-visibility.sql');
    await sql('23-academic-account-visibility.sql');
    await check(
      'academic migration is idempotent; legacy privacy and actual metadata are preserved',
      async () => {
        assert.equal(
          (await actor('select campus from profiles where user_id=$1', [A])).rows[0].campus,
          'North',
        );
        assert.equal((await actor('select id from posts where id=$1', [peer])).rows.length, 0);
        assert.equal((await actor('select user_id from profiles where user_id=$1', [B])).rows.length, 1);
        assert.equal((await db.query('select count(*)::int as n from profiles')).rows[0].n, 5);
      },
    );
    await check(
      'department audience directly grants matching users; outsiders cannot discover rows',
      async () => {
        await actor('update profiles set visible_department=true where user_id=$1', [B], B);
        assert.equal((await actor('select id from posts where id=$1', [peer])).rows.length, 1);
        for (const id of [C, D, E]) {
          assert.equal(
            (await actor('select user_id from profiles where user_id=$1', [B], id)).rows.length,
            0,
          );
          assert.equal((await actor('select id from posts where id=$1', [peer], id)).rows.length, 0);
          assert.equal(
            (await actor('select private.kx_post_target_visible($1)as visible', [peer], id)).rows[0].visible,
            false,
          );
        }
      },
    );
    await check(
      'campus/university/explore widen only the selected matching audience; blocks still win',
      async () => {
        await actor(
          'update profiles set visible_department=false,visible_campus=true where user_id=$1',
          [B],
          B,
        );
        assert.equal((await actor('select id from posts where id=$1', [peer], C)).rows.length, 1);
        assert.equal((await actor('select id from posts where id=$1', [peer], D)).rows.length, 0);
        await actor('update profiles set visible_university=true where user_id=$1', [B], B);
        assert.equal((await actor('select id from posts where id=$1', [peer], D)).rows.length, 1);
        assert.equal((await actor('select id from posts where id=$1', [peer], E)).rows.length, 0);
        await actor('update profiles set visible_explore=true where user_id=$1', [B], B);
        assert.equal((await actor('select id from posts where id=$1', [peer], E)).rows.length, 1);
        await db.query('insert into blocks values($1,$2)', [A, B]);
        assert.equal((await actor('select id from posts where id=$1', [peer])).rows.length, 0);
        await db.query('delete from blocks');
      },
    );
    await check('all off is owner only; raw API follow and target visibility cannot bypass it', async () => {
      await actor(
        'update profiles set visible_department=false,visible_campus=false,visible_university=false,visible_explore=false where user_id=$1',
        [B],
        B,
      );
      assert.equal((await actor('select id from posts where id=$1', [peer])).rows.length, 0);
      assert.equal((await actor('select id from posts where id=$1', [peer], B)).rows.length, 1);
      await assert.rejects(
        actor('insert into follows(follower_id,following_id)values($1,$2)', [A, B]),
        (e) => e.code === '42501',
      );
    });
    await check(
      'new signup requires university/campus/department and copies valid metadata to profiles',
      async () => {
        const id = '66666666-6666-4666-8666-666666666666';
        await assert.rejects(
          db.query('insert into auth.users values($1,$2)', [id, { username: 'new' }]),
          (e) => e.message === 'academic_fields_required',
        );
        await db.query('insert into auth.users values($1,$2)', [
          id,
          { username: 'new', university_name: 'Uni', campus_name: 'North', department_name: 'Computing' },
        ]);
        assert.equal(
          (await db.query('select campus from profiles where user_id=$1', [id])).rows[0].campus,
          'North',
        );
      },
    );
    await check(
      'academic values cannot change via profiles or Auth metadata; display updates still sync',
      async () => {
        await assert.rejects(
          actor(
            "update auth.users set raw_user_meta_data=jsonb_set(raw_user_meta_data,'{university_name}','\"Other\"')where id=$1",
            [A],
            A,
            'supabase_auth_admin',
          ),
          (e) => e.message === 'academic_fields_locked',
        );
        await db.exec('grant update(university,campus,studying)on public.profiles to authenticated');
        await assert.rejects(
          actor("update profiles set campus='South'where user_id=$1", [A]),
          (e) => e.message === 'academic_fields_locked',
        );
        await db.exec('revoke update(university,campus,studying)on public.profiles from authenticated');
        await actor(
          "update auth.users set raw_user_meta_data=jsonb_set(raw_user_meta_data,'{full_name}','\"New name\"')where id=$1",
          [A],
          A,
          'supabase_auth_admin',
        );
        assert.equal(
          (await db.query('select full_name from profiles where user_id=$1', [A])).rows[0].full_name,
          'New name',
        );
      },
    );
    await check(
      'rollback preserves rows, saved preferences and public Storage; removes new entrypoints',
      async () => {
        const before = (await db.query('select count(*)::int as n from posts')).rows[0].n;
        await sql('23-academic-account-visibility-rollback.sql');
        await sql('22-owner-post-actions-rollback.sql');
        assert.equal((await db.query('select count(*)::int as n from posts')).rows[0].n, before);
        assert.equal(
          (await db.query('select audience_configured from profiles where user_id=$1', [B])).rows[0]
            .audience_configured,
          true,
        );
        assert.equal((await db.query('select public from storage.buckets')).rows[0].public, true);
      },
    );
    console.log(passed + ' PostgreSQL account/action checks passed; no production connection.');
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
