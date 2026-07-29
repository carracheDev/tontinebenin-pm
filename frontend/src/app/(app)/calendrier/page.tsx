'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { PiecesJointes, type PJ } from '@/components/pieces-jointes';

interface Evenement {
  id: string;
  titre: string;
  description?: string | null;
  type: string;
  debut: string;
  fin?: string | null;
  projetId?: string | null;
}
interface Projet { id: string; nom: string }

const TYPES = ['REUNION', 'DEADLINE', 'LANCEMENT', 'RELEASE', 'AUTRE'];
const COULEUR_TYPE: Record<string, string> = {
  REUNION: 'var(--brand)',
  DEADLINE: 'var(--annuler)',
  LANCEMENT: 'var(--attention)',
  RELEASE: 'var(--succes)',
  AUTRE: 'var(--texte-sec)',
};
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function CalendrierPage() {
  const [curseur, setCurseur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [modal, setModal] = useState<null | { date?: string }>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const annee = curseur.getFullYear();
  const mois = curseur.getMonth();

  const charger = useCallback(async () => {
    const from = new Date(annee, mois, 1).toISOString();
    const to = new Date(annee, mois + 1, 0, 23, 59, 59).toISOString();
    const { data } = await api.get('/calendrier', { params: { from, to } });
    setEvenements(data.donnees);
  }, [annee, mois]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { api.get('/projets').then((r) => setProjets(r.data.donnees)); }, []);

  const decalage = (new Date(annee, mois, 1).getDay() + 6) % 7; // Lundi = 0
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const nbCellules = Math.ceil((decalage + nbJours) / 7) * 7;

  const evenementsDuJour = (jour: number) =>
    evenements.filter((e) => { const d = new Date(e.debut); return d.getFullYear() === annee && d.getMonth() === mois && d.getDate() === jour; });

  const auj = new Date();
  const estAujourdhui = (jour: number) => auj.getFullYear() === annee && auj.getMonth() === mois && auj.getDate() === jour;

  async function supprimer(id: string) {
    await api.delete(`/calendrier/${id}`);
    charger();
  }

  return (
    <>
      <Header titre="Calendrier" />
      <main className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurseur(new Date(annee, mois - 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-bordure bg-surface text-texte-sec hover:text-brand"><ChevronLeft size={18} /></button>
            <span className="min-w-44 text-center text-base font-semibold text-texte">{MOIS[mois]} {annee}</span>
            <button onClick={() => setCurseur(new Date(annee, mois + 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-bordure bg-surface text-texte-sec hover:text-brand"><ChevronRight size={18} /></button>
            <button onClick={() => { const d = new Date(); setCurseur(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="ml-2 rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte-sec hover:text-brand">Aujourd’hui</button>
          </div>
          <button onClick={() => setModal({})} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce">
            <Plus size={17} /> Nouvel événement
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-bordure bg-surface">
          <div className="grid grid-cols-7 border-b border-bordure">
            {JOURS.map((j) => <div key={j} className="px-2 py-2.5 text-center text-xs font-semibold text-texte-sec">{j}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: nbCellules }).map((_, i) => {
              const jour = i - decalage + 1;
              const valide = jour >= 1 && jour <= nbJours;
              const evs = valide ? evenementsDuJour(jour) : [];
              return (
                <div
                  key={i}
                  onClick={() => valide && setModal({ date: `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}` })}
                  className={`min-h-24 border-b border-r border-bordure p-1.5 last:border-r-0 ${valide ? 'cursor-pointer hover:bg-surface-2/50' : 'bg-surface-2/30'}`}
                >
                  {valide && (
                    <>
                      <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${estAujourdhui(jour) ? 'bg-brand font-semibold text-white' : 'text-texte-sec'}`}>{jour}</span>
                      <div className="mt-1 space-y-1">
                        {evs.slice(0, 3).map((e) => (
                          <div key={e.id} className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white" style={{ background: COULEUR_TYPE[e.type] ?? 'var(--brand)' }} title={e.titre}>
                            {new Date(e.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {e.titre}
                          </div>
                        ))}
                        {evs.length > 3 && <div className="px-1 text-[11px] text-texte-sec">+{evs.length - 3} autre(s)</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Liste des événements du mois */}
        {evenements.length > 0 && (
          <div className="rounded-2xl border border-bordure bg-surface p-5">
            <h2 className="mb-3 text-base font-semibold text-texte">Événements du mois</h2>
            <div className="space-y-2">
              {[...evenements].sort((a, b) => +new Date(a.debut) - +new Date(b.debut)).map((e) => (
                <div key={e.id} className="group flex items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COULEUR_TYPE[e.type] ?? 'var(--brand)' }} />
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setDetailId(e.id)}>
                    <p className="truncate text-sm font-medium text-texte">{e.titre}</p>
                    <p className="text-xs text-texte-sec">
                      {new Date(e.debut).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {e.type} · 📎
                    </p>
                  </div>
                  <button onClick={() => supprimer(e.id)} className="opacity-0 transition group-hover:opacity-100 hover:text-annuler"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal && <ModalEvenement date={modal.date} projets={projets} onFerme={() => setModal(null)} onCree={charger} />}
      {detailId && <DetailEvenement id={detailId} onFerme={() => setDetailId(null)} />}
    </>
  );
}

function ModalEvenement({ date, projets, onFerme, onCree }: { date?: string; projets: Projet[]; onFerme: () => void; onCree: () => void }) {
  const [titre, setTitre] = useState('');
  const [type, setType] = useState('REUNION');
  const [debut, setDebut] = useState(date ? `${date}T09:00` : '');
  const [fin, setFin] = useState('');
  const [description, setDescription] = useState('');
  const [projetId, setProjetId] = useState('');
  const [erreur, setErreur] = useState('');
  const [charge, setCharge] = useState(false);

  // date/heure minimale = maintenant (empêche de programmer dans le passé)
  const maintenant = new Date();
  const minLocal = new Date(maintenant.getTime() - maintenant.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (debut && debut < minLocal) { setErreur('La date de début ne peut pas être dans le passé.'); return; }
    if (fin && debut && fin < debut) { setErreur('La date de fin doit être après le début.'); return; }
    setErreur(''); setCharge(true);
    try {
      await api.post('/calendrier', {
        titre, type,
        debut: new Date(debut).toISOString(),
        fin: fin ? new Date(fin).toISOString() : undefined,
        description: description || undefined,
        projetId: projetId || undefined,
      });
      onCree(); onFerme();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Création impossible.');
    } finally { setCharge(false); }
  }

  const champ = 'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="w-full max-w-md rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texte">Nouvel événement</h2>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={20} /></button>
        </div>
        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Titre *</label>
            <input required minLength={2} value={titre} onChange={(e) => setTitre(e.target.value)} className={champ} placeholder="Réunion d’équipe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={champ}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Projet</label>
              <select value={projetId} onChange={(e) => setProjetId(e.target.value)} className={champ}>
                <option value="">— aucun —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Début *</label>
              <input type="datetime-local" required min={minLocal} value={debut} onChange={(e) => setDebut(e.target.value)} className={champ} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Fin</label>
              <input type="datetime-local" min={debut || minLocal} value={fin} onChange={(e) => setFin(e.target.value)} className={champ} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={champ} />
          </div>

          {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onFerme} className="rounded-lg border border-bordure px-4 py-2 text-sm font-medium text-texte-sec transition hover:text-texte">Annuler</button>
            <button type="submit" disabled={charge} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60">
              {charge ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Détail d'un événement (infos + pièces jointes) ---------- */
interface EvenementDetail {
  id: string;
  titre: string;
  description?: string | null;
  type: string;
  debut: string;
  fin?: string | null;
  piecesJointes?: PJ[];
}

function DetailEvenement({ id, onFerme }: { id: string; onFerme: () => void }) {
  const [ev, setEv] = useState<EvenementDetail | null>(null);

  const charger = useCallback(async () => {
    const { data } = await api.get(`/calendrier/${id}`);
    setEv(data.donnees);
  }, [id]);
  useEffect(() => { charger(); }, [charger]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-bordure bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        {!ev ? (
          <p className="text-sm text-texte-sec">Chargement…</p>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-texte">{ev.titre}</h2>
              <button onClick={onFerme} className="shrink-0 text-texte-sec hover:text-texte"><X size={20} /></button>
            </div>
            <p className="mb-1 text-sm text-texte-sec">
              {new Date(ev.debut).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} · {ev.type}
            </p>
            {ev.description && <p className="mb-4 mt-2 whitespace-pre-wrap text-sm text-texte-sec">{ev.description}</p>}

            <div className="mt-4 border-t border-bordure pt-4">
              <PiecesJointes
                liste={ev.piecesJointes ?? []}
                urlUpload={`/calendrier/${id}/pieces-jointes`}
                baseDownload="/calendrier/pieces-jointes"
                baseDelete="/calendrier/pieces-jointes"
                onChange={charger}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
