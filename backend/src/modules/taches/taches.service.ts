import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutTache, TypeNotification } from '@prisma/client';
import { promises as fsp } from 'fs';
import { basename, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { CreerTacheDto } from './dto/creer-tache.dto';
import { MajTacheDto } from './dto/maj-tache.dto';
import { DeplacerTacheDto } from './dto/deplacer-tache.dto';
import { CommenterDto } from './dto/commenter.dto';
import { PieceJointeDto } from './dto/piece-jointe.dto';
import { BloquerDto } from './dto/bloquer.dto';

// Workflow qualité : ordre officiel des statuts (BLOQUE = état parallèle, à la fin).
const COLONNES: StatutTache[] = [
  'A_FAIRE',
  'EN_COURS',
  'DEV_TERMINE',
  'ATTENTE_TEST',
  'EN_TEST',
  'TEST_VALIDE',
  'VALIDE_MANAGER',
  'TERMINE',
  'BLOQUE',
];

// Poids d'avancement par statut (0-100) → sert au % global du projet.
const POIDS: Record<StatutTache, number> = {
  A_FAIRE: 0,
  EN_COURS: 15,
  DEV_TERMINE: 40,
  ATTENTE_TEST: 50,
  EN_TEST: 65,
  TEST_VALIDE: 80,
  VALIDE_MANAGER: 95,
  TERMINE: 100,
  BLOQUE: 10,
  EN_VALIDATION: 40, // legacy
};

// Statuts réservés : seuls ADMIN / MANAGER peuvent y faire passer une tâche.
const STATUTS_MANAGER: StatutTache[] = ['VALIDE_MANAGER', 'TERMINE'];

const LIBELLE: Record<StatutTache, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  DEV_TERMINE: 'Développement terminé',
  ATTENTE_TEST: 'En attente de test',
  EN_TEST: 'En test',
  TEST_VALIDE: 'Test validé',
  VALIDE_MANAGER: 'Validé par le manager',
  TERMINE: 'Terminé',
  BLOQUE: 'Bloqué',
  EN_VALIDATION: 'En validation',
};

const ASSIGNE = { select: { id: true, nomComplet: true, photoUrl: true } };

@Injectable()
export class TachesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeGateway,
  ) {}

  /** Vue Kanban : les 5 colonnes, chacune avec ses tâches ordonnées. */
  async kanban(projetId: string) {
    await this.assurerProjet(projetId);
    const taches = await this.prisma.tache.findMany({
      where: { projetId },
      include: { assigne: ASSIGNE, _count: { select: { commentaires: true, piecesJointes: true } } },
      orderBy: [{ ordre: 'asc' }, { creeLe: 'asc' }],
    });
    const colonnes = COLONNES.map((statut) => ({
      statut,
      taches: taches.filter((t) => t.statut === statut),
    }));
    return { succes: true, message: 'Tableau des tâches.', donnees: { colonnes } };
  }

  async detail(id: string) {
    const tache = await this.prisma.tache.findUnique({
      where: { id },
      include: {
        assigne: ASSIGNE,
        createur: ASSIGNE,
        commentaires: { include: { auteur: ASSIGNE }, orderBy: { creeLe: 'asc' } },
        piecesJointes: { orderBy: { creeLe: 'desc' } },
        historique: {
          orderBy: { creeLe: 'desc' },
          take: 50,
          include: { par: ASSIGNE },
        },
        blocage: true,
      },
    });
    if (!tache) throw new NotFoundException({ message: 'Tâche introuvable.' });
    return { succes: true, message: 'Détail de la tâche.', donnees: tache };
  }

  async creer(dto: CreerTacheDto, createurId: string) {
    await this.assurerProjet(dto.projetId);
    // placer en fin de la colonne "À faire"
    const dernier = await this.prisma.tache.aggregate({
      where: { projetId: dto.projetId, statut: 'A_FAIRE' },
      _max: { ordre: true },
    });
    const tache = await this.prisma.tache.create({
      data: {
        projetId: dto.projetId,
        phaseId: dto.phaseId,
        titre: dto.titre,
        description: dto.description,
        priorite: dto.priorite ?? 'MOYENNE',
        assigneId: dto.assigneId,
        createurId,
        ordre: (dernier._max.ordre ?? -1) + 1,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        echeance: dto.echeance ? new Date(dto.echeance) : null,
        tempsEstimeH: dto.tempsEstimeH,
      },
      include: { assigne: ASSIGNE },
    });
    if (dto.assigneId && dto.assigneId !== createurId) {
      await this.notifications.notifier(dto.assigneId, TypeNotification.TACHE_ASSIGNEE,
        'Nouvelle tâche assignée', `« ${tache.titre} » vous a été assignée.`, `/taches/${tache.id}`);
    }
    return { succes: true, message: 'Tâche créée.', donnees: tache };
  }

  async modifier(id: string, dto: MajTacheDto, parId: string) {
    const avant = await this.trouver(id);

    if (dto.statut !== undefined)
      await this.historiser(id, 'statut', avant.statut, dto.statut, parId);
    if (dto.assigneId !== undefined)
      await this.historiser(id, 'assigne', avant.assigneId, dto.assigneId, parId);
    if (dto.priorite !== undefined)
      await this.historiser(id, 'priorite', avant.priorite, dto.priorite, parId);

    const tache = await this.prisma.tache.update({
      where: { id },
      data: {
        titre: dto.titre,
        description: dto.description,
        phaseId: dto.phaseId,
        priorite: dto.priorite,
        assigneId: dto.assigneId,
        statut: dto.statut,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        echeance: dto.echeance ? new Date(dto.echeance) : undefined,
        tempsEstimeH: dto.tempsEstimeH,
        termineLe: dto.statut === 'TERMINE' ? new Date() : undefined,
      },
      include: { assigne: ASSIGNE },
    });

    if (dto.assigneId && dto.assigneId !== avant.assigneId && dto.assigneId !== parId) {
      await this.notifications.notifier(dto.assigneId, TypeNotification.TACHE_ASSIGNEE,
        'Tâche assignée', `« ${tache.titre} » vous a été assignée.`, `/taches/${id}`);
    }
    return { succes: true, message: 'Tâche mise à jour.', donnees: tache };
  }

  /** Déplacement Kanban (drag & drop) : change la colonne et la position. */
  async deplacer(id: string, dto: DeplacerTacheDto, parId: string) {
    const avant = await this.trouver(id);
    await this.historiser(id, 'statut', avant.statut, dto.statut, parId);
    const tache = await this.prisma.tache.update({
      where: { id },
      data: {
        statut: dto.statut,
        ordre: dto.ordre,
        termineLe: dto.statut === 'TERMINE' ? new Date() : null,
      },
    });
    // push temps réel : le tableau Kanban se met à jour chez tout le monde
    this.realtime.emitBroadcast('tache:deplacee', {
      tacheId: id,
      projetId: tache.projetId,
      statut: tache.statut,
      ordre: tache.ordre,
    });
    return { succes: true, message: 'Tâche déplacée.', donnees: tache };
  }

  async supprimer(id: string) {
    await this.trouver(id);
    // enfants d'abord (FK)
    await this.prisma.commentaire.deleteMany({ where: { tacheId: id } });
    await this.prisma.pieceJointe.deleteMany({ where: { tacheId: id } });
    await this.prisma.historiqueTache.deleteMany({ where: { tacheId: id } });
    await this.prisma.validation.deleteMany({ where: { tacheId: id } });
    await this.prisma.blocage.deleteMany({ where: { tacheId: id } });
    await this.prisma.tache.delete({ where: { id } });
    return { succes: true, message: 'Tâche supprimée.' };
  }

  // ─── Commentaires ───
  async commenter(id: string, dto: CommenterDto, auteurId: string) {
    const tache = await this.trouver(id);
    const commentaire = await this.prisma.commentaire.create({
      data: {
        tacheId: id,
        auteurId,
        contenu: dto.contenu,
        mentions: dto.mentions ?? [],
      },
      include: { auteur: ASSIGNE },
    });
    // notifier les membres mentionnés
    for (const mid of dto.mentions ?? []) {
      if (mid !== auteurId)
        await this.notifications.notifier(mid, TypeNotification.MENTION,
          'Vous avez été mentionné', `sur la tâche « ${tache.titre} ».`, `/taches/${id}`);
    }
    // notifier l'assigné (s'il n'est pas l'auteur)
    if (tache.assigneId && tache.assigneId !== auteurId)
      await this.notifications.notifier(tache.assigneId, TypeNotification.COMMENTAIRE,
        'Nouveau commentaire', `sur « ${tache.titre} ».`, `/taches/${id}`);
    return { succes: true, message: 'Commentaire ajouté.', donnees: commentaire };
  }

  // ─── Pièces jointes ───
  async ajouterPieceJointe(id: string, dto: PieceJointeDto) {
    await this.trouver(id);
    const pj = await this.prisma.pieceJointe.create({
      data: { tacheId: id, nom: dto.nom, url: dto.url, type: dto.type, tailleKo: dto.tailleKo },
    });
    return { succes: true, message: 'Pièce jointe ajoutée.', donnees: pj };
  }

  async supprimerPieceJointe(pjId: string, dossier: string) {
    const pj = await this.prisma.pieceJointe.findUnique({ where: { id: pjId } });
    if (!pj) throw new NotFoundException({ message: 'Pièce jointe introuvable.' });
    await this.prisma.pieceJointe.delete({ where: { id: pjId } });
    // efface le fichier (best effort)
    fsp.rm(join(dossier, basename(pj.url)), { force: true }).catch(() => undefined);
    return { succes: true, message: 'Pièce jointe supprimée.' };
  }

  // ─── Blocage ───
  async bloquer(id: string, dto: BloquerDto, parId: string) {
    const avant = await this.trouver(id);
    const existe = await this.prisma.blocage.findUnique({ where: { tacheId: id } });
    if (existe && !existe.resolu)
      throw new BadRequestException({ message: 'Cette tâche est déjà bloquée.', code: 'DEJA_BLOQUE' });

    await this.historiser(id, 'statut', avant.statut, 'BLOQUE', parId);
    await this.prisma.blocage.upsert({
      where: { tacheId: id },
      update: { motif: dto.motif, resolu: false, resoluLe: null },
      create: { tacheId: id, motif: dto.motif },
    });
    await this.prisma.tache.update({ where: { id }, data: { statut: 'BLOQUE' } });
    return { succes: true, message: 'Tâche marquée comme bloquée.' };
  }

  async debloquer(id: string, solution: string | undefined, parId: string) {
    await this.trouver(id);
    const blocage = await this.prisma.blocage.findUnique({ where: { tacheId: id } });
    if (!blocage || blocage.resolu)
      throw new BadRequestException({ message: "Cette tâche n'est pas bloquée.", code: 'NON_BLOQUE' });

    await this.prisma.blocage.update({
      where: { tacheId: id },
      data: { resolu: true, resoluLe: new Date(), solution },
    });
    await this.historiser(id, 'statut', 'BLOQUE', 'EN_COURS', parId);
    await this.prisma.tache.update({ where: { id }, data: { statut: 'EN_COURS' } });
    return { succes: true, message: 'Tâche débloquée.' };
  }

  // ─── Workflow de validation : changement de statut contrôlé ───
  /**
   * Fait avancer une tâche dans le workflow, en enregistrant l'auteur, la date
   * et un commentaire (historique de validation). Les statuts VALIDE_MANAGER et
   * TERMINE sont réservés aux rôles ADMIN / MANAGER.
   */
  async changerStatut(
    id: string,
    statut: StatutTache,
    commentaire: string | undefined,
    membre: { id: string; role: string },
  ) {
    const avant = await this.trouver(id);

    if (STATUTS_MANAGER.includes(statut) && membre.role !== 'ADMIN' && membre.role !== 'MANAGER') {
      throw new ForbiddenException({
        message: 'Seul un manager ou administrateur peut valider définitivement une tâche.',
        code: 'VALIDATION_RESERVEE',
      });
    }

    await this.historiser(id, 'statut', avant.statut, statut, membre.id, commentaire);

    const tache = await this.prisma.tache.update({
      where: { id },
      data: {
        statut,
        termineLe: statut === 'TERMINE' ? new Date() : avant.statut === 'TERMINE' ? null : undefined,
      },
      include: { assigne: ASSIGNE },
    });

    // Trace formelle dans le registre des validations (manager / terminé).
    if (STATUTS_MANAGER.includes(statut)) {
      await this.prisma.validation.create({
        data: {
          tacheId: id,
          validateurId: membre.id,
          statut: 'ACCEPTEE',
          commentaire: commentaire ?? null,
          traiteeLe: new Date(),
        },
      });
      if (tache.assigneId && tache.assigneId !== membre.id) {
        await this.notifications.notifier(
          tache.assigneId,
          TypeNotification.TACHE_ASSIGNEE,
          statut === 'TERMINE' ? 'Tâche terminée ✅' : 'Tâche validée par le manager',
          `« ${tache.titre} » : ${LIBELLE[statut]}.`,
          `/taches/${id}`,
        );
      }
    }

    this.realtime.emitBroadcast('tache:statut', {
      tacheId: id,
      projetId: tache.projetId,
      statut,
    });
    return { succes: true, message: 'Statut mis à jour.', donnees: tache };
  }

  /** Liste filtrée (tous projets) pour le suivi admin / manager. */
  async lister(filtres: {
    projetId?: string;
    statut?: StatutTache;
    assigneId?: string;
    priorite?: string;
    echeanceAvant?: string;
    echeanceApres?: string;
  }) {
    const where: Prisma.TacheWhereInput = {};
    if (filtres.projetId) where.projetId = filtres.projetId;
    if (filtres.statut) where.statut = filtres.statut;
    if (filtres.assigneId) where.assigneId = filtres.assigneId;
    if (filtres.priorite) where.priorite = filtres.priorite as Prisma.EnumPrioriteFilter['equals'];
    if (filtres.echeanceAvant || filtres.echeanceApres) {
      where.echeance = {};
      if (filtres.echeanceApres) where.echeance.gte = new Date(filtres.echeanceApres);
      if (filtres.echeanceAvant) where.echeance.lte = new Date(filtres.echeanceAvant);
    }
    const taches = await this.prisma.tache.findMany({
      where,
      include: {
        assigne: ASSIGNE,
        projet: { select: { id: true, nom: true } },
      },
      orderBy: [{ echeance: { sort: 'asc', nulls: 'last' } }, { creeLe: 'desc' }],
      take: 500,
    });
    return { succes: true, message: 'Tâches filtrées.', donnees: taches };
  }

  /** Statistiques d'avancement (vue d'ensemble admin / manager). */
  async statistiques(projetId?: string) {
    const where: Prisma.TacheWhereInput = projetId ? { projetId } : {};
    const taches = await this.prisma.tache.findMany({
      where,
      select: { statut: true, echeance: true, assigne: ASSIGNE, assigneId: true },
    });

    const total = taches.length;
    const parStatut = Object.fromEntries(COLONNES.map((s) => [s, 0])) as Record<StatutTache, number>;
    let sommePoids = 0;
    const maintenant = Date.now();
    let enRetard = 0;

    for (const t of taches) {
      parStatut[t.statut] = (parStatut[t.statut] ?? 0) + 1;
      sommePoids += POIDS[t.statut] ?? 0;
      if (t.echeance && t.statut !== 'TERMINE' && new Date(t.echeance).getTime() < maintenant) enRetard++;
    }

    const dansEtat = (etats: StatutTache[]) => etats.reduce((s, e) => s + (parStatut[e] ?? 0), 0);

    // Regroupement par développeur (assigné).
    const carte = new Map<string, { membre: { id: string; nomComplet: string }; total: number; terminees: number; enCours: number }>();
    for (const t of taches) {
      if (!t.assigne) continue;
      const e = carte.get(t.assigne.id) ?? { membre: { id: t.assigne.id, nomComplet: t.assigne.nomComplet }, total: 0, terminees: 0, enCours: 0 };
      e.total++;
      if (t.statut === 'TERMINE') e.terminees++;
      else if (t.statut !== 'A_FAIRE') e.enCours++;
      carte.set(t.assigne.id, e);
    }

    return {
      succes: true,
      message: 'Statistiques du projet.',
      donnees: {
        total,
        pourcentageGlobal: total ? Math.round(sommePoids / total) : 0,
        parStatut,
        buckets: {
          aFaire: parStatut.A_FAIRE ?? 0,
          enCours: parStatut.EN_COURS ?? 0,
          developpees: dansEtat(['DEV_TERMINE', 'ATTENTE_TEST', 'EN_TEST', 'TEST_VALIDE', 'VALIDE_MANAGER', 'TERMINE']),
          enTest: dansEtat(['ATTENTE_TEST', 'EN_TEST']),
          testValide: dansEtat(['TEST_VALIDE', 'VALIDE_MANAGER', 'TERMINE']),
          valideManager: dansEtat(['VALIDE_MANAGER', 'TERMINE']),
          terminees: parStatut.TERMINE ?? 0,
          bloquees: parStatut.BLOQUE ?? 0,
          enRetard,
        },
        parDeveloppeur: [...carte.values()].sort((a, b) => b.total - a.total),
      },
    };
  }

  // ─── privé ───
  private async trouver(id: string) {
    const t = await this.prisma.tache.findUnique({ where: { id } });
    if (!t) throw new NotFoundException({ message: 'Tâche introuvable.' });
    return t;
  }

  private async assurerProjet(projetId: string) {
    const p = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!p) throw new NotFoundException({ message: 'Projet introuvable.' });
  }

  private async historiser(
    tacheId: string,
    champ: string,
    ancienne: unknown,
    nouvelle: unknown,
    parId: string,
    commentaire?: string,
  ) {
    const a = ancienne === null || ancienne === undefined ? null : String(ancienne);
    const n = nouvelle === null || nouvelle === undefined ? null : String(nouvelle);
    if (a === n && !commentaire) return;
    await this.prisma.historiqueTache.create({
      data: { tacheId, champ, ancienne: a, nouvelle: n, parId, commentaire: commentaire ?? null },
    });
  }
}
