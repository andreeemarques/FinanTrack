import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// Configuração partilhada entre a aplicação real (main.ts) e os testes e2e
export function configurarApp(app: INestApplication) {
  // O Swagger UI usa scripts embutidos que a política de segurança do Helmet bloqueia,
  // por isso a documentação tem uma configuração própria (o resto da API mantém o Helmet completo)
  const helmetPadrao = helmet();
  const helmetDocumentacao = helmet({ contentSecurityPolicy: false });
  app.use((pedido: Request, resposta: Response, seguinte: NextFunction) => {
    const middleware = pedido.path.startsWith('/documentacao')
      ? helmetDocumentacao
      : helmetPadrao;
    middleware(pedido, resposta, seguinte);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que não estão no DTO
      forbidNonWhitelisted: true, // e rejeita o pedido se vierem campos a mais
      transform: true,
    }),
  );

  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });
}