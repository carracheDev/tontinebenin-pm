'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, FileText, Trash2, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

interface Projet { id: string; nom: string }
interface RapportListe { id: string; type: string; projetId: string | null; genereeLe: string }
interface RapportComplet extends RapportListe {
  contenu: string;
  genereParIA?: boolean;
  source?: string;
}

const TYPES = [
  { v: 'ETAT_PROJET', label: 'État du projet', projet: true },
  { v: 'ANALYSE_RETARDS', label: 'Analyse des retards', projet: true },
  { v: 'PREVISION_RISQUES', label: 'Prévision des risques', projet: true },
  { v: 'PERFORMANCE_EQUIPE', label: 'Performance équipe', projet: true },
  { v: 'SYNTHESE', label: 'Synthèse globale', projet: false },
];
const LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.v, t.label]));

const md = {
  h1: (p: React.ComponentProps<'h1'>) => <h1 className="mb-3 mt-1 text-xl font-bold text-texte" {...p} />,
  h2: (p: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-5 text-base font-semibold text-texte" {...p} />,
  h3: (p: React.ComponentProps<'h3'>) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-texte" {...p} />,
  h4: (p: React.ComponentProps<'h4'>) => <h4 className="mb-1 mt-3 text-sm font-semibold text-texte-sec" {...p} />,
  p: (p: React.ComponentProps<'p'>) => <p className="mb-3 text-sm leading-relaxed text-texte-sec" {...p} />,
  ul: (p: React.ComponentProps<'ul'>) => <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-texte-sec" {...p} />,
  ol: (p: React.ComponentProps<'ol'>) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-texte-sec" {...p} />,
  li: (p: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...p} />,
  strong: (p: React.ComponentProps<'strong'>) => <strong className="font-semibold text-texte" {...p} />,
  em: (p: React.ComponentProps<'em'>) => <em className="italic" {...p} />,
  hr: () => <hr className="my-4 border-bordure" />,
};

export default function IaPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [rapports, setRapports] = useState<RapportListe[]>([]);
  const [projetId, setProjetId] = useState('');
  const [type, setType] = useState('ETAT_PROJET');
  const [actif, setActif] = useState<RapportComplet | null>(null);
  const [genere, setGenere] = useState(false);
  const [erreur, setErreur] = useState('');

  const typeCourant = TYPES.find((t) => t.v === type)!;

  async function chargerRapports() {
    const { data } = await api.get('/ia/rapports');
    setRapports(data.donnees);
  }
  useEffect(() => {
    (async () => {
      const [p] = await Promise.all([api.get('/projets'), chargerRapports()]);
      setProjets(p.data.donnees);
      if (p.data.donnees[0]) setProjetId(p.data.donnees[0].id);
    })();
  }, []);

  async function generer() {
    setErreur('');
    setGenere(true);
    try {
      let rep;
      if (!typeCourant.projet) {
        rep = await api.post('/ia/synthese');
      } else {
        if (!projetId) {
          setErreur('Sélectionne un projet.');
          setGenere(false);
          return;
        }
        rep = await api.post(`/ia/projets/${projetId}/rapport`, { type });
      }
      setActif(rep.data.donnees);
      await chargerRapports();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Génération impossible.');
    } finally {
      setGenere(false);
    }
  }

  async function ouvrir(id: string) {
    const { data } = await api.get(`/ia/rapports/${id}`);
    setActif(data.donnees);
  }
  async function supprimer(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await api.delete(`/ia/rapports/${id}`);
    if (actif?.id === id) setActif(null);
    chargerRapports();
  }

  const champ =
    'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <>
      <Header titre="Assistant IA" />
      <main className="space-y-6 p-6">
        {/* Panneau génération */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-tuile text-brand">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-texte">Générer un rapport</h2>
              <p className="text-sm text-texte-sec">Ancré sur tes vraies données · enrichi par l’IA si disponible</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={champ}>
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Projet</label>
              <select
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                disabled={!typeCourant.projet}
                className={`${champ} disabled:opacity-50`}
              >
                {!typeCourant.projet && <option>— (global) —</option>}
                {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <button
              onClick={generer}
              disabled={genere}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
            >
              {genere ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {genere ? 'Génération…' : 'Générer'}
            </button>
          </div>
          {erreur && <p className="mt-3 rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          {/* Historique */}
          <Card className="h-fit">
            <h3 className="mb-3 text-sm font-semibold text-texte">Historique ({rapports.length})</h3>
            {rapports.length === 0 ? (
              <p className="text-sm text-texte-sec">Aucun rapport généré.</p>
            ) : (
              <div className="space-y-1.5">
                {rapports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => ouvrir(r.id)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      actif?.id === r.id ? 'bg-brand-tuile text-brand' : 'text-texte-sec hover:bg-surface-2'
                    }`}
                  >
                    <FileText size={15} className="shrink-0" />
                    <span className="flex-1 truncate">
                      {LABEL[r.type] ?? r.type}
                      <span className="block text-xs opacity-70">
                        {new Date(r.genereeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span onClick={(e) => supprimer(r.id, e)} className="opacity-0 transition group-hover:opacity-100 hover:text-annuler">
                      <Trash2 size={15} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Lecteur */}
          <Card className="min-h-[50vh]">
            {actif ? (
              <>
                <div className="mb-4 flex items-center justify-between border-b border-bordure pb-4">
                  <span className="rounded-full bg-brand-tuile px-3 py-1 text-xs font-semibold text-brand">
                    {LABEL[actif.type] ?? actif.type}
                  </span>
                  {actif.source && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        actif.genereParIA ? 'bg-succes/10 text-succes' : 'bg-texte-sec/10 text-texte-sec'
                      }`}
                    >
                      {actif.genereParIA ? `✨ IA (${actif.source})` : '📊 déterministe'}
                    </span>
                  )}
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                  {actif.contenu}
                </ReactMarkdown>
              </>
            ) : (
              <div className="grid h-full min-h-[40vh] place-items-center text-center">
                <div className="flex flex-col items-center gap-2 text-texte-sec">
                  <Sparkles size={28} className="text-brand/40" />
                  <p className="text-sm">Génère un rapport ou sélectionne-en un dans l’historique.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
