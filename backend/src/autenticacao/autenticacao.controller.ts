import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AutenticacaoService } from './autenticacao.service';
import { AlterarPasswordDto } from './dto/alterar-password.dto';
import { ApagarContaDto } from './dto/apagar-conta.dto';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { EntrarDto } from './dto/entrar.dto';
import { RegistarDto } from './dto/registar.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { PayloadJwt } from './jwt-auth.guard';
import { definirCookieSessao, lerCookieSessao, limparCookieSessao } from './sessao';
import { UtilizadorAtual } from './utilizador-atual.decorator';

// Rotas que verificam passwords: no máximo 10 pedidos por minuto por IP
const LIMITE_SENSIVEL = { default: { limit: 10, ttl: 60_000 } };
// A renovação da sessão é mais frequente (ao abrir a aplicação e a cada 15 minutos)
const LIMITE_RENOVAR = { default: { limit: 30, ttl: 60_000 } };

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly servico: AutenticacaoService) {}

  @Throttle(LIMITE_SENSIVEL)
  @Post('registar')
  @ApiOperation({
    summary: 'Criar conta',
    description:
      'Devolve o utilizador e um token de acesso (15 minutos). A sessão longa vai num cookie httpOnly. Cria também as categorias padrão.',
  })
  @ApiResponse({ status: 409, description: 'Já existe uma conta com este email.' })
  @ApiResponse({ status: 429, description: 'Demasiados pedidos (limite de 10 por minuto).' })
  async registar(@Body() dto: RegistarDto, @Res({ passthrough: true }) resposta: Response) {
    const { refreshToken, ...resultado } = await this.servico.registar(dto);
    definirCookieSessao(resposta, refreshToken);
    return resultado;
  }

  @Throttle(LIMITE_SENSIVEL)
  @Post('entrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sessão',
    description: 'Devolve o utilizador e um token de acesso (15 minutos). A sessão longa vai num cookie httpOnly.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Demasiados pedidos (limite de 10 por minuto).' })
  async entrar(@Body() dto: EntrarDto, @Res({ passthrough: true }) resposta: Response) {
    const { refreshToken, ...resultado } = await this.servico.entrar(dto);
    definirCookieSessao(resposta, refreshToken);
    return resultado;
  }

  @Throttle(LIMITE_RENOVAR)
  @Post('renovar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar a sessão',
    description:
      'Troca o cookie de sessão por um token de acesso novo e um cookie novo (rotação). Reutilizar um cookie já trocado termina a sessão.',
  })
  @ApiResponse({ status: 401, description: 'Sem sessão válida.' })
  async renovar(@Req() pedido: Request, @Res({ passthrough: true }) resposta: Response) {
    try {
      const { refreshToken, ...resultado } = await this.servico.renovar(lerCookieSessao(pedido));
      definirCookieSessao(resposta, refreshToken);
      return resultado;
    } catch (erro) {
      // Um cookie inválido já não serve para nada: remove-o do browser
      if (erro instanceof UnauthorizedException) limparCookieSessao(resposta);
      throw erro;
    }
  }

  @Post('sair')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Terminar a sessão', description: 'Revoga a sessão do dispositivo e apaga o cookie.' })
  async sair(@Req() pedido: Request, @Res({ passthrough: true }) resposta: Response) {
    await this.servico.sair(lerCookieSessao(pedido));
    limparCookieSessao(resposta);
  }

  @UseGuards(JwtAuthGuard)
  @Get('eu')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver o perfil do utilizador autenticado' })
  eu(@UtilizadorAtual() utilizador: PayloadJwt) {
    return this.servico.perfil(utilizador.sub);
  }

  @Throttle(LIMITE_SENSIVEL)
  @UseGuards(JwtAuthGuard)
  @Patch('eu')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar nome e/ou email', description: 'Alterar o email exige a password atual.' })
  @ApiResponse({ status: 400, description: 'Password atual incorreta.' })
  @ApiResponse({ status: 409, description: 'Já existe uma conta com este email.' })
  atualizarPerfil(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: AtualizarPerfilDto,
  ) {
    return this.servico.atualizarPerfil(utilizador.sub, dto);
  }

  @Throttle(LIMITE_SENSIVEL)
  @UseGuards(JwtAuthGuard)
  @Post('alterar-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar a password',
    description:
      'Termina as sessões de todos os dispositivos e devolve um token de acesso e um cookie novos para a sessão atual.',
  })
  @ApiResponse({ status: 400, description: 'Password atual incorreta.' })
  async alterarPassword(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: AlterarPasswordDto,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const { token, refreshToken } = await this.servico.alterarPassword(utilizador.sub, dto);
    definirCookieSessao(resposta, refreshToken);
    return { token };
  }

  @Throttle(LIMITE_SENSIVEL)
  @UseGuards(JwtAuthGuard)
  @Post('apagar-conta')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Apagar a conta',
    description: 'Apaga a conta e todos os dados associados. É irreversível e exige a password.',
  })
  @ApiResponse({ status: 400, description: 'Password incorreta.' })
  async apagarConta(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: ApagarContaDto,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    await this.servico.apagarConta(utilizador.sub, dto);
    limparCookieSessao(resposta);
  }
}