import { Module } from '@nestjs/common';
import { TachesService } from './taches.service';
import { TachesController } from './taches.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TachesController],
  providers: [TachesService],
  exports: [TachesService],
})
export class TachesModule {}
