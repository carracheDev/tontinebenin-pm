import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('apercu')
  apercu() { return this.analytics.apercu(); }

  @Get('performance-membres')
  performance() { return this.analytics.performanceMembres(); }

  @Get('charge')
  charge() { return this.analytics.charge(); }

  @Get('repartition')
  repartition() { return this.analytics.repartitionResponsabilites(); }

  @Get('evolution')
  evolution(@Query('mois') mois?: string) {
    const n = Math.min(Math.max(parseInt(mois ?? '6', 10) || 6, 1), 12);
    return this.analytics.evolution(n);
  }

  @Get('timeline/:projetId')
  timeline(@Param('projetId') projetId: string) {
    return this.analytics.timeline(projetId);
  }
}
