import { IsEnum } from 'class-validator';
import { TypeRapportIA } from '@prisma/client';

export class GenererRapportDto {
  @IsEnum(TypeRapportIA, {
    message:
      'type invalide : ETAT_PROJET | ANALYSE_RETARDS | PREVISION_RISQUES | PERFORMANCE_EQUIPE | SYNTHESE',
  })
  type!: TypeRapportIA;
}
