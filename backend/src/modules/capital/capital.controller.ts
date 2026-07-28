import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CapitalService } from './capital.service';
import { DefinirCapitalDto } from './dto/definir-capital.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('capital')
export class CapitalController {
  constructor(private readonly capital: CapitalService) {}

  @Get('table')
  table() { return this.capital.table(); }

  @Get('membre/:membreId')
  detail(@Param('membreId') id: string) { return this.capital.detailMembre(id); }

  // Seul le fondateur (ADMIN) attribue des parts et relance le calcul
  @UseGuards(RolesGuard) @Roles(Role.ADMIN)
  @Post('membre/:membreId')
  definir(@Param('membreId') id: string, @Body() dto: DefinirCapitalDto) {
    return this.capital.definir(id, dto);
  }

  @UseGuards(RolesGuard) @Roles(Role.ADMIN)
  @Post('recalculer')
  recalculer() { return this.capital.recalculerTous(); }
}
