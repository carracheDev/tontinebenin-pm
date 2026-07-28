import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { MembresService } from './membres.service';
import { CreerMembreDto } from './dto/creer-membre.dto';
import { MajMembreDto } from './dto/maj-membre.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('membres')
export class MembresController {
  constructor(private readonly membres: MembresService) {}

  @Get()
  liste() {
    return this.membres.liste();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.membres.detail(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  creer(@Body() dto: CreerMembreDto) {
    return this.membres.creer(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: MajMembreDto) {
    return this.membres.modifier(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  desactiver(@Param('id') id: string) {
    return this.membres.desactiver(id);
  }
}
