import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DefinirCapitalDto } from './dto/definir-capital.dto';

interface CapitalLike {
  pourcentageAlloue: number;
  pourcentageAcquis: number;
  vestingActif: boolean;
  dureeVestingMois: number;
  cliffMois: number;
  dateDebutVesting: Date;
}

function ajouterMois(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

/** Nombre de mois pleins écoulés entre deux dates (jour anniversaire requis). */
function moisEcoules(debut: Date, fin: Date): number {
  let m = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
  if (fin.getDate() < debut.getDate()) m -= 1;
  return Math.max(0, m);
}

@Injectable()
export class CapitalService {
  private readonly logger = new Logger(CapitalService.name);
  constructor(private prisma: PrismaService) {}

  /** Calcule l'état de vesting d'un membre à l'instant présent. */
  calculerVesting(cap: CapitalLike) {
    const mois = moisEcoules(cap.dateDebutVesting, new Date());
    let acquis = 0;

    if (!cap.vestingActif) {
      acquis = cap.pourcentageAlloue; // pas de vesting → tout acquis
    } else if (mois >= cap.cliffMois) {
      const fraction = Math.min(mois, cap.dureeVestingMois) / cap.dureeVestingMois;
      acquis = cap.pourcentageAlloue * fraction;
    }
    acquis = Math.round(acquis * 100) / 100;

    const complet = acquis >= cap.pourcentageAlloue;
    let prochaineAcquisition: Date | null = null;
    if (cap.vestingActif && !complet) {
      const cibleMois = mois < cap.cliffMois ? cap.cliffMois : mois + 1;
      prochaineAcquisition = ajouterMois(cap.dateDebutVesting, cibleMois);
    }
    const joursAvantProchaine = prochaineAcquisition
      ? Math.max(0, Math.ceil((prochaineAcquisition.getTime() - Date.now()) / 86400000))
      : null;

    return {
      moisEcoules: mois,
      pourcentageAlloue: cap.pourcentageAlloue,
      pourcentageAcquis: acquis,
      pourcentageEnAttente: Math.round((cap.pourcentageAlloue - acquis) * 100) / 100,
      cliffAtteint: mois >= cap.cliffMois,
      acquisComplet: complet,
      prochaineAcquisition,
      joursAvantProchaine,
    };
  }

  /** Attribue / met à jour les parts d'un membre. */
  async definir(membreId: string, dto: DefinirCapitalDto) {
    const membre = await this.prisma.membre.findUnique({ where: { id: membreId } });
    if (!membre) throw new NotFoundException({ message: 'Membre introuvable.' });

    // le total alloué ne doit pas dépasser 100 %
    const autres = await this.prisma.capital.aggregate({
      where: { membreId: { not: membreId } },
      _sum: { pourcentageAlloue: true },
    });
    const totalAutres = autres._sum.pourcentageAlloue ?? 0;
    if (totalAutres + dto.pourcentageAlloue > 100) {
      throw new BadRequestException({
        message: `Total dépassé : il reste ${100 - totalAutres} % à répartir.`,
        code: 'CAPITAL_DEPASSE',
        restant: 100 - totalAutres,
      });
    }

    const debut = dto.dateDebutVesting ? new Date(dto.dateDebutVesting) : new Date();
    const cap = await this.prisma.capital.upsert({
      where: { membreId },
      update: {
        pourcentageAlloue: dto.pourcentageAlloue,
        dureeVestingMois: dto.dureeVestingMois ?? 48,
        cliffMois: dto.cliffMois ?? 12,
        vestingActif: dto.vestingActif ?? true,
        dateDebutVesting: debut,
      },
      create: {
        membreId,
        pourcentageAlloue: dto.pourcentageAlloue,
        dureeVestingMois: dto.dureeVestingMois ?? 48,
        cliffMois: dto.cliffMois ?? 12,
        vestingActif: dto.vestingActif ?? true,
        dateDebutVesting: debut,
      },
    });

    // recalcule immédiatement l'acquis et historise
    const etat = this.calculerVesting(cap);
    await this.prisma.capital.update({
      where: { id: cap.id },
      data: { pourcentageAcquis: etat.pourcentageAcquis },
    });
    await this.prisma.historiqueCapital.create({
      data: { capitalId: cap.id, pourcentageAcquis: etat.pourcentageAcquis, motif: 'attribution / mise à jour' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pourcentageAlloue: _a, pourcentageAcquis: _b, ...capReste } = cap;
    return {
      succes: true,
      message: 'Parts attribuées.',
      donnees: { ...capReste, ...etat },
    };
  }

  /** Table de capitalisation complète. */
  async table() {
    const caps = await this.prisma.capital.findMany({
      include: { membre: { select: { id: true, nomComplet: true, typeMembre: true } } },
    });
    const lignes = caps.map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pourcentageAlloue: _a, pourcentageAcquis: _b, ...reste } = c;
      return { ...reste, ...this.calculerVesting(c) };
    });
    const totalAlloue = Math.round(lignes.reduce((s, l) => s + l.pourcentageAlloue, 0) * 100) / 100;
    const totalAcquis = Math.round(lignes.reduce((s, l) => s + l.pourcentageAcquis, 0) * 100) / 100;
    return {
      succes: true,
      message: 'Table de capitalisation.',
      donnees: {
        lignes,
        totalAlloue,
        totalAcquis,
        nonAttribue: Math.round((100 - totalAlloue) * 100) / 100,
      },
    };
  }

  async detailMembre(membreId: string) {
    const cap = await this.prisma.capital.findUnique({
      where: { membreId },
      include: { historique: { orderBy: { calculeLe: 'desc' }, take: 24 } },
    });
    if (!cap) throw new NotFoundException({ message: 'Aucune part attribuée à ce membre.' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pourcentageAlloue: _a, pourcentageAcquis: _b, ...reste } = cap;
    return { succes: true, message: 'Détail du capital.', donnees: { ...reste, ...this.calculerVesting(cap) } };
  }

  /** Recalcule le vesting de tous les membres ; historise les changements. */
  async recalculerTous() {
    const caps = await this.prisma.capital.findMany();
    let modifies = 0;
    for (const c of caps) {
      const { pourcentageAcquis } = this.calculerVesting(c);
      if (pourcentageAcquis !== c.pourcentageAcquis) {
        await this.prisma.capital.update({
          where: { id: c.id },
          data: { pourcentageAcquis },
        });
        await this.prisma.historiqueCapital.create({
          data: { capitalId: c.id, pourcentageAcquis, motif: 'acquisition automatique (vesting)' },
        });
        modifies++;
      }
    }
    return { succes: true, message: `Vesting recalculé (${modifies} mise(s) à jour).`, donnees: { modifies } };
  }

  /** Cron nocturne : met à jour les parts acquises chaque nuit à minuit. */
  @Cron('0 0 * * *', { name: 'vesting-nocturne' })
  async vestingNocturne() {
    const r = await this.recalculerTous();
    this.logger.log(`[VESTING] ${r.message}`);
  }
}
