-- KampüsX: gönderi menüsü, arşiv, beğeni, kaydetme, rapor, tek katmanlı yorum ve engelleme.
-- Mevcut posts/profiles/user_follows tabloları korunur. İstenen yeni özellikler için
-- 5 ilişki tablosu ve posts sütunları eklenir. Yeni bucket veya Auth kullanıcısı oluşturulmaz.
-- 05, 07, 09 ve 11 kurulumlarından SONRA SQL Editor'da dosyanın tamamını bir kez çalıştırın.
-- uploads public/private ayarını değiştirmez; uygulama mevcut public URL akışını kullanır.
-- Eski 11'i tekrar çalıştırmak yeni gönderi silme iznini kapatabilir.
-- Mevcut gizlilik policy'leri silinmez/genişletilmez; engelleme RESTRICTIVE olarak eklenir.
begin;
do $$
begin
  if not exists(select 1 from storage.buckets where id='uploads') then
    raise exception 'Mevcut uploads bucket bulunamadı. Değişiklik yapılmadı.';
  end if;
  if to_regclass('public.posts') is null or to_regclass('public.profiles') is null
    or to_regclass('public.user_follows') is null then
    raise exception 'Önce mevcut profil, gönderi ve 07 takip kurulumunu tamamlayın.';
  end if;
  if exists (select 1 from pg_class where oid in ('public.posts'::regclass,
    'public.profiles'::regclass,'public.user_follows'::regclass,'storage.objects'::regclass) and not relrowsecurity) then
    raise exception 'Mevcut tablolarda RLS açık olmalı. Değişiklik yapılmadı.';
  end if;
  if to_regclass('public.post_likes') is not null or to_regclass('public.post_bookmarks') is not null
    or to_regclass('public.post_reports') is not null or to_regclass('public.post_comments') is not null
    or to_regclass('public.user_blocks') is not null then
    raise exception 'Yeni ilişki tablolarından biri zaten var; mevcut veriye dokunmadan kurulum durdu. Tekrar çalıştırmayın.';
  end if;
  if exists (select 1 from public.posts where media_url is not null group by media_url having count(*) > 1) then
    raise exception 'Birden çok gönderide aynı medya URL var. Paylaşılan dosya silinmesin diye kurulum durdu; önce bu kayıtlar incelenmeli.';
  end if;
end $$;

alter table public.posts
  add column archived_at timestamptz,
  add column deletion_started_at timestamptz,
  add column pin_slot smallint check (pin_slot between 1 and 3),
  add column likes_count integer not null default 0 check (likes_count >= 0),
  add column comments_count integer not null default 0 check (comments_count >= 0),
  add constraint kampusx_pin_active check (pin_slot is null or (archived_at is null and deletion_started_at is null));
-- En fazla üç yuva: doğrudan SQL ve eş zamanlı istekler de dördüncüyü oluşturamaz.
create unique index kampusx_three_pin_slots on public.posts(user_id,pin_slot) where pin_slot is not null;
create unique index kampusx_exclusive_post_media on public.posts(media_url) where media_url is not null;
create index kampusx_posts_feed on public.posts(created_at desc,id desc) where archived_at is null and deletion_started_at is null;
create index kampusx_posts_owner on public.posts(user_id,created_at desc,id desc);

create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocked_label text not null default '' check (char_length(blocked_label) <= 150),
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id), check(blocker_id <> blocked_id)
);
create index kampusx_blocks_reverse on public.user_blocks(blocked_id,blocker_id);
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create table public.post_bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create index kampusx_bookmarks_owner on public.post_bookmarks(user_id,created_at desc,post_id);
create table public.post_reports (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(reason in ('spam','harassment','inappropriate','other')),
  created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid,
  content text not null check(char_length(content) between 1 and 2000 and content ~ '[^[:space:]]'),
  created_at timestamptz not null default now(),
  unique(post_id,id),
  foreign key(post_id,parent_id) references public.post_comments(post_id,id) on delete cascade,
  check(parent_id is null or parent_id <> id)
);
create index kampusx_comments_thread on public.post_comments(post_id,created_at,id);

create schema if not exists kampusx_security;
revoke all on schema kampusx_security from public;
grant usage on schema kampusx_security to authenticated;

-- Yardımcılar sabit search_path ile çalışır; istemciye iki keyfi kullanıcıyı sorgulama API'si verilmez.
create function kampusx_security.blocked_pair(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a))
$$;
create function kampusx_security.view_person(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and target is not null and
    (auth.uid()=target or not kampusx_security.blocked_pair(auth.uid(),target))
$$;
create function kampusx_security.view_post(target uuid,interaction boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.posts p where p.id=target and auth.uid() is not null
    and kampusx_security.view_person(p.user_id)
    and ((not interaction and p.user_id=auth.uid()) or (p.archived_at is null and p.deletion_started_at is null)))
$$;
create function kampusx_security.media_path(owner_id uuid,url text) returns text
language plpgsql immutable set search_path = '' as $$
declare prefix text := 'https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/';
begin
  if url is null then return null; end if;
  if owner_id is null or url !~ ('^https://djhezivksrvcyqxzpiau[.]supabase[.]co/storage/v1/object/public/uploads/'
    || owner_id::text || '/post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp|mp4|webm)$') then
    raise exception using errcode='22023',message='invalid_post_media';
  end if;
  return substr(url,char_length(prefix)+1);
end $$;
create function kampusx_security.lock_pair(a uuid,b uuid) returns void
language sql volatile set search_path = '' as $$
  select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(a,b)::text || ':' || greatest(a,b)::text, 78231))
$$;

-- INSERT sırasında medya gerçekten bulunmalı. Silinme rezervasyonu ve dosyanın tek
-- gönderiye ait olması, Storage silme/DB silme arasındaki yeniden referans yarışını kapatır.
create function kampusx_security.check_post_media() returns trigger
language plpgsql security definer set search_path = '' as $$
declare path text;
begin
  if new.media_url is not null then
    path := kampusx_security.media_path(new.user_id,new.media_url);
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(path,78232));
    if not exists(select 1 from storage.objects where bucket_id='uploads' and name=path)
      or exists(select 1 from public.posts where media_url=new.media_url and deletion_started_at is not null) then
      raise exception using errcode='42501',message='post_media_unavailable';
    end if;
  end if;
  return new;
end $$;
create trigger kampusx_check_post_media before insert on public.posts
for each row execute function kampusx_security.check_post_media();

create function kampusx_security.check_interaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare author_id uuid; archived timestamptz; deleting timestamptz; parent public.post_comments;
begin
  select user_id,archived_at,deletion_started_at into author_id,archived,deleting
    from public.posts where id=new.post_id for update;
  if not found or new.user_id is distinct from auth.uid() or archived is not null or deleting is not null then
    raise exception using errcode='42501',message='post_unavailable';
  end if;
  perform kampusx_security.lock_pair(new.user_id,author_id);
  -- VOLATILE trigger: engelleme kilidi beklendiyse güncel commit yeniden okunur.
  if kampusx_security.blocked_pair(new.user_id,author_id) then
    raise exception using errcode='42501',message='post_unavailable';
  end if;
  if tg_table_name='post_comments' then
    if new.parent_id is not null then
      select * into parent from public.post_comments where id=new.parent_id and post_id=new.post_id;
      if not found or parent.parent_id is not null or not kampusx_security.view_person(parent.user_id) then
        raise exception using errcode='22023',message='reply_depth';
      end if;
    end if;
  elsif tg_table_name='post_reports' and author_id=new.user_id then
    raise exception using errcode='42501',message='own_report';
  end if;
  return new;
end $$;
create trigger kampusx_like_access before insert on public.post_likes for each row execute function kampusx_security.check_interaction();
create trigger kampusx_bookmark_access before insert on public.post_bookmarks for each row execute function kampusx_security.check_interaction();
create trigger kampusx_report_access before insert on public.post_reports for each row execute function kampusx_security.check_interaction();
create trigger kampusx_comment_access before insert on public.post_comments for each row execute function kampusx_security.check_interaction();

create function kampusx_security.count_interaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target uuid; delta integer;
begin
  if tg_op='INSERT' then target:=new.post_id; delta:=1; else target:=old.post_id; delta:=-1; end if;
  if tg_table_name='post_likes' then
    update public.posts set likes_count=greatest(0,likes_count+delta) where id=target;
  else
    update public.posts set comments_count=greatest(0,comments_count+delta) where id=target;
  end if;
  return null;
end $$;
create trigger kampusx_like_count after insert or delete on public.post_likes for each row execute function kampusx_security.count_interaction();
create trigger kampusx_comment_count after insert or delete on public.post_comments for each row execute function kampusx_security.count_interaction();

create function kampusx_security.block_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform kampusx_security.lock_pair(new.blocker_id,new.blocked_id);
  return new;
end $$;
create function kampusx_security.remove_blocked_follows() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.user_follows where (follower_id=new.blocker_id and followed_id=new.blocked_id)
    or (follower_id=new.blocked_id and followed_id=new.blocker_id);
  return null;
end $$;
create trigger kampusx_block_lock before insert on public.user_blocks for each row execute function kampusx_security.block_change();
create trigger kampusx_block_follows after insert on public.user_blocks for each row execute function kampusx_security.remove_blocked_follows();
create function kampusx_security.notify_block_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a uuid; b uuid;
begin
  if tg_op='DELETE' then a:=old.blocker_id; b:=old.blocked_id;
  else a:=new.blocker_id; b:=new.blocked_id; end if;
  -- İçerik/kimlik taşımayan, yalnızca iki katılımcının özel kanalına giden invalidation.
  perform realtime.send('{}'::jsonb,'changed','kampusx:follows:' || a::text,true);
  perform realtime.send('{}'::jsonb,'changed','kampusx:follows:' || b::text,true);
  return null;
end $$;
create trigger kampusx_block_changed after insert or delete on public.user_blocks
for each row execute function kampusx_security.notify_block_change();
create function kampusx_security.follow_access() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform kampusx_security.lock_pair(new.follower_id,new.followed_id);
  if kampusx_security.blocked_pair(new.follower_id,new.followed_id) then
    raise exception using errcode='42501',message='person_unavailable';
  end if;
  return new;
end $$;
create trigger kampusx_follow_block_access before insert on public.user_follows for each row execute function kampusx_security.follow_access();

-- Gizlilik çatışması: mevcut permissive/restrictive izinler korunur. Ek kurallar
-- önceki bir özel hesap/okuma kuralının izin vermediği satırı açamaz.
create policy kampusx_posts_visibility on public.posts as restrictive for select to public
using ((select auth.uid()) is not null and kampusx_security.view_person(user_id)
  and (user_id=(select auth.uid()) or (archived_at is null and deletion_started_at is null)));
create policy kampusx_profiles_block_visibility on public.profiles as restrictive for select to public
using (kampusx_security.view_person(user_id));
create policy kampusx_follows_block_access on public.user_follows as restrictive for insert to public
with check ((select auth.uid())=follower_id and kampusx_security.view_person(followed_id));

-- Yeni tablolar: anonim ve gereksiz UPDATE/TRUNCATE dahil tüm otomatik yetkiler kaldırılır.
do $$ declare t text; begin
  foreach t in array array['user_blocks','post_likes','post_bookmarks','post_reports','post_comments'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
  end loop;
end $$;
grant select,delete on public.user_blocks,public.post_likes,public.post_bookmarks,public.post_comments to authenticated;
grant select on public.post_reports to authenticated;
grant insert(blocker_id,blocked_id,blocked_label) on public.user_blocks to authenticated;
grant insert(post_id,user_id) on public.post_likes,public.post_bookmarks to authenticated;
grant insert(post_id,user_id,reason) on public.post_reports to authenticated;
grant insert(id,post_id,user_id,parent_id,content) on public.post_comments to authenticated;
grant select(archived_at,deletion_started_at,pin_slot,likes_count,comments_count),delete on public.posts to authenticated;

create policy kampusx_blocks_own on public.user_blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy kampusx_blocks_add on public.user_blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy kampusx_blocks_remove on public.user_blocks for delete to authenticated using(blocker_id=(select auth.uid()));
-- Liste/engel kaldırma kendi block satırından çalışır; gizlenen profil okuma izni açılmaz.
create policy kampusx_blocks_owner_guard on public.user_blocks as restrictive for all to public
using(blocker_id=(select auth.uid())) with check(blocker_id=(select auth.uid()));

do $$ declare t text; begin
  foreach t in array array['post_likes','post_bookmarks','post_reports'] loop
    execute format('create policy kampusx_own_read on public.%I for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.posts p where p.id=post_id))',t);
    execute format('create policy kampusx_own_insert on public.%I for insert to authenticated with check(user_id=(select auth.uid()) and kampusx_security.view_post(post_id,true) and exists(select 1 from public.posts p where p.id=post_id))',t);
    execute format('create policy kampusx_owner_guard on public.%I as restrictive for all to public using(user_id=(select auth.uid()) and exists(select 1 from public.posts p where p.id=post_id)) with check(user_id=(select auth.uid()) and kampusx_security.view_post(post_id,true) and exists(select 1 from public.posts p where p.id=post_id))',t);
    if t <> 'post_reports' then
      execute format('create policy kampusx_own_delete on public.%I for delete to authenticated using(user_id=(select auth.uid()))',t);
    end if;
  end loop;
end $$;

create function kampusx_security.comment_visible(post uuid,parent uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select parent is null or exists(select 1 from public.post_comments c where c.id=parent and c.post_id=post
    and c.parent_id is null and kampusx_security.view_person(c.user_id))
$$;
create policy kampusx_comments_read on public.post_comments for select to authenticated
using (exists(select 1 from public.posts p where p.id=post_id) and kampusx_security.view_person(user_id) and kampusx_security.comment_visible(post_id,parent_id));
create policy kampusx_comments_add on public.post_comments for insert to authenticated
with check(user_id=(select auth.uid()) and kampusx_security.view_post(post_id,true) and exists(select 1 from public.posts p where p.id=post_id));
create policy kampusx_comments_remove on public.post_comments for delete to authenticated using(user_id=(select auth.uid()));
create policy kampusx_comments_visibility_guard on public.post_comments as restrictive for select to public
using (exists(select 1 from public.posts p where p.id=post_id) and kampusx_security.view_person(user_id) and kampusx_security.comment_visible(post_id,parent_id));
create policy kampusx_comments_write_guard on public.post_comments as restrictive for insert to public
with check(user_id=(select auth.uid()) and kampusx_security.view_post(post_id,true) and exists(select 1 from public.posts p where p.id=post_id));
create policy kampusx_comments_delete_guard on public.post_comments as restrictive for delete to public using(user_id=(select auth.uid()));

-- Sahiplik/kontrol alanları istemci tarafından INSERT'e veya UPDATE'e eklenemez.
create policy kampusx_posts_new_state_guard on public.posts as restrictive for insert to public
with check(user_id=(select auth.uid()) and archived_at is null and deletion_started_at is null and pin_slot is null and likes_count=0 and comments_count=0);
create policy kampusx_posts_no_direct_update on public.posts as restrictive for update to public using(false) with check(false);

create function public.kampusx_post_state(p_post_id uuid) returns jsonb
language sql security invoker set search_path = '' as $$
  select jsonb_build_object('id',p.id,'likes_count',p.likes_count,'comments_count',p.comments_count,
    'pin_slot',p.pin_slot,'archived_at',p.archived_at,'deletion_started_at',p.deletion_started_at,
    'liked',exists(select 1 from public.post_likes l where l.post_id=p.id and l.user_id=auth.uid()),
    'bookmarked',exists(select 1 from public.post_bookmarks b where b.post_id=p.id and b.user_id=auth.uid()))
  from public.posts p where p.id=p_post_id
$$;
create function public.kampusx_set_reaction(p_post_id uuid,p_kind text,p_enabled boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_enabled is null or p_kind not in ('like','bookmark') or p_kind is null
    or not exists(select 1 from public.posts where id=p_post_id and archived_at is null and deletion_started_at is null) then
    raise exception using errcode='42501',message='post_unavailable';
  end if;
  if p_kind='like' then
    if p_enabled then insert into public.post_likes(post_id,user_id) values(p_post_id,auth.uid()) on conflict do nothing;
    else delete from public.post_likes where post_id=p_post_id and user_id=auth.uid(); end if;
  else
    if p_enabled then insert into public.post_bookmarks(post_id,user_id) values(p_post_id,auth.uid()) on conflict do nothing;
    else delete from public.post_bookmarks where post_id=p_post_id and user_id=auth.uid(); end if;
  end if;
  return public.kampusx_post_state(p_post_id);
end $$;
create function public.kampusx_report_post(p_post_id uuid,p_reason text) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.post_reports(post_id,user_id,reason) values(p_post_id,auth.uid(),p_reason) on conflict do nothing;
  return found;
end $$;
create function public.kampusx_add_comment(p_id uuid,p_post_id uuid,p_parent_id uuid,p_content text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare c public.post_comments;
begin
  insert into public.post_comments(id,post_id,user_id,parent_id,content)
    values(p_id,p_post_id,auth.uid(),p_parent_id,p_content) on conflict(id) do nothing;
  select * into c from public.post_comments where id=p_id and post_id=p_post_id and user_id=auth.uid()
    and parent_id is not distinct from p_parent_id and content=p_content;
  if not found then raise exception using errcode='42501',message='comment_unavailable'; end if;
  return to_jsonb(c);
end $$;

create function public.kampusx_pin_post(p_post_id uuid,p_pinned boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid:=auth.uid(); slot smallint; p public.posts;
begin
  if owner_id is null or p_pinned is null then raise exception using errcode='42501',message='post_unavailable'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,78233));
  select * into p from public.posts where id=p_post_id and user_id=owner_id for update;
  if not found or p.deletion_started_at is not null or p.archived_at is not null then
    raise exception using errcode='42501',message='post_unavailable';
  end if;
  if p_pinned then
    if p.pin_slot is not null then return jsonb_build_object('pin_slot',p.pin_slot); end if;
    select s::smallint into slot from generate_series(1,3) s where not exists
      (select 1 from public.posts where user_id=owner_id and pin_slot=s) order by s limit 1;
    if slot is null then raise exception using errcode='P0001',message='pin_limit'; end if;
  end if;
  update public.posts set pin_slot=slot where id=p_post_id;
  return jsonb_build_object('pin_slot',slot);
end $$;
create function public.kampusx_archive_post(p_post_id uuid,p_archived boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.posts;
begin
  select * into p from public.posts where id=p_post_id and user_id=auth.uid() for update;
  if not found or p_archived is null or p.deletion_started_at is not null then
    raise exception using errcode='42501',message='post_unavailable';
  end if;
  update public.posts set archived_at=case when p_archived then coalesce(archived_at,now()) end,
    pin_slot=case when p_archived then null else pin_slot end where id=p_post_id returning * into p;
  return jsonb_build_object('archived_at',p.archived_at,'pin_slot',p.pin_slot);
end $$;

create function public.kampusx_begin_post_delete(p_post_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.posts; path text;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='post_unavailable'; end if;
  select * into p from public.posts where id=p_post_id for update;
  if not found then return jsonb_build_object('missing',true); end if;
  if p.user_id is distinct from auth.uid() then raise exception using errcode='42501',message='post_unavailable'; end if;
  path:=kampusx_security.media_path(p.user_id,p.media_url);
  if path is not null then perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(path,78232)); end if;
  update public.posts set deletion_started_at=coalesce(deletion_started_at,now()),pin_slot=null where id=p.id;
  return jsonb_build_object('post_id',p.id,'user_id',p.user_id,'media_path',path,'missing',false);
end $$;
create function kampusx_security.can_remove_media(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.posts p where p.user_id=auth.uid()
    and p.deletion_started_at is not null and p.media_url=
      'https://djhezivksrvcyqxzpiau.supabase.co/storage/v1/object/public/uploads/' || path
    and path ~ ('^' || auth.uid()::text || '/post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp|mp4|webm)$'))
$$;
create function kampusx_security.can_finish_delete(post uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare p public.posts; path text;
begin
  select * into p from public.posts where id=post and user_id=auth.uid() and deletion_started_at is not null;
  if not found then return false; end if;
  path:=kampusx_security.media_path(p.user_id,p.media_url);
  return path is null or not exists(select 1 from storage.objects where bucket_id='uploads' and name=path);
end $$;
create policy kampusx_posts_delete_own on public.posts for delete to authenticated
using(user_id=(select auth.uid()) and kampusx_security.can_finish_delete(id));
create policy kampusx_posts_delete_guard on public.posts as restrictive for delete to public
using(user_id=(select auth.uid()) and kampusx_security.can_finish_delete(id));

-- 11 dosyasındaki DELETE yasağı bu dar iş akışına açılır. Avatar/kapak ve başka
-- kullanıcının post dosyası silinemez. Diğer bucket'ların politikaları korunur.
drop policy if exists kampusx_uploads_guard_delete on storage.objects;
create policy kampusx_uploads_guard_delete on storage.objects as restrictive for delete to public
using(bucket_id <> 'uploads' or kampusx_security.can_remove_media(name));
create policy kampusx_remove_pending_post_media on storage.objects for delete to authenticated
using(bucket_id='uploads' and kampusx_security.can_remove_media(name));

-- Public URL okuması önceki gibi kalır. Listeleme/silme metadata erişimi yalnızca
-- oturum sahibinin klasörüne açıktır; public dosya indirmesi bu metadata kuralından ayrıdır.
-- 11 henüz uygulanmadıysa da eski geniş INSERT/UPDATE policy'leri korumayı delemez.
update storage.buckets set file_size_limit=least(coalesce(file_size_limit,52428800),52428800),
  allowed_mime_types=array['image/jpeg','image/png','image/webp','video/mp4','video/webm'] where id='uploads';
drop policy if exists kampusx_uploads_guard_insert on storage.objects;
create policy kampusx_uploads_guard_insert on storage.objects as restrictive for insert to public
with check(bucket_id <> 'uploads' or ((select auth.uid()) is not null and name ~
  ('^' || (select auth.uid())::text || '/(avatar/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)'
  || '|banner/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)'
  || '|post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp|mp4|webm))$')));
drop policy if exists kampusx_uploads_insert_own on storage.objects;
create policy kampusx_uploads_insert_own on storage.objects for insert to authenticated
with check(bucket_id='uploads' and split_part(name,'/',1)=(select auth.uid())::text);
drop policy if exists kampusx_uploads_guard_update on storage.objects;
create policy kampusx_uploads_guard_update on storage.objects as restrictive for update to public
using(bucket_id <> 'uploads') with check(bucket_id <> 'uploads');
drop policy if exists kampusx_uploads_guard_select on storage.objects;
create policy kampusx_uploads_guard_select on storage.objects as restrictive for select to public
using(bucket_id <> 'uploads' or ((select auth.uid()) is not null
  and split_part(name,'/',1)=(select auth.uid())::text));
drop policy if exists kampusx_uploads_select_own on storage.objects;
create policy kampusx_uploads_select_own on storage.objects for select to authenticated
using(bucket_id='uploads' and split_part(name,'/',1)=(select auth.uid())::text);

create function public.kampusx_finish_post_delete(p_post_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode='42501',message='post_unavailable'; end if;
  if exists(select 1 from public.posts where id=p_post_id) then
    if not kampusx_security.can_finish_delete(p_post_id) then
      raise exception using errcode='42501',message='media_cleanup_required';
    end if;
    delete from public.posts where id=p_post_id and user_id=auth.uid();
    if not found then raise exception using errcode='42501',message='post_unavailable'; end if;
  end if;
end $$;

-- PostgreSQL yeni fonksiyonlara PUBLIC EXECUTE verebilir; tüm yeni API'ler açıkça daraltılır.
revoke all on all functions in schema kampusx_security from public,anon,authenticated;
grant execute on function kampusx_security.view_person(uuid),kampusx_security.view_post(uuid,boolean),
  kampusx_security.comment_visible(uuid,uuid),kampusx_security.can_remove_media(text),
  kampusx_security.can_finish_delete(uuid) to authenticated;
-- RLS ifadeleri planlanırken başka bucket'ların anonim işlemleri de yardımcı ACL'lerini
-- denetleyebilir. Bu yardımcı NULL auth.uid() için yalnızca false döndürür;
-- anon'a şema USAGE veya tablo okuma yetkisi verilmez, uploads anonim erişime açılmaz.
grant execute on function kampusx_security.can_remove_media(text) to anon;
do $$ declare f regprocedure; begin
  for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in
    ('kampusx_post_state','kampusx_set_reaction','kampusx_report_post','kampusx_add_comment','kampusx_pin_post','kampusx_archive_post','kampusx_begin_post_delete','kampusx_finish_post_delete') loop
    execute format('revoke all on function %s from public,anon,authenticated',f);
    execute format('grant execute on function %s to authenticated',f);
  end loop;
end $$;
commit;

select schemaname,tablename,policyname,permissive,cmd from pg_policies
where policyname like 'kampusx_%' and schemaname in ('public','storage') order by tablename,policyname;

select id as bucket, public as is_public, file_size_limit from storage.buckets where id='uploads';
