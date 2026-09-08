-- Une seule pesée par semaine, par membre.
--
-- `week` était jusqu'ici un compteur par membre (pesée n° 1, 2, 3…), sans lien
-- avec le calendrier : deux membres pouvaient être en « semaine 3 » à deux mois
-- d'écart. La colonne devient le numéro de semaine calendaire (lundi → dimanche),
-- calculé depuis la date de la pesée, ce qui en fait une clé fiable.
--
-- Une contrainte unique (profile_id, week) existait déjà, mais sur l'ancien
-- compteur elle ne garantissait rien : « une seule pesée n° 3 » est vrai par
-- construction. Elle doit être levée le temps du recalcul, sinon l'update se
-- heurte aux collisions qu'il est justement en train de créer.
--
-- À exécuter une fois dans Supabase → SQL Editor, script entier d'un bloc.
--
-- Pour voir à l'avance ce qui sera archivé :
--
--   select profile_id, floor((date - date '2026-07-27') / 7.0) as semaine,
--          count(*), array_agg(date order by date)
--     from balance_entries
--    group by 1, 2 having count(*) > 1;

-- 0. Photo de la table avant tout. Le recalcul de `week` écrase des valeurs
--    qu'aucune archive ne rattrape : cette copie est le seul retour arrière
--    complet. À supprimer une fois que tout tourne :
--      drop table balance_entries_avant_migration;
create table if not exists balance_entries_avant_migration as
  select * from balance_entries;
alter table balance_entries_avant_migration enable row level security;

-- 1. Lever la contrainte existante. Son nom est auto-généré, donc on la retrouve
--    par son type plutôt que de le deviner — et on annonce ce qu'on retire.
do $$
declare c text;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
     where ns.nspname = 'public' and rel.relname = 'balance_entries' and con.contype = 'u'
  loop
    raise notice 'Contrainte unique levée : %', c;
    execute format('alter table balance_entries drop constraint %I', c);
  end loop;
end $$;

-- 2. Recalculer week depuis la date. Semaine 0 = lundi 27 juillet 2026,
--    le lundi de la semaine où démarre le championnat.
update balance_entries
   set week = floor((date - date '2026-07-27') / 7.0);

-- 3. Deux pesées dans la même semaine calendaire ne peuvent plus coexister. On
--    garde la première de chaque semaine et on MET LES AUTRES DE CÔTÉ — rien
--    n'est détruit, la table d'archive permet de revenir en arrière ou de
--    changer d'avis (garder la dernière plutôt que la première, par exemple).
create table if not exists balance_entries_doublons as
  select * from balance_entries where false;

-- Toute table du schéma public est servie par l'API. RLS active sans aucune
-- policy = personne n'y accède depuis l'appli, seulement depuis le SQL Editor.
alter table balance_entries_doublons enable row level security;

with archivees as (
  delete from balance_entries e
   using balance_entries keep
   where e.profile_id = keep.profile_id
     and e.week       = keep.week
     and (keep.date, keep.id) < (e.date, e.id)
  returning e.*
)
insert into balance_entries_doublons select * from archivees;

-- 4. Le garde-fou, cette fois sur une vraie semaine calendaire.
alter table balance_entries
  add constraint balance_entries_one_per_week unique (profile_id, week);

-- Ce qui a été mis de côté, s'il y a lieu :
--   select p.name, d.date, d.weight from balance_entries_doublons d
--     join balance_profiles p on p.id = d.profile_id order by p.name, d.date;
