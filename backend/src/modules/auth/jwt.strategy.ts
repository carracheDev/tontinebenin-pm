import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  typeMembre: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me-access',
    });
  }

  async validate(payload: JwtPayload) {
    const membre = await this.prisma.membre.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, typeMembre: true, statut: true },
    });
    if (!membre || membre.statut !== 'ACTIF') {
      throw new UnauthorizedException({
        succes: false,
        message: 'Session invalide ou compte inactif.',
        code: 'SESSION_INVALIDE',
      });
    }
    return membre;
  }
}
