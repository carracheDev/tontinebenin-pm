'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, MessageSquare, Paperclip, X, CalendarClock, Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PiecesJointes, type PJ } from '@/components/pieces-jointes';
import { metaStatut } from '@/lib/statuts-taches';

interface Assigne { id: string; nomComplet: string; photoUrl?: string | null }
interface Tache {
  id: string;
  titre: string;
  description?: string | null;
  statut: string;
  priorite: string;
  echeance?: string | null;
  assigne?: Assigne | null;
  _count?: { commentaires: number; piecesJointes: number };
}
interface Colonne { statut: string; taches: Tache[] }
interface Projet { id: string; nom: string }

const COLS: { statut: string; label: string; accent: string }[] = [
  { statut: 'A_FAIRE', label: 'À faire', accent: 'var(--texte-sec)' },
  { statut: 'EN_COURS', label: 'En cours', accent: 'var(--brand)' },
  { statut: 'DEV_TERMINE', label: 'Dév. terminé', accent: 'var(--brand)' },
  { statut: 'ATTENTE_TEST', label: 'Attente test', accent: 'var(--attention)' },
  { statut: 'EN_TEST', label: 'En test', accent: 'var(--attention)' },
  { statut: 'TEST_VALIDE', label: 'Test validé', accent: 'var(--brand)' },
  { statut: 'VALIDE_MANAGER', label: 'Validé mgr', accent: 'var(--succes)' },
  { statut: 'TERMINE', label: 'Terminé', accent: 'var(--succes)' },
  { statut: 'BLOQUE', label: 'Bloqué', accent: 'var(--annuler)' },
];
const PRIORITES = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];
const COULEUR_PRIO: Record<string, string> = {
  BASSE: 'bg-texte-sec/15 text-texte-sec',
  MOYENNE: 'bg-brand/15 text-brand',
  HAUTE: 'bg-attention/15 text-attention',
  CRITIQUE: 'bg-annuler/15 text-annuler',
};

export default function TachesPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetId, setProjetId] = useState('');
  const [colonnes, setColonnes] = useState<Colonne[]>([]);
  const [membres, setMembres] = useState<Assigne[]>([]);
  const [charge, setCharge] = useState(true);
  const [modal, setModal] = useState(false);
  const [drag, setDrag] = useState<{ id: string; from: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const chargerKanban = useCallback(async (pid: string) => {
    if (!pid) return;
    const { data } = await api.get(`/projets/${pid}/taches`);
    setColonnes(data.donnees.colonnes);
  }, []);

  useEffect(() => {
    (async () => {
      const [p, m] = await Promise.all([api.get('/projets'), api.get('/membres')]);
      setProjets(p.data.donnees);
      setMembres(m.data.donnees ?? m.data);
      const premier = p.data.donnees[0]?.id ?? '';
      setProjetId(premier);
      if (premier) await chargerKanban(premier);
      setCharge(false);
    })();
  }, [chargerKanban]);

  async function deposer(statut: string) {
    if (!drag || drag.from === statut) {
      setDrag(null);
      return;
    }
    const idTache = drag.id;
    // Optimiste : déplace la carte tout de suite
    setColonnes((cols) => {
      const copie = cols.map((c) => ({ ...c, taches: [...c.taches] }));
      let carte: Tache | undefined;
      for (const c of copie) {
        const i = c.taches.findIndex((t) => t.id === idTache);
        if (i >= 0) { carte = c.taches.splice(i, 1)[0]; break; }
      }
      if (carte) {
        carte.statut = statut;
        copie.find((c) => c.statut === statut)?.taches.push(carte);
      }
      return copie;
    });
    const ordre = colonnes.find((c) => c.statut === statut)?.taches.length ?? 0;
    setDrag(null);
    try {
      await api.patch(`/taches/${idTache}/deplacer`, { statut, ordre });
    } catch {
      chargerKanban(projetId); // rollback via refetch
    }
  }

  return (
    <>
      <Header titre="Tâches" />
      <main className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={projetId}
            onChange={(e) => { setProjetId(e.target.value); chargerKanban(e.target.value); }}
            className="rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte outline-none focus:border-brand"
          >
            {projets.length === 0 && <option>Aucun projet</option>}
            {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <button
            onClick={() => setModal(true)}
            disabled={!projetId}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-50"
          >
            <Plus size={17} /> Nouvelle tâche
          </button>
        </div>

        {charge ? (
          <p className="text-sm text-texte-sec">Chargement…</p>
        ) : !projetId ? (
          <Card className="grid min-h-[40vh] place-items-center text-center">
            <p className="text-sm text-texte-sec">Crée d’abord un projet dans la section « Projets ».</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {COLS.map((col) => {
              const c = colonnes.find((x) => x.statut === col.statut);
              const taches = c?.taches ?? [];
              return (
                <div
                  key={col.statut}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => deposer(col.statut)}
                  className="flex flex-col rounded-2xl border border-bordure bg-surface-2/50 p-3"
                >
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.accent }} />
                    <span className="text-sm font-semibold text-texte">{col.label}</span>
                    <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs text-texte-sec">{taches.length}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {taches.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDrag({ id: t.id, from: t.statut })}
                        onClick={() => setDetailId(t.id)}
                        className="cursor-pointer rounded-xl border border-bordure bg-surface p-3 shadow-sm transition hover:border-brand active:cursor-grabbing"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-texte">{t.titre}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${COULEUR_PRIO[t.priorite] ?? ''}`}>
                            {t.priorite}
                          </span>
                        </div>
                        {t.description && <p className="mb-2 line-clamp-2 text-xs text-texte-sec">{t.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-texte-sec">
                          {t.echeance && (
                            <span className="flex items-center gap-1">
                              <CalendarClock size={13} />
                              {new Date(t.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          {!!t._count?.commentaires && <span className="flex items-center gap-1"><MessageSquare size={13} />{t._count.commentaires}</span>}
                          {!!t._count?.piecesJointes && <span className="flex items-center gap-1"><Paperclip size={13} />{t._count.piecesJointes}</span>}
                          {t.assigne && (
                            <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-brand text-[10px] font-semibold text-white" title={t.assigne.nomComplet}>
                              {t.assigne.nomComplet.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {taches.length === 0 && <p className="px-1 py-4 text-center text-xs text-texte-sec">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {modal && (
        <ModalTache
          projetId={projetId}
          membres={membres}
          onFerme={() => setModal(false)}
          onCree={() => chargerKanban(projetId)}
        />
      )}

      {detailId && (
        <DetailTache id={detailId} membres={membres} onFerme={() => setDetailId(null)} onMaj={() => chargerKanban(projetId)} />
      )}
    </>
  );
}

/* ---------- Détail d'une tâche (infos + pièces jointes) ---------- */
interface TacheDetail {
  id: string;
  titre: string;
  description?: string | null;
  statut: string;
  priorite: string;
  echeance?: string | null;
  assigne?: Assigne | null;
  piecesJointes?: PJ[];
}

function DetailTache({ id, membres, onFerme, onMaj }: { id: string; membres: Assigne[]; onFerme: () => void; onMaj: () => void }) {
  const { membre } = useAuth();
  const estManager = membre?.role === 'ADMIN' || membre?.role === 'MANAGER';
  const [t, setT] = useState<TacheDetail | null>(null);
  const [edition, setEdition] = useState(false);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    const { data } = await api.get(`/taches/${id}`);
    setT(data.donnees);
  }, [id]);
  useEffect(() => { charger(); }, [charger]);

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette tâche ?')) return;
    setSuppression(true);
    try {
      await api.delete(`/taches/${id}`);
      onMaj();
      onFerme();
    } catch {
      setSuppression(false);
    }
  }

  if (edition && t) {
    return (
      <ModalTache
        projetId=""
        membres={membres}
        tache={t}
        onFerme={() => setEdition(false)}
        onCree={() => { setEdition(false); charger(); onMaj(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        {!t ? (
          <p className="text-sm text-texte-sec">Chargement…</p>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-texte">{t.titre}</h2>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setEdition(true)} title="Modifier" className="grid h-8 w-8 place-items-center rounded-lg text-texte-sec transition hover:bg-surface-2 hover:text-brand"><Pencil size={16} /></button>
                {estManager && (
                  <button onClick={supprimer} disabled={suppression} title="Supprimer" className="grid h-8 w-8 place-items-center rounded-lg text-texte-sec transition hover:bg-annuler/10 hover:text-annuler disabled:opacity-50"><Trash2 size={16} /></button>
                )}
                <button onClick={onFerme} title="Fermer" className="grid h-8 w-8 place-items-center rounded-lg text-texte-sec transition hover:bg-surface-2 hover:text-texte"><X size={18} /></button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${metaStatut(t.statut).classe}`}>{metaStatut(t.statut).label}</span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${COULEUR_PRIO[t.priorite] ?? ''}`}>{t.priorite}</span>
              {t.echeance && (
                <span className="flex items-center gap-1 text-texte-sec">
                  <CalendarClock size={13} />
                  {new Date(t.echeance).toLocaleDateString('fr-FR')}
                </span>
              )}
              {t.assigne && <span className="text-texte-sec">· {t.assigne.nomComplet}</span>}
            </div>
            {t.description && <p className="mb-4 whitespace-pre-wrap text-sm text-texte-sec">{t.description}</p>}

            <div className="border-t border-bordure pt-4">
              <PiecesJointes
                liste={t.piecesJointes ?? []}
                urlUpload={`/taches/${id}/pieces-jointes`}
                baseDownload="/taches/pieces-jointes"
                baseDelete="/pieces-jointes"
                onChange={() => { charger(); onMaj(); }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalTache({
  projetId, membres, tache, onFerme, onCree,
}: { projetId: string; membres: Assigne[]; tache?: TacheDetail; onFerme: () => void; onCree: () => void }) {
  const edition = !!tache;
  const [titre, setTitre] = useState(tache?.titre ?? '');
  const [description, setDescription] = useState(tache?.description ?? '');
  const [priorite, setPriorite] = useState(tache?.priorite ?? 'MOYENNE');
  const [assigneId, setAssigneId] = useState(tache?.assigne?.id ?? '');
  const [echeance, setEcheance] = useState(tache?.echeance ? new Date(tache.echeance).toISOString().slice(0, 10) : '');
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [erreur, setErreur] = useState('');
  const [charge, setCharge] = useState(false);
  const _d = new Date();
  const aujourdHui = new Date(_d.getTime() - _d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(''); setCharge(true);
    try {
      const corps = {
        titre, priorite,
        description: description || undefined,
        assigneId: assigneId || undefined,
        echeance: echeance ? new Date(echeance).toISOString() : undefined,
      };
      if (edition) {
        await api.patch(`/taches/${tache!.id}`, corps);
      } else {
        const { data } = await api.post('/taches', { projetId, ...corps });
        const id = data.donnees?.id as string | undefined;
        // Upload optionnel des pièces jointes après création de la tâche.
        if (id && fichiers.length) {
          for (const f of fichiers) {
            const fd = new FormData();
            fd.append('fichier', f, f.name);
            await api.post(`/taches/${id}/pieces-jointes`, fd);
          }
        }
      }
      onCree(); onFerme();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? (edition ? 'Modification impossible.' : 'Création impossible.'));
    } finally {
      setCharge(false);
    }
  }

  const champ = 'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="w-full max-w-md rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texte">{edition ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={20} /></button>
        </div>
        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Titre *</label>
            <input required minLength={2} value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} placeholder="Intégrer l’API paiement" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={champ} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Priorité</label>
              <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className={champ}>
                {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Échéance</label>
              <input type="date" min={aujourdHui} value={echeance} onChange={(e) => setEcheance(e.target.value)} className={champ} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Assigné à</label>
            <select value={assigneId} onChange={(e) => setAssigneId(e.target.value)} className={champ}>
              <option value="">— personne —</option>
              {membres.map((m) => <option key={m.id} value={m.id}>{m.nomComplet}</option>)}
            </select>
          </div>

          {!edition && (
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
          )}

          {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onFerme} className="rounded-lg border border-bordure px-4 py-2 text-sm font-medium text-texte-sec transition hover:text-texte">Annuler</button>
            <button type="submit" disabled={charge} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60">
              {charge ? (edition ? 'Enregistrement…' : 'Création…') : (edition ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
