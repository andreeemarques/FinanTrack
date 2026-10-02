import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { aparar } from '../../comum/aparar';
import { DataISO } from '../../comum/data-iso.decorator';
import { TipoMovimento } from '../../generated/prisma/client';

export class ListarMovimentosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 20;

  @IsOptional()
  @IsEnum(TipoMovimento)
  tipo?: TipoMovimento;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  // intervalo de datas (inclusivo), formato AAAA-MM-DD
  @IsOptional()
  @DataISO()
  de?: string;

  @IsOptional()
  @DataISO()
  ate?: string;

  // pesquisa na descrição
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(100)
  pesquisa?: string;
}