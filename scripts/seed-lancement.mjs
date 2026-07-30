#!/usr/bin/env node
/**
 * Crée le projet « Lancement Vague 200 » + les 24 tâches dans le PM TontineBénin.
 * Les tâches sont créées NON assignées et catégorisées ([CTO], [Backend], [Flutter]).
 * L'admin les attribue ensuite dans l'UI (Tâches → crayon → Assigné à).
 *
 * Usage (sur le VPS, depuis le dossier du backend PM) :
 *   EMAIL=ton@email MDP=ton_mot_de_passe node ../scripts/seed-lancement.mjs
 * Options :
 *   API=http://127.0.0.1:3100   (défaut ; l'API du PM)
 *   TOKEN=...                    (jeton admin, si tu ne veux pas mettre EMAIL/MDP)
 */

const API = (process.env.API || 'http://127.0.0.1:3100').replace(/\/$/, '');

async function call(path, method, body, token) {
  const r = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(d).slice(0, 200)}`);
  return d.donnees ?? d;
}

let token = process.env.TOKEN;
if (!token) {
  if (!process.env.EMAIL || !process.env.MDP) {
    console.error('❌ Fournis EMAIL + MDP (ou TOKEN). Ex : EMAIL=... MDP=... node scripts/seed-lancement.mjs');
    process.exit(1);
  }
  const c = await call('/auth/connexion', 'POST', { email: process.env.EMAIL, motDePasse: process.env.MDP });
  token = c.accessToken;
  console.log('✅ Connecté en tant qu’admin.');
}

const projet = await call('/projets', 'POST', {
  nom: 'Lancement TontineBénin — Vague 200',
  description: "App client d'abord. Objectif : 200 utilisateurs actifs fin août.",
  statut: 'EN_COURS',
  priorite: 'HAUTE',
}, token);
console.log('✅ Projet créé :', projet.id);

// [catégorie, titre, priorité, description détaillée]
const TACHES = [
  // ── CTO / Chef de projet ──
  ['CTO', 'Débloquer le payout FedaPay', 'CRITIQUE',
    "Le retrait est bloqué (403 « Opération non autorisée »). Relancer FedaPay (chat + support@fedapay.com) avec la réf compte acc_9537257052 jusqu'à activation du payout. Fini : FedaPay confirme l'activation."],
  ['CTO', 'Cadrer le pont retrait collecteur', 'CRITIQUE',
    "Plan B si le payout tarde : le collecteur exécute le retrait via operations-assistees. Définir le flux + créer la tâche pour Backend Retrait. Fini : flux écrit + tâche assignée."],
  ['CTO', 'Mettre en place la revue de code', 'HAUTE',
    "Branche dev + Pull Request obligatoire avant fusion. Personne ne pousse sur main. Fini : règle écrite + branche dev partagée."],
  ['CTO', 'Préparer le déploiement de la vague', 'HAUTE',
    "Checklist VPS : variables FedaPay (live), prisma migrate deploy, logs/monitoring, sauvegarde base. Fini : checklist prête et testée."],
  ['CTO', 'Piloter le PM chaque jour (rituel)', 'MOYENNE',
    "Page Suivi : valider Test validé → Validé manager, débloquer l'équipe, bilan chaque soir."],

  // ── Backend · Cotisation ──
  ['Backend·Cotisation', 'Brancher FedaPay à la cotisation', 'CRITIQUE',
    "Où : transactions.service.ts (cotiser) + fedapay.service.ts (initierPaiement). Créer la transaction FedaPay et renvoyer l'URL de paiement. Fini : une cotisation sandbox crée une vraie transaction FedaPay."],
  ['Backend·Cotisation', 'Webhook FedaPay « approved » → créditer la cagnotte', 'CRITIQUE',
    "Où : POST /transactions/webhook-fedapay + verifierEtConstruireEvenement. Statut approved → créditer la tontine (brut) + notif + idempotence. Fini : le webhook crédite la cagnotte."],
  ['Backend·Cotisation', 'Appliquer le 1 % en sus', 'CRITIQUE',
    "Client paie cotisation + 1 % ; la cagnotte reçoit le brut. Constante TAUX_COMMISSION_COTISATION=0.01 déjà posée. Fini : frais prélevé, cagnotte pleine, 1 % tracé."],
  ['Backend·Cotisation', 'Tontine de groupe — cycle complet', 'HAUTE',
    "Vérifier cotisations → distribution automatique quand la cagnotte est pleine. Fini : un cycle complet (5 membres) distribue correctement."],
  ['Backend·Cotisation', 'Retirer le stub KKiaPay du flux cotisation', 'HAUTE',
    "grep -r kkiapay src/modules/transactions → remplacer par FedaPay. Fini : plus de référence KKiaPay dans la cotisation."],
  ['Backend·Cotisation', 'Tests de la cotisation', 'MOYENNE',
    "Où : transactions.service.spec.ts. Fini : tests verts sur montant, 1 %, crédit cagnotte."],

  // ── Backend · Retrait & fiabilité ──
  ['Backend·Retrait', 'Brancher le payout FedaPay au retrait', 'CRITIQUE',
    "Où : retraits.service.ts (~ligne 417) + fedapay.service.ts (initierTransfert). Dépend de l'activation payout. Fini : un retrait déclenche un payout FedaPay."],
  ['Backend·Retrait', 'Pont retrait collecteur (secours)', 'CRITIQUE',
    "Où : operations-assistees. Le collecteur exécute le retrait si le payout auto n'est pas actif. Fini : un retrait aboutit sans payout automatique."],
  ['Backend·Retrait', 'Webhook payout (sent / failed)', 'CRITIQUE',
    "Mettre à jour le statut du retrait selon FedaPay (sent, failed) + notifier + rembourser si failed. Fini : le statut du retrait suit le payout."],
  ['Backend·Retrait', 'Tests des 3 chemins d’argent', 'HAUTE',
    "Cotiser · distribuer · retirer. Filet de sécurité n°1 d'une app d'argent. Fini : tests verts sur les 3 flux."],
  ['Backend·Retrait', 'Notifications financières', 'HAUTE',
    "Où : notifications. Appeler notifier() après cotisation reçue, distribution, retrait envoyé. Fini : une notif part à chaque étape."],
  ['Backend·Retrait', 'Idempotence / circuit breaker', 'MOYENNE',
    "Vérifier qu'un webhook rejoué ne double pas un crédit. Fini : un webhook rejoué ne crédite qu'une fois."],

  // ── Flutter · App client ──
  ['Flutter·Client', 'Appliquer la charte Bleu royal', 'CRITIQUE',
    "Où : lib/core/constants/app_colors.dart. Reporter les couleurs validées. Fini : l'app reflète le bleu royal + vert/rouge sémantiques."],
  ['Flutter·Client', 'Écran Cotiser branché à l’API', 'CRITIQUE',
    "Où : lib/features/transactions. Montant, opérateur, 1 %, confirmation → appel réel + page de paiement FedaPay. Fini : une cotisation part du téléphone."],
  ['Flutter·Client', 'Écran Retrait branché', 'CRITIQUE',
    "Où : lib/features/retraits. Montant, frais, confirmation → API. Gérer l'état « en attente ». Fini : un retrait part de l'app."],
  ['Flutter·Client', 'Accueil + Détail tontine (vraies données)', 'HAUTE',
    "Où : lib/features/dashboard + tontines. Solde, mes tontines, détail (membres, statut versé/non payé). Fini : plus aucune donnée fictive."],
  ['Flutter·Client', 'Historique + Reçu', 'HAUTE',
    "Où : lib/features/historique + transactions. Liste réelle + reçu partageable (WhatsApp/PDF). Fini : l'historique affiche les vraies transactions."],
  ['Flutter·Client', 'Parcours d’entrée (Inscription · Connexion · OTP)', 'HAUTE',
    "Où : lib/features/auth. Fini : un nouvel utilisateur s'inscrit, reçoit l'OTP et se connecte."],
  ['Flutter·Client', 'Lever les 19 TODO / mock', 'MOYENNE',
    "grep -rn \"TODO|mock\" lib, en priorité sur cotiser/retrait. Fini : plus de mock sur le parcours principal."],
];

let ok = 0;
for (const [cat, titre, prio, desc] of TACHES) {
  try {
    await call('/taches', 'POST', { projetId: projet.id, titre: `[${cat}] ${titre}`, description: desc, priorite: prio }, token);
    ok++;
    console.log(`  + [${cat}] ${titre}`);
  } catch (e) {
    console.log(`  ✗ ${titre} — ${e.message}`);
  }
}

console.log(`\n✅ ${ok}/${TACHES.length} tâches créées dans « Lancement Vague 200 ».`);
console.log('👉 Ouvre le PM → Tâches → clique chaque carte → crayon → « Assigné à » pour l’attribuer.');
