import { Module } from '@nestjs/common';
import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ValidationsController],
  providers: [ValidationsService],
})
export class ValidationsModule {}
