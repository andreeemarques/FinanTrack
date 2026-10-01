import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que não estão no DTO
      forbidNonWhitelisted: true, // e rejeita o pedido se vierem campos a mais
      transform: true,
    }),
  );

  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();