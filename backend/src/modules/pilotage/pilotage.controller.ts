import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PilotageService } from './pilotage.service';
import { CreerPhaseDto, MajPhaseDto } from './dto/phase.dto';
import { CreerObjectifDto, MajObjectifDto } from './dto/objectif.dto';
import { CreerJalonDto, MajJalonDto } from './dto/jalon.dto';
import { CreerRisqueDto, MajRisqueDto } from './dto/risque.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class PilotageController {
  constructor(private readonly p: PilotageService) {}

  // ── Vue globale & avancement ──
  @Get('projets/:projetId/vue-globale')
  vueGlobale(@Param('projetId') id: string) { return this.p.vueGlobale(id); }

  @Post('projets/:projetId/recalculer')
  recalculer(@Param('projetId') id: string) {
    return this.p.recalculer(id).then((avancement) => ({
      succes: true, message: 'Avancement recalculé.', donnees: { avancement },
    }));
  }

  // ── Phases ──
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Post('projets/:projetId/phases')
  creerPhase(@Param('projetId') id: string, @Body() dto: CreerPhaseDto) { return this.p.creerPhase(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('phases/:id')
  majPhase(@Param('id') id: string, @Body() dto: MajPhaseDto) { return this.p.majPhase(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('phases/:id')
  supPhase(@Param('id') id: string) { return this.p.supprimerPhase(id); }

  // ── Objectifs ──
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Post('projets/:projetId/objectifs')
  creerObjectif(@Param('projetId') id: string, @Body() dto: CreerObjectifDto) { return this.p.creerObjectif(id, dto); }
  @Patch('objectifs/:id')
  majObjectif(@Param('id') id: string, @Body() dto: MajObjectifDto) { return this.p.majObjectif(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('objectifs/:id')
  supObjectif(@Param('id') id: string) { return this.p.supprimerObjectif(id); }

  // ── Jalons / Roadmap ──
  @Get('projets/:projetId/roadmap')
  roadmap(@Param('projetId') id: string) { return this.p.roadmap(id); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Post('projets/:projetId/jalons')
  creerJalon(@Param('projetId') id: string, @Body() dto: CreerJalonDto) { return this.p.creerJalon(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('jalons/:id')
  majJalon(@Param('id') id: string, @Body() dto: MajJalonDto) { return this.p.majJalon(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('jalons/:id')
  supJalon(@Param('id') id: string) { return this.p.supprimerJalon(id); }

  // ── Risques ──
  @Get('projets/:projetId/risques')
  listeRisques(@Param('projetId') id: string) { return this.p.listeRisques(id); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Post('projets/:projetId/risques')
  creerRisque(@Param('projetId') id: string, @Body() dto: CreerRisqueDto) { return this.p.creerRisque(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Patch('risques/:id')
  majRisque(@Param('id') id: string, @Body() dto: MajRisqueDto) { return this.p.majRisque(id, dto); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('risques/:id')
  supRisque(@Param('id') id: string) { return this.p.supprimerRisque(id); }
}
