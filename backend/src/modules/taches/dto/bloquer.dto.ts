import { IsString, MinLength } from 'class-validator';

export class BloquerDto {
  @IsString() @MinLength(2) motif!: string;
}
