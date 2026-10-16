-- Supabase SQL Editor > New query > tamamını yapıştır > Run.
-- Kullanıcının onayıyla yalnızca takip ilişkisi tablosunu ve erişim/Realtime kurallarını ekler.
-- Mevcut profiles, posts, Storage, Auth tablolarını veya satırlarını değiştirmez.
begin;

-- Beklenmeyen mevcut tabloyu sessizce değiştirmek yerine işlemi durdurur.
do $$ begin
  if to_regclass('public.user_follows') is not null then
    raise exception 'user_follows zaten var. Bu kurulum yalnızca bir kez çalıştırılır; mevcut tablo değiştirilmedi.';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'realtime' and c.relname = 'messages' and c.relrowsecurity) then
    raise exception 'Supabase Realtime messages/RLS bulunamadı; değişiklik yapılmadı.';
  end if;
end $$;

create table public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_no_self check (follower_id <> followed_id)
);
create index user_follows_followed_idx on public.user_follows (followed_id, follower_id);
alter table public.user_follows enable row level security;
revoke all on public.user_follows from public, anon, authenticated;
grant select, delete on public.user_follows to authenticated;
grant insert (follower_id, followed_id) on public.user_follows to authenticated;

create policy kampusx_follows_read_involved on public.user_follows
  for select to authenticated
  using ((select auth.uid()) = follower_id or (select auth.uid()) = followed_id);
create policy kampusx_follows_insert_own on public.user_follows
  for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy kampusx_follows_delete_own on public.user_follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

-- Yalnızca etkilenen iki kullanıcıya boş bir değişiklik bildirimi gönderilir.
-- İlişkiler Postgres Changes yayınına eklenmez; DELETE olayları genel kanala sızmaz.
create function public.kampusx_notify_follow_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare follower uuid; followed uuid;
begin
  if tg_op = 'DELETE' then follower := old.follower_id; followed := old.followed_id;
  else follower := new.follower_id; followed := new.followed_id; end if;
  perform realtime.send('{}'::jsonb, 'changed', 'kampusx:follows:' || follower::text, true);
  perform realtime.send('{}'::jsonb, 'changed', 'kampusx:follows:' || followed::text, true);
  return null;
end $$;
revoke all on function public.kampusx_notify_follow_change() from public, anon, authenticated;
create trigger kampusx_follow_changed after insert or delete on public.user_follows
  for each row execute function public.kampusx_notify_follow_change();

create policy kampusx_follows_receive on realtime.messages
  for select to authenticated
  using (extension = 'broadcast' and (select realtime.topic()) = 'kampusx:follows:' || (select auth.uid())::text);
-- Diğer uygulama kanallarının kuralları korunur. Var olan geniş permissive kurallar
-- bile bu ayrılmış kanal adlarında başka kullanıcıyı veya anonim erişimi açamaz.
create policy kampusx_follows_private_guard on realtime.messages
  as restrictive for select to public
  using ((select realtime.topic()) not like 'kampusx:follows:%' or
    (extension = 'broadcast' and (select realtime.topic()) = 'kampusx:follows:' || (select auth.uid())::text));
create policy kampusx_follows_no_client_broadcast on realtime.messages
  as restrictive for insert to public
  with check ((select realtime.topic()) not like 'kampusx:follows:%');

commit;

select tablename, policyname, roles, cmd from pg_policies
where (schemaname = 'public' and tablename = 'user_follows')
   or (schemaname = 'realtime' and policyname like 'kampusx_follows_%')
order by tablename, policyname;
