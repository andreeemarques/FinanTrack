import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Em produção a API fica atrás do proxy da plataforma: confia nele para ver o IP real
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
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