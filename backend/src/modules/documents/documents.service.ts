import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AjouterVersionDto, CreerDocumentDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  /** Liste filtrée par le rôle du demandeur (ADMIN voit tout). */
  async liste(role: Role, projetId?: string, categorie?: string) {
    const acces =
      role === 'ADMIN'
        ? {}
        : { OR: [{ accesRoles: { isEmpty: true } }, { accesRoles: { has: role } }] };
    const documents = await this.prisma.document.findMany({
      where: {
        ...acces,
        ...(projetId ? { projetId } : {}),
        ...(categorie ? { categorie: categorie as any } : {}),
      },
      include: {
        ajoutePar: { select: { id: true, nomComplet: true } },
        _count: { select: { versions: true } },
        versions: { orderBy: { numero: 'desc' }, take: 1 }, // dernière version
      },
      orderBy: { creeLe: 'desc' },
    });
    return { succes: true, message: 'Espace documentaire.', donnees: documents };
  }

  async detail(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        ajoutePar: { select: { id: true, nomComplet: true } },
        versions: { orderBy: { numero: 'desc' } },
      },
    });
    if (!doc) throw new NotFoundException({ message: 'Document introuvable.' });
    return { succes: true, message: 'Détail du document.', donnees: doc };
  }

  async creer(dto: CreerDocumentDto, ajouteParId: string) {
    const doc = await this.prisma.document.create({
      data: {
        titre: dto.titre,
        categorie: dto.categorie ?? 'AUTRE',
        projetId: dto.projetId,
        accesRoles: dto.accesRoles ?? [],
        ajouteParId,
        versions: { create: { numero: 1, url: dto.url, note: dto.note } },
      },
      include: { versions: true },
    });
    return { succes: true, message: 'Document créé (version 1).', donnees: doc };
  }

  /** Nouvelle version = numéro auto-incrémenté (historique conservé). */
  async ajouterVersion(id: string, dto: AjouterVersionDto) {
    await this.assurer(id);
    const max = await this.prisma.versionDocument.aggregate({
      where: { documentId: id }, _max: { numero: true },
    });
    const version = await this.prisma.versionDocument.create({
      data: { documentId: id, numero: (max._max.numero ?? 0) + 1, url: dto.url, note: dto.note },
    });
    return { succes: true, message: `Version ${version.numero} ajoutée.`, donnees: version };
  }

  async supprimer(id: string) {
    await this.assurer(id);
    await this.prisma.versionDocument.deleteMany({ where: { documentId: id } });
    await this.prisma.document.delete({ where: { id } });
    return { succes: true, message: 'Document supprimé.' };
  }

  private async assurer(id: string) {
    const d = await this.prisma.document.findUnique({ where: { id } });
    if (!d) throw new NotFoundException({ message: 'Document introuvable.' });
  }
}
