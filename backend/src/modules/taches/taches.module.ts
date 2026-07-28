import { Module } from '@nestjs/common';
import { TachesService } from './taches.service';
import { TachesController } from './taches.controller';

@Module({
  controllers: [TachesController],
  providers: [TachesService],
  exports: [TachesService],
})
export class TachesModule {}
