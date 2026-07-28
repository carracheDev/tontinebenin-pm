import {
  IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength,
} from 'class-validator';
import { Role, TypeMembre } from '@prisma/client';

export class CreerMembreDto {
  @IsString() @MinLength(2) nomComplet!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) motDePasse!: string;
  @IsOptional() @IsString() poste?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsEnum(TypeMembre) typeMembre?: TypeMembre;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() disponibilite?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) competences?: string[];
  @IsOptional() @IsString() responsabilites?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) niveauImplication?: number;
}
