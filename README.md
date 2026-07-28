# Balance ⚖️

**Le championnat de pesée du lundi matin.** On se pèse, on note, on se chambre.

Réécriture en **React + Vite + TypeScript** de la maquette `Balance.dc.html`, avec
**Supabase** pour la base de données et l'authentification des membres.

---

## Ce que fait l'appli

- **Connexion** par email + mot de passe (Supabase Auth). Les inscriptions publiques sont
  désactivées : les comptes sont créés à la main par l'admin (voir plus bas).
- **Onboarding** : à sa première connexion, un membre choisit son nom, sa couleur, son poids de départ et son objectif.
- **Le groupe** (dashboard) : courbes de tout le monde (% perdu ou kg), classement, fil des dernières pesées avec réactions emoji, mur des trophées.
- **Mon suivi** : courbe de poids vs objectif, anneau de progression, série de lundis, mensurations, historique complet.
- **Nouvelle pesée** : poids + mensurations + petit mot pour le groupe.

Le tout est peuplé de **8 concurrents de démo** (données fidèles à la maquette d'origine) pour que le tableau de bord soit vivant dès la première connexion.

## Stack

| | |
|---|---|
| Front | React 18, Vite 5, TypeScript |
| Styles | inline styles fidèles à la maquette (fonts Anton + Space Grotesk) |
| Backend | Supabase (Postgres + Auth + RLS) |

## Démarrage

```bash
npm install
npm run dev
```

L'appli tourne sur http://localhost:5173.

> La configuration Supabase est déjà dans `.env.local` (projet existant, tables préfixées `balance_`).
> Pour pointer vers un autre projet, copie `.env.example` → `.env.local` et renseigne l'URL + la clé publishable.

### Build de production

```bash
npm run build      # tsc + vite build → dist/
npm run preview
```

## Base de données

Les migrations et le seed sont versionnés dans `supabase/` :

- `supabase/migrations/0001_balance_init.sql` — tables, index, politiques RLS, fonction d'agrégats.
- `supabase/seed.sql` — les 8 concurrents de démo et leurs pesées.

### Modèle

- **`balance_profiles`** — un profil par membre. `user_id` relie le profil au compte Supabase Auth (`null` pour les profils de démo).
- **`balance_entries`** — une pesée par (profil, semaine) : poids + mensurations + note.
- **`balance_reactions`** — réactions emoji sur une pesée (une par membre / emoji / pesée).

### Sécurité (RLS)

- Tout membre connecté **lit** tous les profils / pesées / réactions (c'est une compétition de groupe).
- Chacun **n'écrit que ses propres** données (`auth.uid()` vérifié à l'insertion / mise à jour).
- Vérifié : un client **anonyme** ne lit aucune donnée personnelle (0 ligne) et ne peut rien insérer (401).
- Seule la fonction `balance_public_stats()` est publique — elle ne renvoie que 3 chiffres agrégés (kg perdus, nb de membres, semaine) pour la page d'accueil, aucune donnée nominative.

### Gestion des comptes (inscriptions désactivées)

Les inscriptions publiques sont **désactivées** sur le projet (`signup_disabled`). Pour ajouter un membre :

1. Dashboard Supabase → **Authentication → Users → Add user**
2. Renseigne email + mot de passe, coche **« Auto Confirm User »**
3. La personne se connecte via **« Se connecter »** et passe par l'onboarding

Pour rouvrir l'inscription libre depuis l'app, il faudrait réactiver *Allow new users to sign up*
dans Auth **et** remettre un bouton d'inscription dans `Login.tsx`.

### Recommandation Supabase (facultatif)

- *Leaked Password Protection* désactivée — à activer dans Auth pour bloquer les mots de passe compromis (HaveIBeenPwned).

## Structure du code

```
src/
  supabaseClient.ts        client Supabase
  theme.ts                 tokens de design + constantes (champs, emojis, dates)
  types.ts                 Member, Entry, ...
  lib/
    data.ts                fetch + mutations Supabase, mapping lignes → modèles
    compute.ts             logique de calcul portée de la maquette (classement, courbes, stats)
  context/
    AuthContext.tsx        session, signIn / signUp / signOut
    DataContext.tsx        chargement des données + mutations + membre "moi"
  components/
    Login.tsx  Onboarding.tsx  Header.tsx
    Dashboard.tsx  MonSuivi.tsx  WeighInModal.tsx
    Toast.tsx  Spinner.tsx
```

La logique métier de la maquette (`groupChart`, `personVals`, classement, roasts…) a été
portée fidèlement dans `src/lib/compute.ts` comme fonctions pures.
