// Service worker minimal : rend l'app installable (PWA). Pas de cache offline
// (l'app a besoin du serveur), il laisse simplement passer les requêtes.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  /* passthrough — le navigateur gère normalement */
});
