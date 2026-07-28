import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
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
