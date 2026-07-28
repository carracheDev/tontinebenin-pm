import { IsEnum, IsInt, Min } from 'class-validator';
import { StatutTache } from '@prisma/client';

/** Déplacement Kanban : nouvelle colonne + position. */
export class DeplacerTacheDto {
  @IsEnum(StatutTache) statut!: StatutTache;
  @IsInt() @Min(0) ordre!: number;
}
