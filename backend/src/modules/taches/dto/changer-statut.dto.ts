import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatutTache } from '@prisma/client';

export class ChangerStatutDto {
  @IsEnum(StatutTache) statut!: StatutTache;
  @IsOptional() @IsString() @MaxLength(1000) commentaire?: string;
}
