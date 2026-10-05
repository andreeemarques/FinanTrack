import { IsOptional } from 'class-validator';
import { MesISO } from '../../comum/mes-iso.decorator';

export class ConsultarOrcamentosDto {
  @IsOptional()
  @MesISO()
  mes?: string;
}