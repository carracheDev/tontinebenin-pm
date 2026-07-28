/**
 * MODE DÉMO — activé par NEXT_PUBLIC_DEMO=1 au build.
 * Sert des données fictives sans backend : le collaborateur voit un tableau de
 * bord rempli et navigue partout, uniquement pour donner un avis sur le front.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

export const membreDemo = {
  id: 'f',
  nomComplet: 'SODJINOU Jésukpégo Carrache',
  email: 'sodjinoucarrache457@gmail.com',
  role: 'ADMIN',
  typeMembre: 'FONDATEUR',
  poste: 'Fondateur',
  photoUrl: null,
};

const membres = [
  membreDemo,
  { id: 'a', nomComplet: 'GOUTIN Alphonsine', email: 'alphonsine@tontinebenin.bj', role: 'MANAGER', typeMembre: 'COLLABORATEUR', poste: 'Développeuse mobile', statut: 'ACTIF', photoUrl: null },
  { id: 'b', nomComplet: 'ADJOVI Marc', email: 'marc@tontinebenin.bj', role: 'MEMBRE', typeMembre: 'COLLABORATEUR', poste: 'Développeur backend', statut: 'ACTIF', photoUrl: null },
  { id: 'c', nomComplet: 'HOUNKPATIN Sarah', email: 'sarah@tontinebenin.bj', role: 'MEMBRE', typeMembre: 'COLLABORATEUR', poste: 'UI/UX Designer', statut: 'ACTIF', photoUrl: null },
  { id: 'd', nomComplet: 'DOSSA Kevin', email: 'kevin@tontinebenin.bj', role: 'MEMBRE', typeMembre: 'COLLABORATEUR', poste: 'Assurance qualité', statut: 'ACTIF', photoUrl: null },
  { id: 'e', nomComplet: 'AGBODJAN Ruth', email: 'ruth@tontinebenin.bj', role: 'MEMBRE', typeMembre: 'COLLABORATEUR', poste: 'Marketing', statut: 'ACTIF', photoUrl: null },
].map((m) => ({ statut: 'ACTIF', ...m }));

const projets = [
  { id: 'p1', nom: 'MVP TontineBénin', description: 'Application client : cotisations, retraits, tontines de groupe.', statut: 'EN_COURS', priorite: 'HAUTE', avancement: 62, _count: { taches: 14, phases: 4, objectifs: 6 } },
  { id: 'p2', nom: 'App Collecteur', description: 'Application terrain pour les agents collecteurs.', statut: 'PLANIFIE', priorite: 'MOYENNE', avancement: 15, _count: { taches: 6, phases: 3, objectifs: 4 } },
  { id: 'p3', nom: 'Dashboard Admin', description: 'Back-office de supervision et KPIs.', statut: 'EN_COURS', priorite: 'HAUTE', avancement: 40, _count: { taches: 4, phases: 2, objectifs: 3 } },
];

const A = (id: string) => membres.find((m) => m.id === id)!;
const jour = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

const tache = (id: string, titre: string, statut: string, priorite: string, ass: string, ech: number, com = 0, pj = 0) => ({
  id, titre, statut, priorite, echeance: jour(ech),
  assigne: { id: ass, nomComplet: A(ass).nomComplet, photoUrl: null },
  _count: { commentaires: com, piecesJointes: pj },
});

const kanban = {
  colonnes: [
    { statut: 'A_FAIRE', taches: [
      tache('t1', 'Écran historique des cotisations', 'A_FAIRE', 'MOYENNE', 'a', 6, 2),
      tache('t2', 'Intégration KKiaPay (sandbox)', 'A_FAIRE', 'HAUTE', 'b', 4, 1, 2),
      tache('t3', 'Maquette écran retrait', 'A_FAIRE', 'MOYENNE', 'c', 8),
    ] },
    { statut: 'EN_COURS', taches: [
      tache('t4', 'API cotisation + webhook', 'EN_COURS', 'HAUTE', 'b', 2, 4, 1),
      tache('t5', 'Flux onboarding client', 'EN_COURS', 'HAUTE', 'a', 3, 1),
    ] },
    { statut: 'EN_VALIDATION', taches: [
      tache('t6', 'Authentification biométrique', 'EN_VALIDATION', 'HAUTE', 'a', -1, 3),
    ] },
    { statut: 'TERMINE', taches: [
      tache('t7', 'Inscription par téléphone', 'TERMINE', 'HAUTE', 'b', -8, 2),
      tache('t8', 'Charte graphique bleue', 'TERMINE', 'MOYENNE', 'c', -10, 1),
      tache('t9', 'Structure du projet Flutter', 'TERMINE', 'BASSE', 'a', -12),
    ] },
    { statut: 'BLOQUE', taches: [
      tache('t10', 'API payout (décaissement)', 'BLOQUE', 'CRITIQUE', 'b', 1, 5, 1),
    ] },
  ],
};

const apercu = {
  totalProjets: 3, projetsActifs: 2, totalMembres: 6, totalTaches: 24,
  tachesTerminees: 11, tachesEnRetard: 3, avancementMoyen: 39,
  repartitionStatuts: { A_FAIRE: 7, EN_COURS: 4, EN_VALIDATION: 2, TERMINE: 11, BLOQUE: 0 },
};

const MOISCOURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
function evolution(n: number) {
  const out: { mois: string; creees: number; terminees: number }[] = [];
  const base = [3, 5, 4, 7, 6, 9, 5, 8, 7, 10, 6, 8];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const k = (n - 1 - i);
    out.push({ mois: MOISCOURT[d.getMonth()], creees: base[k % base.length], terminees: Math.max(1, base[k % base.length] - 2) });
  }
  return out;
}

const perf = [
  { membre: { nomComplet: 'GOUTIN Alphonsine' }, assignees: 8, terminees: 5, enCours: 2, enRetard: 1, tempsPasseH: 46, tauxCompletion: 63 },
  { membre: { nomComplet: 'ADJOVI Marc' }, assignees: 9, terminees: 4, enCours: 3, enRetard: 2, tempsPasseH: 52, tauxCompletion: 44 },
  { membre: { nomComplet: 'HOUNKPATIN Sarah' }, assignees: 5, terminees: 4, enCours: 1, enRetard: 0, tempsPasseH: 30, tauxCompletion: 80 },
  { membre: { nomComplet: 'DOSSA Kevin' }, assignees: 4, terminees: 3, enCours: 1, enRetard: 0, tempsPasseH: 18, tauxCompletion: 75 },
  { membre: { nomComplet: 'AGBODJAN Ruth' }, assignees: 3, terminees: 2, enCours: 1, enRetard: 0, tempsPasseH: 12, tauxCompletion: 67 },
];

const charge = [
  { membre: 'ADJOVI Marc', charge: 6 }, { membre: 'GOUTIN Alphonsine', charge: 4 },
  { membre: 'HOUNKPATIN Sarah', charge: 2 }, { membre: 'DOSSA Kevin', charge: 1 }, { membre: 'AGBODJAN Ruth', charge: 1 },
];

const repartition = [
  { membre: 'ADJOVI Marc', taches: 9, pourcentage: 31 },
  { membre: 'GOUTIN Alphonsine', taches: 8, pourcentage: 28 },
  { membre: 'HOUNKPATIN Sarah', taches: 5, pourcentage: 17 },
  { membre: 'DOSSA Kevin', taches: 4, pourcentage: 14 },
  { membre: 'AGBODJAN Ruth', taches: 3, pourcentage: 10 },
];

const contribution = {
  lignes: [
    { membre: { id: 'a', nomComplet: 'GOUTIN Alphonsine', typeMembre: 'COLLABORATEUR' }, terminees: 5, enCours: 2, enRetard: 1, tempsPasseH: 46, ponctualite: 92, poidsContribution: 27.5 },
    { membre: { id: 'b', nomComplet: 'ADJOVI Marc', typeMembre: 'COLLABORATEUR' }, terminees: 4, enCours: 3, enRetard: 2, tempsPasseH: 52, ponctualite: 78, poidsContribution: 24.1 },
    { membre: { id: 'c', nomComplet: 'HOUNKPATIN Sarah', typeMembre: 'COLLABORATEUR' }, terminees: 4, enCours: 1, enRetard: 0, tempsPasseH: 30, ponctualite: 100, poidsContribution: 21.3 },
    { membre: { id: 'd', nomComplet: 'DOSSA Kevin', typeMembre: 'COLLABORATEUR' }, terminees: 3, enCours: 1, enRetard: 0, tempsPasseH: 18, ponctualite: 100, poidsContribution: 15.6 },
    { membre: { id: 'e', nomComplet: 'AGBODJAN Ruth', typeMembre: 'COLLABORATEUR' }, terminees: 2, enCours: 1, enRetard: 0, tempsPasseH: 12, ponctualite: 100, poidsContribution: 11.5 },
    { membre: { id: 'f', nomComplet: 'SODJINOU Jésukpégo Carrache', typeMembre: 'FONDATEUR' }, terminees: 0, enCours: 0, enRetard: 0, tempsPasseH: 0, ponctualite: 100, poidsContribution: 0 },
  ],
  totaux: { membres: 6, tachesTerminees: 18, tempsPasseH: 158 },
};

const AVERT = "Projection non contractuelle. Aucune part n'est attribuée aujourd'hui : TontineBénin est une entreprise individuelle, le fondateur détient 100 %. Simulation indicative, applicable uniquement en cas de passage en société (SARL).";
const projection = {
  plancherFondateur: 60,
  repartition: [
    { membre: 'SODJINOU Jésukpégo Carrache', typeMembre: 'FONDATEUR', pourcentageProjete: 60, poidsContribution: 0 },
    { membre: 'GOUTIN Alphonsine', typeMembre: 'COLLABORATEUR', pourcentageProjete: 11, poidsContribution: 27.5 },
    { membre: 'ADJOVI Marc', typeMembre: 'COLLABORATEUR', pourcentageProjete: 9.6, poidsContribution: 24.1 },
    { membre: 'HOUNKPATIN Sarah', typeMembre: 'COLLABORATEUR', pourcentageProjete: 8.5, poidsContribution: 21.3 },
    { membre: 'DOSSA Kevin', typeMembre: 'COLLABORATEUR', pourcentageProjete: 6.2, poidsContribution: 15.6 },
    { membre: 'AGBODJAN Ruth', typeMembre: 'COLLABORATEUR', pourcentageProjete: 4.6, poidsContribution: 11.5 },
  ],
  avertissement: AVERT,
};

const evenements = [
  { id: 'e1', titre: 'Réunion hebdo équipe', type: 'REUNION', debut: jour(1), fin: null, projetId: 'p1' },
  { id: 'e2', titre: 'Deadline intégration KKiaPay', type: 'DEADLINE', debut: jour(5), fin: null, projetId: 'p1' },
  { id: 'e3', titre: 'Démo interne MVP', type: 'LANCEMENT', debut: jour(9), fin: null, projetId: 'p1' },
  { id: 'e4', titre: 'Release v0.2 App Collecteur', type: 'RELEASE', debut: jour(-3), fin: null, projetId: 'p2' },
];

const timeline = {
  phases: [
    { id: 'ph1', nom: 'Cadrage & maquettes', avancement: 100 },
    { id: 'ph2', nom: 'Développement MVP', avancement: 62 },
    { id: 'ph3', nom: 'Tests & recette', avancement: 20 },
    { id: 'ph4', nom: 'Lancement pilote', avancement: 0 },
  ],
  jalons: [
    { id: 'j1', titre: 'Maquettes validées', date: jour(-30), atteint: true, version: null },
    { id: 'j2', titre: 'Paiement fonctionnel', date: jour(7), atteint: false, version: 'v0.3' },
    { id: 'j3', titre: 'Pilote 50 utilisateurs', date: jour(40), atteint: false, version: 'v1.0' },
  ],
};

const rapports = [
  { id: 'r1', type: 'ETAT_PROJET', projetId: 'p1', genereeLe: jour(-1) },
  { id: 'r2', type: 'SYNTHESE', projetId: null, genereeLe: jour(-2) },
];
const rapportContenu: Record<string, any> = {
  r1: {
    id: 'r1', type: 'ETAT_PROJET', projetId: 'p1', genereeLe: jour(-1), genereParIA: true, source: 'groq',
    contenu: `### État du projet — MVP TontineBénin\n\nLe projet avance à un rythme soutenu (**62 %**) et se trouve en phase de **développement**.\n\n- **Statut** : EN_COURS · **État** : En bonne voie\n- **Objectifs** : 4/6 atteints\n- **Tâches** : 14 au total (3 terminées, 2 en cours)\n- **Retards** : 3 tâches en retard\n- **Risques** : 1 critique (API payout)\n\n#### Recommandation\nDébloquer en priorité l'API de décaissement, qui conditionne la fonctionnalité de retrait.`,
  },
  r2: {
    id: 'r2', type: 'SYNTHESE', projetId: null, genereeLe: jour(-2), genereParIA: false, source: 'deterministe',
    contenu: `### Synthèse du portefeuille\n\n- **Projets** : 3 (dont 2 actifs)\n- **Avancement moyen** : 39 %\n- **Membres actifs** : 6\n- **Tâches** : 24 · terminées : 11 · en retard : 3\n\n#### Points d'attention\n- ⚠️ 3 tâches en retard sur l'ensemble du portefeuille.`,
  },
};

const ok = (donnees: unknown) => ({ succes: true, message: 'ok', donnees });

function resoudre(method: string, url: string): unknown {
  const u = url.split('?')[0];

  if (u === '/auth/moi') return ok(membreDemo);
  if (u === '/analytics/apercu') return ok(apercu);
  if (u === '/analytics/performance-membres') return ok(perf);
  if (u === '/analytics/charge') return ok(charge);
  if (u === '/analytics/repartition') return ok(repartition);
  if (u.startsWith('/analytics/evolution')) {
    const m = /mois=(\d+)/.exec(url);
    return ok(evolution(m ? parseInt(m[1], 10) : 6));
  }
  if (u.startsWith('/analytics/timeline/')) return ok(timeline);
  if (u === '/projets') return ok(projets);
  if (/^\/projets\/.+\/taches$/.test(u)) return ok(kanban);
  if (u === '/membres') return ok(membres);
  if (u === '/contribution') return ok(contribution);
  if (u === '/contribution/projection') return ok(projection);
  if (u === '/calendrier') return ok(evenements);
  if (u === '/ia/rapports') return ok(rapports);
  if (/^\/ia\/rapports\/.+/.test(u) && method === 'get') {
    const id = u.split('/').pop()!;
    return ok(rapportContenu[id] ?? rapportContenu.r1);
  }
  if (u === '/ia/synthese') return ok(rapportContenu.r2);
  if (/^\/ia\/projets\/.+\/rapport$/.test(u)) return ok(rapportContenu.r1);

  if (u === '/messagerie/conversations') {
    return ok([
      {
        id: 'cv1', type: 'CANAL', nom: 'Équipe TontineBénin', interlocuteur: null,
        membres: membres.slice(0, 4),
        dernierMessage: { id: 'm3', type: 'TEXTE', contenu: 'Parfait, on avance 💪', creeLe: jour(0), auteur: { id: 'b', nomComplet: 'ADJOVI Marc' } },
        nonLus: 0,
      },
    ]);
  }
  if (/^\/messagerie\/conversations\/.+\/messages$/.test(u)) {
    return ok([
      { id: 'm1', type: 'TEXTE', contenu: 'Salut l’équipe ! On démarre les cotisations aujourd’hui 🚀', creeLe: jour(0), auteur: { id: 'a', nomComplet: 'GOUTIN Alphonsine', photoUrl: null } },
      { id: 'm2', type: 'TEXTE', contenu: 'Super, je m’occupe de l’intégration KKiaPay', creeLe: jour(0), auteur: { id: 'b', nomComplet: 'ADJOVI Marc', photoUrl: null } },
      { id: 'm3', type: 'TEXTE', contenu: 'Parfait, on avance 💪', creeLe: jour(0), auteur: { id: 'b', nomComplet: 'ADJOVI Marc', photoUrl: null } },
    ]);
  }

  // Mutations et routes non couvertes : succès générique (démo lecture seule)
  return ok({ id: 'demo', ...{} });
}

export function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const data = resoudre((config.method ?? 'get').toLowerCase(), config.url ?? '');
  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse);
}
