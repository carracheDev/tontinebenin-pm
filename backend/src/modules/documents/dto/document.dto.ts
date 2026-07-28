import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategorieDocument, Role } from '@prisma/client';

export class CreerDocumentDto {
  @IsString() @MinLength(2) titre!: string;
  @IsOptional() @IsEnum(CategorieDocument) categorie?: CategorieDocument;
  @IsOptional() @IsString() projetId?: string;
  @IsOptional() @IsArray() @IsEnum(Role, { each: true }) accesRoles?: Role[];
  // première version
  @IsString() url!: string;
  @IsOptional() @IsString() note?: string;
}

export class AjouterVersionDto {
  @IsString() url!: string;
  @IsOptional() @IsString() note?: string;
}
