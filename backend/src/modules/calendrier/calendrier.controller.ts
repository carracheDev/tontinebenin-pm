import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CalendrierService } from './calendrier.service';
import { CreerEvenementDto, MajEvenementDto } from './dto/evenement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendrier')
export class CalendrierController {
  constructor(private readonly cal: CalendrierService) {}

  @Get()
  liste(@Query('from') from?: string, @Query('to') to?: string) {
    return this.cal.liste(from, to);
  }
  @Get(':id')
  detail(@Param('id') id: string) { return this.cal.detail(id); }
  @Post()
  creer(@Body() dto: CreerEvenementDto) { return this.cal.creer(dto); }
  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: MajEvenementDto) { return this.cal.modifier(id, dto); }
  @Delete(':id')
  supprimer(@Param('id') id: string) { return this.cal.supprimer(id); }
  @Post(':id/participants/:membreId')
  ajouter(@Param('id') id: string, @Param('membreId') mid: string) { return this.cal.ajouterParticipant(id, mid); }
  @Delete(':id/participants/:membreId')
  retirer(@Param('id') id: string, @Param('membreId') mid: string) { return this.cal.retirerParticipant(id, mid); }
}
