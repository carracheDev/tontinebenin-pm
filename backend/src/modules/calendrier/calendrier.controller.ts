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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { CalendrierService } from './calendrier.service';
import { CreerEvenementDto, MajEvenementDto } from './dto/evenement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

const DOSSIER_EVT = join(process.cwd(), 'uploads', 'evenements');
if (!existsSync(DOSSIER_EVT)) mkdirSync(DOSSIER_EVT, { recursive: true });

@UseGuards(JwtAuthGuard)
@Controller('calendrier')
export class CalendrierController {
  constructor(private readonly cal: CalendrierService) {}

  @Get()
  liste(@Query('from') from?: string, @Query('to') to?: string) {
    return this.cal.liste(from, to);
  }

  // Pièces jointes (déclaré avant :id pour éviter toute ambiguïté)
  @Post(':id/pieces-jointes')
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: DOSSIER_EVT,
        filename: (_req, file, cb) => cb(null, randomUUID() + (extname(file.originalname) || '')),
      }),
      limits: { fileSize: 30 * 1024 * 1024 },
    }),
  )
  ajouterPiece(@Param('id') id: string, @UploadedFile() fichier: Express.Multer.File) {
    if (!fichier) throw new NotFoundException({ message: 'Aucun fichier reçu.' });
    return this.cal.ajouterPiece(id, {
      nom: Buffer.from(fichier.originalname, 'latin1').toString('utf8'),
      url: fichier.filename,
      type: fichier.mimetype,
      tailleKo: Math.max(1, Math.round(fichier.size / 1024)),
    });
  }

  @Get('pieces-jointes/:fichier')
  telecharger(@Param('fichier') fichier: string): StreamableFile {
    const chemin = join(DOSSIER_EVT, basename(fichier));
    if (!existsSync(chemin)) throw new NotFoundException({ message: 'Fichier introuvable.' });
    return new StreamableFile(createReadStream(chemin));
  }

  @Delete('pieces-jointes/:pjId')
  supprimerPiece(@Param('pjId') pjId: string) {
    return this.cal.supprimerPiece(pjId, DOSSIER_EVT);
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
