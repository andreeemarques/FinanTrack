import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service';
import { AlterarPasswordDto } from './dto/alterar-password.dto';
import { ApagarContaDto } from './dto/apagar-conta.dto';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { EntrarDto } from './dto/entrar.dto';
import { RegistarDto } from './dto/registar.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { PayloadJwt } from './jwt-auth.guard';
import { UtilizadorAtual } from './utilizador-atual.decorator';

@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly servico: AutenticacaoService) {}

  @Post('registar')
  registar(@Body() dto: RegistarDto) {
    return this.servico.registar(dto);
  }

  @Post('entrar')
  @HttpCode(HttpStatus.OK)
  entrar(@Body() dto: EntrarDto) {
    return this.servico.entrar(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('eu')
  eu(@UtilizadorAtual() utilizador: PayloadJwt) {
    return this.servico.perfil(utilizador.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('eu')
  atualizarPerfil(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: AtualizarPerfilDto,
  ) {
    return this.servico.atualizarPerfil(utilizador.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alterar-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  alterarPassword(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: AlterarPasswordDto,
  ) {
    return this.servico.alterarPassword(utilizador.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apagar-conta')
  @HttpCode(HttpStatus.NO_CONTENT)
  apagarConta(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: ApagarContaDto,
  ) {
    return this.servico.apagarConta(utilizador.sub, dto);
  }
}