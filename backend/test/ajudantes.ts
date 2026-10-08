import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

export const PASSWORD_TESTE = 'passwordDeTeste1';

export type AplicacaoTeste = INestApplication<App>;

export async function criarApp(): Promise<AplicacaoTeste> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
  return app;
}

// Apaga todos os dados (o CASCADE limpa as tabelas que dependem dos utilizadores)
export async function limparBaseDeDados(app: AplicacaoTeste) {
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error('Recusado: só se pode limpar uma base de dados com "_test" no nome.');
  }
  await app.get(PrismaService).$executeRawUnsafe('TRUNCATE TABLE utilizadores CASCADE');
}

export async function registarUtilizador(app: AplicacaoTeste, nome: string, email: string) {
  const resposta = await request(app.getHttpServer())
    .post('/autenticacao/registar')
    .send({ nome, email, password: PASSWORD_TESTE })
    .expect(201);

  return {
    id: resposta.body.utilizador.id as string,
    email,
    token: resposta.body.token as string,
  };
}

export const autorizacao = (token: string) => ({ Authorization: `Bearer ${token}` });