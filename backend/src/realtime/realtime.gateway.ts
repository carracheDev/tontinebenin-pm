import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

/**
 * Passerelle temps réel (socket.io).
 * Authentifie chaque connexion via le JWT, puis pousse les événements
 * au bon membre (notifications) ou à tous (mises à jour Kanban).
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private sockets = new Map<string, Set<string>>(); // membreId -> socketIds

  constructor(private jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET || 'change-me-access',
      });
      client.data.membreId = payload.sub;
      const set = this.sockets.get(payload.sub) ?? new Set<string>();
      set.add(client.id);
      this.sockets.set(payload.sub, set);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const mid = client.data?.membreId as string | undefined;
    if (!mid) return;
    const set = this.sockets.get(mid);
    set?.delete(client.id);
    if (set && set.size === 0) this.sockets.delete(mid);
  }

  /** Pousse un événement à un membre précis (toutes ses sessions). */
  emitToMembre(membreId: string, event: string, payload: unknown) {
    const set = this.sockets.get(membreId);
    if (!set) return;
    for (const id of set) this.server.to(id).emit(event, payload);
  }

  /** Diffuse à tous les clients connectés (ex: déplacement Kanban). */
  emitBroadcast(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
