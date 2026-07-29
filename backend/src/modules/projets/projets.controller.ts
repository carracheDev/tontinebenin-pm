import {
  Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post,
  StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ProjetsService } from './projets.service';
import { CreerProjetDto } from './dto/creer-projet.dto';
import { MajProjetDto } from './dto/maj-projet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const DOSSIER_PROJETS = join(process.cwd(), 'uploads', 'projets');
if (!existsSync(DOSSIER_PROJETS)) mkdirSync(DOSSIER_PROJETS, { recursive: true });

@UseGuards(JwtAuthGuard)
@Controller('projets')
export class ProjetsController {
  constructor(private readonly projets: ProjetsService) {}

  @Get()
  liste() {
    return this.projets.liste();
  }

  // ── Pièces jointes (déclarées AVANT :id pour éviter l'ambiguïté de route) ──
  @Get('pieces-jointes/:fichier')
  telecharger(@Param('fichier') fichier: string): StreamableFile {
    const chemin = join(DOSSIER_PROJETS, basename(fichier));
    if (!existsSync(chemin)) throw new NotFoundException({ message: 'Fichier introuvable.' });
    return new StreamableFile(createReadStream(chemin));
  }

  @Delete('pieces-jointes/:pjId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  supprimerPiece(@Param('pjId') pjId: string) {
    return this.projets.supprimerPiece(pjId, DOSSIER_PROJETS);
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

  @Post(':id/pieces-jointes')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: DOSSIER_PROJETS,
        filename: (_req, file, cb) => cb(null, randomUUID() + (extname(file.originalname) || '')),
      }),
      limits: { fileSize: 30 * 1024 * 1024 }, // 30 Mo max
    }),
  )
  pieceJointe(@Param('id') id: string, @UploadedFile() fichier: Express.Multer.File) {
    if (!fichier) throw new NotFoundException({ message: 'Aucun fichier reçu.' });
    return this.projets.ajouterPiece(id, {
      nom: Buffer.from(fichier.originalname, 'latin1').toString('utf8'),
      url: fichier.filename,
      type: fichier.mimetype,
      tailleKo: Math.max(1, Math.round(fichier.size / 1024)),
    });
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
