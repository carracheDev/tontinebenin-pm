'use client';

import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Ligne {
  membre: { id: string; nomComplet: string; typeMembre: string };
  terminees: number;
  enCours: number;
  enRetard: number;
  tempsPasseH: number;
  ponctualite: number;
  poidsContribution: number;
}
interface Projete { membre: string; typeMembre: string; pourcentageProjete: number; poidsContribution: number }

const PALETTE = ['#2563EB', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4'];

export default function ContributionPage() {
  const { membre } = useAuth();
  const estAdmin = membre?.role === 'ADMIN';
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [projection, setProjection] = useState<Projete[]>([]);
  const [plancher, setPlancher] = useState(60);
  const [avertissement, setAvertissement] = useState('');
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    if (!estAdmin) {
      setCharge(false);
      return;
    }
    (async () => {
      try {
        const [t, p] = await Promise.all([api.get('/contribution'), api.get('/contribution/projection')]);
        setLignes(t.data.donnees.lignes);
        setProjection(p.data.donnees.repartition);
        setPlancher(p.data.donnees.plancherFondateur);
        setAvertissement(p.data.donnees.avertissement);
      } finally {
        setCharge(false);
      }
    })();
  }, [estAdmin]);

  // Accès réservé au fondateur (les membres ne voient pas la contribution)
  if (membre && !estAdmin) {
    return (
      <>
        <Header titre="Contribution" />
        <main className="p-6">
          <Card className="grid min-h-[50vh] place-items-center text-center">
            <div className="flex flex-col items-center gap-2 text-texte-sec">
              <Info size={26} className="text-texte-sec/50" />
              <p className="text-sm">Cette section est réservée au fondateur.</p>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header titre="Contribution" />
      <main className="space-y-6 p-6">
        {/* Bandeau juridique */}
        <div className="flex gap-3 rounded-2xl border border-attention/30 bg-attention/10 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-attention" />
          <p className="text-sm text-texte">
            <span className="font-semibold text-attention">Aucune part n’est attribuée.</span>{' '}
            TontineBénin est une entreprise individuelle — le fondateur détient 100 %. Ce module{' '}
            <span className="font-medium">documente la contribution réelle</span> de chaque membre. La projection
            ci-dessous est <span className="font-medium">indicative et non contractuelle</span> : elle ne
            s’appliquerait qu’en cas de passage en société (SARL), à la décision du fondateur.
          </p>
        </div>

        {/* Tableau de contribution */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-texte">Contribution documentée par membre</h2>
          {charge ? (
            <p className="text-sm text-texte-sec">Chargement…</p>
          ) : lignes.length === 0 ? (
            <p className="text-sm text-texte-sec">Aucun membre actif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-texte-sec">
                    <th className="pb-3 font-medium">Membre</th>
                    <th className="pb-3 font-medium">Terminées</th>
                    <th className="pb-3 font-medium">En cours</th>
                    <th className="pb-3 font-medium">Temps (h)</th>
                    <th className="pb-3 font-medium">Ponctualité</th>
                    <th className="pb-3 font-medium">Poids contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l) => (
                    <tr key={l.membre.id} className="border-t border-bordure">
                      <td className="py-3">
                        <span className="font-medium text-texte">{l.membre.nomComplet}</span>
                        <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-texte-sec">
                          {l.membre.typeMembre}
                        </span>
                      </td>
                      <td className="py-3 text-texte-sec">{l.terminees}</td>
                      <td className="py-3 text-texte-sec">{l.enCours}</td>
                      <td className="py-3 text-texte-sec">{l.tempsPasseH}</td>
                      <td className="py-3 text-texte-sec">{l.ponctualite}%</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${l.poidsContribution}%` }} />
                          </div>
                          <span className="font-medium text-texte">{l.poidsContribution}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Projection */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-texte">Projection indicative (SARL)</h2>
              <p className="text-sm text-texte-sec">Plancher fondateur {plancher}% · reste réparti à la contribution</p>
            </div>
            <span className="rounded-full bg-attention/10 px-3 py-1 text-xs font-semibold text-attention">
              Non contractuel
            </span>
          </div>
          {projection.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projection} dataKey="pourcentageProjete" nameKey="membre" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {projection.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}%`, 'Projeté']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--bordure)', borderRadius: 12, color: 'var(--texte)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 self-center">
                {projection.map((p, i) => (
                  <div key={p.membre} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-texte">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                      {p.membre}
                      <span className="text-xs text-texte-sec">({p.typeMembre})</span>
                    </span>
                    <span className="font-semibold text-texte">{p.pourcentageProjete}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-texte-sec">Pas encore de données.</p>
          )}
          {avertissement && <p className="mt-4 border-t border-bordure pt-3 text-xs italic text-texte-sec">{avertissement}</p>}
        </Card>
      </main>
    </>
  );
}
