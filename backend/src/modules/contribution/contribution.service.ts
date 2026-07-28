import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StatutTache, TypeMembre } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ACTIVES: StatutTache[] = ['A_FAIRE', 'EN_COURS', 'EN_VALIDATION'];

// Pondérations du score de contribution (transparentes, ajustables)
const POIDS = {
  TACHE_TERMINEE: 3, // par tâche terminée
  HEURE: 0.5, // par heure passée
  PONCTUALITE: 10, // × ratio de ponctualité (0..1)
  ANCIENNETE: 1, // par mois d'ancienneté (plafonné)
};
const ANCIENNETE_MAX_MOIS = 24;

// Projection SARL : plancher de contrôle réservé au(x) fondateur(s)
const PLANCHER_FONDATEUR = 60;

const AVERTISSEMENT =
  "Projection non contractuelle. Aucune part n'est attribuée aujourd'hui : " +
  "TONTINE BÉNIN est une entreprise individuelle, le fondateur détient 100 %. " +
  'Cette simulation indicative, fondée sur la contribution documentée, ne pourrait ' +
  "s'appliquer qu'en cas de transformation en société (SARL), à la seule décision du fondateur.";

interface Metrique {
  membre: { id: string; nomComplet: string; typeMembre: TypeMembre; photoUrl?: string | null };
  terminees: number;
  enCours: number;
  enRetard: number;
  tempsPasseH: number;
  ponctualite: number; // %
  ancienneteMois: number;
  score: number;
}

function moisEcoules(debut: Date, fin: Date): number {
  const m = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
  return Math.max(0, m);
}

@Injectable()
export class ContributionService {
  private readonly logger = new Logger(ContributionService.name);
  constructor(private prisma: PrismaService) {}

  /** Calcule les métriques de contribution de chaque membre actif (depuis les vraies tâches). */
  private async calculer(): Promise<Metrique[]> {
    const now = new Date();
    const [membres, taches] = await Promise.all([
      this.prisma.membre.findMany({
        where: { statut: 'ACTIF' },
        select: { id: true, nomComplet: true, typeMembre: true, photoUrl: true, creeLe: true },
      }),
      this.prisma.tache.findMany({
        select: { assigneId: true, statut: true, tempsPasseH: true, echeance: true, termineLe: true },
      }),
    ]);

    return membres.map((m) => {
      const t = taches.filter((x) => x.assigneId === m.id);
      const terminees = t.filter((x) => x.statut === 'TERMINE');
      const enCours = t.filter((x) => ACTIVES.includes(x.statut)).length;
      const enRetard = t.filter(
        (x) => x.echeance && x.echeance < now && x.statut !== 'TERMINE',
      ).length;
      const tempsPasseH = t.reduce((s, x) => s + (x.tempsPasseH ?? 0), 0);

      const avecEcheance = terminees.filter((x) => x.echeance);
      const aTemps = avecEcheance.filter((x) => x.termineLe && x.echeance && x.termineLe <= x.echeance).length;
      const ponctualite = avecEcheance.length ? aTemps / avecEcheance.length : 1;

      const ancienneteMois = Math.min(moisEcoules(m.creeLe, now), ANCIENNETE_MAX_MOIS);

      const score =
        terminees.length * POIDS.TACHE_TERMINEE +
        tempsPasseH * POIDS.HEURE +
        (terminees.length ? ponctualite * POIDS.PONCTUALITE : 0) +
        ancienneteMois * POIDS.ANCIENNETE;

      return {
        membre: { id: m.id, nomComplet: m.nomComplet, typeMembre: m.typeMembre, photoUrl: m.photoUrl },
        terminees: terminees.length,
        enCours,
        enRetard,
        tempsPasseH: Math.round(tempsPasseH * 10) / 10,
        ponctualite: Math.round(ponctualite * 100),
        ancienneteMois,
        score: Math.round(score * 10) / 10,
      };
    });
  }

  /** Tableau de contribution : part relative de chaque membre (poids documenté). */
  async table() {
    const metriques = await this.calculer();
    const totalScore = metriques.reduce((s, m) => s + m.score, 0);

    const lignes = metriques
      .map((m) => ({
        ...m,
        poidsContribution: totalScore > 0 ? Math.round((m.score / totalScore) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.score - a.score);

    return {
      succes: true,
      message: 'Contribution documentée par membre.',
      donnees: {
        lignes,
        totaux: {
          membres: metriques.length,
          tachesTerminees: metriques.reduce((s, m) => s + m.terminees, 0),
          tempsPasseH: Math.round(metriques.reduce((s, m) => s + m.tempsPasseH, 0) * 10) / 10,
        },
      },
    };
  }

  /** Projection NON CONTRACTUELLE d'une répartition en cas de passage en SARL. */
  async projection() {
    const metriques = await this.calculer();

    let fondateurs = metriques.filter((m) => m.membre.typeMembre === 'FONDATEUR');
    let contributeurs = metriques.filter((m) => m.membre.typeMembre !== 'FONDATEUR');

    // Aucun fondateur explicite → tout le monde est traité comme contributeur
    if (fondateurs.length === 0) {
      contributeurs = metriques;
    }

    const repartition = metriques.map((m) => ({
      membre: m.membre.nomComplet,
      typeMembre: m.membre.typeMembre,
      poidsContribution: 0,
      pourcentageProjete: 0,
    }));
    const idx = (id: string) => metriques.findIndex((m) => m.membre.id === id);

    if (contributeurs.length === 0) {
      // Que des fondateurs → 100 % réparti également entre eux
      fondateurs.forEach((f) => {
        repartition[idx(f.membre.id)].pourcentageProjete = Math.round((100 / fondateurs.length) * 10) / 10;
      });
    } else {
      const plancher = fondateurs.length ? PLANCHER_FONDATEUR : 0;
      const reste = 100 - plancher;
      const scoreContribTotal = contributeurs.reduce((s, m) => s + m.score, 0);

      fondateurs.forEach((f) => {
        repartition[idx(f.membre.id)].pourcentageProjete = Math.round((plancher / fondateurs.length) * 10) / 10;
      });
      contributeurs.forEach((c) => {
        const part = scoreContribTotal > 0 ? (c.score / scoreContribTotal) * reste : reste / contributeurs.length;
        const i = idx(c.membre.id);
        repartition[i].pourcentageProjete = Math.round(part * 10) / 10;
        repartition[i].poidsContribution =
          scoreContribTotal > 0 ? Math.round((c.score / scoreContribTotal) * 1000) / 10 : 0;
      });
    }

    return {
      succes: true,
      message: 'Projection indicative (non contractuelle).',
      donnees: {
        plancherFondateur: PLANCHER_FONDATEUR,
        repartition: repartition.sort((a, b) => b.pourcentageProjete - a.pourcentageProjete),
        avertissement: AVERTISSEMENT,
      },
    };
  }

  /** Détail d'un membre + historique des snapshots documentés. */
  async detailMembre(membreId: string) {
    const metriques = await this.calculer();
    const m = metriques.find((x) => x.membre.id === membreId);
    if (!m) throw new NotFoundException({ message: 'Membre introuvable ou inactif.' });

    const historique = await this.prisma.contribution.findMany({
      where: { membreId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    return { succes: true, message: 'Détail de contribution.', donnees: { ...m, historique } };
  }

  /** Cron nocturne : enregistre un snapshot de contribution par membre actif (registre documenté). */
  @Cron('0 0 * * *', { name: 'snapshot-contribution' })
  async enregistrerSnapshots() {
    try {
      const metriques = await this.calculer();
      for (const m of metriques) {
        await this.prisma.contribution.create({
          data: {
            membreId: m.membre.id,
            tachesTerminees: m.terminees,
            tempsPasseH: m.tempsPasseH,
            description: 'snapshot quotidien automatique',
          },
        });
      }
      this.logger.log(`[CONTRIBUTION] ${metriques.length} snapshot(s) enregistré(s).`);
    } catch (e) {
      this.logger.warn(`[CONTRIBUTION] snapshot ignoré : ${(e as Error).message}`);
    }
  }
}
