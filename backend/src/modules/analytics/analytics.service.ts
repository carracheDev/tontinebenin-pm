import { Injectable, NotFoundException } from '@nestjs/common';
import { StatutTache } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const COLONNES: StatutTache[] = [
  'A_FAIRE', 'EN_COURS', 'EN_VALIDATION', 'TERMINE', 'BLOQUE',
];
const ACTIVES: StatutTache[] = ['A_FAIRE', 'EN_COURS', 'EN_VALIDATION'];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Aperçu global (cartes KPI du tableau de bord). */
  async apercu() {
    const now = new Date();
    const [projets, totalMembres, taches] = await Promise.all([
      this.prisma.projet.findMany({ select: { avancement: true, statut: true, parentId: true } }),
      this.prisma.membre.count({ where: { statut: 'ACTIF' } }),
      this.prisma.tache.findMany({ select: { statut: true, echeance: true } }),
    ]);

    const racines = projets.filter((p) => p.parentId === null);
    const avancementMoyen = racines.length
      ? Math.round(racines.reduce((s, p) => s + p.avancement, 0) / racines.length)
      : 0;

    const parStatut = Object.fromEntries(
      COLONNES.map((s) => [s, taches.filter((t) => t.statut === s).length]),
    );
    const enRetard = taches.filter(
      (t) => t.echeance && t.echeance < now && t.statut !== 'TERMINE',
    ).length;

    return {
      succes: true,
      message: 'Aperçu global.',
      donnees: {
        totalProjets: projets.length,
        projetsActifs: projets.filter((p) => p.statut === 'EN_COURS').length,
        totalMembres,
        totalTaches: taches.length,
        tachesTerminees: parStatut.TERMINE,
        tachesEnRetard: enRetard,
        avancementMoyen,
        repartitionStatuts: parStatut,
      },
    };
  }

  /** Performance par membre (barres / tableau). */
  async performanceMembres() {
    const now = new Date();
    const [membres, taches] = await Promise.all([
      this.prisma.membre.findMany({
        where: { statut: 'ACTIF' },
        select: { id: true, nomComplet: true, photoUrl: true, typeMembre: true },
      }),
      this.prisma.tache.findMany({
        select: { assigneId: true, statut: true, echeance: true, tempsPasseH: true },
      }),
    ]);

    const donnees = membres.map((m) => {
      const t = taches.filter((x) => x.assigneId === m.id);
      const terminees = t.filter((x) => x.statut === 'TERMINE').length;
      const enCours = t.filter((x) => ACTIVES.includes(x.statut)).length;
      const enRetard = t.filter(
        (x) => x.echeance && x.echeance < now && x.statut !== 'TERMINE',
      ).length;
      const tempsPasseH = t.reduce((s, x) => s + (x.tempsPasseH ?? 0), 0);
      return {
        membre: m,
        assignees: t.length,
        terminees,
        enCours,
        enRetard,
        tempsPasseH,
        tauxCompletion: t.length ? Math.round((terminees / t.length) * 100) : 0,
      };
    });
    return { succes: true, message: 'Performance de l’équipe.', donnees };
  }

  /** Charge de travail (tâches actives par membre) — barres. */
  async charge() {
    const [membres, taches] = await Promise.all([
      this.prisma.membre.findMany({
        where: { statut: 'ACTIF' },
        select: { id: true, nomComplet: true },
      }),
      this.prisma.tache.findMany({
        where: { statut: { in: ACTIVES } },
        select: { assigneId: true },
      }),
    ]);
    const donnees = membres
      .map((m) => ({
        membre: m.nomComplet,
        charge: taches.filter((t) => t.assigneId === m.id).length,
      }))
      .sort((a, b) => b.charge - a.charge);
    return { succes: true, message: 'Charge de travail.', donnees };
  }

  /** Répartition des responsabilités (part de chaque membre) — camembert. */
  async repartitionResponsabilites() {
    const [membres, taches] = await Promise.all([
      this.prisma.membre.findMany({
        where: { statut: 'ACTIF' },
        select: { id: true, nomComplet: true },
      }),
      this.prisma.tache.findMany({ select: { assigneId: true } }),
    ]);
    const total = taches.filter((t) => t.assigneId).length || 1;
    const donnees = membres
      .map((m) => {
        const n = taches.filter((t) => t.assigneId === m.id).length;
        return { membre: m.nomComplet, taches: n, pourcentage: Math.round((n / total) * 100) };
      })
      .filter((d) => d.taches > 0)
      .sort((a, b) => b.taches - a.taches);
    return { succes: true, message: 'Répartition des responsabilités.', donnees };
  }

  /** Évolution mensuelle : tâches créées vs terminées (courbe). */
  async evolution(nbMois = 6) {
    const debut = new Date();
    debut.setMonth(debut.getMonth() - (nbMois - 1));
    debut.setDate(1);
    debut.setHours(0, 0, 0, 0);

    const taches = await this.prisma.tache.findMany({
      select: { creeLe: true, termineLe: true },
    });

    const cle = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const mois: Record<string, { creees: number; terminees: number }> = {};
    for (let i = nbMois - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      mois[cle(d)] = { creees: 0, terminees: 0 };
    }
    for (const t of taches) {
      const kc = cle(t.creeLe);
      if (mois[kc]) mois[kc].creees += 1;
      if (t.termineLe) {
        const kt = cle(t.termineLe);
        if (mois[kt]) mois[kt].terminees += 1;
      }
    }
    const donnees = Object.entries(mois).map(([m, v]) => ({ mois: m, ...v }));
    return { succes: true, message: 'Évolution mensuelle.', donnees };
  }

  /** Timeline d'un projet : phases + jalons ordonnés (Gantt / frise). */
  async timeline(projetId: string) {
    const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!projet) throw new NotFoundException({ message: 'Projet introuvable.' });

    const [phases, jalons] = await Promise.all([
      this.prisma.phase.findMany({
        where: { projetId },
        orderBy: { ordre: 'asc' },
        select: { id: true, nom: true, dateDebut: true, dateFin: true, avancement: true },
      }),
      this.prisma.jalon.findMany({
        where: { projetId },
        orderBy: { date: 'asc' },
        select: { id: true, titre: true, date: true, atteint: true, version: true },
      }),
    ]);

    const elements = [
      ...phases.map((p) => ({
        type: 'phase' as const,
        id: p.id, libelle: p.nom, debut: p.dateDebut, fin: p.dateFin, avancement: p.avancement,
      })),
      ...jalons.map((j) => ({
        type: 'jalon' as const,
        id: j.id, libelle: j.titre, date: j.date, atteint: j.atteint, version: j.version,
      })),
    ];
    return { succes: true, message: 'Timeline du projet.', donnees: { phases, jalons, elements } };
  }
}
