'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Flag, Layers } from 'lucide-react';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

interface ChargePoint { membre: string; charge: number }
interface EvoPoint { mois: string; creees: number; terminees: number }
interface Projet { id: string; nom: string }
interface Phase { id: string; nom: string; dateDebut?: string | null; dateFin?: string | null; avancement: number }
interface Jalon { id: string; titre: string; date: string; atteint: boolean; version?: string | null }

const tooltip = { background: 'var(--surface)', border: '1px solid var(--bordure)', borderRadius: 12, color: 'var(--texte)' };

export default function AnalyticsPage() {
  const [charge, setCharge] = useState<ChargePoint[]>([]);
  const [evo, setEvo] = useState<EvoPoint[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetId, setProjetId] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);

  useEffect(() => {
    (async () => {
      const [c, e, p] = await Promise.all([
        api.get('/analytics/charge'),
        api.get('/analytics/evolution?mois=12'),
        api.get('/projets'),
      ]);
      setCharge(c.data.donnees);
      setEvo(e.data.donnees);
      setProjets(p.data.donnees);
      if (p.data.donnees[0]) setProjetId(p.data.donnees[0].id);
    })();
  }, []);

  const chargerTimeline = useCallback(async (pid: string) => {
    if (!pid) return;
    const { data } = await api.get(`/analytics/timeline/${pid}`);
    setPhases(data.donnees.phases);
    setJalons(data.donnees.jalons);
  }, []);
  useEffect(() => { chargerTimeline(projetId); }, [projetId, chargerTimeline]);

  return (
    <>
      <Header titre="Analytics" />
      <main className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Charge de travail */}
          <Card>
            <h2 className="mb-1 text-base font-semibold text-texte">Charge de travail</h2>
            <p className="mb-4 text-sm text-texte-sec">Tâches actives par membre</p>
            <div className="h-72">
              {charge.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charge} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" horizontal={false} />
                    <XAxis type="number" stroke="var(--texte-sec)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="membre" stroke="var(--texte-sec)" fontSize={12} tickLine={false} axisLine={false} width={90} />
                    <Tooltip contentStyle={tooltip} cursor={{ fill: 'var(--surface-2)' }} />
                    <Bar dataKey="charge" name="Actives" fill="#2563EB" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="grid h-full place-items-center text-sm text-texte-sec">Aucune donnée</div>}
            </div>
          </Card>

          {/* Évolution 12 mois */}
          <Card>
            <h2 className="mb-1 text-base font-semibold text-texte">Évolution (12 mois)</h2>
            <p className="mb-4 text-sm text-texte-sec">Tâches créées vs terminées</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bordure)" vertical={false} />
                  <XAxis dataKey="mois" stroke="var(--texte-sec)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--texte-sec)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltip} />
                  <Line type="monotone" dataKey="creees" name="Créées" stroke="#93C5FD" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="terminees" name="Terminées" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Timeline projet */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-texte">Timeline du projet</h2>
              <p className="text-sm text-texte-sec">Phases & jalons</p>
            </div>
            <select value={projetId} onChange={(e) => setProjetId(e.target.value)} className="rounded-lg border border-bordure bg-surface-2 px-3 py-2 text-sm text-texte outline-none focus:border-brand">
              {projets.length === 0 && <option>Aucun projet</option>}
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-texte"><Layers size={15} /> Phases</h3>
              {phases.length ? (
                <div className="space-y-3">
                  {phases.map((ph) => (
                    <div key={ph.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-texte">{ph.nom}</span>
                        <span className="text-texte-sec">{ph.avancement}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${ph.avancement}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-texte-sec">Aucune phase.</p>}
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-texte"><Flag size={15} /> Jalons</h3>
              {jalons.length ? (
                <div className="space-y-2">
                  {jalons.map((j) => (
                    <div key={j.id} className="flex items-center gap-3">
                      <span className={`h-3 w-3 shrink-0 rounded-full border-2 ${j.atteint ? 'border-succes bg-succes' : 'border-texte-sec bg-transparent'}`} />
                      <div className="flex-1">
                        <p className="text-sm text-texte">{j.titre}{j.version ? ` · ${j.version}` : ''}</p>
                        <p className="text-xs text-texte-sec">{new Date(j.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                      {j.atteint && <span className="rounded-full bg-succes/15 px-2 py-0.5 text-xs font-semibold text-succes">Atteint</span>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-texte-sec">Aucun jalon.</p>}
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
