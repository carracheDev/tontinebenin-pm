import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ContributionService } from './contribution.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Réservé au fondateur (ADMIN) — les membres ne voient pas la contribution/projection.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('contribution')
export class ContributionController {
  constructor(private readonly contribution: ContributionService) {}

  /** Tableau de contribution documentée par membre. */
  @Get()
  table() {
    return this.contribution.table();
  }

  /** Projection indicative (non contractuelle) en cas de passage en SARL. */
  @Get('projection')
  projection() {
    return this.contribution.projection();
  }

  @Get('membre/:id')
  detail(@Param('id') id: string) {
    return this.contribution.detailMembre(id);
  }
}
