-- Support mail bookkeeping only. No description, email address or username is stored here.
-- Run the WHOLE file on djhezivksrvcyqxzpiau. Existing social/Auth/Storage data is not changed.
begin;
set local lock_timeout='5s';
create schema if not exists private;
do $guard$
begin
 if to_regclass('private.support_dispatches') is not null
   and coalesce(obj_description(to_regclass('private.support_dispatches'),'pg_class'),'')
      <> 'KampusX support dispatch 2026102201' then
   raise exception 'Unexpected support dispatch table; inspect before proceeding';
 end if;
end $guard$;
create table if not exists private.support_dispatches(
 request_id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 fingerprint text not null check(fingerprint ~ '^[0-9a-f]{64}$'),
 state text not null default 'processing' check(state in('processing','sent','uncertain','rejected')),
 created_at timestamptz not null default clock_timestamp(),
 lease_until timestamptz not null,
 attempts integer not null default 1 check(attempts between 1 and 3)
);
comment on table private.support_dispatches is 'KampusX support dispatch 2026102201';
create index if not exists kx_support_dispatch_user_time on private.support_dispatches(user_id,created_at desc);
create index if not exists kx_support_dispatch_time on private.support_dispatches(created_at desc);
alter table private.support_dispatches enable row level security;
revoke all on private.support_dispatches from public,anon,authenticated,service_role;

create or replace function public.kx_support_reserve(p_actor uuid,p_request uuid,p_fingerprint text)
returns jsonb language plpgsql security definer set search_path=public as $fn$
declare existing private.support_dispatches%rowtype; current_time_at timestamptz:=clock_timestamp();
begin
 if p_actor is null or p_request is null or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then
  raise exception using errcode='22023',message='support_invalid_request';
 end if;
 -- A single short database lock makes limits durable across concurrent Edge workers.
 perform pg_advisory_xact_lock(hashtextextended('kampusx:support:dispatch',0));
 select * into existing from private.support_dispatches where request_id=p_request;
 if found then
  if existing.user_id<>p_actor or existing.fingerprint<>p_fingerprint then
   return jsonb_build_object('decision','conflict');
  end if;
  if existing.state='sent' then return jsonb_build_object('decision','sent'); end if;
  if existing.created_at<current_time_at-interval '23 hours' then return jsonb_build_object('decision','expired'); end if;
  if existing.state='rejected' then return jsonb_build_object('decision','rejected'); end if;
  if existing.lease_until>current_time_at then return jsonb_build_object('decision','busy','retry_after',90); end if;
  if existing.attempts>=3 then return jsonb_build_object('decision','locked'); end if;
  update private.support_dispatches set state='processing',lease_until=current_time_at+interval '90 seconds',attempts=attempts+1
   where request_id=p_request;
  return jsonb_build_object('decision','reserved');
 end if;
 if (select count(*) from private.support_dispatches where created_at>current_time_at-interval '24 hours')>=100 then
  return jsonb_build_object('decision','rate_limited','retry_after',3600);
 end if;
 if exists(select 1 from private.support_dispatches where user_id=p_actor and created_at>current_time_at-interval '1 minute') then
  return jsonb_build_object('decision','rate_limited','retry_after',60);
 end if;
 if (select count(*) from private.support_dispatches where user_id=p_actor and created_at>current_time_at-interval '1 hour')>=3 then
  return jsonb_build_object('decision','rate_limited','retry_after',3600);
 end if;
 if (select count(*) from private.support_dispatches where user_id=p_actor and created_at>current_time_at-interval '24 hours')>=5 then
  return jsonb_build_object('decision','rate_limited','retry_after',86400);
 end if;
 insert into private.support_dispatches(request_id,user_id,fingerprint,lease_until)
 values(p_request,p_actor,p_fingerprint,current_time_at+interval '90 seconds');
 return jsonb_build_object('decision','reserved');
end $fn$;

create or replace function public.kx_support_finish(p_actor uuid,p_request uuid,p_fingerprint text,p_outcome text)
returns boolean language plpgsql security definer set search_path=public as $fn$
begin
 if p_outcome is null or p_outcome not in('sent','uncertain','rejected') then
  raise exception using errcode='22023',message='support_invalid_outcome';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('kampusx:support:dispatch',0));
 update private.support_dispatches set state=p_outcome,lease_until=clock_timestamp()
 where request_id=p_request and user_id=p_actor and fingerprint=p_fingerprint and state<>'sent';
 return found;
end $fn$;

create or replace function public.kx_support_status(p_actor uuid,p_request uuid)
returns jsonb language sql stable security definer set search_path=public as $fn$
 select coalesce((select jsonb_build_object('status',case
  when s.state='sent' then 'sent'
  when s.state='rejected' then 'rejected'
  when s.created_at<now()-interval '23 hours' or s.attempts>=3 and s.lease_until<=now() then 'expired'
  when s.lease_until>now() then 'pending'
  else 'retryable' end,'retry_after',greatest(0,ceil(extract(epoch from s.lease_until-now())))::int)
  from private.support_dispatches s where s.request_id=p_request and s.user_id=p_actor),jsonb_build_object('status','unknown'));
$fn$;
revoke all on function public.kx_support_reserve(uuid,uuid,text),public.kx_support_finish(uuid,uuid,text,text),public.kx_support_status(uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.kx_support_reserve(uuid,uuid,text),public.kx_support_finish(uuid,uuid,text,text),public.kx_support_status(uuid,uuid)
 to service_role;
create or replace function public.kx_support_contract_version() returns text language sql immutable set search_path=public
 as $fn$ select '2026102201'::text; $fn$;
revoke all on function public.kx_support_contract_version() from public,anon;
grant execute on function public.kx_support_contract_version() to authenticated,service_role;
notify pgrst,'reload schema';
commit;
select public.kx_support_contract_version() as support_contract_version;
