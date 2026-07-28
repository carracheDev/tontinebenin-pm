import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreerObjectifDto {
  @IsString() @MinLength(2) libelle!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() echeance?: string;
}
export class MajObjectifDto extends PartialType(CreerObjectifDto) {
  @IsOptional() @IsBoolean() atteint?: boolean;
}
