'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

export default function InscriptionPage() {
  const { inscription } = useAuth();
  const router = useRouter();
  const [nomComplet, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [poste, setPoste] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [charge, setCharge] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setCharge(true);
    try {
      await inscription(nomComplet, email, motDePasse, poste || undefined);
      router.replace('/dashboard');
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Inscription impossible.');
    } finally {
      setCharge(false);
    }
  }

  const champ =
    'w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand';

  return (
    <div className="relative grid min-h-screen place-items-center bg-fond px-4 py-10">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">
            TB
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-texte">Créer un compte</h1>
            <p className="text-sm text-texte-sec">TontineBénin Project Manager</p>
          </div>
        </div>

        <form onSubmit={soumettre} className="space-y-4 rounded-2xl border border-bordure bg-surface p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Nom complet</label>
            <input required value={nomComplet} onChange={(e) => setNom(e.target.value)} placeholder="SODJINOU Carrache" className={champ} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@tontinebenin.bj" className={champ} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Poste <span className="text-texte-sec">(optionnel)</span></label>
            <input value={poste} onChange={(e) => setPoste(e.target.value)} placeholder="Cofondateur / CTO…" className={champ} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Mot de passe</label>
            <input type="password" required minLength={6} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="6 caractères min." className={champ} />
          </div>

          {erreur && <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>}

          <button type="submit" disabled={charge} className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60">
            {charge ? 'Création…' : 'Créer mon compte'}
          </button>

          <p className="text-center text-sm text-texte-sec">
            Déjà inscrit ?{' '}
            <Link href="/connexion" className="font-medium text-brand hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
