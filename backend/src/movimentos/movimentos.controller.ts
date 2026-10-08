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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import type { PayloadJwt } from '../autenticacao/jwt-auth.guard';
import { UtilizadorAtual } from '../autenticacao/utilizador-atual.decorator';
import { AtualizarMovimentoDto } from './dto/atualizar-movimento.dto';
import { CriarMovimentoDto } from './dto/criar-movimento.dto';
import { ListarMovimentosDto } from './dto/listar-movimentos.dto';
import { MovimentosService } from './movimentos.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Movimentos')
@ApiBearerAuth()
@Controller('movimentos')
export class MovimentosController {
  constructor(private readonly servico: MovimentosService) {}

  @Post()
  criar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: CriarMovimentoDto,
  ) {
    return this.servico.criar(utilizador.sub, dto);
  }

  @Get()
  listar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Query() filtros: ListarMovimentosDto,
  ) {
    return this.servico.listar(utilizador.sub, filtros);
  }

  @Get(':id')
  obter(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servico.obter(id, utilizador.sub);
  }

  @Patch(':id')
  atualizar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarMovimentoDto,
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