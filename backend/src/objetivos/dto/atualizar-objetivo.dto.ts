import { PartialType } from '@nestjs/swagger';
import { CriarObjetivoDto } from './criar-objetivo.dto';

export class AtualizarObjetivoDto extends PartialType(CriarObjetivoDto) {}