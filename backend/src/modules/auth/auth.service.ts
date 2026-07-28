import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { InscriptionDto } from './dto/inscription.dto';
import { ConnexionDto } from './dto/connexion.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /** Le tout premier membre inscrit devient le FONDATEUR (ADMIN). */
  async inscription(dto: InscriptionDto) {
    const existe = await this.prisma.membre.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existe) {
      throw new BadRequestException({
        message: 'Un compte existe déjà avec cet email.',
        code: 'EMAIL_EXISTANT',
      });
    }

    const nbMembres = await this.prisma.membre.count();
    const premier = nbMembres === 0;

    const membre = await this.prisma.membre.create({
      data: {
        nomComplet: dto.nomComplet,
        email: dto.email.toLowerCase(),
        motDePasseHash: await argon2.hash(dto.motDePasse),
        poste: dto.poste,
        typeMembre: premier ? 'FONDATEUR' : 'COLLABORATEUR',
        role: premier ? 'ADMIN' : 'MEMBRE',
        statut: 'ACTIF',
      },
    });

    return {
      succes: true,
      message: premier
        ? 'Compte fondateur créé avec succès.'
        : 'Compte créé avec succès.',
      donnees: this.tokensEtProfil(membre),
    };
  }

  async connexion(dto: ConnexionDto) {
    const membre = await this.prisma.membre.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!membre || !(await argon2.verify(membre.motDePasseHash, dto.motDePasse))) {
      throw new UnauthorizedException({
        message: 'Email ou mot de passe incorrect.',
        code: 'IDENTIFIANTS_INVALIDES',
      });
    }
    if (membre.statut !== 'ACTIF') {
      throw new UnauthorizedException({
        message: 'Ce compte est inactif.',
        code: 'COMPTE_INACTIF',
      });
    }
    return {
      succes: true,
      message: 'Connexion réussie.',
      donnees: this.tokensEtProfil(membre),
    };
  }

  async rafraichir(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
      });
      const membre = await this.prisma.membre.findUnique({
        where: { id: payload.sub },
      });
      if (!membre || membre.statut !== 'ACTIF') throw new Error();
      return {
        succes: true,
        message: 'Token rafraîchi.',
        donnees: this.tokensEtProfil(membre),
      };
    } catch {
      throw new UnauthorizedException({
        message: 'Refresh token invalide ou expiré.',
        code: 'REFRESH_INVALIDE',
      });
    }
  }

  // ─── privé ───
  private tokensEtProfil(membre: {
    id: string;
    email: string;
    role: string;
    typeMembre: string;
    nomComplet: string;
  }) {
    const payload = {
      sub: membre.id,
      email: membre.email,
      role: membre.role,
      typeMembre: membre.typeMembre,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET || 'change-me-access',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return {
      accessToken,
      refreshToken,
      membre: {
        id: membre.id,
        nomComplet: membre.nomComplet,
        email: membre.email,
        role: membre.role,
        typeMembre: membre.typeMembre,
      },
    };
  }
}
