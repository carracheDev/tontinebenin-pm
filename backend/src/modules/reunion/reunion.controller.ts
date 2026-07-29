import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReunionService } from './reunion.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { MembreCourant, MembreAuth } from '../../common/decorators/membre-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reunion')
export class ReunionController {
  constructor(private readonly reunion: ReunionService) {}

  /** Jeton pour rejoindre une réunion via 8x8 JaaS (ou { configure:false } si non paramétré). */
  @Get('jaas')
  jaas(@MembreCourant() m: MembreAuth) {
    return this.reunion.jetonJaas(m.id);
  }
}
