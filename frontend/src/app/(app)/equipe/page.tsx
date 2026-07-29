'use client';

import { useEffect, useState } from 'react';
import { Crown, Mail, Pencil, X, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Membre {
  id: string;
  nomComplet: string;
  email: string;
  typeMembre: string;
  role: string;
  statut: string;
  poste?: string | null;
  responsabilites?: string | null;
  photoUrl?: string | null;
}
interface LigneContribution {
  membre: { id: string };
  terminees: number;
  enCours: number;
  poidsContribution: number;
}

// Entreprise individuelle : pas de « cofondateur » — un seul fondateur, le reste = collaborateurs.
const TYPES_MEMBRE = ['FONDATEUR', 'COLLABORATEUR', 'PRESTATAIRE', 'STAGIAIRE'] as const;
const LIBELLE_TYPE: Record<string, string> = {
  FONDATEUR: 'Fondateur',
  COFONDATEUR: 'Collaborateur', // legacy → affiché comme collaborateur
  COLLABORATEUR: 'Collaborateur',
  PRESTATAIRE: 'Prestataire',
  STAGIAIRE: 'Stagiaire',
};
const ROLES = ['ADMIN', 'MANAGER', 'MEMBRE', 'OBSERVATEUR'] as const;
const STATUTS = ['ACTIF', 'INACTIF', 'SUSPENDU', 'PARTI'] as const;

const COULEUR_TYPE: Record<string, string> = {
  FONDATEUR: 'bg-or/20 text-attention',
  COFONDATEUR: 'bg-brand/10 text-brand',
  COLLABORATEUR: 'bg-brand/10 text-brand',
  PRESTATAIRE: 'bg-texte-sec/15 text-texte-sec',
  STAGIAIRE: 'bg-texte-sec/15 text-texte-sec',
};
const COULEUR_STATUT: Record<string, string> = {
  ACTIF: 'bg-succes/15 text-succes',
  INACTIF: 'bg-texte-sec/15 text-texte-sec',
  SUSPENDU: 'bg-annuler/15 text-annuler',
  PARTI: 'bg-texte-sec/15 text-texte-sec',
};

export default function EquipePage() {
  const { membre: moi } = useAuth();
  const estAdmin = moi?.role === 'ADMIN';
  const [membres, setMembres] = useState<Membre[]>([]);
  const [contrib, setContrib] = useState<Record<string, LigneContribution>>({});
  const [charge, setCharge] = useState(true);
  const [edition, setEdition] = useState<Membre | null>(null);

  async function recharger() {
    const [m, c] = await Promise.all([api.get('/membres'), api.get('/contribution')]);
    setMembres(m.data.donnees ?? m.data);
    const map: Record<string, LigneContribution> = {};
    for (const l of c.data.donnees.lignes as LigneContribution[]) map[l.membre.id] = l;
    setContrib(map);
  }

  useEffect(() => {
    (async () => {
      try {
        await recharger();
      } finally {
        setCharge(false);
      }
    })();
  }, []);

  const initiales = (n: string) => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <Header titre="Équipe" />
      <main className="space-y-5 p-6">
        <p className="text-sm text-texte-sec">{membres.length} membre(s)</p>

        {charge ? (
          <p className="text-sm text-texte-sec">Chargement…</p>
        ) : membres.length === 0 ? (
          <Card className="grid min-h-[40vh] place-items-center text-center">
            <p className="text-sm text-texte-sec">Aucun membre pour l’instant.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {membres.map((m) => {
              const c = contrib[m.id];
              const fondateur = m.typeMembre === 'FONDATEUR';
              // Le « poste » est facultatif ; à défaut on affiche le type (jamais « — » nu).
              const sousTitre = m.poste?.trim() || LIBELLE_TYPE[m.typeMembre] || 'Membre';
              return (
                <Card key={m.id} className="relative flex flex-col gap-4">
                  {estAdmin && (
                    <button
                      onClick={() => setEdition(m)}
                      title="Modifier ce membre"
                      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-texte-sec transition hover:bg-surface-2 hover:text-brand"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                        {initiales(m.nomComplet)}
                      </div>
                      {fondateur && (
                        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-or text-white">
                          <Crown size={11} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-texte">{m.nomComplet}</p>
                      <p className="truncate text-sm text-texte-sec">{sousTitre}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_TYPE[m.typeMembre] ?? ''}`}>{LIBELLE_TYPE[m.typeMembre] ?? m.typeMembre}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-texte-sec">{m.role}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_STATUT[m.statut] ?? ''}`}>{m.statut}</span>
                  </div>

                  <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-sm text-texte-sec hover:text-brand">
                    <Mail size={14} /> <span className="truncate">{m.email}</span>
                  </a>

                  {m.responsabilites?.trim() && (
                    <div className="rounded-lg bg-surface-2 px-3 py-2">
                      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-texte-sec">Responsabilités</p>
                      <p className="whitespace-pre-line text-xs text-texte">{m.responsabilites}</p>
                    </div>
                  )}

                  <div className="border-t border-bordure pt-3">
                    <div className="mb-1 flex justify-between text-xs text-texte-sec">
                      <span>Poids de contribution</span>
                      <span className="font-semibold text-texte">{c?.poidsContribution ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${c?.poidsContribution ?? 0}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-texte-sec">
                      {c ? `${c.terminees} terminée(s) · ${c.enCours} en cours` : 'Aucune tâche'}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {edition && (
        <ModalEditerMembre
          membre={edition}
          onFerme={() => setEdition(null)}
          onEnregistre={async () => {
            setEdition(null);
            await recharger();
          }}
        />
      )}
    </>
  );
}

function ModalEditerMembre({
  membre,
  onFerme,
  onEnregistre,
}: {
  membre: Membre;
  onFerme: () => void;
  onEnregistre: () => void;
}) {
  const [poste, setPoste] = useState(membre.poste ?? '');
  const [typeMembre, setTypeMembre] = useState(
    membre.typeMembre === 'COFONDATEUR' ? 'COLLABORATEUR' : membre.typeMembre,
  );
  const [role, setRole] = useState(membre.role);
  const [statut, setStatut] = useState(membre.statut);
  const [responsabilites, setResponsabilites] = useState(membre.responsabilites ?? '');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function enregistrer() {
    setEnCours(true);
    setErreur('');
    try {
      await api.patch(`/membres/${membre.id}`, {
        poste: poste.trim() || undefined,
        typeMembre,
        role,
        statut,
        responsabilites: responsabilites.trim() || undefined,
      });
      onEnregistre();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setErreur(err.response?.data?.message ?? 'Échec de la mise à jour.');
    } finally {
      setEnCours(false);
    }
  }

  const champSelect = 'w-full rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte focus:border-brand focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onFerme}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-texte">Modifier {membre.nomComplet}</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-texte-sec">Poste / rôle affiché</label>
            <input
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="ex : Développeur mobile"
              className={champSelect}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-texte-sec">Type de membre</label>
            <select value={typeMembre} onChange={(e) => setTypeMembre(e.target.value)} className={champSelect}>
              {TYPES_MEMBRE.map((t) => (
                <option key={t} value={t}>{LIBELLE_TYPE[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-texte-sec">Rôle (droits)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={champSelect}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-texte-sec">Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className={champSelect}>
              {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-texte-sec">Responsabilités</label>
            <textarea
              value={responsabilites}
              onChange={(e) => setResponsabilites(e.target.value)}
              rows={4}
              placeholder="Ex : Architecture technique, revue de code, sécurité, base de données, déploiement ; planification, répartition des tâches, réunions, rapports d'avancement."
              className={`${champSelect} resize-none`}
            />
          </div>

          {erreur && <p className="text-xs text-annuler">{erreur}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onFerme} className="rounded-lg px-4 py-2 text-sm font-medium text-texte-sec hover:bg-surface-2">
            Annuler
          </button>
          <button
            onClick={enregistrer}
            disabled={enCours}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
          >
            {enCours && <Loader2 size={14} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
