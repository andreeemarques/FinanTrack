import { PickType } from '@nestjs/swagger';
import { CriarOrcamentoDto } from './criar-orcamento.dto';

// Só o limite pode ser alterado (a categoria e o mês definem o orçamento)
export class AtualizarOrcamentoDto extends PickType(CriarOrcamentoDto, [
  'limiteCentimos',
] as const) {}