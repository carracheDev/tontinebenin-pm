import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
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
import { MessagerieService } from './messagerie.service';
import { EnvoyerMessageDto, OuvrirDirectDto } from './dto/messagerie.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { MembreCourant, MembreAuth } from '../../common/decorators/membre-courant.decorator';

const DOSSIER_AUDIO = join(process.cwd(), 'uploads', 'audio');
if (!existsSync(DOSSIER_AUDIO)) mkdirSync(DOSSIER_AUDIO, { recursive: true });

@UseGuards(JwtAuthGuard)
@Controller('messagerie')
export class MessagerieController {
  constructor(private readonly messagerie: MessagerieService) {}

  @Get('conversations')
  conversations(@MembreCourant() m: MembreAuth) {
    return this.messagerie.conversations(m.id);
  }

  @Post('direct')
  direct(@Body() dto: OuvrirDirectDto, @MembreCourant() m: MembreAuth) {
    return this.messagerie.ouvrirDirect(m.id, dto.membreId);
  }

  @Get('conversations/:id/messages')
  messages(@Param('id') id: string, @MembreCourant() m: MembreAuth) {
    return this.messagerie.messages(id, m.id);
  }

  @Post('conversations/:id/messages')
  envoyer(@Param('id') id: string, @Body() dto: EnvoyerMessageDto, @MembreCourant() m: MembreAuth) {
    return this.messagerie.envoyerTexte(id, m.id, dto.contenu);
  }

  @Post('conversations/:id/vocal')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: DOSSIER_AUDIO,
        filename: (_req, file, cb) => cb(null, randomUUID() + (extname(file.originalname) || '.webm')),
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 Mo max
    }),
  )
  vocal(
    @Param('id') id: string,
    @UploadedFile() fichier: Express.Multer.File,
    @Body('dureeSec') dureeSec: string,
    @MembreCourant() m: MembreAuth,
  ) {
    if (!fichier) throw new NotFoundException({ message: 'Aucun fichier audio reçu.' });
    return this.messagerie.envoyerVocal(id, m.id, fichier.filename, parseInt(dureeSec, 10) || 0);
  }

  /** Streame un fichier vocal (protégé par JWT ; nom = UUID). */
  @Get('audio/:fichier')
  audio(@Param('fichier') fichier: string): StreamableFile {
    const chemin = join(DOSSIER_AUDIO, basename(fichier));
    if (!existsSync(chemin)) throw new NotFoundException({ message: 'Audio introuvable.' });
    return new StreamableFile(createReadStream(chemin), { type: 'audio/webm' });
  }
}
