import {
  Body, Controller, Delete, Get, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { AjouterVersionDto, CreerDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  MembreCourant, MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  liste(
    @MembreCourant() m: MembreAuth,
    @Query('projetId') projetId?: string,
    @Query('categorie') categorie?: string,
  ) {
    return this.docs.liste(m.role as Role, projetId, categorie);
  }

  @Get(':id')
  detail(@Param('id') id: string) { return this.docs.detail(id); }

  @Post()
  creer(@Body() dto: CreerDocumentDto, @MembreCourant() m: MembreAuth) {
    return this.docs.creer(dto, m.id);
  }

  @Post(':id/versions')
  version(@Param('id') id: string, @Body() dto: AjouterVersionDto) {
    return this.docs.ajouterVersion(id, dto);
  }

  @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  supprimer(@Param('id') id: string) { return this.docs.supprimer(id); }
}
