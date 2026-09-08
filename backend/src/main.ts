import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Разрешаем запросы с фронтенда (раздел 4.5 ТЗ — frontend и backend на разных портах)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  // Проверяем данные форм по правилам из DTO (например create-lead.dto.ts)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
