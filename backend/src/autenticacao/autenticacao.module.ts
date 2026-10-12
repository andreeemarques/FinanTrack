import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AutenticacaoController } from './autenticacao.controller';
import { AutenticacaoService } from './autenticacao.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true, // o guard pode ser usado noutros módulos sem importar o JwtModule
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Token de acesso curto (15 minutos); a sessão longa está no cookie de renovação
        signOptions: { expiresIn: Number(config.get('JWT_EXPIRES_SEGUNDOS')) || 900 },
      }),
    }),
  ],
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService],
  exports: [AutenticacaoService],
})
export class AutenticacaoModule {}