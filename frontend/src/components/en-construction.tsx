'use client';

import { Hammer } from 'lucide-react';
import { Header } from '@/components/header';

export function EnConstruction({ titre }: { titre: string }) {
  return (
    <>
      <Header titre={titre} />
      <main className="p-6">
        <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-dashed border-bordure bg-surface">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-tuile text-brand">
              <Hammer size={26} />
            </div>
            <p className="text-lg font-semibold text-texte">{titre}</p>
            <p className="max-w-xs text-sm text-texte-sec">
              Module en cours de construction. Il arrive dans une prochaine étape.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
