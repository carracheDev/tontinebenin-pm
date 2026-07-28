import { IsInt, IsOptional, IsString } from 'class-validator';

export class PieceJointeDto {
  @IsString() nom!: string;
  @IsString() url!: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsInt() tailleKo?: number;
}
