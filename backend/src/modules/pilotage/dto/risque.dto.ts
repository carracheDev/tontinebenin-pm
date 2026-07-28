import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { NiveauRisque } from '@prisma/client';

export class CreerRisqueDto {
  @IsString() @MinLength(2) libelle!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(NiveauRisque) niveau?: NiveauRisque;
  @IsOptional() @IsInt() @Min(0) @Max(100) probabilite?: number;
  @IsOptional() @IsString() mitigation?: string;
  @IsOptional() @IsString() responsableId?: string;
}
export class MajRisqueDto extends PartialType(CreerRisqueDto) {
  @IsOptional() @IsBoolean() resolu?: boolean;
}
