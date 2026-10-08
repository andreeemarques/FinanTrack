import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Saúde')
@SkipThrottle()
@Controller('saude')
export class SaudeController {
  @Get()
  @ApiOperation({ summary: 'Verificar se a API está a funcionar' })
  verificar() {
    return { estado: 'ok' };
  }
}