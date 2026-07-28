import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TypeEvenement } from '@prisma/client';

export class CreerEvenementDto {
  @IsString() @MinLength(2) titre!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TypeEvenement) type?: TypeEvenement;
  @IsDateString() debut!: string;
  @IsOptional() @IsDateString() fin?: string;
  @IsOptional() @IsInt() @Min(0) rappelAvantMin?: number;
  @IsOptional() @IsString() projetId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) participants?: string[];
}
export class MajEvenementDto extends PartialType(CreerEvenementDto) {}
