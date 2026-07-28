import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InscriptionDto } from './dto/inscription.dto';
import { ConnexionDto } from './dto/connexion.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import {
  MembreCourant,
  MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('inscription')
  inscription(@Body() dto: InscriptionDto) {
    return this.auth.inscription(dto);
  }

  @Post('connexion')
  connexion(@Body() dto: ConnexionDto) {
    return this.auth.connexion(dto);
  }

  @Post('rafraichir')
  rafraichir(@Body() dto: RefreshDto) {
    return this.auth.rafraichir(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('moi')
  moi(@MembreCourant() membre: MembreAuth) {
    return { succes: true, message: 'Profil courant.', donnees: membre };
  }
}
