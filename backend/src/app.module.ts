import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembresModule } from './modules/membres/membres.module';
import { ProjetsModule } from './modules/projets/projets.module';
import { TachesModule } from './modules/taches/taches.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ValidationsModule } from './modules/validations/validations.module';
import { PilotageModule } from './modules/pilotage/pilotage.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ContributionModule } from './modules/contribution/contribution.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CalendrierModule } from './modules/calendrier/calendrier.module';
import { IaModule } from './modules/ia/ia.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    MembresModule,
    ProjetsModule,
    TachesModule,
    NotificationsModule,
    ValidationsModule,
    PilotageModule,
    AnalyticsModule,
    ContributionModule,
    DocumentsModule,
    CalendrierModule,
    IaModule,
  ],
})
export class AppModule {}
