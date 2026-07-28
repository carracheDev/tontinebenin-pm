import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerProjetDto } from './dto/creer-projet.dto';
import { MajProjetDto } from './dto/maj-projet.dto';

@Injectable()
export class ProjetsService {
  constructor(private prisma: PrismaService) {}

  async liste() {
    const projets = await this.prisma.projet.findMany({
      where: { parentId: null },
      include: {
        enfants: true,
        _count: { select: { taches: true, phases: true, objectifs: true } },
      },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: 'Liste des projets.', donnees: projets };
  }

  async detail(id: string) {
    const projet = await this.prisma.projet.findUnique({
      where: { id },
      include: {
        enfants: true,
        phases: { orderBy: { ordre: 'asc' } },
        objectifs: true,
        jalons: { orderBy: { date: 'asc' } },
        risques: true,
        _count: { select: { taches: true } },
      },
    });
    if (!projet) throw new NotFoundException({ message: 'Projet introuvable.' });
    return { succes: true, message: 'Détail du projet.', donnees: projet };
  }

  async creer(dto: CreerProjetDto) {
    const projet = await this.prisma.projet.create({
      data: {
        nom: dto.nom,
        description: dto.description,
        statut: dto.statut ?? 'PLANIFIE',
        priorite: dto.priorite ?? 'MOYENNE',
        parentId: dto.parentId,
        version: dto.version,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : null,
      },
    });
    return { succes: true, message: 'Projet créé.', donnees: projet };
  }

  async modifier(id: string, dto: MajProjetDto) {
    await this.assurerExiste(id);
    const projet = await this.prisma.projet.update({
      where: { id },
      data: {
        ...dto,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateFinPrevue: dto.dateFinPrevue ? new Date(dto.dateFinPrevue) : undefined,
      },
    });
    return { succes: true, message: 'Projet mis à jour.', donnees: projet };
  }

  async supprimer(id: string) {
    await this.assurerExiste(id);
    await this.prisma.projet.delete({ where: { id } });
    return { succes: true, message: 'Projet supprimé.' };
  }

  private async assurerExiste(id: string) {
    const p = await this.prisma.projet.findUnique({ where: { id } });
    if (!p) throw new NotFoundException({ message: 'Projet introuvable.' });
  }
}
