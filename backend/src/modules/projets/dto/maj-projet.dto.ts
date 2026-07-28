import { PartialType } from '@nestjs/mapped-types';
import { CreerProjetDto } from './creer-projet.dto';

export class MajProjetDto extends PartialType(CreerProjetDto) {}
