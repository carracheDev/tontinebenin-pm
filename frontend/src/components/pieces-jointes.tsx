'use client';

import { useRef, useState } from 'react';
import { Paperclip, FileText, Image as ImageIcon, Download, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface PJ {
  id: string;
  nom: string;
  url: string;
  type?: string | null;
  tailleKo?: number | null;
}

export function PiecesJointes({
  liste,
  urlUpload,
  baseDownload,
  baseDelete,
  onChange,
}: {
  liste: PJ[];
  urlUpload: string; // ex: /taches/:id/pieces-jointes
  baseDownload: string; // ex: /taches/pieces-jointes
  baseDelete: string; // ex: /pieces-jointes
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [charge, setCharge] = useState(false);

  async function upload(files: FileList) {
    setCharge(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('fichier', f, f.name);
        await api.post(urlUpload, fd);
      }
      onChange();
    } finally {
      setCharge(false);
    }
  }

  async function telecharger(pj: PJ) {
    const { data } = await api.get(`${baseDownload}/${pj.url}`, { responseType: 'blob' });
    const u = URL.createObjectURL(data as Blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = pj.nom;
    a.click();
    URL.revokeObjectURL(u);
  }

  async function supprimer(pj: PJ) {
    await api.delete(`${baseDelete}/${pj.id}`);
    onChange();
  }

  const ko = (n?: number | null) => (n && n > 1024 ? `${(n / 1024).toFixed(1)} Mo` : `${n ?? 0} Ko`);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-texte">Pièces jointes ({liste.length})</span>
        <input
          ref={ref}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => ref.current?.click()}
          disabled={charge}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
        >
          {charge ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
          Ajouter
        </button>
      </div>

      {liste.length === 0 ? (
        <p className="rounded-lg border border-dashed border-bordure py-4 text-center text-xs text-texte-sec">
          Aucun fichier. Clique « Ajouter » (images, PDF, ZIP… tous types).
        </p>
      ) : (
        <div className="space-y-1.5">
          {liste.map((pj) => {
            const estImage = pj.type?.startsWith('image/');
            return (
              <div key={pj.id} className="group flex items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  {estImage ? <ImageIcon size={16} /> : <FileText size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-texte">{pj.nom}</p>
                  <p className="text-xs text-texte-sec">{ko(pj.tailleKo)}</p>
                </div>
                <button onClick={() => telecharger(pj)} title="Télécharger" className="text-texte-sec transition hover:text-brand">
                  <Download size={16} />
                </button>
                <button onClick={() => supprimer(pj)} title="Supprimer" className="text-texte-sec opacity-0 transition hover:text-annuler group-hover:opacity-100">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
