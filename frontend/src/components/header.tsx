'use client';

import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/lib/auth';

export function Header({ titre }: { titre: string }) {
  const { membre } = useAuth();
  const initiales = (membre?.nomComplet ?? '?')
    .split(' ')
    .map((m) => m[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-bordure bg-surface/80 px-4 py-3.5 backdrop-blur md:px-6">
      <h1 className="text-lg font-semibold text-texte">{titre}</h1>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-bordure bg-surface-2 px-3 py-2 md:flex">
          <Search size={16} className="text-texte-sec" />
          <input
            placeholder="Rechercher…"
            className="w-40 bg-transparent text-sm text-texte outline-none placeholder:text-texte-sec"
          />
        </div>

        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-bordure bg-surface text-texte-sec transition hover:text-brand">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-annuler" />
        </button>

        <ThemeToggle />

        <div className="flex items-center gap-2 pl-1">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
            {initiales}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-texte">{membre?.nomComplet ?? '—'}</p>
            <p className="text-xs text-texte-sec">{membre?.poste ?? membre?.role ?? ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
