import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembresModule } from './modules/membres/membres.module';
import { ProjetsModule } from './modules/projets/projets.module';
import { TachesModule } from './modules/taches/taches.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ValidationsModule } from './modules/validations/validations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    MembresModule,
    ProjetsModule,
    TachesModule,
    NotificationsModule,
    ValidationsModule,
  ],
})
export class AppModule {}
