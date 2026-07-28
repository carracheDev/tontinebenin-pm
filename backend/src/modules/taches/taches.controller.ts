import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { TachesService } from './taches.service';
import { CreerTacheDto } from './dto/creer-tache.dto';
import { MajTacheDto } from './dto/maj-tache.dto';
import { DeplacerTacheDto } from './dto/deplacer-tache.dto';
import { CommenterDto } from './dto/commenter.dto';
import { PieceJointeDto } from './dto/piece-jointe.dto';
import { BloquerDto } from './dto/bloquer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  MembreCourant, MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class TachesController {
  constructor(private readonly taches: TachesService) {}

  // Vue Kanban d'un projet
  @Get('projets/:projetId/taches')
  kanban(@Param('projetId') projetId: string) {
    return this.taches.kanban(projetId);
  }

  @Post('taches')
  creer(@Body() dto: CreerTacheDto, @MembreCourant() m: MembreAuth) {
    return this.taches.creer(dto, m.id);
  }

  @Get('taches/:id')
  detail(@Param('id') id: string) {
    return this.taches.detail(id);
  }

  @Patch('taches/:id')
  modifier(@Param('id') id: string, @Body() dto: MajTacheDto, @MembreCourant() m: MembreAuth) {
    return this.taches.modifier(id, dto, m.id);
  }

  @Patch('taches/:id/deplacer')
  deplacer(@Param('id') id: string, @Body() dto: DeplacerTacheDto, @MembreCourant() m: MembreAuth) {
    return this.taches.deplacer(id, dto, m.id);
  }

  @Post('taches/:id/commentaires')
  commenter(@Param('id') id: string, @Body() dto: CommenterDto, @MembreCourant() m: MembreAuth) {
    return this.taches.commenter(id, dto, m.id);
  }

  @Post('taches/:id/pieces-jointes')
  pieceJointe(@Param('id') id: string, @Body() dto: PieceJointeDto) {
    return this.taches.ajouterPieceJointe(id, dto);
  }

  @Post('taches/:id/bloquer')
  bloquer(@Param('id') id: string, @Body() dto: BloquerDto, @MembreCourant() m: MembreAuth) {
    return this.taches.bloquer(id, dto, m.id);
  }

  @Patch('taches/:id/debloquer')
  debloquer(@Param('id') id: string, @Body('solution') solution: string, @MembreCourant() m: MembreAuth) {
    return this.taches.debloquer(id, solution, m.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('taches/:id')
  supprimer(@Param('id') id: string) {
    return this.taches.supprimer(id);
  }
}
