'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (nécessaire pour l'installation PWA). */
export function EnregistrerSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore */
      });
    }
  }, []);
  return null;
}
