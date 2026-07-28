import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export const api = axios.create({ baseURL: API_URL });

const ACCESS = 'tb_pm_access';
const REFRESH = 'tb_pm_refresh';

export const jetons = {
  get access() {
    return typeof window !== 'undefined' ? localStorage.getItem(ACCESS) : null;
  },
  get refresh() {
    return typeof window !== 'undefined' ? localStorage.getItem(REFRESH) : null;
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  effacer() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

// Ajoute le Bearer sur chaque requête
api.interceptors.request.use((config) => {
  const t = jetons.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// 401 → tente un refresh une fois, sinon déconnecte
let rafraichissement: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && jetons.refresh) {
      original._retry = true;
      rafraichissement ??= (async () => {
        try {
          const { data } = await axios.post(`${API_URL}/auth/rafraichir`, {
            refreshToken: jetons.refresh,
          });
          const d = data.donnees;
          jetons.set(d.accessToken, d.refreshToken);
          return d.accessToken as string;
        } catch {
          jetons.effacer();
          return null;
        } finally {
          rafraichissement = null;
        }
      })();
      const nouveau = await rafraichissement;
      if (nouveau) {
        original.headers.Authorization = `Bearer ${nouveau}`;
        return api(original);
      }
      if (typeof window !== 'undefined') window.location.href = '/connexion';
    }
    return Promise.reject(error);
  },
);
