# Balance ⚖️

**Le championnat de pesée de la semaine.** On se pèse, on note, on se chambre.

Réécriture en **React + Vite + TypeScript** de la maquette `Balance.dc.html`, avec
**Supabase** pour la base de données et l'authentification des membres.

---

## Ce que fait l'appli

- **Accueil** : présentation de l'appli, création de compte et connexion (email + mot de passe, Supabase Auth).
- **Rooms privées** : chaque championnat est une room. On la crée, ou on la rejoint avec un **code d'invitation** à 6 caractères (ou le lien `#/rejoindre/CODE`). Une room n'est visible que de ses membres — le cloisonnement est fait par la RLS, pas par l'appli. Un utilisateur appartient à **une seule room** pour l'instant.
- **Onboarding** : après avoir choisi sa room, un membre choisit son nom, sa couleur, son poids de départ et son objectif. L'objectif peut être **au-dessus** du poids de départ : quelqu'un qui veut prendre du poids est classé et récompensé sur sa progression à lui, exactement comme les autres.
- **Une pesée par semaine** (lundi → dimanche), garantie par une contrainte d'unicité en base.
- **Le groupe** (dashboard) : courbes de tout le monde (% de progression ou kg), classement, fil des dernières pesées avec réactions emoji, mur des trophées.
- **Mon suivi** : courbe de poids vs objectif, anneau de progression, série de semaines, mensurations, historique complet.
- **Nouvelle pesée** : poids + mensurations + petit mot pour le groupe. Une seule par semaine.
- **Réglages** : profil, mot de passe, email, et le code d'invitation de sa room — visible par tous les membres, n'importe qui peut inviter.
- **Panneau propriétaire** : la personne qui a créé la room y voit la liste des membres et peut en retirer. L'autorisation est vérifiée par la base (`balance_remove_member`), pas par l'interface.

## Migrations à appliquer

Les scripts de `supabase/migrations/` ne sont pas joués automatiquement : à exécuter
une fois, **dans l'ordre**, depuis Supabase → SQL Editor.

| Script | Ce qu'il fait |
|---|---|
| `20260908_one_weigh_in_per_week.sql` | `week` devient le numéro de semaine calendaire, doublons purgés, contrainte d'unicité `(profile_id, week)` |
| `20260908_rooms.sql` | Table `balance_rooms`, `room_id` sur les profils, membres actuels relogés dans une room, **toutes les policies RLS remplacées** |
| `20260908_membres.sql` | Fonction `balance_remove_member` : le propriétaire retire un membre, ses pesées partant dans `balance_membres_retires` |

**Ce que deviennent les données existantes.** Rien n'est supprimé. Les profils, pesées et
réactions déjà en base sont conservés tels quels, et tous les membres actuels sont déplacés
d'un bloc dans une seule room — personne n'a de code à saisir. Ouvre `20260908_rooms.sql` et
renseigne `v_owner_email` (et `v_room_name`) avant de l'exécuter, sinon le propriétaire est
désigné au hasard parmi les plus anciens membres.

Seule exception : si quelqu'un s'était pesé deux fois dans la même semaine calendaire, la
nouvelle contrainte l'interdit. Ces lignes ne sont pas détruites mais déplacées dans
`balance_entries_doublons`. Le script du haut de `20260908_one_weigh_in_per_week.sql` te dit
combien il y en a avant que tu lances quoi que ce soit.

Côté Supabase, il faut aussi **activer les inscriptions** (Authentication → Sign In / Providers),
sans quoi le bouton « Créer un compte » renvoie une erreur.

Un jeu de **8 concurrents de démo** (`supabase/seed.sql`, données fidèles à la maquette) est disponible en option pour remplir le tableau de bord ; sinon la ligue démarre à vide, avec de vrais membres uniquement.

## Stack

| | |
|---|---|
| Front | React 18, Vite 5, TypeScript |
| Styles | inline styles fidèles à la maquette (fonts Anton + Space Grotesk) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Déploiement | GitHub Pages, build automatique via GitHub Actions |