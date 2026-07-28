import { Injectable } from '@nestjs/common';
import { TypeNotification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  /** Point d'entrée unique : crée la notif EN BASE puis la POUSSE en temps réel. */
  async notifier(
    membreId: string,
    type: TypeNotification,
    titre: string,
    message: string,
    lien?: string,
  ) {
    const notif = await this.prisma.notification.create({
      data: { membreId, type, titre, message, lien },
    });
    this.realtime.emitToMembre(membreId, 'notification', notif);
    return notif;
  }

  async liste(membreId: string) {
    const [notifications, nonLus] = await Promise.all([
      this.prisma.notification.findMany({
        where: { membreId },
        orderBy: { creeLe: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({ where: { membreId, lu: false } }),
    ]);
    return {
      succes: true,
      message: 'Vos notifications.',
      donnees: { notifications, nonLus },
    };
  }

  async nonLus(membreId: string) {
    const nonLus = await this.prisma.notification.count({
      where: { membreId, lu: false },
    });
    return { succes: true, message: 'Compteur non lus.', donnees: { nonLus } };
  }

  async marquerLu(id: string, membreId: string) {
    await this.prisma.notification.updateMany({
      where: { id, membreId },
      data: { lu: true },
    });
    return { succes: true, message: 'Notification marquée comme lue.' };
  }

  async marquerToutLu(membreId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { membreId, lu: false },
      data: { lu: true },
    });
    return { succes: true, message: `${count} notification(s) marquée(s) lue(s).` };
  }
}
