import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // ─── API Versioning ────────────────────────────────────────────────────────
  app.setGlobalPrefix('v1', { exclude: ['/health', '/'] });

  // ─── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip propriedades não decoradas
      forbidNonWhitelisted: true,
      transform: true,           // auto-cast de query params
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger (apenas fora de produção) ─────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Serviços Marketplace API')
      .setDescription('API do marketplace de serviços — referência: BLOCOs A–E')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('auth', 'Autenticação e autorização')
      .addTag('users', 'Perfil de usuários')
      .addTag('providers', 'Perfil de prestadores')
      .addTag('categories', 'Catálogo de serviços')
      .addTag('matching', 'Busca e matching de prestadores')
      .addTag('bookings', 'Pedidos e agendamentos')
      .addTag('payments', 'Pagamentos')
      .addTag('reviews', 'Avaliações')
      .addTag('notifications', 'Notificações')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/v1`);
  if (nodeEnv !== 'production') {
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
