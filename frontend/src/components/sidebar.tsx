'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  MessageCircle,
  CalendarDays,
  Sparkles,
  PieChart,
  Users,
  Award,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { DEMO } from '@/lib/demo';

export const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/projets', label: 'Projets', icon: FolderKanban },
  { href: '/taches', label: 'Tâches', icon: ListChecks },
  { href: '/messagerie', label: 'Messagerie', icon: MessageCircle },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { href: '/ia', label: 'Assistant IA', icon: Sparkles },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/equipe', label: 'Équipe', icon: Users },
  { href: '/contribution', label: 'Contribution', icon: Award, adminSeulement: true },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { membre, deconnexion } = useAuth();
  const estAdmin = membre?.role === 'ADMIN';
  const [nonLus, setNonLus] = useState(0);

  // Compteur de messages non lus (badge) : au montage, à la navigation, en temps réel, + poll
  useEffect(() => {
    let vivant = true;
    const charger = async () => {
      try {
        const { data } = await api.get('/messagerie/non-lus');
        if (vivant) setNonLus(data.donnees?.total ?? 0);
      } catch {
        /* ignore */
      }
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

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-bold text-white">TB</div>
        <div>
          <p className="text-sm font-semibold text-white">TontineBénin</p>
          <p className="text-xs text-sidebar-texte">Project Manager</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.filter((i) => !('adminSeulement' in i) || estAdmin).map(({ href, label, icon: Icon }) => {
          const actif = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                actif
                  ? 'bg-brand text-white shadow-lg shadow-brand/30'
                  : 'text-sidebar-texte hover:bg-sidebar-2 hover:text-white'
              }`}
            >
              <Icon size={19} />
              {label}
              {href === '/messagerie' && nonLus > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-annuler px-1 text-[11px] font-semibold text-white">
                  {nonLus > 99 ? '99+' : nonLus}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!DEMO && (
        <button
          onClick={deconnexion}
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-texte transition hover:bg-sidebar-2 hover:text-annuler"
        >
          <LogOut size={19} />
          Déconnexion
        </button>
      )}
    </aside>
  );
}
