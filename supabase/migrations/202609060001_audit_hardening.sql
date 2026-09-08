-- Apply to staging first. Transaction fails if legacy ownership cannot be mapped.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create schema if not exists extensions;


alter table public.songs add column if not exists owner_id uuid references auth.users(id);
alter table public.setlists add column if not exists owner_id uuid references auth.users(id);
alter table public.setlist_members add column if not exists user_id uuid references auth.users(id);
alter table public.setlist_items add column if not exists performance_notes text;
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.user_subscriptions add column if not exists stripe_event_created bigint not null default 0;

update public.songs s set owner_id = u.id from auth.users u where s.owner_id is null and lower(s.created_by) = lower(u.email);
update public.setlists s set owner_id = u.id from auth.users u where s.owner_id is null and lower(s.created_by) = lower(u.email);
update public.setlist_members m set user_id = u.id from auth.users u where m.user_id is null and lower(m.member_email) = lower(u.email);
do $$ begin
  if exists(select 1 from public.songs where owner_id is null) or exists(select 1 from public.setlists where owner_id is null)
    or exists(select 1 from public.setlist_members where user_id is null) then
    raise exception 'Unmapped legacy emails. Resolve ownership before applying this migration.';
  end if;
end $$;
alter table public.songs alter column owner_id set not null;
alter table public.setlists alter column owner_id set not null;
alter table public.setlist_members alter column user_id set not null;
create index if not exists songs_owner_id_idx on public.songs(owner_id);
create index if not exists setlists_owner_id_idx on public.setlists(owner_id);
create unique index if not exists setlist_member_user_idx on public.setlist_members(setlist_id,user_id);
create index if not exists setlist_members_user_idx on public.setlist_members(user_id);
create index if not exists setlist_items_order_idx on public.setlist_items(setlist_id,order_index);
create index if not exists setlist_items_song_idx on public.setlist_items(song_id);
create unique index if not exists subscription_stripe_id_idx on public.user_subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;
create unique index if not exists subscription_stripe_customer_idx on public.user_subscriptions(stripe_customer_id) where stripe_customer_id is not null;

-- Definer helpers avoid RLS cycles between songs, items, members and setlists.
create or replace function private.paid(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_subscriptions where user_id = p_user and plan_type in ('base','pro'));
$$;
create or replace function private.owns_setlist(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.setlists where id=p_id and owner_id=auth.uid());
$$;
create or replace function private.reads_setlist(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.owns_setlist(p_id) or exists(select 1 from public.setlist_members where setlist_id=p_id and user_id=auth.uid());
$$;
create or replace function private.edits_setlist(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.owns_setlist(p_id) or (private.paid(auth.uid()) and private.reads_setlist(p_id));
$$;
create or replace function private.reads_song(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.songs where id=p_id and owner_id=auth.uid())
    or exists(select 1 from public.setlist_items where song_id=p_id and private.reads_setlist(setlist_id));
$$;
revoke all on function private.paid(uuid), private.owns_setlist(uuid), private.reads_setlist(uuid), private.edits_setlist(uuid), private.reads_song(uuid) from public;
grant execute on function private.paid(uuid), private.owns_setlist(uuid), private.reads_setlist(uuid), private.edits_setlist(uuid), private.reads_song(uuid) to authenticated;

-- Remove ALL old policies, including permissive policies not listed in the supplied export.
do $$ declare p record; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname='public'
    and tablename in ('profiles','user_subscriptions','songs','setlists','setlist_items','setlist_members') loop
    execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_items enable row level security;
alter table public.setlist_members enable row level security;
revoke all on public.profiles, public.user_subscriptions, public.songs, public.setlists, public.setlist_items, public.setlist_members from anon, authenticated;
grant select on public.profiles, public.user_subscriptions, public.setlist_members to authenticated;
grant update(full_name,accepted_terms_version,updated_at) on public.profiles to authenticated;
grant select,insert,update,delete on public.songs, public.setlists, public.setlist_items to authenticated;
grant delete on public.setlist_members to authenticated;
grant all on public.profiles, public.user_subscriptions, public.songs, public.setlists, public.setlist_items, public.setlist_members to service_role;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid());
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy subscription_read on public.user_subscriptions for select to authenticated using(user_id=auth.uid());
create policy songs_read on public.songs for select to authenticated using(owner_id=auth.uid() or private.reads_song(id));
create policy songs_insert on public.songs for insert to authenticated with check(owner_id=auth.uid());
create policy songs_update on public.songs for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy songs_delete on public.songs for delete to authenticated using(owner_id=auth.uid());
create policy setlists_read on public.setlists for select to authenticated using(owner_id=auth.uid() or private.reads_setlist(id));
create policy setlists_insert on public.setlists for insert to authenticated with check(owner_id=auth.uid());
create policy setlists_update on public.setlists for update to authenticated using(private.edits_setlist(id)) with check(private.edits_setlist(id));
create policy setlists_delete on public.setlists for delete to authenticated using(owner_id=auth.uid());
create policy items_read on public.setlist_items for select to authenticated using(private.reads_setlist(setlist_id));
create policy items_insert on public.setlist_items for insert to authenticated with check(private.edits_setlist(setlist_id) and (song_id is null or private.reads_song(song_id)));
create policy items_update on public.setlist_items for update to authenticated using(private.edits_setlist(setlist_id)) with check(private.edits_setlist(setlist_id) and (song_id is null or private.reads_song(song_id)));
create policy items_delete on public.setlist_items for delete to authenticated using(private.edits_setlist(setlist_id));
create policy members_read on public.setlist_members for select to authenticated using(user_id=auth.uid() or private.owns_setlist(setlist_id));
create policy members_delete on public.setlist_members for delete to authenticated using(user_id=auth.uid() or private.owns_setlist(setlist_id));

create or replace function private.content_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare total bigint;
begin
  if tg_op='UPDATE' then
    if new.owner_id is distinct from old.owner_id then raise exception 'Ownership cannot be changed'; end if;
    new.created_by := old.created_by;
    return new;
  end if;
  new.owner_id := coalesce(new.owner_id,auth.uid());
  if new.owner_id is null then raise exception 'Owner required'; end if;
  select email into new.created_by from auth.users where id=new.owner_id;
  -- Same lock is used for membership acceptance: concurrent requests cannot exceed the quota.
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,0));
  if not private.paid(new.owner_id) then
    if tg_table_name='songs' then
      select count(*) into total from public.songs where owner_id=new.owner_id;
      if total >= 10 then raise exception 'O plano Free permite até 10 músicas.'; end if;
    else
      select (select count(*) from public.setlists where owner_id=new.owner_id)
        + (select count(*) from public.setlist_members m join public.setlists s on s.id=m.setlist_id where m.user_id=new.owner_id and s.owner_id<>new.owner_id) into total;
      if total >= 1 then raise exception 'O plano Free permite participar de 1 repertório.'; end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.content_guard() from public;
create trigger songs_content_guard before insert or update on public.songs for each row execute function private.content_guard();
create trigger setlists_content_guard before insert or update on public.setlists for each row execute function private.content_guard();

create table public.setlist_invites (
  id uuid primary key default gen_random_uuid(), setlist_id uuid not null references public.setlists(id) on delete cascade,
  token_hash text not null unique, created_by uuid not null references auth.users(id),
  expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now()
);
alter table public.setlist_invites enable row level security;
revoke all on public.setlist_invites from anon,authenticated;
grant all on public.setlist_invites to service_role;
create or replace function public.create_setlist_invite(p_setlist_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
  if not private.owns_setlist(p_setlist_id) or not private.paid(auth.uid()) then raise exception 'Somente o dono assinante pode convidar.'; end if;
  perform 1 from public.setlists where id=p_setlist_id for update;
  token := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
  update public.setlist_invites set revoked_at=now() where setlist_id=p_setlist_id and revoked_at is null;
  insert into public.setlist_invites(setlist_id,token_hash,created_by,expires_at)
    values(p_setlist_id,encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid(),now()+interval '7 days');
  return token;
end $$;
create or replace function public.accept_setlist_invite(p_setlist_id uuid,p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); email text; total bigint;
begin
  if caller is null then raise exception 'Faça login para aceitar.'; end if;
  perform 1 from public.setlist_invites where setlist_id=p_setlist_id
    and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and expires_at>now() and revoked_at is null for share;
  if not found then
    raise exception 'Convite inválido ou expirado. Solicite um novo link ao dono.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text,0));
  if private.reads_setlist(p_setlist_id) then return p_setlist_id; end if;
  if not private.paid(caller) then
    select (select count(*) from public.setlists where owner_id=caller)
      + (select count(*) from public.setlist_members m join public.setlists s on s.id=m.setlist_id where m.user_id=caller and s.owner_id<>caller) into total;
    if total >= 1 then raise exception 'O plano Free permite participar de 1 repertório.'; end if;
  end if;
  select u.email into email from auth.users u where u.id=caller;
  insert into public.setlist_members(setlist_id,user_id,member_email) values(p_setlist_id,caller,email) on conflict do nothing;
  return p_setlist_id;
end $$;
create or replace function public.reorder_setlist(p_setlist_id uuid,p_item_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.edits_setlist(p_setlist_id) then raise exception 'Sem permissão para editar.'; end if;
  perform 1 from public.setlists where id=p_setlist_id for update;
  if cardinality(p_item_ids) <> (select count(*) from public.setlist_items where setlist_id=p_setlist_id)
    or cardinality(p_item_ids) <> (select count(distinct x) from unnest(p_item_ids) x)
    or exists(select 1 from unnest(p_item_ids) x where not exists(select 1 from public.setlist_items where id=x and setlist_id=p_setlist_id)) then
    raise exception 'O repertório mudou. Atualize antes de ordenar.';
  end if;
  update public.setlist_items i set order_index=x.ordinality-1 from unnest(p_item_ids) with ordinality x(id,ordinality) where i.id=x.id and i.setlist_id=p_setlist_id;
end $$;
revoke all on function public.create_setlist_invite(uuid),public.accept_setlist_invite(uuid,text),public.reorder_setlist(uuid,uuid[]) from public;
grant execute on function public.create_setlist_invite(uuid),public.accept_setlist_invite(uuid,text),public.reorder_setlist(uuid,uuid[]) to authenticated;

create table public.stripe_webhook_events(id text primary key, created bigint not null, processed_at timestamptz not null default now());
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon,authenticated;
grant all on public.stripe_webhook_events to service_role;
create or replace function public.apply_stripe_subscription(p_event_id text,p_created bigint,p_user_id uuid,p_customer text,p_subscription text,p_plan text,p_status text,p_period_end timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_plan not in ('free','base','pro') then raise exception 'Unknown plan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
  if exists(select 1 from public.stripe_webhook_events where id=p_event_id) then return; end if;
  insert into public.user_subscriptions(user_id,stripe_customer_id,stripe_subscription_id,plan_type,status,current_period_end,stripe_event_created,updated_at)
    values(p_user_id,p_customer,p_subscription,p_plan,p_status,p_period_end,p_created,now())
    on conflict(user_id) do update set stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,
      plan_type=excluded.plan_type,status=excluded.status,current_period_end=excluded.current_period_end,stripe_event_created=excluded.stripe_event_created,updated_at=now()
    where public.user_subscriptions.stripe_event_created <= excluded.stripe_event_created;
  insert into public.stripe_webhook_events(id,created) values(p_event_id,p_created);
end $$;
revoke all on function public.apply_stripe_subscription(text,bigint,uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_stripe_subscription(text,bigint,uuid,text,text,text,text,timestamptz) to service_role;

-- One checkout attempt per account, shared across devices and plans.
create table public.billing_checkout_attempts (
  user_id uuid primary key references auth.users(id), request_id uuid not null default gen_random_uuid(),
  plan text not null check(plan in ('base','pro')), expires_at timestamptz not null,
  session_id text, session_url text
);
alter table public.billing_checkout_attempts enable row level security;
revoke all on public.billing_checkout_attempts from anon,authenticated;
grant all on public.billing_checkout_attempts to service_role;
create or replace function public.claim_checkout(p_user_id uuid,p_plan text)
returns public.billing_checkout_attempts language plpgsql security definer set search_path='' as $$
declare attempt public.billing_checkout_attempts;
begin
  if p_plan not in ('base','pro') then raise exception 'Invalid plan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,2));
  select * into attempt from public.billing_checkout_attempts where user_id=p_user_id;
  if attempt.expires_at>now() then
    if attempt.plan<>p_plan then raise exception 'Já existe um checkout aberto para outro plano. Conclua-o ou aguarde sua expiração.'; end if;
    return attempt;
  end if;
  insert into public.billing_checkout_attempts(user_id,plan,expires_at) values(p_user_id,p_plan,now()+interval '35 minutes')
    on conflict(user_id) do update set request_id=gen_random_uuid(),plan=excluded.plan,expires_at=excluded.expires_at,session_id=null,session_url=null
    returning * into attempt;
  return attempt;
end $$;
revoke all on function public.claim_checkout(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_checkout(uuid,text) to service_role;
commit;
