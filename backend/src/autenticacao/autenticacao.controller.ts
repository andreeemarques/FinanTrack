import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service';
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
}