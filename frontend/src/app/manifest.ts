import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TontineBénin — Project Manager',
    short_name: 'TontineBénin PM',
    description: 'Gestion de projet de la startup TontineBénin.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b1120',
    theme_color: '#2563eb',
    lang: 'fr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
