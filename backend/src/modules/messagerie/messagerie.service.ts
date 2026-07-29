import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TypeMessage } from '@prisma/client';
import { promises as fsp } from 'fs';
import { basename, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

const AUTEUR = { select: { id: true, nomComplet: true, photoUrl: true } };

@Injectable()
export class MessagerieService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  /** Canal d'équipe : le crée si absent et y ajoute tous les membres actifs. */
  private async assurerCanal() {
    let canal = await this.prisma.conversation.findFirst({ where: { type: 'CANAL' } });
    if (!canal) {
      canal = await this.prisma.conversation.create({
        data: { type: 'CANAL', nom: 'Équipe TontineBénin' },
      });
    }
    const actifs = await this.prisma.membre.findMany({
      where: { statut: 'ACTIF' },
      select: { id: true },
    });
    const deja = await this.prisma.membreConversation.findMany({
      where: { conversationId: canal.id },
      select: { membreId: true },
    });
    const set = new Set(deja.map((m) => m.membreId));
    const aAjouter = actifs.filter((a) => !set.has(a.id));
    if (aAjouter.length) {
      await this.prisma.membreConversation.createMany({
        data: aAjouter.map((a) => ({ conversationId: canal!.id, membreId: a.id })),
      });
    }
    return canal;
  }

  private async participant(conversationId: string, membreId: string) {
    const mc = await this.prisma.membreConversation.findUnique({
      where: { conversationId_membreId: { conversationId, membreId } },
    });
    if (!mc) throw new ForbiddenException({ message: 'Conversation non autorisée.' });
    return mc;
  }

  /** Liste des conversations du membre (canal + DM), avec dernier message + non-lus. */
  async conversations(membreId: string) {
    await this.assurerCanal();
    const liens = await this.prisma.membreConversation.findMany({
      where: { membreId },
      include: {
        conversation: {
          include: {
            membres: { include: { membre: AUTEUR } },
            messages: { orderBy: { creeLe: 'desc' }, take: 1, include: { auteur: AUTEUR } },
          },
        },
      },
    });

    const donnees = await Promise.all(
      liens.map(async (l) => {
        const c = l.conversation;
        const dernier = c.messages[0] ?? null;
        const nonLus = await this.prisma.message.count({
          where: {
            conversationId: c.id,
            auteurId: { not: membreId },
            ...(l.luJusquauLe ? { creeLe: { gt: l.luJusquauLe } } : {}),
          },
        });
        const autres = c.membres.map((m) => m.membre).filter((m) => m.id !== membreId);
        const nom = c.type === 'CANAL' ? c.nom ?? 'Équipe' : autres[0]?.nomComplet ?? 'Direct';
        return {
          id: c.id,
          type: c.type,
          nom,
          interlocuteur: c.type === 'DIRECT' ? autres[0] ?? null : null,
          membres: c.membres.map((m) => m.membre),
          dernierMessage: dernier,
          nonLus,
        };
      }),
    );

    donnees.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'CANAL' ? -1 : 1;
      const ta = a.dernierMessage ? +new Date(a.dernierMessage.creeLe) : 0;
      const tb = b.dernierMessage ? +new Date(b.dernierMessage.creeLe) : 0;
      return tb - ta;
    });

    return { succes: true, message: 'Conversations.', donnees };
  }

  /** Nombre total de messages non lus (pour le badge). */
  async nombreNonLus(membreId: string) {
    const liens = await this.prisma.membreConversation.findMany({
      where: { membreId },
      select: { conversationId: true, luJusquauLe: true },
    });
    let total = 0;
    for (const l of liens) {
      total += await this.prisma.message.count({
        where: {
          conversationId: l.conversationId,
          auteurId: { not: membreId },
          ...(l.luJusquauLe ? { creeLe: { gt: l.luJusquauLe } } : {}),
        },
      });
    }
    return { succes: true, message: 'Non-lus.', donnees: { total } };
  }

  /** Ouvre (ou récupère) une conversation privée entre deux membres. */
  async ouvrirDirect(membreId: string, autreId: string) {
    if (membreId === autreId)
      throw new ForbiddenException({ message: 'Conversation avec soi-même impossible.' });
    const autre = await this.prisma.membre.findUnique({ where: { id: autreId } });
    if (!autre) throw new NotFoundException({ message: 'Membre introuvable.' });

    let conv = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { membres: { some: { membreId } } },
          { membres: { some: { membreId: autreId } } },
        ],
      },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          membres: { create: [{ membreId }, { membreId: autreId }] },
        },
      });
    }
    return { succes: true, message: 'Conversation ouverte.', donnees: { id: conv.id } };
  }

  /** Messages d'une conversation + marque comme lu. */
  async messages(conversationId: string, membreId: string) {
    await this.participant(conversationId, membreId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { creeLe: 'asc' },
      take: 300,
      include: { auteur: AUTEUR },
    });
    await this.prisma.membreConversation.update({
      where: { conversationId_membreId: { conversationId, membreId } },
      data: { luJusquauLe: new Date() },
    });
    return { succes: true, message: 'Messages.', donnees: messages };
  }

  private async creer(
    conversationId: string,
    auteurId: string,
    data: {
      type: TypeMessage;
      contenu?: string;
      audioFichier?: string;
      dureeSec?: number;
      fichierNom?: string;
      fichierStocke?: string;
      fichierMime?: string;
      fichierTailleKo?: number;
    },
  ) {
    await this.participant(conversationId, auteurId);
    const message = await this.prisma.message.create({
      data: { conversationId, auteurId, ...data },
      include: { auteur: AUTEUR },
    });
    // Temps réel : notifier les autres participants
    const membres = await this.prisma.membreConversation.findMany({
      where: { conversationId },
      select: { membreId: true },
    });
    for (const m of membres) {
      if (m.membreId !== auteurId)
        this.realtime.emitToMembre(m.membreId, 'message:nouveau', { conversationId, message });
    }
    return message;
  }

  async envoyerTexte(conversationId: string, auteurId: string, contenu: string) {
    const message = await this.creer(conversationId, auteurId, { type: 'TEXTE', contenu });
    return { succes: true, message: 'Message envoyé.', donnees: message };
  }

  async envoyerVocal(conversationId: string, auteurId: string, audioFichier: string, dureeSec: number) {
    const message = await this.creer(conversationId, auteurId, {
      type: 'VOCAL',
      audioFichier,
      dureeSec,
    });
    return { succes: true, message: 'Message vocal envoyé.', donnees: message };
  }

  async envoyerFichier(
    conversationId: string,
    auteurId: string,
    meta: { nom: string; stocke: string; mime: string; tailleKo: number },
  ) {
    const message = await this.creer(conversationId, auteurId, {
      type: 'FICHIER',
      fichierNom: meta.nom,
      fichierStocke: meta.stocke,
      fichierMime: meta.mime,
      fichierTailleKo: meta.tailleKo,
    });
    return { succes: true, message: 'Fichier envoyé.', donnees: message };
  }

  /** Supprime un message (auteur ou admin). Efface le fichier associé + temps réel. */
  async supprimer(messageId: string, membreId: string, estAdmin: boolean) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException({ message: 'Message introuvable.' });
    if (msg.auteurId !== membreId && !estAdmin)
      throw new ForbiddenException({ message: 'Suppression non autorisée.' });

    await this.prisma.message.delete({ where: { id: messageId } });

    // Efface le fichier associé (best effort)
    const fichier = msg.audioFichier ?? msg.fichierStocke;
    if (fichier) {
      const dossier = msg.type === 'VOCAL' ? 'audio' : 'fichiers';
      const chemin = join(process.cwd(), 'uploads', dossier, basename(fichier));
      fsp.rm(chemin, { force: true }).catch(() => undefined);
    }

    // Temps réel : notifie les participants
    const membres = await this.prisma.membreConversation.findMany({
      where: { conversationId: msg.conversationId },
      select: { membreId: true },
    });
    for (const m of membres)
      this.realtime.emitToMembre(m.membreId, 'message:supprime', {
        conversationId: msg.conversationId,
        messageId,
      });

    return { succes: true, message: 'Message supprimé.' };
  }
}
