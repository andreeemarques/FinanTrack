import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import type { PayloadJwt } from '../autenticacao/jwt-auth.guard';
import { UtilizadorAtual } from '../autenticacao/utilizador-atual.decorator';
import { CategoriasService } from './categorias.service';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@UseGuards(JwtAuthGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly servico: CategoriasService) {}

  @Get()
  listar(@UtilizadorAtual() utilizador: PayloadJwt) {
    return this.servico.listar(utilizador.sub);
  }

  @Post()
  criar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: CriarCategoriaDto,
  ) {
    return this.servico.criar(utilizador.sub, dto);
  }

  @Patch(':id')
  atualizar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarCategoriaDto,
  ) {
    return this.servico.atualizar(id, utilizador.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servico.remover(id, utilizador.sub);
  }
}