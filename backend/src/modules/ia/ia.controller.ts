import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TypeRapportIA } from '@prisma/client';
import { IaService } from './ia.service';
import { GenererRapportDto } from './dto/generer-rapport.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('ia')
export class IaController {
  constructor(private readonly ia: IaService) {}

  /** Génère un rapport pour un projet. */
  @Post('projets/:projetId/rapport')
  genererProjet(@Param('projetId') projetId: string, @Body() dto: GenererRapportDto) {
    return this.ia.genererRapportProjet(projetId, dto.type);
  }

  /** Synthèse globale du portefeuille (tous projets). */
  @Post('synthese')
  synthese() {
    return this.ia.genererSynthese();
  }

  /** Historique des rapports générés. */
  @Get('rapports')
  liste(@Query('projetId') projetId?: string, @Query('type') type?: TypeRapportIA) {
    return this.ia.liste(projetId, type);
  }

  @Get('rapports/:id')
  parId(@Param('id') id: string) {
    return this.ia.parId(id);
  }

  @Delete('rapports/:id')
  supprimer(@Param('id') id: string) {
    return this.ia.supprimer(id);
  }
}
