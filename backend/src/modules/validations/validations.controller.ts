import {
  Body, Controller, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ValidationsService } from './validations.service';
import { DemanderValidationDto } from './dto/demander-validation.dto';
import { TraiterValidationDto } from './dto/traiter-validation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  MembreCourant, MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ValidationsController {
  constructor(private readonly validations: ValidationsService) {}

  @Post('taches/:tacheId/validations/demander')
  demander(@Param('tacheId') tacheId: string, @Body() dto: DemanderValidationDto, @MembreCourant() m: MembreAuth) {
    return this.validations.demander(tacheId, dto, m.id);
  }

  @Get('taches/:tacheId/validations')
  parTache(@Param('tacheId') tacheId: string) {
    return this.validations.parTache(tacheId);
  }

  @Get('validations/en-attente')
  enAttente(@MembreCourant() m: MembreAuth) {
    return this.validations.mesEnAttente(m.id);
  }

  // Seuls les responsables tranchent
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('validations/:id/traiter')
  traiter(@Param('id') id: string, @Body() dto: TraiterValidationDto, @MembreCourant() m: MembreAuth) {
    return this.validations.traiter(id, dto, m.id);
  }
}
