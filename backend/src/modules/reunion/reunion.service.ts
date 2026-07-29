import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Génère les jetons JWT pour 8x8 JaaS (Jitsi as a Service).
 * Nécessite dans le .env : JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY.
 * Sans ces variables, la visio retombe sur le mode démo (meet.jit.si).
 */
@Injectable()
export class ReunionService {
  constructor(private prisma: PrismaService) {}

  estConfigure(): boolean {
    return !!(
      process.env.JAAS_APP_ID &&
      process.env.JAAS_KID &&
      process.env.JAAS_PRIVATE_KEY
    );
  }

  async jetonJaas(membreId: string) {
    if (!this.estConfigure()) {
      return { succes: true, message: 'JaaS non configuré.', donnees: { configure: false } };
    }

    const appId = process.env.JAAS_APP_ID as string;
    const kid = process.env.JAAS_KID as string;
    // La clé privée est stockée sur une ligne avec des \n échappés → on les restaure.
    const clePrivee = (process.env.JAAS_PRIVATE_KEY as string).replace(/\\n/g, '\n');

    const membre = await this.prisma.membre.findUnique({
      where: { id: membreId },
      select: { id: true, nomComplet: true, email: true },
    });

    const maintenant = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        aud: 'jitsi',
        iss: 'chat',
        sub: appId,
        room: '*', // ce jeton autorise toutes les salles de l'app
        exp: maintenant + 3 * 3600, // valable 3 h
        nbf: maintenant - 10,
        context: {
          user: {
            id: membre?.id ?? membreId,
            name: membre?.nomComplet ?? 'Membre',
            email: membre?.email ?? '',
            avatar: '',
            moderator: 'true', // équipe de confiance → chacun peut démarrer
          },
          features: {
            livestreaming: 'false',
            recording: 'false',
            transcription: 'false',
            'outbound-call': 'false',
          },
        },
      },
      clePrivee,
      { algorithm: 'RS256', header: { alg: 'RS256', kid, typ: 'JWT' } },
    );

    return {
      succes: true,
      message: 'Jeton JaaS émis.',
      donnees: { configure: true, domain: '8x8.vc', appId, token },
    };
  }
}
