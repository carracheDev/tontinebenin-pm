import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { StatutProjet } from '@prisma/client';

export class CreerPhaseDto {
  @IsString() @MinLength(2) nom!: string;
  @IsOptional() @IsInt() ordre?: number;
  @IsOptional() @IsDateString() dateDebut?: string;
  @IsOptional() @IsDateString() dateFin?: string;
}
export class MajPhaseDto extends PartialType(CreerPhaseDto) {
  @IsOptional() @IsEnum(StatutProjet) statut?: StatutProjet;
  @IsOptional() @IsInt() @Min(0) @Max(100) avancement?: number;
}
