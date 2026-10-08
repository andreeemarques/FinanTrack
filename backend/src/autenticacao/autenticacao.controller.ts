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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AutenticacaoService } from './autenticacao.service';
import { AlterarPasswordDto } from './dto/alterar-password.dto';
import { ApagarContaDto } from './dto/apagar-conta.dto';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { EntrarDto } from './dto/entrar.dto';
import { RegistarDto } from './dto/registar.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { PayloadJwt } from './jwt-auth.guard';
import { UtilizadorAtual } from './utilizador-atual.decorator';

// Rotas que verificam passwords: no máximo 10 pedidos por minuto por IP
const LIMITE_SENSIVEL = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly servico: AutenticacaoService) {}

  @Throttle(LIMITE_SENSIVEL)
  @Post('registar')
  @ApiOperation({ summary: 'Criar conta', description: 'Devolve o utilizador e um token. Cria também as categorias padrão.' })
  @ApiResponse({ status: 409, description: 'Já existe uma conta com este email.' })
  @ApiResponse({ status: 429, description: 'Demasiados pedidos (limite de 10 por minuto).' })
  registar(@Body() dto: RegistarDto) {
    return this.servico.registar(dto);
  }

  @Throttle(LIMITE_SENSIVEL)
  @Post('entrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sessão', description: 'Devolve o utilizador e um token JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Demasiados pedidos (limite de 10 por minuto).' })
  entrar(@Body() dto: EntrarDto) {
    return this.servico.entrar(dto);
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
    description: 'Invalida os tokens das outras sessões e devolve um token novo para a sessão atual.',
  })
  @ApiResponse({ status: 400, description: 'Password atual incorreta.' })
  alterarPassword(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: AlterarPasswordDto,
  ) {
    return this.servico.alterarPassword(utilizador.sub, dto);
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
  apagarConta(
    @UtilizadorAtual() utilizador: PayloadJwt,
    @Body() dto: ApagarContaDto,
  ) {
    return this.servico.apagarConta(utilizador.sub, dto);
  }
}