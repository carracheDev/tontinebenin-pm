import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerMembreDto } from './dto/creer-membre.dto';
import { MajMembreDto } from './dto/maj-membre.dto';

const SANS_SECRET = {
  id: true,
  nomComplet: true,
  email: true,
  telephone: true,
  photoUrl: true,
  poste: true,
  typeMembre: true,
  role: true,
  statut: true,
  dateIntegration: true,
  disponibilite: true,
  niveauImplication: true,
  competences: true,
  responsabilites: true,
  creeLe: true,
} as const;

@Injectable()
export class MembresService {
  constructor(private prisma: PrismaService) {}

  async liste() {
    const membres = await this.prisma.membre.findMany({
      where: { statut: { not: 'PARTI' } },
      select: SANS_SECRET,
      orderBy: { creeLe: 'asc' },
    });
    return { succes: true, message: "Liste de l'équipe.", donnees: membres };
  }

  async detail(id: string) {
    const membre = await this.prisma.membre.findUnique({
      where: { id },
      select: { ...SANS_SECRET, capital: true },
    });
    if (!membre) throw new NotFoundException({ message: 'Membre introuvable.' });
    return { succes: true, message: 'Détail du membre.', donnees: membre };
  }

  async creer(dto: CreerMembreDto) {
    const existe = await this.prisma.membre.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existe) {
      throw new BadRequestException({
        message: 'Un membre existe déjà avec cet email.',
        code: 'EMAIL_EXISTANT',
      });
    }
    const membre = await this.prisma.membre.create({
      data: {
        nomComplet: dto.nomComplet,
        email: dto.email.toLowerCase(),
        motDePasseHash: await argon2.hash(dto.motDePasse),
        poste: dto.poste,
        telephone: dto.telephone,
        typeMembre: dto.typeMembre ?? 'COLLABORATEUR',
        role: dto.role ?? 'MEMBRE',
        disponibilite: dto.disponibilite,
        competences: dto.competences ?? [],
        responsabilites: dto.responsabilites,
        niveauImplication: dto.niveauImplication ?? 0,
      },
      select: SANS_SECRET,
    });
    return { succes: true, message: 'Membre ajouté à l’équipe.', donnees: membre };
  }

  async modifier(id: string, dto: MajMembreDto) {
    await this.assurerExiste(id);
    const data: Record<string, unknown> = { ...dto };
    delete data.motDePasse;
    if (dto.motDePasse) data.motDePasseHash = await argon2.hash(dto.motDePasse);
    if (dto.email) data.email = dto.email.toLowerCase();

    const membre = await this.prisma.membre.update({
      where: { id },
      data,
      select: SANS_SECRET,
    });
    return { succes: true, message: 'Membre mis à jour.', donnees: membre };
  }

  /** Départ = statut PARTI (on ne supprime jamais l’historique). */
  async desactiver(id: string) {
    await this.assurerExiste(id);
    await this.prisma.membre.update({
      where: { id },
      data: { statut: 'PARTI' },
    });
    return { succes: true, message: 'Membre marqué comme parti.' };
  }

  private async assurerExiste(id: string) {
    const m = await this.prisma.membre.findUnique({ where: { id } });
    if (!m) throw new NotFoundException({ message: 'Membre introuvable.' });
  }
}
