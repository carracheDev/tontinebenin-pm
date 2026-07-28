import { Injectable, NotFoundException } from '@nestjs/common';
import { StatutTache } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreerPhaseDto, MajPhaseDto } from './dto/phase.dto';
import { CreerObjectifDto, MajObjectifDto } from './dto/objectif.dto';
import { CreerJalonDto, MajJalonDto } from './dto/jalon.dto';
import { CreerRisqueDto, MajRisqueDto } from './dto/risque.dto';

const COLONNES: StatutTache[] = [
  'A_FAIRE', 'EN_COURS', 'EN_VALIDATION', 'TERMINE', 'BLOQUE',
];

@Injectable()
export class PilotageService {
  constructor(private prisma: PrismaService) {}

  // ═══════════ AVANCEMENT (calcul auto) ═══════════

  /**
   * Recalcule l'avancement de chaque phase et du projet,
   * à partir des tâches réellement terminées. Persiste les valeurs.
   */
  async recalculer(projetId: string) {
    await this.assurerProjet(projetId);

    // par phase
    const phases = await this.prisma.phase.findMany({ where: { projetId } });
    for (const ph of phases) {
      const [total, faites] = await Promise.all([
        this.prisma.tache.count({ where: { phaseId: ph.id } }),
        this.prisma.tache.count({ where: { phaseId: ph.id, statut: 'TERMINE' } }),
      ]);
      const av = total > 0 ? Math.round((faites / total) * 100) : 0;
      await this.prisma.phase.update({ where: { id: ph.id }, data: { avancement: av } });
    }

    // global projet
    const [total, faites] = await Promise.all([
      this.prisma.tache.count({ where: { projetId } }),
      this.prisma.tache.count({ where: { projetId, statut: 'TERMINE' } }),
    ]);
    const avancement = total > 0 ? Math.round((faites / total) * 100) : 0;
    await this.prisma.projet.update({ where: { id: projetId }, data: { avancement } });
    return avancement;
  }

  /** Vision globale : avancement, état, objectifs, retards, prochaines étapes. */
  async vueGlobale(projetId: string) {
    const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!projet) throw new NotFoundException({ message: 'Projet introuvable.' });

    const avancement = await this.recalculer(projetId);
    const maintenant = new Date();

    const [taches, objectifsTotal, objectifsAtteints, phases, jalons, risquesCritiques, risquesTotal] =
      await Promise.all([
        this.prisma.tache.findMany({
          where: { projetId },
          select: {
            id: true, titre: true, statut: true, echeance: true,
            assigne: { select: { id: true, nomComplet: true } },
          },
        }),
        this.prisma.objectif.count({ where: { projetId } }),
        this.prisma.objectif.count({ where: { projetId, atteint: true } }),
        this.prisma.phase.findMany({
          where: { projetId },
          orderBy: { ordre: 'asc' },
          select: { id: true, nom: true, statut: true, avancement: true },
        }),
        this.prisma.jalon.findMany({ where: { projetId }, orderBy: { date: 'asc' } }),
        this.prisma.risque.count({ where: { projetId, niveau: 'CRITIQUE', resolu: false } }),
        this.prisma.risque.count({ where: { projetId, resolu: false } }),
      ]);

    const parStatut = Object.fromEntries(
      COLONNES.map((s) => [s, taches.filter((t) => t.statut === s).length]),
    );

    const retards = taches.filter(
      (t) => t.echeance && t.echeance < maintenant && t.statut !== 'TERMINE',
    );

    const jalonsEnRetard = jalons.filter((j) => !j.atteint && j.date < maintenant);
    const prochainsJalons = jalons.filter((j) => !j.atteint && j.date >= maintenant).slice(0, 5);

    return {
      succes: true,
      message: 'Vue globale du projet.',
      donnees: {
        projet: { id: projet.id, nom: projet.nom, statut: projet.statut, version: projet.version },
        avancement,
        etat:
          avancement === 100 ? 'Terminé'
          : retards.length > 0 || jalonsEnRetard.length > 0 ? 'En retard'
          : avancement === 0 ? 'Non démarré'
          : 'En bonne voie',
        objectifs: {
          total: objectifsTotal,
          atteints: objectifsAtteints,
          restants: objectifsTotal - objectifsAtteints,
        },
        taches: { total: taches.length, parStatut },
        retards,
        phases,
        roadmap: { prochains: prochainsJalons, enRetard: jalonsEnRetard },
        risques: { total: risquesTotal, critiques: risquesCritiques },
      },
    };
  }

  // ═══════════ PHASES ═══════════
  async creerPhase(projetId: string, dto: CreerPhaseDto) {
    await this.assurerProjet(projetId);
    const max = await this.prisma.phase.aggregate({
      where: { projetId }, _max: { ordre: true },
    });
    const phase = await this.prisma.phase.create({
      data: {
        projetId, nom: dto.nom,
        ordre: dto.ordre ?? (max._max.ordre ?? -1) + 1,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      },
    });
    return { succes: true, message: 'Phase créée.', donnees: phase };
  }
  async majPhase(id: string, dto: MajPhaseDto) {
    await this.exists('phase', id);
    const phase = await this.prisma.phase.update({
      where: { id },
      data: {
        ...dto,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
      },
    });
    return { succes: true, message: 'Phase mise à jour.', donnees: phase };
  }
  async supprimerPhase(id: string) {
    await this.exists('phase', id);
    await this.prisma.tache.updateMany({ where: { phaseId: id }, data: { phaseId: null } });
    await this.prisma.phase.delete({ where: { id } });
    return { succes: true, message: 'Phase supprimée.' };
  }

  // ═══════════ OBJECTIFS ═══════════
  async creerObjectif(projetId: string, dto: CreerObjectifDto) {
    await this.assurerProjet(projetId);
    const o = await this.prisma.objectif.create({
      data: {
        projetId, libelle: dto.libelle, description: dto.description,
        echeance: dto.echeance ? new Date(dto.echeance) : null,
      },
    });
    return { succes: true, message: 'Objectif ajouté.', donnees: o };
  }
  async majObjectif(id: string, dto: MajObjectifDto) {
    await this.exists('objectif', id);
    const o = await this.prisma.objectif.update({
      where: { id },
      data: {
        ...dto,
        atteintLe: dto.atteint === true ? new Date() : dto.atteint === false ? null : undefined,
        echeance: dto.echeance ? new Date(dto.echeance) : undefined,
      },
    });
    return { succes: true, message: 'Objectif mis à jour.', donnees: o };
  }
  async supprimerObjectif(id: string) {
    await this.exists('objectif', id);
    await this.prisma.objectif.delete({ where: { id } });
    return { succes: true, message: 'Objectif supprimé.' };
  }

  // ═══════════ JALONS (roadmap) ═══════════
  async roadmap(projetId: string) {
    await this.assurerProjet(projetId);
    const jalons = await this.prisma.jalon.findMany({
      where: { projetId }, orderBy: { date: 'asc' },
    });
    return { succes: true, message: 'Feuille de route.', donnees: jalons };
  }
  async creerJalon(projetId: string, dto: CreerJalonDto) {
    await this.assurerProjet(projetId);
    const j = await this.prisma.jalon.create({
      data: {
        projetId, titre: dto.titre, description: dto.description,
        version: dto.version, date: new Date(dto.date),
      },
    });
    return { succes: true, message: 'Jalon ajouté à la roadmap.', donnees: j };
  }
  async majJalon(id: string, dto: MajJalonDto) {
    await this.exists('jalon', id);
    const j = await this.prisma.jalon.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
    return { succes: true, message: 'Jalon mis à jour.', donnees: j };
  }
  async supprimerJalon(id: string) {
    await this.exists('jalon', id);
    await this.prisma.jalon.delete({ where: { id } });
    return { succes: true, message: 'Jalon supprimé.' };
  }

  // ═══════════ RISQUES ═══════════
  async listeRisques(projetId: string) {
    await this.assurerProjet(projetId);
    const risques = await this.prisma.risque.findMany({
      where: { projetId },
      include: { responsable: { select: { id: true, nomComplet: true } } },
      orderBy: [{ resolu: 'asc' }, { niveau: 'desc' }],
    });
    return { succes: true, message: 'Registre des risques.', donnees: risques };
  }
  async creerRisque(projetId: string, dto: CreerRisqueDto) {
    await this.assurerProjet(projetId);
    const r = await this.prisma.risque.create({
      data: {
        projetId, libelle: dto.libelle, description: dto.description,
        niveau: dto.niveau ?? 'MODERE', probabilite: dto.probabilite ?? 50,
        mitigation: dto.mitigation, responsableId: dto.responsableId,
      },
    });
    return { succes: true, message: 'Risque enregistré.', donnees: r };
  }
  async majRisque(id: string, dto: MajRisqueDto) {
    await this.exists('risque', id);
    const r = await this.prisma.risque.update({ where: { id }, data: dto });
    return { succes: true, message: 'Risque mis à jour.', donnees: r };
  }
  async supprimerRisque(id: string) {
    await this.exists('risque', id);
    await this.prisma.risque.delete({ where: { id } });
    return { succes: true, message: 'Risque supprimé.' };
  }

  // ═══════════ privé ═══════════
  private async assurerProjet(projetId: string) {
    const p = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!p) throw new NotFoundException({ message: 'Projet introuvable.' });
  }
  private async exists(modele: 'phase' | 'objectif' | 'jalon' | 'risque', id: string) {
    const found = await (this.prisma as any)[modele].findUnique({ where: { id } });
    if (!found) throw new NotFoundException({ message: `${modele} introuvable.` });
  }
}
