'use client';

import { useEffect, useState } from 'react';
import { Crown, Mail } from 'lucide-react';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

interface Membre {
  id: string;
  nomComplet: string;
  email: string;
  typeMembre: string;
  role: string;
  statut: string;
  poste?: string | null;
  photoUrl?: string | null;
}
interface LigneContribution {
  membre: { id: string };
  terminees: number;
  enCours: number;
  poidsContribution: number;
}

const COULEUR_TYPE: Record<string, string> = {
  FONDATEUR: 'bg-or/20 text-attention',
  COFONDATEUR: 'bg-brand/15 text-brand',
  COLLABORATEUR: 'bg-brand/10 text-brand',
  PRESTATAIRE: 'bg-texte-sec/15 text-texte-sec',
  STAGIAIRE: 'bg-texte-sec/15 text-texte-sec',
};
const COULEUR_STATUT: Record<string, string> = {
  ACTIF: 'bg-succes/15 text-succes',
  INACTIF: 'bg-texte-sec/15 text-texte-sec',
  SUSPENDU: 'bg-annuler/15 text-annuler',
};

export default function EquipePage() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [contrib, setContrib] = useState<Record<string, LigneContribution>>({});
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([api.get('/membres'), api.get('/contribution')]);
        setMembres(m.data.donnees ?? m.data);
        const map: Record<string, LigneContribution> = {};
        for (const l of c.data.donnees.lignes as LigneContribution[]) map[l.membre.id] = l;
        setContrib(map);
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
              return (
                <Card key={m.id} className="flex flex-col gap-4">
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
                      <p className="truncate text-sm text-texte-sec">{m.poste ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_TYPE[m.typeMembre] ?? ''}`}>{m.typeMembre}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-texte-sec">{m.role}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_STATUT[m.statut] ?? ''}`}>{m.statut}</span>
                  </div>

                  <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-sm text-texte-sec hover:text-brand">
                    <Mail size={14} /> <span className="truncate">{m.email}</span>
                  </a>

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
    </>
  );
}
