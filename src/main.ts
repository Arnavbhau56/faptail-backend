import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002').split(',');
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 5000);
  console.log(`🚀 Backend running on http://localhost:${process.env.PORT ?? 5000}`);
}
bootstrap();
