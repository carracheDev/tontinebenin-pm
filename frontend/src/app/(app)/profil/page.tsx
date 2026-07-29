'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, Lock } from 'lucide-react';
import { AxiosError } from 'axios';
import { Header } from '@/components/header';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface MonProfil {
  nomComplet: string;
  email: string;
  telephone?: string | null;
  poste?: string | null;
  typeMembre: string;
  role: string;
  disponibilite?: string | null;
  competences?: string[];
}

export default function ProfilPage() {
  const { rafraichir } = useAuth();
  const [profil, setProfil] = useState<MonProfil | null>(null);
  const [nomComplet, setNomComplet] = useState('');
  const [telephone, setTelephone] = useState('');
  const [disponibilite, setDisponibilite] = useState('');
  const [competences, setCompetences] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [charge, setCharge] = useState(false);
  const [ok, setOk] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/auth/moi');
      const p: MonProfil = data.donnees ?? data;
      setProfil(p);
      setNomComplet(p.nomComplet ?? '');
      setTelephone(p.telephone ?? '');
      setDisponibilite(p.disponibilite ?? '');
      setCompetences((p.competences ?? []).join(', '));
    })();
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(''); setOk(false); setCharge(true);
    try {
      await api.patch('/membres/moi', {
        nomComplet: nomComplet.trim(),
        telephone: telephone.trim() || undefined,
        disponibilite: disponibilite.trim() || undefined,
        competences: competences.split(',').map((c) => c.trim()).filter(Boolean),
        motDePasse: motDePasse.trim() || undefined,
      });
      setMotDePasse('');
      setOk(true);
      await rafraichir();
      setTimeout(() => setOk(false), 2500);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Enregistrement impossible.');
    } finally {
      setCharge(false);
    }
  }

  const champ = 'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <>
      <Header titre="Mon profil" />
      <main className="mx-auto max-w-2xl space-y-5 p-4 md:p-6">
        {/* Infos non modifiables — gérées par l'admin */}
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-xs text-texte-sec">Titre / poste</p>
            <p className="text-sm font-medium text-texte">{profil?.poste || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-texte-sec">Type</p>
            <p className="text-sm font-medium text-texte">{profil?.typeMembre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-texte-sec">Rôle</p>
            <p className="text-sm font-medium text-texte">{profil?.role ?? '—'}</p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-texte-sec">
            <Lock size={13} /> Modifiable seulement par l’administrateur
          </p>
        </Card>

        <Card>
          <form onSubmit={enregistrer} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Nom complet *</label>
              <input required minLength={2} value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} className={champ} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Email</label>
              <input value={profil?.email ?? ''} disabled className={`${champ} cursor-not-allowed opacity-60`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-texte">Téléphone</label>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className={champ} placeholder="+229 …" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-texte">Disponibilité</label>
                <input value={disponibilite} onChange={(e) => setDisponibilite(e.target.value)} className={champ} placeholder="Temps plein, 20 h/semaine…" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Compétences</label>
              <input value={competences} onChange={(e) => setCompetences(e.target.value)} className={champ} placeholder="Flutter, NestJS, Design… (séparées par des virgules)" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-texte">Nouveau mot de passe</label>
              <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={champ} placeholder="Laisser vide pour ne pas changer" />
            </div>

            {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

            <div className="flex items-center justify-end gap-3">
              {ok && <span className="flex items-center gap-1 text-sm font-medium text-succes"><Check size={16} /> Enregistré</span>}
              <button type="submit" disabled={charge} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60">
                {charge && <Loader2 size={15} className="animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </Card>
      </main>
    </>
  );
}
