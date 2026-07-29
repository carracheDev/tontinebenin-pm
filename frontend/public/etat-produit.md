# 📋 État des lieux — TontineBénin (produit fintech)

*Document d'onboarding pour l'équipe. Dernière analyse du code : composants figés depuis le commit `e37ed46` (17 juin 2026) — l'activité récente a porté sur l'outil interne de gestion de projet.*

> ⚠️ **Lecture honnête** : les pourcentages mesurent la **couverture du code écrit** (largeur des fonctionnalités), **pas** la validation à l'exécution. « Codé » ≠ « testé » ≠ « déployé ».

---

## 1. 🖥️ tontinepro-backend — l'API (le cœur du système)

**À quoi ça sert** : le cerveau du projet. Toutes les règles (tontines, cotisations, retraits, crédits, scores) et la base de données passent par lui ; les 3 apps s'y branchent.

**Stack** : NestJS 11 · Prisma 7 · PostgreSQL (Neon) · TypeScript · JWT.

**Lancer en local :**

```
cd tontinepro-backend
npm install
npx prisma generate
npm run start:dev        # http://localhost:3000
```

**Avancement : ~80 % codé · testé partiellement · DÉPLOYÉ (VPS).**
Faits du code : **27 modules**, **31 contrôleurs**, **216 endpoints**, **34 modèles Prisma**, **24 migrations**, **13 tâches planifiées (cron)**.

**✅ Présentes** : auth JWT + rôles, tontines (individuelles + groupe), transactions, retraits, score crédit, micro-crédits, PADME, KYC, litiges, notifications, audit, zones, opérations assistées / USSD, 13 crons. Intégrations référencées : KKiaPay, Twilio / Africa's Talking, Firebase FCM, Cloudinary.

**⬜ À ajouter / finir**
- 🔴 **Critique — Décaissement des retraits** : KKiaPay n'a pas d'API de payout → l'argent ne peut pas *sortir* automatiquement. C'est LE blocage produit.
- 🔴 **Critique — Tests automatiques** : seulement 4 fichiers de tests + 6 scripts curl manuels. Insuffisant pour une fintech.
- 🟠 **Important** : confirmer que SMS / FCM / Cloudinary fonctionnent avec de **vraies clés** (référencé ≠ testé).
- 🟢 **Confort** : documentation API (Swagger), montée en charge.

**Fichiers-clés** : `src/common/constants/business.constants.ts` (règles financières), `prisma/schema.prisma`, `src/modules/*`, `.env.example`.

**Prochaines étapes** : (1) trancher le décaissement (KKiaPay payout ou FedaPay) ; (2) tests sur retraits / webhook / score ; (3) valider SMS + FCM ; (4) Swagger.

---

## 2. 📱 tontinepro_client — l'app du client final

**À quoi ça sert** : l'app mobile que le client utilise pour cotiser, retirer, suivre ses tontines et son score.

**Stack** : Flutter (Dart ≥ 3.11) · Riverpod · go_router · Dio.

**Lancer :** `cd tontinepro_client && flutter pub get && flutter run`

**Avancement : ~60 % codé · quasiment pas testé · pas d'APK distribué.**
Faits du code : **16 features**, **33 écrans**, **45 providers**, **14 repositories**. Base URL déjà pointée sur le VPS.
⚠️ **19 fichiers** contiennent `TODO / mock / placeholder` → plusieurs écrans sont maquettés mais pas complètement branchés à l'API.

**✅ Présentes** : auth, dashboard, tontines, transactions, retraits, micro-crédits, score, notifications, PADME, litiges, badges, coup de pouce, scanner QR, profil.

**⬜ À ajouter / finir**
- 🔴 **Critique** : brancher réellement les écrans encore en données fictives et lever les 19 TODO.
- 🔴 **Critique** : aucun test (1 seul fichier).
- 🟠 **Important** : dossier `profil` **ET** `profile` en double → dette à nettoyer.
- 🟢 **Confort** : build APK release + distribution.

**Fichiers-clés** : `lib/main.dart`, `lib/core/network/dio_client.dart` (JWT + refresh auto), `lib/core/network/api_endpoints.dart`, `lib/features/<feature>/`.

**Prochaines étapes** : (1) audit écran par écran « branché vs mock » ; (2) finir le branchement API ; (3) supprimer le doublon profil ; (4) tests cotisation / retrait ; (5) build APK.

---

## 3. 🧑‍💼 tontinepro_collecteur — l'app de l'agent de terrain

**À quoi ça sert** : l'app du collecteur qui enrôle les clients, encaisse les cotisations sur le terrain et suit ses missions.

**Stack** : identique au client (Flutter, Riverpod, go_router, Dio).

**Lancer :** `cd tontinepro_collecteur && flutter pub get && flutter run`

**Avancement : ~55-60 % codé · quasiment pas testé · pas déployé.**
Faits du code : **11 features**, **36 écrans**, **45 providers**, **10 repositories**. Seulement **3 fichiers** avec TODO/mock → plus propre que l'app client.
📌 **À corriger dans la doc** : le `CLAUDE.md` dit « À démarrer » — c'est faux : l'app a 87 fichiers et 36 écrans, elle est bien avancée.

**✅ Présentes** : auth, clients, collecte, commissions, enrôlement, missions, supervision, scanner, notifications, profil, home.

**⬜ À ajouter / finir**
- 🟠 **Important** : vérifier le branchement API réel des 36 écrans.
- 🔴 **Critique** : tests absents (1 fichier).
- 🟢 **Confort** : évaluer un mode hors-ligne terrain (collecteur sans réseau).

**Fichiers-clés** : `lib/features/collecte/`, `lib/features/enrolement/`, `lib/core/network/`.

**Prochaines étapes** : (1) corriger le statut dans la doc ; (2) vérifier le branchement API ; (3) tests collecte / enrôlement ; (4) évaluer le besoin hors-ligne.

---

## 4. 🎛️ tontinepro_admin — le tableau de bord d'administration

**À quoi ça sert** : l'interface web où l'équipe pilote tout (utilisateurs, transactions, retraits à valider, KYC, litiges, PADME, alertes, santé du système).

**Stack** : Next.js 15 · React 19 · TypeScript · App Router · middleware d'auth.

**Lancer :** `cd tontinepro_admin && npm install && npm run dev`

**Avancement : ~55 % codé · non testé · non déployé** (base URL encore `localhost:3000`).
Faits du code : **23 pages** (dashboard, utilisateurs, transactions, tontines, retraits, KYC, litiges, PADME, commissions, alertes, rapports, notifications, audit, zones, collecteurs, santé, paramètres, action-center + pages de détail).
⚠️ **12 fichiers** avec TODO/mock → plusieurs pages sont des coquilles à remplir. Appels API centralisés dans `src/lib/api.ts`.

**✅ Présentes** : structure des 23 sections, auth + middleware, client API centralisé, charte couleur.

**⬜ À ajouter / finir**
- 🔴 **Critique** : remplir les pages en placeholder (12 fichiers) et brancher les vraies données.
- 🟠 **Important** : configurer `NEXT_PUBLIC_API_URL` vers le VPS et déployer.
- 🟢 **Confort** : graphiques / KPIs temps réel.

**Fichiers-clés** : `src/lib/api.ts`, `src/lib/auth.ts`, `src/middleware.ts`, `src/app/(dashboard)/*`.

**Prochaines étapes** : (1) inventaire pages « réelles vs vides » ; (2) brancher les données ; (3) déployer sur le VPS ; (4) sécuriser l'accès admin.

---

## 📊 Tableau de synthèse

| Composant | Avancement (largeur code) | Prêt prod ? | Bloquant principal |
|---|---|---|---|
| Backend | ~80 % | Presque | Décaissement KKiaPay + tests |
| App client | ~60 % | Non | Écrans à brancher + 0 test |
| App collecteur | ~55-60 % | Non | Branchement API à vérifier + 0 test |
| Admin | ~55 % | Non | Pages placeholder + pas déployé |

*Pourcentages = couverture du code écrit, pas validation à l'exécution.*

---

## 👥 Suggestion de répartition (équipe de 4-5)

| Profil | Composant | Pourquoi |
|---|---|---|
| CTO / Chef de projet | Backend + intégrations + coordination | Le plus critique et transversal |
| Dev mobile #1 | App client | La plus visible, beaucoup d'écrans à finir |
| Dev mobile #2 | App collecteur | Base propre, avancée, autonome |
| Dev web | Admin | Next.js, indépendant, pages à remplir |
| QA / testeur | Tests + curl backend | Combler le vrai manque : la validation |

---

## 🎯 5 priorités transversales

1. 🔴 **Résoudre le décaissement** (retraits) — sans ça, pas de produit.
2. 🔴 **Tests** — couverture quasi nulle partout (fintech = risque financier).
3. 🟠 **Finir le branchement API** des écrans mobiles + pages admin en mock.
4. 🟠 **Déployer admin + APK** et pointer tout le monde sur le VPS.
5. 🟢 **Nettoyer la dette** (doublon profil, corriger la doc collecteur, lever les TODO).

---

## 🚦 Pour une vraie mise en production, il manque

- Backend déployé ✅ — mais **décaissement d'argent non fonctionnel** ❌.
- Aucune app mobile buildée / distribuée (pas d'APK) ❌.
- Admin non déployé ❌.
- Couverture de tests insuffisante pour manipuler de l'argent réel ❌.
- Intégrations (SMS, FCM, paiement) à confirmer avec de vraies clés ❌.

---

## 🧭 Par où commencer (nouveau développeur)

1. Lire le `CLAUDE.md` à la racine (règles métier, charte, stack).
2. Lancer le **backend** en local + `npx prisma studio` pour voir la base.
3. Ouvrir `business.constants.ts` — toutes les règles financières y sont.
4. Choisir son composant, le lancer, repérer ses TODO (`grep -rn "TODO"`).
5. Prendre une petite tâche de la liste « Prochaines étapes » de son composant.
