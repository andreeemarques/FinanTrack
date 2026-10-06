import { IsIn, IsOptional } from 'class-validator';

export const PERIODOS = ['6meses', 'ano'] as const;
export type Periodo = (typeof PERIODOS)[number];

export class ConsultarRelatoriosDto {
  @IsOptional()
  @IsIn(PERIODOS)
  periodo?: Periodo;
}