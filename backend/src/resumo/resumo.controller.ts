import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import type { PayloadJwt } from '../autenticacao/jwt-auth.guard';
import { UtilizadorAtual } from '../autenticacao/utilizador-atual.decorator';
import { ConsultarDashboardDto } from './dto/consultar-dashboard.dto';
import { ConsultarRelatoriosDto } from './dto/consultar-relatorios.dto';
import { ResumoService } from './resumo.service';

@UseGuards(JwtAuthGuard)
@Controller('resumo')
export class ResumoController {
  constructor(private readonly servico: ResumoService) {}

  @Get('dashboard')
  dashboard(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Query() consulta: ConsultarDashboardDto,
  ) {
    return this.servico.dashboard(utilizador.sub, consulta.mes);
  }

  @Get('relatorios')
  relatorios(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Query() consulta: ConsultarRelatoriosDto,
  ) {
    return this.servico.relatorios(utilizador.sub, consulta.periodo);
  }
}