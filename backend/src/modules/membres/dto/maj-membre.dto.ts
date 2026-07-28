import { PartialType } from '@nestjs/mapped-types';
import { CreerMembreDto } from './creer-membre.dto';

export class MajMembreDto extends PartialType(CreerMembreDto) {}
