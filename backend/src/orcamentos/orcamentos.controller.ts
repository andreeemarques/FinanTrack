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
import { AtualizarOrcamentoDto } from './dto/atualizar-orcamento.dto';
import { ConsultarOrcamentosDto } from './dto/consultar-orcamentos.dto';
import { CriarOrcamentoDto } from './dto/criar-orcamento.dto';
import { OrcamentosService } from './orcamentos.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Orçamentos')
@ApiBearerAuth()
@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly servico: OrcamentosService) {}

  @Get()
  listar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Query() consulta: ConsultarOrcamentosDto,
  ) {
    return this.servico.listar(utilizador.sub, consulta.mes);
  }

  @Post()
  criar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: CriarOrcamentoDto,
  ) {
    return this.servico.criar(utilizador.sub, dto);
  }

  @Patch(':id')
  atualizar(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarOrcamentoDto,
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