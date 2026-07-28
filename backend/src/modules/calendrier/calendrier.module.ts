import { Module } from '@nestjs/common';
import { CalendrierService } from './calendrier.service';
import { CalendrierController } from './calendrier.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CalendrierController],
  providers: [CalendrierService],
})
export class CalendrierModule {}
