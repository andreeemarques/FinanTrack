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
import { AtualizarObjetivoDto } from './dto/atualizar-objetivo.dto';
import { CriarContribuicaoDto } from './dto/criar-contribuicao.dto';
import { CriarObjetivoDto } from './dto/criar-objetivo.dto';
import { ObjetivosService } from './objetivos.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Objetivos de poupança')
@ApiBearerAuth()
@Controller('objetivos')
export class ObjetivosController {
  constructor(private readonly servico: ObjetivosService) {}

  @Get()
  listar(@UtilizadorAtual() utilizador: PayloadJwt) {
    return this.servico.listar(utilizador.sub);
  }

  @Post()
  criar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: CriarObjetivoDto,
  ) {
    return this.servico.criar(utilizador.sub, dto);
  }

  @Patch(':id')
  atualizar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarObjetivoDto,
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

  @Get(':id/contribuicoes')
  listarContribuicoes(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servico.listarContribuicoes(id, utilizador.sub);
  }

  @Post(':id/contribuicoes')
  adicionarContribuicao(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarContribuicaoDto,
  ) {
    return this.servico.adicionarContribuicao(id, utilizador.sub, dto);
  }

  @Delete(':id/contribuicoes/:contribuicaoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerContribuicao(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contribuicaoId', ParseUUIDPipe) contribuicaoId: string,
  ) {
    return this.servico.removerContribuicao(id, contribuicaoId, utilizador.sub);
  }
}