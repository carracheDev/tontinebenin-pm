# Backend — TONTINE BÉNIN PROJECT MANAGER

API NestJS (Phase 1 — Socle). Auth JWT + RBAC, gestion des membres et des projets.

## Démarrage
```bash
cp .env.example .env          # renseigne DATABASE_URL + secrets JWT
npm install
npx prisma migrate dev --name init   # crée la base
npm run start:dev             # http://localhost:3100
```

## Endpoints (Phase 1)
| Méthode | Route | Accès |
|---|---|---|
| POST | /auth/inscription | public (1er inscrit = FONDATEUR/ADMIN) |
| POST | /auth/connexion | public |
| POST | /auth/rafraichir | public (refresh token) |
| GET  | /auth/moi | authentifié |
| GET  | /membres | authentifié |
| GET  | /membres/:id | authentifié |
| POST | /membres | ADMIN |
| PATCH| /membres/:id | ADMIN, MANAGER |
| DELETE| /membres/:id | ADMIN |
| GET  | /projets | authentifié |
| GET  | /projets/:id | authentifié |
| POST | /projets | ADMIN, MANAGER |
| PATCH| /projets/:id | ADMIN, MANAGER |
| DELETE| /projets/:id | ADMIN |

## Format de réponse (uniforme)
```json
{ "succes": true, "message": "…", "donnees": { } }
{ "succes": false, "message": "…", "code": "CODE_METIER" }
```

## Rôles (RBAC)
ADMIN (fondateur) · MANAGER (cofondateur) · MEMBRE (collaborateur) · OBSERVATEUR (lecture).
