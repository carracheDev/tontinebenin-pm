'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, jetons } from './api';
import { DEMO, membreDemo } from './demo';

export interface Membre {
  id: string;
  nomComplet: string;
  email: string;
  role: string;
  typeMembre: string;
  poste?: string | null;
  photoUrl?: string | null;
}

interface AuthCtx {
  membre: Membre | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (nomComplet: string, email: string, motDePasse: string, poste?: string) => Promise<void>;
  rafraichir: () => Promise<void>;
  deconnexion: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [membre, setMembre] = useState<Membre | null>(null);
  const [chargement, setChargement] = useState(true);

  // Au montage : si un token existe, récupère le profil
  useEffect(() => {
    if (DEMO) {
      setMembre(membreDemo as Membre);
      setChargement(false);
      return;
    }
    (async () => {
      if (!jetons.access) {
        setChargement(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/moi');
        setMembre(data.donnees ?? data);
      } catch {
        jetons.effacer();
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const appliquer = (d: { accessToken: string; refreshToken: string; membre?: Membre } & Record<string, unknown>) => {
    jetons.set(d.accessToken, d.refreshToken);
    if (d.membre) setMembre(d.membre);
  };

  const connexion = useCallback(async (email: string, motDePasse: string) => {
    const { data } = await api.post('/auth/connexion', { email, motDePasse });
    appliquer(data.donnees);
    if (!data.donnees.membre) {
      const moi = await api.get('/auth/moi');
      setMembre(moi.data.donnees ?? moi.data);
    }
  }, []);

  const inscription = useCallback(
    async (nomComplet: string, email: string, motDePasse: string, poste?: string) => {
      const { data } = await api.post('/auth/inscription', { nomComplet, email, motDePasse, poste });
      appliquer(data.donnees);
      if (!data.donnees.membre) {
        const moi = await api.get('/auth/moi');
        setMembre(moi.data.donnees ?? moi.data);
      }
    },
    [],
  );

  const rafraichir = useCallback(async () => {
    if (DEMO || !jetons.access) return;
    const { data } = await api.get('/auth/moi');
    setMembre(data.donnees ?? data);
  }, []);

  const deconnexion = useCallback(() => {
    jetons.effacer();
    setMembre(null);
    window.location.href = '/connexion';
  }, []);

  return (
    <Ctx.Provider value={{ membre, chargement, connexion, inscription, rafraichir, deconnexion }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return c;
}
