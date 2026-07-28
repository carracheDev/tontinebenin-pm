import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreerJalonDto {
  @IsString() @MinLength(2) titre!: string;
  @IsDateString() date!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() version?: string;
}
export class MajJalonDto extends PartialType(CreerJalonDto) {
  @IsOptional() @IsBoolean() atteint?: boolean;
}
