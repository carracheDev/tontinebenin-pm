import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { StatutValidation, TypeNotification } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DemanderValidationDto } from './dto/demander-validation.dto';
import { TraiterValidationDto } from './dto/traiter-validation.dto';

@Injectable()
export class ValidationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Un membre soumet sa tâche à validation → la tâche passe EN_VALIDATION. */
  async demander(tacheId: string, dto: DemanderValidationDto, demandeurId: string) {
    const tache = await this.trouverTache(tacheId);

    const enCours = await this.prisma.validation.findFirst({
      where: { tacheId, statut: StatutValidation.DEMANDEE },
    });
    if (enCours)
      throw new BadRequestException({
        message: 'Une demande de validation est déjà en cours pour cette tâche.',
        code: 'VALIDATION_EN_COURS',
      });

    const validation = await this.prisma.validation.create({
      data: {
        tacheId,
        validateurId: dto.validateurId,
        commentaire: dto.commentaire,
        version: dto.version,
        statut: StatutValidation.DEMANDEE,
      },
    });
    await this.prisma.tache.update({
      where: { id: tacheId },
      data: { statut: 'EN_VALIDATION' },
    });

    // notifier le responsable ciblé (sinon les admins/managers)
    if (dto.validateurId) {
      await this.notifications.notifier(dto.validateurId, TypeNotification.VALIDATION_DEMANDEE,
        'Validation demandée', `« ${tache.titre} » attend votre validation.`, `/taches/${tacheId}`);
    } else {
      const responsables = await this.prisma.membre.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, statut: 'ACTIF' },
        select: { id: true },
      });
      for (const r of responsables)
        if (r.id !== demandeurId)
          await this.notifications.notifier(r.id, TypeNotification.VALIDATION_DEMANDEE,
            'Validation demandée', `« ${tache.titre} » attend une validation.`, `/taches/${tacheId}`);
    }
    return { succes: true, message: 'Demande de validation envoyée.', donnees: validation };
  }

  /** Le responsable tranche : accepte, demande une modif ou rejette. */
  async traiter(validationId: string, dto: TraiterValidationDto, validateurId: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id: validationId },
      include: { tache: true },
    });
    if (!validation) throw new NotFoundException({ message: 'Validation introuvable.' });
    if (validation.statut !== StatutValidation.DEMANDEE)
      throw new BadRequestException({
        message: 'Cette demande a déjà été traitée.', code: 'DEJA_TRAITEE',
      });

    await this.prisma.validation.update({
      where: { id: validationId },
      data: {
        statut: dto.decision,
        commentaire: dto.commentaire,
        validateurId,
        traiteeLe: new Date(),
      },
    });

    // effet sur la tâche
    const nouveauStatut =
      dto.decision === StatutValidation.ACCEPTEE ? 'TERMINE' : 'EN_COURS';
    await this.prisma.tache.update({
      where: { id: validation.tacheId },
      data: {
        statut: nouveauStatut,
        termineLe: nouveauStatut === 'TERMINE' ? new Date() : null,
      },
    });
    await this.prisma.historiqueTache.create({
      data: {
        tacheId: validation.tacheId,
        champ: 'validation',
        ancienne: 'EN_VALIDATION',
        nouvelle: dto.decision,
        parId: validateurId,
      },
    });

    // prévenir le créateur/assigné de la tâche
    const cible = validation.tache.assigneId ?? validation.tache.createurId;
    const libelle =
      dto.decision === StatutValidation.ACCEPTEE ? 'acceptée ✅'
      : dto.decision === StatutValidation.REJETEE ? 'rejetée ❌'
      : 'à modifier ✏️';
    if (cible && cible !== validateurId)
      await this.notifications.notifier(cible, TypeNotification.VALIDATION_DEMANDEE,
        `Validation ${libelle}`, `Tâche « ${validation.tache.titre} ».`, `/taches/${validation.tacheId}`);

    return { succes: true, message: `Validation ${libelle}.` };
  }

  async parTache(tacheId: string) {
    const validations = await this.prisma.validation.findMany({
      where: { tacheId },
      include: { validateur: { select: { id: true, nomComplet: true } } },
      orderBy: { demandeeLe: 'desc' },
    });
    return { succes: true, message: 'Historique des validations.', donnees: validations };
  }

  async mesEnAttente(validateurId: string) {
    const validations = await this.prisma.validation.findMany({
      where: {
        statut: StatutValidation.DEMANDEE,
        OR: [{ validateurId }, { validateurId: null }],
      },
      include: { tache: { select: { id: true, titre: true, projetId: true } } },
      orderBy: { demandeeLe: 'asc' },
    });
    return { succes: true, message: 'Validations en attente.', donnees: validations };
  }

  private async trouverTache(id: string) {
    const t = await this.prisma.tache.findUnique({ where: { id } });
    if (!t) throw new NotFoundException({ message: 'Tâche introuvable.' });
    return t;
  }
}
