'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FolderKanban, ListChecks, Users, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/header';
import { Card, KpiCard } from '@/components/ui';
import { api } from '@/lib/api';

interface Apercu {
  totalProjets: number;
  projetsActifs: number;
  totalMembres: number;
  totalTaches: number;
  tachesTerminees: number;
  tachesEnRetard: number;
  avancementMoyen: number;
  repartitionStatuts: Record<string, number>;
}
interface EvoPoint { mois: string; creees: number; terminees: number }
interface Repart { membre: string; taches: number; pourcentage: number }
interface Perf {
  membre: { nomComplet: string };
  assignees: number;
  terminees: number;
  enRetard: number;
  tauxCompletion: number;
}

const PALETTE = ['#2563EB', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4'];

export default function DashboardPage() {
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [evo, setEvo] = useState<EvoPoint[]>([]);
  const [repart, setRepart] = useState<Repart[]>([]);
  const [perf, setPerf] = useState<Perf[]>([]);
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, e, r, p] = await Promise.all([
          api.get('/analytics/apercu'),
          api.get('/analytics/evolution?mois=6'),
          api.get('/analytics/repartition'),
          api.get('/analytics/performance-membres'),
        ]);
        setApercu(a.data.donnees);
        setEvo(e.data.donnees);
        setRepart(r.data.donnees);
        setPerf(p.data.donnees);
      } finally {
        setCharge(false);
      }
    })();
  }, []);

  return (
    <>
      <Header titre="Tableau de bord" />
      <main className="space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Projets actifs"
            valeur={apercu ? `${apercu.projetsActifs}/${apercu.totalProjets}` : '—'}
            icon={FolderKanban}
            couleur="brand"
            serie={evo.map((x) => x.creees)}
          />
          <KpiCard
            label="Tâches terminées"
            valeur={apercu?.tachesTerminees ?? '—'}
            icon={ListChecks}
            couleur="succes"
            serie={evo.map((x) => x.terminees)}
          />
          <KpiCard
            label="Membres actifs"
            valeur={apercu?.totalMembres ?? '—'}
            icon={Users}
            couleur="brand"
          />
          <KpiCard
            label="Tâches en retard"
            valeur={apercu?.tachesEnRetard ?? '—'}
            delta={apercu?.tachesEnRetard ? -apercu.tachesEnRetard : 0}
            icon={AlertTriangle}
            couleur="attention"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Rapport mensuel */}
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-texte">Rapport mensuel</h2>
                <p className="text-sm text-texte-sec">Tâches créées vs terminées (6 mois)</p>
              </div>
              <span className="text-2xl font-bold text-brand">{apercu?.avancementMoyen ?? 0}%</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evo} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" vertical={false} />
                  <XAxis dataKey="mois" stroke="var(--texte-sec)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--texte-sec)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--bordure)',
                      borderRadius: 12,
                      color: 'var(--texte)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="creees" name="Créées" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="terminees" name="Terminées" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Répartition (donut) */}
          <Card>
            <h2 className="mb-1 text-base font-semibold text-texte">Répartition des tâches</h2>
            <p className="mb-2 text-sm text-texte-sec">Par membre</p>
            <div className="h-56">
              {repart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={repart} dataKey="taches" nameKey="membre" innerRadius={55} outerRadius={80} paddingAngle={3}>
                      {repart.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--bordure)',
                        borderRadius: 12,
                        color: 'var(--texte)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-texte-sec">Aucune donnée</div>
              )}
            </div>
            <div className="mt-2 space-y-1.5">
              {repart.slice(0, 5).map((r, i) => (
                <div key={r.membre} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-texte-sec">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    {r.membre}
                  </span>
                  <span className="font-medium text-texte">{r.pourcentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance équipe */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-texte">Performance de l’équipe</h2>
          {perf.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-texte-sec">
                    <th className="pb-3 font-medium">Membre</th>
                    <th className="pb-3 font-medium">Assignées</th>
                    <th className="pb-3 font-medium">Terminées</th>
                    <th className="pb-3 font-medium">En retard</th>
                    <th className="pb-3 font-medium">Complétion</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.map((m) => (
                    <tr key={m.membre.nomComplet} className="border-t border-bordure">
                      <td className="py-3 font-medium text-texte">{m.membre.nomComplet}</td>
                      <td className="py-3 text-texte-sec">{m.assignees}</td>
                      <td className="py-3 text-texte-sec">{m.terminees}</td>
                      <td className="py-3 text-texte-sec">{m.enRetard}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${m.tauxCompletion}%` }} />
                          </div>
                          <span className="text-texte">{m.tauxCompletion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-texte-sec">{charge ? 'Chargement…' : 'Aucun membre actif.'}</p>
          )}
        </Card>
      </main>
    </>
  );
}
