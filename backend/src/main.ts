import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Atrás de proxies (Vercel e a plataforma da API), o IP real do utilizador vem no cabeçalho
  // X-Forwarded-For. TRUST_PROXY_HOPS diz quantos proxies são de confiança; em produção,
  // por omissão, 1. O valor certo descobre-se com o endpoint /saude/ip (ver README).
  const saltos = Number(
    process.env.TRUST_PROXY_HOPS ?? (process.env.NODE_ENV === 'production' ? 1 : 0),
  );
  if (saltos > 0) {
    app.set('trust proxy', saltos);
  }

  configurarApp(app);

  const configuracao = new DocumentBuilder()
    .setTitle('FinanTrack API')
    .setDescription(
      'API do FinanTrack, um gestor financeiro pessoal. ' +
        'Para testar as rotas protegidas: faz login em POST /autenticacao/entrar, ' +
        'copia o token da resposta e cola-o no botão "Authorize".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, configuracao);
  SwaggerModule.setup('documentacao', app, documento, {
    customSiteTitle: 'FinanTrack API',
    swaggerOptions: { persistAuthorization: true }, // mantém o token ao recarregar a página
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();