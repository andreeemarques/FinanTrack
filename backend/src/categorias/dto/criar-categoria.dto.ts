import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { aparar } from '../../comum/aparar';

export class CriarCategoriaDto {
  @Transform(aparar)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'A cor deve ter o formato #RRGGBB.' })
  cor?: string;
}