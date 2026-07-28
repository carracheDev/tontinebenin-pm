import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import {
  MembreCourant, MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifs: NotificationsService) {}

  @Get()
  liste(@MembreCourant() m: MembreAuth) {
    return this.notifs.liste(m.id);
  }

  @Get('non-lus')
  nonLus(@MembreCourant() m: MembreAuth) {
    return this.notifs.nonLus(m.id);
  }

  @Patch('tout-lu')
  toutLu(@MembreCourant() m: MembreAuth) {
    return this.notifs.marquerToutLu(m.id);
  }

  @Patch(':id/lu')
  lu(@Param('id') id: string, @MembreCourant() m: MembreAuth) {
    return this.notifs.marquerLu(id, m.id);
  }
}
