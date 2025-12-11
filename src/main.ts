import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Explicitly map raw body for webhook verification
  app.use(express.json({
    verify: (req: any, res: any, buf: Buffer) => {
      req.rawBody = buf;
    }
  }));
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet Service')
    .setDescription(
      'Wallet Service API with Google Auth, Paystack, and Transfers',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addTag('app', 'Application endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('api-keys', 'API Key management')
    .addTag('wallet', 'Wallet operations')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('app.port')!;
  const appUrl = configService.get<string>('app.url')!;

  await app.listen(port);
  Logger.log(`Application is running on: ${appUrl}`, 'Bootstrap');
  Logger.log(`Swagger is running on: ${appUrl}/api/docs`, 'Bootstrap');
}
bootstrap();
