import { Module } from '@nestjs/common';
import { IaService } from './ia.service';
import { IaController } from './ia.controller';
import { PilotageModule } from '../pilotage/pilotage.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PilotageModule, AnalyticsModule],
  controllers: [IaController],
  providers: [IaService],
})
export class IaModule {}
