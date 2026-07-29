import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { TachesService } from './taches.service';
import { CreerTacheDto } from './dto/creer-tache.dto';
import { MajTacheDto } from './dto/maj-tache.dto';
import { DeplacerTacheDto } from './dto/deplacer-tache.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { CommenterDto } from './dto/commenter.dto';
import { BloquerDto } from './dto/bloquer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  MembreCourant, MembreAuth,
} from '../../common/decorators/membre-courant.decorator';

const DOSSIER_PIECES = join(process.cwd(), 'uploads', 'pieces');
if (!existsSync(DOSSIER_PIECES)) mkdirSync(DOSSIER_PIECES, { recursive: true });

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

  // Suivi admin / manager — liste filtrée (déclarée avant :id)
  @Get('taches')
  lister(
    @Query('projetId') projetId?: string,
    @Query('statut') statut?: string,
    @Query('assigneId') assigneId?: string,
    @Query('priorite') priorite?: string,
    @Query('echeanceAvant') echeanceAvant?: string,
    @Query('echeanceApres') echeanceApres?: string,
  ) {
    return this.taches.lister({
      projetId,
      statut: statut as never,
      assigneId,
      priorite,
      echeanceAvant,
      echeanceApres,
    });
  }

  @Get('taches/statistiques')
  statistiques(@Query('projetId') projetId?: string) {
    return this.taches.statistiques(projetId);
  }

  @Get('taches/:id')
  detail(@Param('id') id: string) {
    return this.taches.detail(id);
  }

  // Workflow de validation : avancer une tâche (avec commentaire)
  @Patch('taches/:id/statut')
  changerStatut(@Param('id') id: string, @Body() dto: ChangerStatutDto, @MembreCourant() m: MembreAuth) {
    return this.taches.changerStatut(id, dto.statut, dto.commentaire, { id: m.id, role: m.role });
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

  // ── Pièces jointes (fichiers : image, PDF, ZIP… tous types) ──
  @Post('taches/:id/pieces-jointes')
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: DOSSIER_PIECES,
        filename: (_req, file, cb) => cb(null, randomUUID() + (extname(file.originalname) || '')),
      }),
      limits: { fileSize: 30 * 1024 * 1024 }, // 30 Mo max
    }),
  )
  pieceJointe(@Param('id') id: string, @UploadedFile() fichier: Express.Multer.File) {
    if (!fichier) throw new NotFoundException({ message: 'Aucun fichier reçu.' });
    return this.taches.ajouterPieceJointe(id, {
      nom: Buffer.from(fichier.originalname, 'latin1').toString('utf8'),
      url: fichier.filename,
      type: fichier.mimetype,
      tailleKo: Math.max(1, Math.round(fichier.size / 1024)),
    });
  }

  @Get('taches/pieces-jointes/:fichier')
  telecharger(@Param('fichier') fichier: string): StreamableFile {
    const chemin = join(DOSSIER_PIECES, basename(fichier));
    if (!existsSync(chemin)) throw new NotFoundException({ message: 'Fichier introuvable.' });
    return new StreamableFile(createReadStream(chemin));
  }

  @Delete('pieces-jointes/:pjId')
  supprimerPiece(@Param('pjId') pjId: string) {
    return this.taches.supprimerPieceJointe(pjId, DOSSIER_PIECES);
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
