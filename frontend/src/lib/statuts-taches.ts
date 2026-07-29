// Workflow de validation des tâches — source unique (front) pour l'ordre,
// les libellés et les couleurs des statuts. Doit rester aligné avec l'enum
// StatutTache du backend.

export interface StatutMeta {
  v: string;
  label: string;
  court: string; // libellé court (badges étroits)
  classe: string; // classes Tailwind (fond + texte)
  managerSeul?: boolean; // réservé ADMIN / MANAGER
}

export const STATUTS_TACHE: StatutMeta[] = [
  { v: 'A_FAIRE', label: 'À faire', court: 'À faire', classe: 'bg-surface-2 text-texte-sec' },
  { v: 'EN_COURS', label: 'En cours', court: 'En cours', classe: 'bg-brand/15 text-brand' },
  { v: 'DEV_TERMINE', label: 'Développement terminé', court: 'Dév. fini', classe: 'bg-info/15 text-info' },
  { v: 'ATTENTE_TEST', label: 'En attente de test', court: 'Attente test', classe: 'bg-attention/15 text-attention' },
  { v: 'EN_TEST', label: 'En test', court: 'En test', classe: 'bg-or/20 text-attention' },
  { v: 'TEST_VALIDE', label: 'Test validé', court: 'Test OK', classe: 'bg-info/15 text-info' },
  { v: 'VALIDE_MANAGER', label: 'Validé par le manager', court: 'Validé mgr', classe: 'bg-brand/20 text-brand', managerSeul: true },
  { v: 'TERMINE', label: 'Terminé', court: 'Terminé', classe: 'bg-succes/15 text-succes', managerSeul: true },
  { v: 'BLOQUE', label: 'Bloqué', court: 'Bloqué', classe: 'bg-annuler/15 text-annuler' },
];

// Statuts « avancement normal » (hors BLOQUE) dans l'ordre du workflow.
export const WORKFLOW = STATUTS_TACHE.filter((s) => s.v !== 'BLOQUE');

const PAR_V = Object.fromEntries(STATUTS_TACHE.map((s) => [s.v, s]));
export const metaStatut = (v: string): StatutMeta =>
  PAR_V[v] ?? { v, label: v, court: v, classe: 'bg-surface-2 text-texte-sec' };
