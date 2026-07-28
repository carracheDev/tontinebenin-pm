import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { StatutTache } from '@prisma/client';
import { CreerTacheDto } from './creer-tache.dto';

export class MajTacheDto extends PartialType(CreerTacheDto) {
  @IsOptional() @IsEnum(StatutTache) statut?: StatutTache;
}
