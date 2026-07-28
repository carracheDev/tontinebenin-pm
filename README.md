# TONTINE BÉNIN PROJECT MANAGER

Plateforme de gestion, suivi et pilotage de projet pour la startup **TONTINE BÉNIN**.
Outil interne pour piloter le développement produit, les équipes, le capital (parts/vesting),
les tâches, la roadmap et la performance — pensé pour durer plusieurs années.

> **Statut : Phase 0 — Fondations posées.** Modèle de données complet + architecture + plan.
> La construction se fait ensuite **module par module**, chacun testé et livré fonctionnel.

---

## 1. Analyse du besoin (résumé)

**Problème.** Une startup tech pilote son développement dans des dizaines d'outils dispersés
(WhatsApp, Excel, têtes des fondateurs). Résultat : perte d'information, retards invisibles,
responsabilités floues, aucune trace du vesting ni des contributions.

**Solution.** Un **hub unique** qui centralise : l'équipe, le capital, les projets/phases,
les tâches (type Jira), les validations, la roadmap, les documents, le calendrier, les
notifications temps réel et un **assistant IA** de reporting.

**Acteurs.** Fondateur (contrôle total) · Cofondateurs (gèrent leurs modules) ·
Collaborateurs (tâches autorisées) · Observateurs (investisseurs, mentors — lecture seule).

---

## 2. Architecture technique

```
┌───────────────────────────────────────────────────────────┐
│  Web (Next.js / React)      Mobile (Flutter)               │
│  Dashboard, Kanban, Gantt   Notifications, tâches nomades  │
└───────────────┬───────────────────────┬───────────────────┘
                │ HTTPS / JWT            │ WebSocket (temps réel)
                ▼                        ▼
┌───────────────────────────────────────────────────────────┐
│  API Backend — NestJS (TypeScript)                         │
│  Auth · Guards RBAC · Modules métier · Gateway WebSocket   │
│  Service IA (rapports, prévision retards/risques)          │
└───────────────┬───────────────────────────────────────────┘
                │ Prisma ORM
                ▼
        PostgreSQL   +   Cloudinary (fichiers)   +   Firebase (push)
```

**Stack** (identique à l'écosystème TontineBénin, pour capitaliser le savoir-faire) :
`NestJS · Prisma · PostgreSQL · Next.js · Flutter · WebSocket · JWT · Docker`

---

## 3. Modules (mapping avec ta demande)

| # | Ton besoin | Module backend | Modèles clés |
|---|---|---|---|
| 1 | Gestion du projet | `projets` | Projet, Phase, Objectif, Jalon |
| 2 | Équipe & cofondateurs | `membres`, `capital` | Membre, Capital, HistoriqueCapital |
| 3 | Tâches & collaboration | `taches` | Tache, Commentaire, PieceJointe, Blocage |
| 4 | Notifications temps réel | `notifications` + Gateway WS | Notification |
| 5 | Dashboard intelligent | `analytics` | (agrégations) |
| 6 | Calendrier & échéances | `calendrier` | Evenement, ParticipationEvenement |
| 7 | Validations | `validations` | Validation |
| 8 | Documents | `documents` | Document, VersionDocument |
| 9 | Sécurité & permissions | `auth` + Guards RBAC | Role, JournalAction |
| 10 | Assistant IA | `ia` | RapportIA |
| 11 | Risques / blocages | dans `projets` / `taches` | Risque, Blocage |

Le **modèle de données complet** est déjà écrit : [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) (26 modèles, 12 enums).

---

## 4. Structure de dossiers (cible)

```
tontinebenin-pm/
├── backend/                 # API NestJS
│   ├── prisma/schema.prisma ✅ (fait)
│   └── src/
│       ├── common/          # guards RBAC, décorateurs, interceptors, filtres
│       ├── modules/
│       │   ├── auth/        membres/  capital/
│       │   ├── projets/     taches/   validations/
│       │   ├── documents/   calendrier/ notifications/
│       │   ├── analytics/   ia/
│       └── realtime/        # WebSocket gateway
├── web/                     # Next.js (dashboard, Kanban, Gantt, calendrier)
├── mobile/                  # Flutter (Riverpod) — phase ultérieure
└── docs/                    # UML, ADR, décisions
```

---

## 5. Plan de développement (par phases livrables)

| Phase | Contenu | Livrable |
|---|---|---|
| **0. Fondations** ✅ | Analyse, architecture, **schéma BD**, plan | ce dépôt |
| **1. Socle** ✅ | Auth + RBAC, module Membres, module Projets, migration Prisma | API + login fonctionnels |
| **2. Tâches** ✅ | CRUD tâches, Kanban, commentaires, mentions, pièces jointes, historique | tableau Jira-like |
| **3. Collaboration** ✅ | Validations (workflow), blocages, notifications in-app + WebSocket | temps réel |
| **4. Pilotage** ✅ | Phases, objectifs, jalons/roadmap, calcul d'avancement, risques | vision globale |
| **5. Dashboard** ✅ | Analytics + graphiques (avancement, charge, perf/membre, timeline) | tableau de bord |
| **6. Capital** | Parts + vesting (cliff, acquisition mensuelle, cron nocturne), historique | suivi des parts |
| **7. Documents & Calendrier** | Espace documentaire versionné + calendrier + rappels | GED + agenda |
| **8. Assistant IA** | Rapports auto (état, retards, risques, perf) via LLM | reporting IA |
| **9. Mobile & Déploiement** | App Flutter + Docker + CI/CD | production |

**Principe** : chaque phase est **testée (Jest / e2e)** et **démontrable** avant la suivante.

---

## 6. Sécurité

- Auth JWT (access + refresh), mots de passe **Argon2**, sessions révocables.
- **RBAC** par rôle (ADMIN / MANAGER / MEMBRE / OBSERVATEUR) via Guards NestJS.
- **Journal d'audit** (`JournalAction`) : chaque action sensible tracée.
- Validation stricte des entrées (DTO + class-validator), rate limiting.

---

## 7. Prochaine étape

➡️ **Phase 1 — Socle** : je génère le projet NestJS (auth + RBAC + membres + projets),
la première **migration Prisma**, et un jeu de tests. Puis on avance phase par phase.

*Dis « go Phase 1 » et je construis le socle fonctionnel.*
# tontinebenin-pm
