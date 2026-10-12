import { Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { definirCookieSessao } from '../autenticacao/sessao';
import { DemoService } from './demo.service';

@ApiTags('Demonstração')
@Controller('demo')
export class DemoController {
  constructor(private readonly servico: DemoService) {}

  // No máximo 5 contas de demonstração por hora por IP
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('sessao')
  @ApiOperation({
    summary: 'Criar uma conta de demonstração',
    description:
      'Cria uma conta temporária, com dados de exemplo, apagada ao fim de 24 horas. Devolve o utilizador e um token de acesso, como o login (a sessão longa vai num cookie httpOnly).',
  })
  @ApiResponse({ status: 404, description: 'A demonstração está desativada.' })
  @ApiResponse({ status: 429, description: 'Demasiados pedidos (limite de 5 por hora).' })
  @ApiResponse({ status: 503, description: 'Limite de contas de demonstração ativas atingido.' })
  async criarSessao(@Res({ passthrough: true }) resposta: Response) {
    const { refreshToken, ...resultado } = await this.servico.criarSessao();
    definirCookieSessao(resposta, refreshToken);
    return resultado;
  }
}