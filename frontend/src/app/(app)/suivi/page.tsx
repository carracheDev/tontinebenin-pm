'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Loader2, Lock, History, ClipboardCheck } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { STATUTS_TACHE, WORKFLOW, metaStatut } from '@/lib/statuts-taches';

interface Ref { id: string; nom?: string; nomComplet?: string }
interface Tache {
  id: string;
  titre: string;
  statut: string;
  priorite: string;
  echeance?: string | null;
  assigne?: { id: string; nomComplet: string } | null;
  projet?: { id: string; nom: string } | null;
}
interface Stats {
  total: number;
  pourcentageGlobal: number;
  parStatut: Record<string, number>;
  buckets: Record<string, number>;
  parDeveloppeur: { membre: { id: string; nomComplet: string }; total: number; terminees: number; enCours: number }[];
}

const PRIORITES = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];
const fdate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function SuiviPage() {
  const { membre } = useAuth();
  const estManager = membre?.role === 'ADMIN' || membre?.role === 'MANAGER';

  const [projets, setProjets] = useState<Ref[]>([]);
  const [membres, setMembres] = useState<Ref[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  // filtres
  const [fProjet, setFProjet] = useState('');
  const [fStatut, setFStatut] = useState('');
  const [fDev, setFDev] = useState('');
  const [fPriorite, setFPriorite] = useState('');
  const [fEcheance, setFEcheance] = useState('');

  const charger = useCallback(async () => {
    const p = new URLSearchParams();
    if (fProjet) p.set('projetId', fProjet);
    if (fStatut) p.set('statut', fStatut);
    if (fDev) p.set('assigneId', fDev);
    if (fPriorite) p.set('priorite', fPriorite);
    if (fEcheance) p.set('echeanceAvant', new Date(fEcheance).toISOString());
    const [t, s] = await Promise.all([
      api.get(`/taches?${p.toString()}`),
      api.get(`/taches/statistiques${fProjet ? `?projetId=${fProjet}` : ''}`),
    ]);
    setTaches(t.data.donnees);
    setStats(s.data.donnees);
  }, [fProjet, fStatut, fDev, fPriorite, fEcheance]);

  useEffect(() => {
    Promise.all([api.get('/projets'), api.get('/membres')]).then(([p, m]) => {
      setProjets(p.data.donnees ?? p.data);
      setMembres(m.data.donnees ?? m.data);
    });
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const b = stats?.buckets ?? {};
  const champSel = 'rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte outline-none focus:border-brand';

  return (
    <>
      <Header titre="Suivi & validation" />
      <main className="space-y-5 p-4 md:p-6">
        {/* Vue d'ensemble */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <p className="text-sm text-texte-sec">Avancement global</p>
            <p className="mt-1 text-4xl font-bold text-brand">{stats?.pourcentageGlobal ?? 0}%</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${stats?.pourcentageGlobal ?? 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-texte-sec">{stats?.total ?? 0} tâche(s){fProjet ? ' (projet filtré)' : ' (tous projets)'}</p>
          </Card>

          <Card className="lg:col-span-2">
            <p className="mb-3 text-sm font-semibold text-texte">Répartition</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="À faire" valeur={b.aFaire} />
              <Kpi label="En cours" valeur={b.enCours} accent="text-brand" />
              <Kpi label="Développées" valeur={b.developpees} accent="text-info" />
              <Kpi label="En test" valeur={b.enTest} accent="text-attention" />
              <Kpi label="Test validé" valeur={b.testValide} accent="text-info" />
              <Kpi label="Validées mgr" valeur={b.valideManager} accent="text-brand" />
              <Kpi label="Terminées" valeur={b.terminees} accent="text-succes" />
              <Kpi label="En retard" valeur={b.enRetard} accent="text-annuler" />
            </div>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-texte">Filtrer :</span>
            <select value={fProjet} onChange={(e) => setFProjet(e.target.value)} className={champSel}>
              <option value="">Tous les projets</option>
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <select value={fStatut} onChange={(e) => setFStatut(e.target.value)} className={champSel}>
              <option value="">Tous les statuts</option>
              {STATUTS_TACHE.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
            <select value={fDev} onChange={(e) => setFDev(e.target.value)} className={champSel}>
              <option value="">Tous les développeurs</option>
              {membres.map((m) => <option key={m.id} value={m.id}>{m.nomComplet}</option>)}
            </select>
            <select value={fPriorite} onChange={(e) => setFPriorite(e.target.value)} className={champSel}>
              <option value="">Toutes priorités</option>
              {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm text-texte-sec">
              Échéance avant
              <input type="date" value={fEcheance} onChange={(e) => setFEcheance(e.target.value)} className={champSel} />
            </label>
            {(fProjet || fStatut || fDev || fPriorite || fEcheance) && (
              <button
                onClick={() => { setFProjet(''); setFStatut(''); setFDev(''); setFPriorite(''); setFEcheance(''); }}
                className="text-sm font-medium text-brand hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </Card>

        {/* Tableau des tâches */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-texte-sec">
                <tr>
                  <th className="px-4 py-3">Tâche</th>
                  <th className="px-4 py-3">Assigné</th>
                  <th className="px-4 py-3">Priorité</th>
                  <th className="px-4 py-3">Échéance</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {taches.map((t) => {
                  const meta = metaStatut(t.statut);
                  const retard = t.echeance && t.statut !== 'TERMINE' && new Date(t.echeance).getTime() < Date.now();
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setDetailId(t.id)}
                      className="cursor-pointer border-t border-bordure transition hover:bg-surface-2"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-texte">{t.titre}</p>
                        {t.projet && <p className="text-xs text-texte-sec">{t.projet.nom}</p>}
                      </td>
                      <td className="px-4 py-3 text-texte-sec">{t.assigne?.nomComplet ?? '—'}</td>
                      <td className="px-4 py-3 text-texte-sec">{t.priorite}</td>
                      <td className={`px-4 py-3 ${retard ? 'font-semibold text-annuler' : 'text-texte-sec'}`}>{fdate(t.echeance)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.classe}`}>{meta.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {taches.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-texte-sec">Aucune tâche pour ces filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {detailId && (
        <DetailSuivi
          id={detailId}
          estManager={estManager}
          onFerme={() => setDetailId(null)}
          onChange={charger}
        />
      )}
    </>
  );
}

function Kpi({ label, valeur, accent = 'text-texte' }: { label: string; valeur?: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-bordure px-3 py-2.5">
      <p className={`text-2xl font-bold ${accent}`}>{valeur ?? 0}</p>
      <p className="text-xs text-texte-sec">{label}</p>
    </div>
  );
}

interface HistoLigne {
  id: string;
  champ: string;
  ancienne?: string | null;
  nouvelle?: string | null;
  commentaire?: string | null;
  creeLe: string;
  par?: { nomComplet: string } | null;
}
interface Detail {
  id: string;
  titre: string;
  statut: string;
  assigne?: { nomComplet: string } | null;
  echeance?: string | null;
  historique?: HistoLigne[];
}

function DetailSuivi({
  id, estManager, onFerme, onChange,
}: { id: string; estManager: boolean; onFerme: () => void; onChange: () => void }) {
  const [tache, setTache] = useState<Detail | null>(null);
  const [nouveau, setNouveau] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const recharger = useCallback(async () => {
    const { data } = await api.get(`/taches/${id}`);
    setTache(data.donnees);
    setNouveau(data.donnees.statut);
  }, [id]);
  useEffect(() => { recharger(); }, [recharger]);

  async function valider() {
    if (!nouveau || (nouveau === tache?.statut && !commentaire.trim())) {
      setErreur('Choisis un nouveau statut (ou ajoute un commentaire).');
      return;
    }
    setEnCours(true); setErreur('');
    try {
      await api.patch(`/taches/${id}/statut`, { statut: nouveau, commentaire: commentaire.trim() || undefined });
      setCommentaire('');
      await recharger();
      onChange();
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Changement refusé.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onFerme}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-bordure bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-bordure p-5">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-texte">{tache?.titre ?? 'Chargement…'}</h2>
            <p className="text-xs text-texte-sec">Assigné : {tache?.assigne?.nomComplet ?? '—'} · Échéance : {fdate(tache?.echeance)}</p>
          </div>
          <button onClick={onFerme} className="text-texte-sec hover:text-texte"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* Changer le statut */}
          <div className="mb-5 rounded-xl border border-bordure p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-texte"><ClipboardCheck size={16} /> Faire avancer la tâche</p>
            <select value={nouveau} onChange={(e) => setNouveau(e.target.value)} className="mb-2 w-full rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte outline-none focus:border-brand">
              {[...WORKFLOW, ...STATUTS_TACHE.filter((s) => s.v === 'BLOQUE')].map((s) => (
                <option key={s.v} value={s.v} disabled={s.managerSeul && !estManager}>
                  {s.label}{s.managerSeul && !estManager ? ' (manager)' : ''}
                </option>
              ))}
            </select>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder="Commentaire de validation (optionnel)…"
              className="mb-2 w-full resize-none rounded-lg border border-bordure bg-surface px-3 py-2 text-sm text-texte outline-none focus:border-brand"
            />
            {!estManager && (
              <p className="mb-2 flex items-center gap-1 text-xs text-texte-sec"><Lock size={12} /> « Validé manager » et « Terminé » sont réservés aux managers/admins.</p>
            )}
            {erreur && <p className="mb-2 text-xs text-annuler">{erreur}</p>}
            <button
              onClick={valider}
              disabled={enCours}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
            >
              {enCours && <Loader2 size={14} className="animate-spin" />} Enregistrer le statut
            </button>
          </div>

          {/* Historique des validations */}
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-texte"><History size={16} /> Historique</p>
          <div className="space-y-2">
            {(tache?.historique ?? []).filter((h) => h.champ === 'statut' || h.commentaire).map((h) => (
              <div key={h.id} className="rounded-lg border border-bordure px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-texte">
                    {h.ancienne ? metaStatut(h.ancienne).label : '—'} → <b>{h.nouvelle ? metaStatut(h.nouvelle).label : '—'}</b>
                  </span>
                  <span className="shrink-0 text-xs text-texte-sec">{new Date(h.creeLe).toLocaleString('fr-FR')}</span>
                </div>
                <p className="text-xs text-texte-sec">Par {h.par?.nomComplet ?? 'système'}{h.commentaire ? ` — « ${h.commentaire} »` : ''}</p>
              </div>
            ))}
            {(tache?.historique ?? []).length === 0 && <p className="text-xs text-texte-sec">Aucun changement enregistré.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
