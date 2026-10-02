import { PartialType } from '@nestjs/mapped-types';
import { CriarMovimentoDto } from './criar-movimento.dto';

export class AtualizarMovimentoDto extends PartialType(CriarMovimentoDto) {}