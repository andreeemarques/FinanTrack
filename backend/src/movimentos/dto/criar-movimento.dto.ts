import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { aparar } from '../../comum/aparar';
import { DataISO } from '../../comum/data-iso.decorator';
import { MetodoPagamento, TipoMovimento } from '../../generated/prisma/client';

export class CriarMovimentoDto {
  @IsEnum(TipoMovimento)
  tipo: TipoMovimento;

  // Em cêntimos e sempre positivo: 54,20 € → 5420
  @IsInt()
  @Min(1)
  @Max(2_000_000_000)
  valorCentimos: number;

  @DataISO()
  data: string;

  @Transform(aparar)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  descricao: string;

  @IsEnum(MetodoPagamento)
  metodoPagamento: MetodoPagamento;

  @IsUUID()
  categoriaId: string;
}