import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

@ApiTags('Saúde')
@SkipThrottle()
@Controller('saude')
export class SaudeController {
  @Get()
  @ApiOperation({ summary: 'Verificar se a API está a funcionar' })
  verificar() {
    return { estado: 'ok' };
  }

  // TEMPORÁRIO: serve para descobrir quantos proxies estão à frente da API.
  // Só devolve o IP de quem pergunta. Apagar depois de configurar o TRUST_PROXY_HOPS.
  @Get('ip')
  @ApiExcludeEndpoint()
  ip(@Req() pedido: Request) {
    return {
      ip: pedido.ip,
      xForwardedFor: pedido.headers['x-forwarded-for'] ?? null,
    };
  }
}