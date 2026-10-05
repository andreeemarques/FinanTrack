import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { MesISO } from '../../comum/mes-iso.decorator';

export class CriarOrcamentoDto {
  @IsUUID()
  categoriaId: string;

  // Em cêntimos: 500,00 € → 50000
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  limiteCentimos: number;

  @MesISO()
  mes: string;
}