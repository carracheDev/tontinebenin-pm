'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { LucideIcon } from 'lucide-react';

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-bordure bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function KpiCard({
  label,
  valeur,
  delta,
  icon: Icon,
  couleur = 'brand',
  serie,
}: {
  label: string;
  valeur: string | number;
  delta?: number;
  icon: LucideIcon;
  couleur?: 'brand' | 'succes' | 'attention' | 'annuler';
  serie?: number[];
}) {
  const positif = (delta ?? 0) >= 0;
  const teinte = {
    brand: 'var(--brand)',
    succes: 'var(--succes)',
    attention: 'var(--attention)',
    annuler: 'var(--annuler)',
  }[couleur];
  const donnees = (serie ?? []).map((v, i) => ({ i, v }));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: 'var(--brand-tuile)', color: teinte }}
        >
          <Icon size={20} />
        </div>
        {delta !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              positif ? 'bg-succes/10 text-succes' : 'bg-annuler/10 text-annuler'
            }`}
          >
            {positif ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-texte">{valeur}</p>
        <p className="text-sm text-texte-sec">{label}</p>
      </div>

      {donnees.length > 1 && (
        <div className="h-9">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={donnees}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={teinte} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={teinte} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={teinte} strokeWidth={2} fill={`url(#spark-${label})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
