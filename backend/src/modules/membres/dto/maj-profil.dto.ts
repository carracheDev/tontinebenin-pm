import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Modification de SON PROPRE profil par un membre.
 * Volontairement limité : ni rôle, ni type de membre, ni poste/titre, ni statut.
 */
export class MajProfilDto {
  @IsOptional() @IsString() @MinLength(2) nomComplet?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() disponibilite?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) competences?: string[];
  @IsOptional() @IsString() @MinLength(6) motDePasse?: string;
}
