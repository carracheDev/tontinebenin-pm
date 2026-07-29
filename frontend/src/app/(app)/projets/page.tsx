'use client';

import { useEffect, useState } from 'react';
import { Plus, FolderKanban, X, Paperclip } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { PiecesJointes, PJ } from '@/components/pieces-jointes';

interface Projet {
  id: string;
  nom: string;
  description?: string | null;
  statut: string;
  priorite: string;
  avancement: number;
  _count?: { taches: number; phases: number; objectifs: number };
}

const STATUTS = ['PLANIFIE', 'EN_COURS', 'EN_PAUSE', 'TERMINE', 'ANNULE'];
const PRIORITES = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];

const COULEUR_STATUT: Record<string, string> = {
  PLANIFIE: 'bg-texte-sec/15 text-texte-sec',
  EN_COURS: 'bg-brand/15 text-brand',
  EN_PAUSE: 'bg-attention/15 text-attention',
  TERMINE: 'bg-succes/15 text-succes',
  ANNULE: 'bg-annuler/15 text-annuler',
};
const COULEUR_PRIORITE: Record<string, string> = {
  BASSE: 'text-texte-sec',
  MOYENNE: 'text-brand',
  HAUTE: 'text-attention',
  CRITIQUE: 'text-annuler',
};

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [charge, setCharge] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function recharger() {
    const { data } = await api.get('/projets');
    setProjets(data.donnees);
    setCharge(false);
  }
  useEffect(() => {
    recharger();
  }, []);

  return (
    <>
      <Header titre="Projets" />
      <main className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-texte-sec">{projets.length} projet(s)</p>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce"
          >
            <Plus size={17} /> Nouveau projet
          </button>
        </div>

        {charge ? (
          <p className="text-sm text-texte-sec">Chargement…</p>
        ) : projets.length === 0 ? (
          <Card className="grid min-h-[40vh] place-items-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-tuile text-brand">
                <FolderKanban size={26} />
              </div>
              <p className="text-texte">Aucun projet pour l’instant.</p>
              <button onClick={() => setModal(true)} className="text-sm font-medium text-brand hover:underline">
                Créer le premier projet
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projets.map((p) => (
              <Card
                key={p.id}
                onClick={() => setDetailId(p.id)}
                className="flex cursor-pointer flex-col gap-3 transition hover:border-brand"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-texte">{p.nom}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COULEUR_STATUT[p.statut] ?? ''}`}>
                    {p.statut}
                  </span>
                </div>
                {p.description && <p className="line-clamp-2 text-sm text-texte-sec">{p.description}</p>}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-texte-sec">
                    <span>Avancement</span>
                    <span>{p.avancement}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.avancement}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-texte-sec">
                  <span>{p._count?.taches ?? 0} tâches</span>
                  <span className={`font-semibold ${COULEUR_PRIORITE[p.priorite] ?? ''}`}>{p.priorite}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {modal && <ModalProjet onFerme={() => setModal(false)} onCree={recharger} />}
      {detailId && <DetailProjet id={detailId} onFerme={() => setDetailId(null)} />}
    </>
  );
}

function DetailProjet({ id, onFerme }: { id: string; onFerme: () => void }) {
  const [projet, setProjet] = useState<(Projet & { piecesJointes?: PJ[] }) | null>(null);

  async function recharger() {
    const { data } = await api.get(`/projets/${id}`);
    setProjet(data.donnees);
  }
  useEffect(() => {
    recharger();
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-texte">{projet?.nom ?? 'Chargement…'}</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={20} /></button>
        </div>
        {projet?.description && <p className="mb-4 text-sm text-texte-sec">{projet.description}</p>}
        {projet && (
          <div className="border-t border-bordure pt-4">
            <PiecesJointes
              liste={projet.piecesJointes ?? []}
              urlUpload={`/projets/${id}/pieces-jointes`}
              baseDownload="/projets/pieces-jointes"
              baseDelete="/projets/pieces-jointes"
              onChange={recharger}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ModalProjet({ onFerme, onCree }: { onFerme: () => void; onCree: () => void }) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState('PLANIFIE');
  const [priorite, setPriorite] = useState('MOYENNE');
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [erreur, setErreur] = useState('');
  const [charge, setCharge] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setCharge(true);
    try {
      const { data } = await api.post('/projets', { nom, description: description || undefined, statut, priorite });
      const id = data.donnees?.id as string | undefined;
      // Upload optionnel des pièces jointes après création du projet.
      if (id && fichiers.length) {
        for (const f of fichiers) {
          const fd = new FormData();
          fd.append('fichier', f, f.name);
          await api.post(`/projets/${id}/pieces-jointes`, fd);
        }
      }
      onCree();
      onFerme();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Création impossible.');
    } finally {
      setCharge(false);
    }
  }

  const champ =
    'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="w-full max-w-md rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texte">Nouveau projet</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Nom *</label>
            <input required minLength={2} value={nom} onChange={(e) => setNom(e.target.value)} className={champ} placeholder="MVP TontineBénin" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={champ} placeholder="Objectif du projet…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)} className={champ}>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Priorité</label>
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className={champ}>
                {PRIORITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">
              Pièces jointes <span className="font-normal text-texte-sec">(optionnel — tous types)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-bordure px-3 py-2.5 text-sm text-texte-sec transition hover:border-brand hover:text-brand">
              <Paperclip size={15} />
              <span>{fichiers.length ? `${fichiers.length} fichier(s) sélectionné(s)` : 'Ajouter des fichiers (images, PDF, ZIP…)'}</span>
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => setFichiers(e.target.files ? Array.from(e.target.files) : [])}
              />
            </label>
            {fichiers.length > 0 && (
              <ul className="mt-2 space-y-1">
                {fichiers.map((f, i) => (
                  <li key={i} className="truncate text-xs text-texte-sec">• {f.name}</li>
                ))}
              </ul>
            )}
          </div>

          {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onFerme} className="rounded-lg border border-bordure px-4 py-2 text-sm font-medium text-texte-sec transition hover:text-texte">
              Annuler
            </button>
            <button type="submit" disabled={charge} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60">
              {charge ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
