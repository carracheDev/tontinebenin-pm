import { IsString, MaxLength, MinLength } from 'class-validator';

export class EnvoyerMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  contenu!: string;
}

export class OuvrirDirectDto {
  @IsString()
  membreId!: string;
}
