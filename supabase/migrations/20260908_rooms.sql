-- Passage en « rooms » : chaque ligue est privée, on n'y entre que sur invitation.
--
-- Un utilisateur = un profil = une room (une seule pour l'instant). Le profil EST
-- l'appartenance : pas de table de membres à tenir synchronisée. On rejoint une
-- room en connaissant son code d'invitation, et la RLS fait le cloisonnement —
-- l'appli continue de faire `select *`, la base ne lui rend que sa propre room.
--
-- À exécuter une fois dans Supabase → SQL Editor, APRÈS 20260908_one_weigh_in_per_week.sql.
-- ⚠ Ce script remplace TOUTES les policies des tables balance_*.

-- ------------------------------------------- 0. Date d'arrivée de chaque membre
-- Le nombre de pesées dues se compte depuis l'inscription. La colonne peut ne pas
-- exister ; on la crée en la remplissant avec la première pesée du membre, sans
-- quoi tous les anciens passeraient pour des arrivants du jour.
alter table balance_profiles add column if not exists created_at timestamptz;
update balance_profiles p
   set created_at = coalesce((select min(e.date)::timestamptz from balance_entries e where e.profile_id = p.id), now())
 where created_at is null;
alter table balance_profiles alter column created_at set default now();
alter table balance_profiles alter column created_at set not null;

-- ---------------------------------------------------------------- 1. Les rooms
-- Code d'invitation : court, lisible à l'oral, sans I/O/0/1 pour éviter les
-- « c'est un i ou un L ? ». Une fonction, car un DEFAULT n'accepte pas de sous-requête.
create or replace function balance_room_code() returns text
  language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '')
    from generate_series(1, 6);
$$;

create table if not exists balance_rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- Unique : c'est la seule clé d'entrée dans la room.
  code       text not null unique default balance_room_code(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table balance_profiles add column if not exists room_id uuid references balance_rooms(id) on delete cascade;

-- Un seul profil par personne, donc une seule room.
create unique index if not exists balance_profiles_one_per_user on balance_profiles(user_id) where user_id is not null;
create index if not exists balance_profiles_room on balance_profiles(room_id);

-- ------------------------------------------------- 2. Reloger les membres actuels
-- La ligue existante devient UNE room, et tous les profils déjà en base y sont
-- déplacés d'un bloc : personne n'a de code à saisir, tes potes sont dedans au
-- moment où le script se termine. Aucune pesée, réaction ou profil n'est supprimé.
do $$
declare
  -- ⚠ À RENSEIGNER : l'email du compte qui doit posséder la room.
  --    Laissé à null, c'est le membre le plus ancien qui est désigné — autant
  --    dire au hasard. Mets le tien.
  v_owner_email text := 'floriancollard77@gmail.com';
  -- Le nom affiché de la room. Changeable ensuite directement en base.
  v_room_name   text := 'La ligue de la semaine';
  v_owner uuid;
  v_room  uuid;
begin
  if not exists (select 1 from balance_profiles where room_id is null) then
    return; -- déjà relogés, le script a déjà tourné
  end if;

  if v_owner_email is not null then
    select id into v_owner from auth.users where lower(email) = lower(v_owner_email);
    if v_owner is null then
      raise exception 'Aucun compte avec l''email %. Corrige v_owner_email.', v_owner_email;
    end if;
  else
    select user_id into v_owner from balance_profiles
     where user_id is not null order by created_at limit 1;
    if v_owner is null then
      raise exception 'Aucun profil rattaché à un compte : renseigne v_owner_email.';
    end if;
  end if;

  insert into balance_rooms (name, owner_id) values (v_room_name, v_owner) returning id into v_room;
  update balance_profiles set room_id = v_room where room_id is null;

  raise notice 'Room % créée, % profils déplacés dedans.',
    v_room, (select count(*) from balance_profiles where room_id = v_room);
end $$;

alter table balance_profiles alter column room_id set not null;

-- --------------------------------------------------------- 3. Qui voit quoi
-- security definer : ces fonctions doivent lire balance_profiles sans repasser
-- par les policies qui, elles, s'appuient dessus.
create or replace function balance_my_room() returns uuid
  language sql stable security definer set search_path = public as $$
  select room_id from balance_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function balance_my_room_profiles() returns setof uuid
  language sql stable security definer set search_path = public as $$
  select id from balance_profiles where room_id = balance_my_room();
$$;

-- Le seul moyen de trouver une room dont on n'est pas membre : en connaître le code.
create or replace function balance_room_by_code(p_code text)
  returns table (id uuid, name text)
  language sql stable security definer set search_path = public as $$
  select r.id, r.name from balance_rooms r where upper(trim(p_code)) = r.code;
$$;

revoke all on function balance_room_by_code(text) from public, anon;
grant execute on function balance_room_by_code(text) to authenticated;

-- ------------------------------------------------------------- 4. Les policies
-- On repart de zéro : les anciennes règles ouvraient la ligue à tout compte connecté.
do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
            where schemaname = 'public'
              and tablename in ('balance_rooms', 'balance_profiles', 'balance_entries', 'balance_reactions')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table balance_rooms      enable row level security;
alter table balance_profiles   enable row level security;
alter table balance_entries    enable row level security;
alter table balance_reactions  enable row level security;

-- Rooms : la sienne, ou celle qu'on vient de créer et qu'on n'a pas encore rejointe.
create policy rooms_read   on balance_rooms   for select to authenticated
  using (id = balance_my_room() or owner_id = auth.uid());
create policy rooms_create on balance_rooms   for insert to authenticated
  with check (owner_id = auth.uid());

-- Profils : ceux de sa room. On ne crée et ne modifie que le sien.
create policy profiles_read   on balance_profiles for select to authenticated
  using (room_id = balance_my_room());
create policy profiles_create on balance_profiles for insert to authenticated
  with check (user_id = auth.uid());
create policy profiles_update on balance_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pesées : celles de sa room. On ne publie que les siennes.
create policy entries_read   on balance_entries for select to authenticated
  using (profile_id in (select balance_my_room_profiles()));
create policy entries_create on balance_entries for insert to authenticated
  with check (profile_id in (select id from balance_profiles where user_id = auth.uid()));

-- Réactions : sur les pesées de sa room, et on ne retire que les siennes.
create policy reactions_read   on balance_reactions for select to authenticated
  using (entry_id in (select id from balance_entries where profile_id in (select balance_my_room_profiles())));
create policy reactions_create on balance_reactions for insert to authenticated
  with check (user_id = auth.uid()
    and entry_id in (select id from balance_entries where profile_id in (select balance_my_room_profiles())));
create policy reactions_delete on balance_reactions for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------ 5. Les privilèges
-- Les policies filtrent des LIGNES ; encore faut-il avoir le droit d'ouvrir la
-- table. `balance_rooms` est neuve et n'a hérité d'aucun grant, d'où un 401
-- « permission denied » avant même que la RLS ait son mot à dire. On l'écrit
-- explicitement pour les quatre tables plutôt que de compter sur les privilèges
-- par défaut du schéma. Rien pour `anon` : un visiteur non connecté n'a accès
-- qu'à la fonction de statistiques.
grant select, insert                 on balance_rooms     to authenticated;
grant select, insert, update         on balance_profiles  to authenticated;
grant select, insert                 on balance_entries   to authenticated;
grant select, insert, delete         on balance_reactions to authenticated;

-- ------------------------------------------- 6. Garder l'accueil public vivant
-- Les policies ci-dessus ne parlent qu'à `authenticated`. Un visiteur non connecté
-- n'a donc plus le droit de lire quoi que ce soit — ce qui est voulu, sauf pour les
-- compteurs de la page d'accueil. On les fait passer par la fonction, en definer,
-- plutôt que d'ouvrir les tables.
-- Enveloppé : si la fonction porte un autre nom chez toi, on ne veut pas que ça
-- fasse échouer (et annuler) tout le reste de la migration.
do $$
begin
  alter function balance_public_stats() security definer;
  grant execute on function balance_public_stats() to anon, authenticated;
exception when undefined_function then
  raise notice 'balance_public_stats() introuvable : les compteurs de la page d''accueil resteront à zéro.';
end $$;
