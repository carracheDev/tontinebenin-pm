import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CommenterDto {
  @IsString() @MinLength(1) contenu!: string;
  /** ids des membres mentionnés (@nom). */
  @IsOptional() @IsArray() @IsString({ each: true }) mentions?: string[];
}
