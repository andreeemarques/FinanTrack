import { Module } from '@nestjs/common';
import { AutenticacaoModule } from '../autenticacao/autenticacao.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [AutenticacaoModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}