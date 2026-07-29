'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { DEMO } from '@/lib/demo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { membre, chargement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!chargement && !membre) router.replace('/connexion');
  }, [chargement, membre, router]);

  if (chargement || !membre) {
    return (
      <div className="grid min-h-screen place-items-center bg-fond">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bordure border-t-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond">
      <Sidebar />
      <MobileNav />
      <div className="pb-16 lg:pb-0 lg:pl-64">
        {DEMO && (
          <div className="bg-brand px-4 py-1.5 text-center text-xs font-medium text-white">
            Mode démonstration — données fictives à des fins d’aperçu du design
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
