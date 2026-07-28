import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutValidation } from '@prisma/client';

export class TraiterValidationDto {
  // ACCEPTEE | MODIFICATION_DEMANDEE | REJETEE
  @IsEnum(StatutValidation) decision!: StatutValidation;
  @IsOptional() @IsString() commentaire?: string;
}
