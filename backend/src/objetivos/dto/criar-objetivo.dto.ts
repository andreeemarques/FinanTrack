import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { aparar } from '../../comum/aparar';
import { DataISO } from '../../comum/data-iso.decorator';

export class CriarObjetivoDto {
  @Transform(aparar)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nome: string;

  // Em cêntimos: 2000,00 € → 200000
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  metaCentimos: number;

  // Opcional; no PATCH, enviar null remove a data limite
  @IsOptional()
  @DataISO()
  dataLimite?: string | null;
}