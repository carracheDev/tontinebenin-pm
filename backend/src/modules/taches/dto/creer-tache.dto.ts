import {
  IsDateString, IsEnum, IsNumber, IsOptional, IsString, MinLength,
} from 'class-validator';
import { Priorite } from '@prisma/client';

export class CreerTacheDto {
  @IsString() projetId!: string;
  @IsOptional() @IsString() phaseId?: string;
  @IsString() @MinLength(2) titre!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(Priorite) priorite?: Priorite;
  @IsOptional() @IsString() assigneId?: string;
  @IsOptional() @IsDateString() dateDebut?: string;
  @IsOptional() @IsDateString() echeance?: string;
  @IsOptional() @IsNumber() tempsEstimeH?: number;
}
