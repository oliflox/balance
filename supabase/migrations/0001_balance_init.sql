-- Balance — weight-loss competition app schema.
-- Tables are prefixed `balance_` to coexist with other apps in the same project.

create table if not exists public.balance_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users(id) on delete cascade,
  name         text not null,
  color        text not null default '#C8FF3D',
  start_weight numeric(5,1) not null,
  target       numeric(5,1) not null,
  roast        text default '',
  trophy_icon  text default '',
  trophy_title text default '',
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.balance_entries (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.balance_profiles(id) on delete cascade,
  week       int not null,
  date       date not null,
  weight     numeric(5,1) not null,
  taille     numeric(5,1),
  hanches    numeric(5,1),
  poitrine   numeric(5,1),
  bras       numeric(5,1),
  cuisse     numeric(5,1),
  mg         numeric(5,1),
  note       text default '',
  created_at timestamptz not null default now(),
  unique (profile_id, week)
);

create table if not exists public.balance_reactions (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.balance_entries(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (entry_id, user_id, emoji)
);

create index if not exists balance_entries_profile_idx on public.balance_entries(profile_id);
create index if not exists balance_reactions_entry_idx on public.balance_reactions(entry_id);

alter table public.balance_profiles  enable row level security;
alter table public.balance_entries   enable row level security;
alter table public.balance_reactions enable row level security;

-- Table privileges. RLS (below) still filters rows on top of these grants.
-- Only the `authenticated` role touches the tables directly; anon uses the SECURITY
-- DEFINER function only, so it needs no table grants.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.balance_profiles  to authenticated;
grant select, insert, update, delete on public.balance_entries   to authenticated;
grant select, insert, delete         on public.balance_reactions to authenticated;

-- Profiles: every signed-in member sees all competitors; you manage only your own row.
create policy "balance_profiles_select" on public.balance_profiles
  for select to authenticated using (true);
create policy "balance_profiles_insert" on public.balance_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "balance_profiles_update" on public.balance_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "balance_profiles_delete" on public.balance_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- Entries: everyone signed in can read; you write only entries on your own profile.
create policy "balance_entries_select" on public.balance_entries
  for select to authenticated using (true);
create policy "balance_entries_insert" on public.balance_entries
  for insert to authenticated with check (
    exists (select 1 from public.balance_profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
create policy "balance_entries_update" on public.balance_entries
  for update to authenticated using (
    exists (select 1 from public.balance_profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.balance_profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
create policy "balance_entries_delete" on public.balance_entries
  for delete to authenticated using (
    exists (select 1 from public.balance_profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

-- Reactions: everyone signed in can read; you toggle only your own.
create policy "balance_reactions_select" on public.balance_reactions
  for select to authenticated using (true);
create policy "balance_reactions_insert" on public.balance_reactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "balance_reactions_delete" on public.balance_reactions
  for delete to authenticated using (auth.uid() = user_id);

-- Aggregate stats for the pre-login landing hero, without exposing any personal data.
create or replace function public.balance_public_stats()
returns table(total_lost numeric, member_count int, week_no int)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(round(sum(diff.lost)::numeric, 1), 0) as total_lost,
    (select count(*) from public.balance_profiles)::int as member_count,
    coalesce((select max(week) from public.balance_entries) + 1, 0)::int as week_no
  from (
    select p.start_weight - le.weight as lost
    from public.balance_profiles p
    join lateral (
      select weight from public.balance_entries e
      where e.profile_id = p.id order by week desc limit 1
    ) le on true
  ) diff;
$$;

grant execute on function public.balance_public_stats() to anon, authenticated;
