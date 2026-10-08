import { PartialType } from '@nestjs/swagger';
import { CriarMovimentoDto } from './criar-movimento.dto';

export class AtualizarMovimentoDto extends PartialType(CriarMovimentoDto) {}