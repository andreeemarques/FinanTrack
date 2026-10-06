import { IsOptional } from 'class-validator';
import { MesISO } from '../../comum/mes-iso.decorator';

export class ConsultarDashboardDto {
  @IsOptional()
  @MesISO()
  mes?: string;
}