import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DataISO } from '../../comum/data-iso.decorator';

export class CriarContribuicaoDto {
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  valorCentimos: number;

  // Se não vier, usa o dia de hoje
  @IsOptional()
  @DataISO()
  data?: string;
}