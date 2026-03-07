import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // VULN: CORS wide open — allows any origin
  app.enableCors({ origin: '*', methods: '*' });

  // Swagger docs exposed publicly
  const config = new DocumentBuilder()
    .setTitle('RansomFlow API')
    .setDescription('AI Workflow Automation Platform — RansomFlow v1.0')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000, '0.0.0.0');
  console.log('RansomFlow backend running on port 3000');
}
bootstrap();
