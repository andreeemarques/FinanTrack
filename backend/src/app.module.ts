import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutenticacaoModule } from './autenticacao/autenticacao.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MovimentosModule } from './movimentos/movimentos.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrcamentosModule } from './orcamentos/orcamentos.module';
import { ObjetivosModule } from './objetivos/objetivos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AutenticacaoModule,
    CategoriasModule,
    MovimentosModule,
    OrcamentosModule,
    ObjetivosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}