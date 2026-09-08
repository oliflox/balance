-- Retirer un membre d'une room, réservé au propriétaire.
--
-- L'autorisation vit ici et nulle part ailleurs : le bouton n'apparaît que pour
-- le propriétaire, mais c'est cette fonction qui refuse l'appel de quelqu'un
-- d'autre. Une policy DELETE ne suffirait pas — il faut aussi archiver avant de
-- supprimer, et ça ne se confie pas au navigateur.
--
-- À exécuter dans Supabase → SQL Editor, après 20260908_rooms.sql.

-- Le filet : un membre retiré part ici avec toutes ses pesées, en JSON, plutôt
-- que de s'évaporer sur un clic de trop. Aucune policy = invisible depuis l'API,
-- lisible seulement depuis le SQL Editor.
create table if not exists balance_membres_retires (
  id          bigint generated always as identity primary key,
  profile_id  uuid        not null,
  room_id     uuid        not null,
  name        text        not null,
  retired_at  timestamptz not null default now(),
  retired_by  uuid,
  profil      jsonb       not null,
  pesees      jsonb       not null
);
alter table balance_membres_retires enable row level security;

create or replace function balance_remove_member(p_profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_room    uuid;
  v_owner   uuid;
  v_user    uuid;
  v_pesees  int;
begin
  select p.room_id, r.owner_id, p.user_id
    into v_room, v_owner, v_user
    from balance_profiles p
    join balance_rooms r on r.id = p.room_id
   where p.id = p_profile_id;

  if v_room is null then
    raise exception 'Membre introuvable.';
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Seul le propriétaire de la room peut retirer un membre.';
  end if;
  if v_user is not distinct from v_owner then
    raise exception 'Le propriétaire ne peut pas se retirer lui-même.';
  end if;

  insert into balance_membres_retires (profile_id, room_id, name, retired_by, profil, pesees)
  select p.id, p.room_id, p.name, auth.uid(), to_jsonb(p),
         coalesce((select jsonb_agg(to_jsonb(e) order by e.date) from balance_entries e
                    where e.profile_id = p.id), '[]'::jsonb)
    from balance_profiles p
   where p.id = p_profile_id;

  -- Ses réactions sur les pesées des autres partent aussi : il n'est plus là
  -- pour les assumer.
  if v_user is not null then
    delete from balance_reactions where user_id = v_user;
  end if;
  delete from balance_reactions where entry_id in (select id from balance_entries where profile_id = p_profile_id);
  delete from balance_entries where profile_id = p_profile_id;
  get diagnostics v_pesees = row_count;
  delete from balance_profiles where id = p_profile_id;

  raise notice 'Membre % retiré (% pesées archivées).', p_profile_id, v_pesees;
end $$;

revoke all on function balance_remove_member(uuid) from public, anon;
grant execute on function balance_remove_member(uuid) to authenticated;

-- Réintégrer quelqu'un retiré par erreur (à faire à la main, c'est assez rare
-- pour ne pas mériter un bouton) :
--   select profil, pesees from balance_membres_retires order by retired_at desc;
