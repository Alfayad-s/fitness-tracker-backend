import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
  const allowedOrigins = new Set([
    frontendUrl,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ]);

  app.enableCors({
    origin: [...allowedOrigins],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
