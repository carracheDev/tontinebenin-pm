import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProjetsService } from './projets.service';
import { CreerProjetDto } from './dto/creer-projet.dto';
import { MajProjetDto } from './dto/maj-projet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projets')
export class ProjetsController {
  constructor(private readonly projets: ProjetsService) {}

  @Get()
  liste() {
    return this.projets.liste();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.projets.detail(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  creer(@Body() dto: CreerProjetDto) {
    return this.projets.creer(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: MajProjetDto) {
    return this.projets.modifier(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.projets.supprimer(id);
  }
}
