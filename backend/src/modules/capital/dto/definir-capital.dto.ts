import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DefinirCapitalDto {
  @IsNumber() @Min(0) @Max(100) pourcentageAlloue!: number;
  @IsOptional() @IsInt() @Min(1) @Max(120) dureeVestingMois?: number; // défaut 48
  @IsOptional() @IsInt() @Min(0) @Max(48) cliffMois?: number;         // défaut 12
  @IsOptional() @IsDateString() dateDebutVesting?: string;
  @IsOptional() @IsBoolean() vestingActif?: boolean;
}
