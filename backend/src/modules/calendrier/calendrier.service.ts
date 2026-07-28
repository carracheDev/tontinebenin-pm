import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TypeNotification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreerEvenementDto, MajEvenementDto } from './dto/evenement.dto';

const PARTICIPANT = {
  include: { membre: { select: { id: true, nomComplet: true, photoUrl: true } } },
};

@Injectable()
export class CalendrierService {
  private readonly logger = new Logger(CalendrierService.name);
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Événements sur une période (défaut : à venir). */
  async liste(from?: string, to?: string) {
    const debut = from ? new Date(from) : new Date();
    const where: any = { debut: { gte: debut } };
    if (to) where.debut.lte = new Date(to);
    const evenements = await this.prisma.evenement.findMany({
      where,
      include: { participants: PARTICIPANT },
      orderBy: { debut: 'asc' },
      take: 200,
    });
    return { succes: true, message: 'Événements.', donnees: evenements };
  }

  async detail(id: string) {
    const ev = await this.prisma.evenement.findUnique({
      where: { id }, include: { participants: PARTICIPANT },
    });
    if (!ev) throw new NotFoundException({ message: 'Événement introuvable.' });
    return { succes: true, message: "Détail de l'événement.", donnees: ev };
  }

  async creer(dto: CreerEvenementDto) {
    const ev = await this.prisma.evenement.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        type: dto.type ?? 'REUNION',
        debut: new Date(dto.debut),
        fin: dto.fin ? new Date(dto.fin) : null,
        rappelAvantMin: dto.rappelAvantMin,
        projetId: dto.projetId,
        participants: dto.participants?.length
          ? { create: dto.participants.map((membreId) => ({ membreId })) }
          : undefined,
      },
      include: { participants: PARTICIPANT },
    });
    return { succes: true, message: 'Événement créé.', donnees: ev };
  }

  async modifier(id: string, dto: MajEvenementDto) {
    await this.assurer(id);
    const ev = await this.prisma.evenement.update({
      where: { id },
      data: {
        titre: dto.titre,
        description: dto.description,
        type: dto.type,
        debut: dto.debut ? new Date(dto.debut) : undefined,
        fin: dto.fin ? new Date(dto.fin) : undefined,
        rappelAvantMin: dto.rappelAvantMin,
        rappelEnvoye: dto.debut ? false : undefined, // date changée → rappel à renvoyer
      },
    });
    return { succes: true, message: 'Événement mis à jour.', donnees: ev };
  }

  async supprimer(id: string) {
    await this.assurer(id);
    await this.prisma.participationEvenement.deleteMany({ where: { evenementId: id } });
    await this.prisma.evenement.delete({ where: { id } });
    return { succes: true, message: 'Événement supprimé.' };
  }

  async ajouterParticipant(id: string, membreId: string) {
    await this.assurer(id);
    await this.prisma.participationEvenement.upsert({
      where: { evenementId_membreId: { evenementId: id, membreId } },
      update: {},
      create: { evenementId: id, membreId },
    });
    return { succes: true, message: 'Participant ajouté.' };
  }

  async retirerParticipant(id: string, membreId: string) {
    await this.prisma.participationEvenement.deleteMany({
      where: { evenementId: id, membreId },
    });
    return { succes: true, message: 'Participant retiré.' };
  }

  /** Rappels automatiques : toutes les 5 minutes, prévient les participants. */
  @Cron('*/5 * * * *', { name: 'rappels-evenements' })
  async envoyerRappels() {
    const maintenant = new Date();
    const candidats = await this.prisma.evenement.findMany({
      where: {
        rappelEnvoye: false,
        rappelAvantMin: { not: null },
        debut: { gte: maintenant },
      },
      include: { participants: true },
    });

    let envoyes = 0;
    for (const ev of candidats) {
      const seuil = new Date(ev.debut.getTime() - (ev.rappelAvantMin ?? 0) * 60000);
      if (maintenant >= seuil) {
        for (const p of ev.participants) {
          await this.notifications.notifier(
            p.membreId,
            TypeNotification.ECHEANCE_PROCHE,
            'Rappel : ' + ev.titre,
            `Débute à ${ev.debut.toLocaleString('fr-FR')}.`,
            `/calendrier/${ev.id}`,
          );
        }
        await this.prisma.evenement.update({
          where: { id: ev.id }, data: { rappelEnvoye: true },
        });
        envoyes++;
      }
    }
    if (envoyes) this.logger.log(`[RAPPELS] ${envoyes} événement(s) rappelé(s).`);
  }

  private async assurer(id: string) {
    const e = await this.prisma.evenement.findUnique({ where: { id } });
    if (!e) throw new NotFoundException({ message: 'Événement introuvable.' });
  }
}
