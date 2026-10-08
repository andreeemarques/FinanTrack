import { PartialType } from '@nestjs/swagger';
import { CriarCategoriaDto } from './criar-categoria.dto';

export class AtualizarCategoriaDto extends PartialType(CriarCategoriaDto) {}