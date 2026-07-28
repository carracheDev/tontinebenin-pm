import { IsOptional, IsString } from 'class-validator';

export class DemanderValidationDto {
  @IsOptional() @IsString() validateurId?: string; // responsable ciblé (optionnel)
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() commentaire?: string;
}
