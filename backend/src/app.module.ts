import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AutenticacaoModule } from './autenticacao/autenticacao.module';
import { CategoriasModule } from './categorias/categorias.module';
import { validarAmbiente } from './config/validar-ambiente';
import { MovimentosModule } from './movimentos/movimentos.module';
import { ObjetivosModule } from './objetivos/objetivos.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResumoModule } from './resumo/resumo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    // Limite geral: 100 pedidos por minuto por IP (as rotas sensíveis têm um limite mais apertado)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      skipIf: () => process.env.DESATIVAR_THROTTLE === 'true',
    }),
    PrismaModule,
    AutenticacaoModule,
    CategoriasModule,
    MovimentosModule,
    OrcamentosModule,
    ObjetivosModule,
    ResumoModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}