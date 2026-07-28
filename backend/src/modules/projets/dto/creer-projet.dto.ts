import {
  IsDateString, IsEnum, IsOptional, IsString, MinLength,
} from 'class-validator';
import { Priorite, StatutProjet } from '@prisma/client';

export class CreerProjetDto {
  @IsString() @MinLength(2) nom!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(StatutProjet) statut?: StatutProjet;
  @IsOptional() @IsEnum(Priorite) priorite?: Priorite;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsDateString() dateDebut?: string;
  @IsOptional() @IsDateString() dateFinPrevue?: string;
  @IsOptional() @IsString() version?: string;
}
