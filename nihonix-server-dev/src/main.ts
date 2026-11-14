import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor, GlobalExceptionFilter } from './common/index';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3010;

  app.enableShutdownHooks();

  app.setGlobalPrefix('api', { exclude: ['/'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Nihonix API')
    .setDescription('Nihonix Server API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true, 
      showRequestDuration: true, 
    },
    customSiteTitle: 'Nihonix API Documentation',
  });

  await app.listen(port);

  const shutdown = async () => {
    try {
      await app.close();   
      process.exit(0);     
    } finally {
      process.exit(0);  
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(`
╔═══════════════════════════════════════════════════╗
║   Nihonix Server                                  ║
╟───────────────────────────────────────────────────╢
║  API:        http://localhost:${port}/api         ║
║  Swagger:    http://localhost:${port}/api-docs    ║
╚═══════════════════════════════════════════════════╝
  `);
}

void bootstrap();
