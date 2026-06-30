import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import express from 'express';

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    console.log('[NestJS] Inicializando servidor Serverless...');
    const expressInstance = express();
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressInstance),
    );

    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    const config = new DocumentBuilder()
      .setTitle('Pasteleria API')
      .setDescription('The Bizcochao Pasteleria API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    console.log('[NestJS] Servidor inicializado con éxito.');
  }
  
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
