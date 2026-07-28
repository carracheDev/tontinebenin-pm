import { io, type Socket } from 'socket.io-client';
import { jetons } from './api';
import { DEMO } from './demo';

let socket: Socket | null = null;

/** Socket.io singleton, authentifié par le JWT (proxifié via /socket.io). */
export function getSocket(): Socket | null {
  if (DEMO) return null; // pas de temps réel en mode démo
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      auth: { token: jetons.access },
      transports: ['polling', 'websocket'],
    });
  }
  return socket;
}
