'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ConnexionPage() {
  const { connexion } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [charge, setCharge] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setCharge(true);
    try {
      await connexion(email, motDePasse);
      router.replace('/dashboard');
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErreur(ax.response?.data?.message ?? 'Connexion impossible. Vérifie tes identifiants.');
    } finally {
      setCharge(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-fond px-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-xl font-bold text-white">
            TB
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-texte">TontineBénin</h1>
            <p className="text-sm text-texte-sec">Project Manager</p>
          </div>
        </div>

        <form onSubmit={soumettre} className="space-y-4 rounded-2xl border border-bordure bg-surface p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@tontinebenin.bj"
              className="w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-texte">Mot de passe</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-bordure bg-surface-2 px-3 py-2.5 text-sm text-texte outline-none transition focus:border-brand"
            />
          </div>

          {erreur && (
            <p className="rounded-lg bg-annuler/10 px-3 py-2 text-sm text-annuler">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={charge}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-fonce disabled:opacity-60"
          >
            {charge ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-texte-sec">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="font-medium text-brand hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
