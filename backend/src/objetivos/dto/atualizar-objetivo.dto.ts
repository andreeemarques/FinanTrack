import { PartialType } from '@nestjs/mapped-types';
import { CriarObjetivoDto } from './criar-objetivo.dto';

export class AtualizarObjetivoDto extends PartialType(CriarObjetivoDto) {}