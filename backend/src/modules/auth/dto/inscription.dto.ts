import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class InscriptionDto {
  @IsString()
  @MinLength(2)
  nomComplet!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  motDePasse!: string;

  @IsOptional()
  @IsString()
  poste?: string;
}
