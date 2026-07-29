'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, ListChecks, MessageCircle, MoreHorizontal,
  X, LogOut,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import { DEMO } from '@/lib/demo';
import { NAV } from './sidebar';
import { ThemeToggle } from './theme-toggle';

// Accès rapides du pouce en bas de l'écran (les autres passent dans « Plus »).
const PRINCIPAUX = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/projets', label: 'Projets', icon: FolderKanban },
  { href: '/taches', label: 'Tâches', icon: ListChecks },
  { href: '/messagerie', label: 'Messages', icon: MessageCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  const { membre, deconnexion } = useAuth();
  const estAdmin = membre?.role === 'ADMIN';
  const [nonLus, setNonLus] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let vivant = true;
    const charger = async () => {
      try {
        const { data } = await api.get('/messagerie/non-lus');
        if (vivant) setNonLus(data.donnees?.total ?? 0);
      } catch { /* ignore */ }
    };
    charger();
    const t = setInterval(charger, 12000);
    const s = getSocket();
    const onMsg = () => charger();
    s?.on('message:nouveau', onMsg);
    return () => {
      vivant = false;
      clearInterval(t);
      s?.off('message:nouveau', onMsg);
    };
  }, [pathname]);

  // Ferme le menu à chaque changement de page.
  useEffect(() => { setMenu(false); }, [pathname]);

  const actif = (href: string) => pathname === href || pathname.startsWith(href + '/');
  // Éléments qui ne sont pas déjà dans la barre du bas.
  const hrefsPrincipaux = PRINCIPAUX.map((p) => p.href);
  const autres = NAV.filter(
    (i) => !hrefsPrincipaux.includes(i.href) && (!('adminSeulement' in i) || estAdmin),
  );

  return (
    <>
      {/* Barre de navigation basse — visible uniquement sur mobile/tablette */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-bordure bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {PRINCIPAUX.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              actif(href) ? 'text-brand' : 'text-texte-sec'
            }`}
          >
            <Icon size={21} />
            {label}
            {href === '/messagerie' && nonLus > 0 && (
              <span className="absolute right-1/2 top-1 grid h-4 min-w-4 translate-x-3 place-items-center rounded-full bg-annuler px-1 text-[10px] font-semibold text-white">
                {nonLus > 99 ? '99+' : nonLus}
              </span>
            )}
          </Link>
        ))}
        <button
          onClick={() => setMenu(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
            menu ? 'text-brand' : 'text-texte-sec'
          }`}
        >
          <MoreHorizontal size={21} />
          Plus
        </button>
      </nav>

      {/* Menu « Plus » — feuille glissant du bas */}
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-bordure bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                  {(membre?.nomComplet ?? '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-texte">{membre?.nomComplet ?? '—'}</p>
                  <p className="text-xs text-texte-sec">{membre?.poste ?? membre?.role ?? ''}</p>
                </div>
              </div>
              <button onClick={() => setMenu(false)} className="text-texte-sec hover:text-texte"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {autres.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border border-bordure px-2 py-3 text-center text-xs font-medium transition ${
                    actif(href) ? 'bg-brand-tuile text-brand' : 'text-texte hover:bg-surface-2'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-bordure pt-3">
              <div className="flex items-center gap-2 text-sm text-texte-sec">
                <ThemeToggle /> Thème
              </div>
              {!DEMO && (
                <button
                  onClick={deconnexion}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-annuler transition hover:bg-annuler/10"
                >
                  <LogOut size={17} /> Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
