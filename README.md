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

Un jeu de **8 concurrents de démo** (`supabase/seed.sql`, données fidèles à la maquette) est disponible en option pour remplir le tableau de bord ; sinon la ligue démarre à vide, avec de vrais membres uniquement.

## Stack

| | |
|---|---|
| Front | React 18, Vite 5, TypeScript |
| Styles | inline styles fidèles à la maquette (fonts Anton + Space Grotesk) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Déploiement | GitHub Pages, build automatique via GitHub Actions |